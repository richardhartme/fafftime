import { describe, expect, it, beforeEach } from 'vitest';

import {
  findSpeedBasedSlowPeriods,
  shouldBreakSequenceForTimestampGap,
  findMatchingRecordingGaps,
  convertGapToPeriod,
  buildGpsPointsFromGap,
} from '../src/core/data-analyzer';
import { SEMICIRCLE_TO_DEGREES } from '../src/utils/gps-utils';
import type { FitRecord, TimestampGap } from '../src/types/app-types';

const toSemicircle = (degrees: number): number => Math.round(degrees / SEMICIRCLE_TO_DEGREES);

describe('data-analyzer helpers', () => {
  describe('findSpeedBasedSlowPeriods', () => {
    const baseTime = new Date('2024-01-01T00:00:00Z');

    const createRecord = (offsetMs: number, speed: number, extras: Partial<FitRecord> = {}): FitRecord => ({
      timestamp: new Date(baseTime.getTime() + offsetMs),
      speed,
      distance: extras.distance ?? offsetMs / 1000,
      positionLat: extras.positionLat,
      positionLong: extras.positionLong,
    });

    it('groups slow sequences and splits on large timestamp gaps', () => {
      const records: FitRecord[] = [
        createRecord(0, 2.0),
        createRecord(60_000, 0.2, { positionLat: toSemicircle(52.0), positionLong: toSemicircle(-1.0) }),
        createRecord(120_000, 0.3, { positionLat: toSemicircle(52.0005), positionLong: toSemicircle(-1.0005) }),
        createRecord(180_000, 0.4, { positionLat: toSemicircle(52.001), positionLong: toSemicircle(-1.001) }),
        createRecord(240_000, 1.2),
        createRecord(600_000, 0.3, { positionLat: toSemicircle(52.01), positionLong: toSemicircle(-1.01) }),
        createRecord(660_000, 0.3, { positionLat: toSemicircle(52.0105), positionLong: toSemicircle(-1.0105) }),
        createRecord(720_000, 0.3, { positionLat: toSemicircle(52.011), positionLong: toSemicircle(-1.011) }),
      ];

      const periods = findSpeedBasedSlowPeriods(records, ['2to5'], 120_000);

      expect(periods).toHaveLength(2);

      expect(periods[0].recordCount).toBe(3);
      expect(periods[0].startTime.getTime()).toBe(new Date(baseTime.getTime() + 60_000).getTime());
      expect(periods[0].endTime.getTime()).toBe(new Date(baseTime.getTime() + 180_000).getTime());

      expect(periods[1].recordCount).toBe(3);
      expect(periods[1].startTime.getTime()).toBe(new Date(baseTime.getTime() + 600_000).getTime());
      expect(periods[1].endTime.getTime()).toBe(new Date(baseTime.getTime() + 720_000).getTime());
    });
  });

  describe('shouldBreakSequenceForTimestampGap', () => {
    const baseTime = new Date('2024-01-01T00:00:00Z');

    it('returns false for empty sequences', () => {
      expect(shouldBreakSequenceForTimestampGap([], {
        timestamp: new Date(baseTime.getTime() + 1_000_000),
      }, 120_000)).toBe(false);
    });

    it('returns false when the gap is within the threshold', () => {
      const sequence: FitRecord[] = [
        { timestamp: baseTime },
        { timestamp: new Date(baseTime.getTime() + 30_000) },
      ];

      const nextRecord: FitRecord = { timestamp: new Date(baseTime.getTime() + 110_000) };

      expect(shouldBreakSequenceForTimestampGap(sequence, nextRecord, 120_000)).toBe(false);
    });

    it('returns true when the gap exceeds the threshold', () => {
      const sequence: FitRecord[] = [
        { timestamp: baseTime },
        { timestamp: new Date(baseTime.getTime() + 30_000) },
      ];

      const nextRecord: FitRecord = { timestamp: new Date(baseTime.getTime() + 200_000) };

      expect(shouldBreakSequenceForTimestampGap(sequence, nextRecord, 120_000)).toBe(true);
    });
  });

  describe('findMatchingRecordingGaps', () => {
    const baseTime = new Date('2024-01-01T05:00:00Z');

    const lat1 = 52.0;
    const lon1 = -1.2;
    const lat2 = 52.5;
    const lon2 = -1.25;

    const records: FitRecord[] = [
      {
        timestamp: baseTime,
        distance: 0,
        positionLat: toSemicircle(lat1),
        positionLong: toSemicircle(lon1),
      },
      {
        timestamp: new Date(baseTime.getTime() + 8 * 60 * 1000),
        distance: 1000,
        positionLat: toSemicircle(lat2),
        positionLong: toSemicircle(lon2),
      },
    ];

    it('converts qualifying recording gaps into slow-period objects', () => {
      const gaps = findMatchingRecordingGaps(records, ['5to10'], 120_000);

      expect(gaps).toHaveLength(1);

      const [gap] = gaps;
      expect(gap.isGap).toBe(true);
      expect(gap.recordCount).toBe(0);
      expect(gap.startDistance).toBe(0);
      expect(gap.endDistance).toBe(1000);
      expect(gap.gpsPoints).toHaveLength(2);
      expect(gap.gpsPoints[0][0]).toBeCloseTo(lat1, 6);
      expect(gap.gpsPoints[0][1]).toBeCloseTo(lon1, 6);
      expect(gap.gpsPoints[1][0]).toBeCloseTo(lat2, 6);
      expect(gap.gpsPoints[1][1]).toBeCloseTo(lon2, 6);
      expect(gap.gapData?.gapDurationMinutes).toBe(8);
    });

    it('returns an empty list when no gaps match the selected ranges', () => {
      const gaps = findMatchingRecordingGaps(records, ['2to5'], 120_000);
      expect(gaps).toHaveLength(0);
    });
  });

  describe('convertGapToPeriod', () => {
    let gap: TimestampGap;

    beforeEach(() => {
      gap = {
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T09:10:00Z'),
        gapDuration: 600_000,
        gapDurationMinutes: 10,
        gapDurationHours: 10 / 60,
        startDistance: 1500,
        endDistance: 1700,
        startGpsPoint: [52.1, -1.25],
        endGpsPoint: [52.11, -1.3],
      };
    });

    it('wraps a timestamp gap in a slow-period compatible object', () => {
      const period = convertGapToPeriod(gap);

      expect(period.isGap).toBe(true);
      expect(period.recordCount).toBe(0);
      expect(period.startTime).toBe(gap.startTime);
      expect(period.endTime).toBe(gap.endTime);
      expect(period.startDistance).toBe(gap.startDistance);
      expect(period.endDistance).toBe(gap.endDistance);
      expect(period.gapData).toBe(gap);
    });
  });

  describe('buildGpsPointsFromGap', () => {
    const baseGap: TimestampGap = {
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T09:05:00Z'),
      gapDuration: 300_000,
      gapDurationMinutes: 5,
      gapDurationHours: 5 / 60,
      startDistance: 0,
      endDistance: 0,
      startGpsPoint: null,
      endGpsPoint: null,
    };

    it('returns both start and end points when available', () => {
      const points = buildGpsPointsFromGap({
        ...baseGap,
        startGpsPoint: [1, 2],
        endGpsPoint: [3, 4],
      });
      expect(points).toEqual([[1, 2], [3, 4]]);
    });

    it('falls back to single start point when end point missing', () => {
      const points = buildGpsPointsFromGap({
        ...baseGap,
        startGpsPoint: [5, 6],
      });
      expect(points).toEqual([[5, 6]]);
    });

    it('falls back to single end point when start point missing', () => {
      const points = buildGpsPointsFromGap({
        ...baseGap,
        endGpsPoint: [7, 8],
      });
      expect(points).toEqual([[7, 8]]);
    });

    it('returns an empty array when no GPS points exist', () => {
      const points = buildGpsPointsFromGap(baseGap);
      expect(points).toEqual([]);
    });
  });
});
