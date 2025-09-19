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

const { decodeFitFile } = await import('../src/core/fit-parser');

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
