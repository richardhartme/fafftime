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
    .map(record => {
      if (typeof record.positionLat !== 'number' || typeof record.positionLong !== 'number') {
        return null;
      }

      return [
        record.positionLat * SEMICIRCLE_TO_DEGREES,
        record.positionLong * SEMICIRCLE_TO_DEGREES,
      ] as [number, number];
    })
    .filter((point): point is [number, number] => point !== null);
}
