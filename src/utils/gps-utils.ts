// =============================================================================
// GPS UTILITY FUNCTIONS
// =============================================================================

import { FitRecord } from '../types/app-types';

export const SEMICIRCLE_TO_DEGREES = 180 / Math.pow(2, 31);

/**
 * Converts GPS coordinates from Garmin's semicircle format to decimal degrees
 */
export function convertGpsCoordinates(records: FitRecord[]): [number, number][] {
  return records
    .map(toGpsPoint)
    .filter((point): point is [number, number] => point !== null);
}

/**
 * Converts a record's GPS position from semicircles to decimal degrees, or null if it has no position
 */
export function toGpsPoint(record: FitRecord): [number, number] | null {
  const { positionLat, positionLong } = record;
  if (typeof positionLat !== 'number' || typeof positionLong !== 'number') {
    return null;
  }

  return [
    positionLat * SEMICIRCLE_TO_DEGREES,
    positionLong * SEMICIRCLE_TO_DEGREES,
  ];
}
