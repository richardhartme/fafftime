import { describe, expect, it, beforeEach, vi } from 'vitest';

let decoderResult: { messages: unknown; errors: unknown[] } = { messages: {}, errors: [] };
const decoderInstances: any[] = [];
const streamFromByteArray = vi.fn((bytes: Uint8Array) => ({ mocked: true, bytes }));

vi.mock('@garmin/fitsdk', () => ({
  Stream: {
    fromByteArray: streamFromByteArray,
  },
  Decoder: class {
    public stream: unknown;
    constructor(stream: unknown) {
      this.stream = stream;
      decoderInstances.push(this);
    }

    read() {
      return decoderResult;
    }
  },
}));

const { decodeFitFile, extractActivityTimes } = await import('./fit-parser');

import type { FitSession, FitRecord } from '../types/app-types';

describe('decodeFitFile', () => {
  beforeEach(() => {
    decoderResult = { messages: { sessionMesgs: [] }, errors: [] };
    decoderInstances.length = 0;
    streamFromByteArray.mockClear();
  });

  it('decodes FIT files using the Garmin SDK', async () => {
    const fakeArrayBuffer = new ArrayBuffer(8);
    const fakeFile = {
      arrayBuffer: vi.fn(async () => fakeArrayBuffer),
    } as unknown as File;

    const result = await decodeFitFile(fakeFile);

    expect(fakeFile.arrayBuffer).toHaveBeenCalledTimes(1);
    expect(streamFromByteArray).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(decoderInstances).toHaveLength(1);
    expect(decoderInstances[0].stream).toEqual(streamFromByteArray.mock.results[0].value);
    expect(result).toEqual(decoderResult.messages);
  });

  it('warns when the decoder reports errors', async () => {
    decoderResult = {
      messages: { recordMesgs: [] },
      errors: ['corrupt'],
    };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const fakeFile = {
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
    } as unknown as File;

    await decodeFitFile(fakeFile);

    expect(warnSpy).toHaveBeenCalledWith('FIT parsing errors:', decoderResult.errors);
    warnSpy.mockRestore();
  });
});

