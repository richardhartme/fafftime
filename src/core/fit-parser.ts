// =============================================================================
// FIT FILE PARSING LOGIC
// =============================================================================

import { Decoder, Stream } from '@garmin/fitsdk';
import { FitData, FitSession, FitRecord, ActivityTimes } from '../types/app-types';

/**
 * Decodes a FIT file and returns the parsed data
 */
export async function decodeFitFile(file: File): Promise<FitData> {
  const arrayBuffer = await file.arrayBuffer();
  const fileStream = Stream.fromByteArray(new Uint8Array(arrayBuffer));
  const fileDecoder = new Decoder(fileStream);
  const { messages: fitData, errors: fitErrors } = fileDecoder.read();

  if (fitErrors.length > 0) {
    console.warn('FIT parsing errors:', fitErrors);
  }

  return fitData;
}

/**
 * Extracts basic activity timing and distance information from sessions and records
 */
export function extractActivityTimes(sessions: FitSession[], records: FitRecord[]): ActivityTimes {
  let startTime: Date | null = null;
  let endTime: Date | null = null;
  let movingTime: number | null = null;
  let totalDistance: number | null = null;

  if (sessions.length > 0) {
    const session = sessions[0];
    startTime = session.startTime ?? null;
    movingTime = typeof session.totalTimerTime === 'number' ? session.totalTimerTime : null;
    totalDistance = typeof session.totalDistance === 'number' ? session.totalDistance : null;

    if (startTime && typeof session.totalElapsedTime === 'number') {
      endTime = new Date(startTime.getTime() + (session.totalElapsedTime * 1000));
    }
  }

  // Record timestamps, when present, override the session-derived times
  const firstTimestamp = records.find(record => record.timestamp)?.timestamp;
  const lastTimestamp = findLastTimestamp(records);

  if (firstTimestamp) {
    startTime = firstTimestamp;
  }

  if (lastTimestamp) {
    endTime = lastTimestamp;
  }

  return { startTime, endTime, movingTime, totalDistance };
}

function findLastTimestamp(records: FitRecord[]): Date | undefined {
  for (let i = records.length - 1; i >= 0; i--) {
    const { timestamp } = records[i];
    if (timestamp) {
      return timestamp;
    }
  }
  return undefined;
}