describe('extractActivityTimes', () => {
  describe('with session data', () => {
    it('extracts all timing data from a complete session', () => {
      const sessions: FitSession[] = [{
        startTime: new Date('2024-01-01T10:00:00Z'),
        totalTimerTime: 3600,
        totalElapsedTime: 3900,
        totalDistance: 25000,
      }];

      const result = extractActivityTimes(sessions, []);

      expect(result.startTime).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(result.endTime).toEqual(new Date('2024-01-01T11:05:00Z'));
      expect(result.movingTime).toBe(3600);
      expect(result.totalDistance).toBe(25000);
    });

    it('handles session with missing totalTimerTime', () => {
      const sessions: FitSession[] = [{
        startTime: new Date('2024-01-01T10:00:00Z'),
        totalElapsedTime: 3600,
        totalDistance: 10000,
      }];

      const result = extractActivityTimes(sessions, []);

      expect(result.startTime).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(result.movingTime).toBeNull();
      expect(result.totalDistance).toBe(10000);
    });

    it('handles session with missing totalDistance', () => {
      const sessions: FitSession[] = [{
        startTime: new Date('2024-01-01T10:00:00Z'),
        totalTimerTime: 3600,
        totalElapsedTime: 3600,
      }];

      const result = extractActivityTimes(sessions, []);

      expect(result.totalDistance).toBeNull();
    });

    it('handles session with missing totalElapsedTime (no calculated endTime)', () => {
      const sessions: FitSession[] = [{
        startTime: new Date('2024-01-01T10:00:00Z'),
        totalTimerTime: 3600,
        totalDistance: 25000,
      }];

      const result = extractActivityTimes(sessions, []);

      expect(result.startTime).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(result.endTime).toBeNull();
      expect(result.movingTime).toBe(3600);
    });

    it('handles session with missing startTime', () => {
      const sessions: FitSession[] = [{
        totalTimerTime: 3600,
        totalElapsedTime: 3600,
        totalDistance: 25000,
      }];

      const result = extractActivityTimes(sessions, []);

      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
      expect(result.movingTime).toBe(3600);
    });

    it('uses first session when multiple sessions exist', () => {
      const sessions: FitSession[] = [
        {
          startTime: new Date('2024-01-01T10:00:00Z'),
          totalTimerTime: 1800,
          totalElapsedTime: 1800,
          totalDistance: 10000,
        },
        {
          startTime: new Date('2024-01-01T12:00:00Z'),
          totalTimerTime: 3600,
          totalElapsedTime: 3600,
          totalDistance: 20000,
        },
      ];

      const result = extractActivityTimes(sessions, []);

      expect(result.startTime).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(result.movingTime).toBe(1800);
      expect(result.totalDistance).toBe(10000);
    });
  });

  describe('with record data (fallback)', () => {
    it('extracts times from records when no session data', () => {
      const records: FitRecord[] = [
        { timestamp: new Date('2024-01-01T10:00:00Z') },
        { timestamp: new Date('2024-01-01T10:30:00Z') },
        { timestamp: new Date('2024-01-01T11:00:00Z') },
      ];

      const result = extractActivityTimes([], records);

      expect(result.startTime).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(result.endTime).toEqual(new Date('2024-01-01T11:00:00Z'));
      expect(result.movingTime).toBeNull();
      expect(result.totalDistance).toBeNull();
    });

    it('skips records without timestamps to find first valid', () => {
      const records: FitRecord[] = [
        { speed: 5 }, // No timestamp
        { distance: 100 }, // No timestamp
        { timestamp: new Date('2024-01-01T10:05:00Z') },
        { timestamp: new Date('2024-01-01T11:00:00Z') },
      ];

      const result = extractActivityTimes([], records);

      expect(result.startTime).toEqual(new Date('2024-01-01T10:05:00Z'));
      expect(result.endTime).toEqual(new Date('2024-01-01T11:00:00Z'));
    });

    it('skips records without timestamps to find last valid', () => {
      const records: FitRecord[] = [
        { timestamp: new Date('2024-01-01T10:00:00Z') },
        { timestamp: new Date('2024-01-01T10:30:00Z') },
        { speed: 5 }, // No timestamp
        { distance: 100 }, // No timestamp
      ];

      const result = extractActivityTimes([], records);

      expect(result.startTime).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(result.endTime).toEqual(new Date('2024-01-01T10:30:00Z'));
    });

    it('handles single record with timestamp', () => {
      const records: FitRecord[] = [
        { timestamp: new Date('2024-01-01T10:00:00Z') },
      ];

      const result = extractActivityTimes([], records);

      expect(result.startTime).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(result.endTime).toEqual(new Date('2024-01-01T10:00:00Z'));
    });

    it('handles records where none have timestamps', () => {
      const records: FitRecord[] = [
        { speed: 5 },
        { distance: 100 },
        { speed: 10 },
      ];

      const result = extractActivityTimes([], records);

      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
    });
  });

  describe('with both session and record data', () => {
    it('prefers session startTime but uses record endTime as fallback', () => {
      const sessions: FitSession[] = [{
        startTime: new Date('2024-01-01T10:00:00Z'),
        totalTimerTime: 3600,
        // No totalElapsedTime, so endTime from session will be null
      }];

      const records: FitRecord[] = [
        { timestamp: new Date('2024-01-01T10:00:00Z') },
        { timestamp: new Date('2024-01-01T11:30:00Z') },
      ];

      const result = extractActivityTimes(sessions, records);

      // startTime from session (preferred)
      expect(result.startTime).toEqual(new Date('2024-01-01T10:00:00Z'));
      // endTime from records (fallback since session has no totalElapsedTime)
      expect(result.endTime).toEqual(new Date('2024-01-01T11:30:00Z'));
      expect(result.movingTime).toBe(3600);
    });
  });

  describe('edge cases', () => {
    it('handles empty sessions and empty records', () => {
      const result = extractActivityTimes([], []);

      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
      expect(result.movingTime).toBeNull();
      expect(result.totalDistance).toBeNull();
    });

    it('handles zero values in session', () => {
      const sessions: FitSession[] = [{
        startTime: new Date('2024-01-01T10:00:00Z'),
        totalTimerTime: 0,
        totalElapsedTime: 0,
        totalDistance: 0,
      }];

      const result = extractActivityTimes(sessions, []);

      expect(result.movingTime).toBe(0);
      expect(result.totalDistance).toBe(0);
      expect(result.endTime).toEqual(new Date('2024-01-01T10:00:00Z'));
    });
  });
});
