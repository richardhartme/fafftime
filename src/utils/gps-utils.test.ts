import { describe, expect, it } from 'vitest';
import { convertGpsCoordinates, SEMICIRCLE_TO_DEGREES } from './gps-utils';
import type { FitRecord } from '../types/app-types';

// Helper to convert decimal degrees to semicircles (reverse of SEMICIRCLE_TO_DEGREES)
const toSemicircle = (degrees: number): number => Math.round(degrees / SEMICIRCLE_TO_DEGREES);

describe('gps-utils', () => {
  describe('SEMICIRCLE_TO_DEGREES constant', () => {
    it('has the correct conversion value', () => {
      // Garmin uses 2^31 semicircles for 180 degrees
      const expected = 180 / Math.pow(2, 31);
      expect(SEMICIRCLE_TO_DEGREES).toBe(expected);
    });

    it('converts known semicircle values correctly', () => {
      // Test with known values
      // 0 semicircles = 0 degrees
      expect(0 * SEMICIRCLE_TO_DEGREES).toBe(0);

      // 2^31 semicircles = 180 degrees
      expect(Math.pow(2, 31) * SEMICIRCLE_TO_DEGREES).toBe(180);

      // -2^31 semicircles = -180 degrees
      expect(-Math.pow(2, 31) * SEMICIRCLE_TO_DEGREES).toBe(-180);
    });
  });

  describe('convertGpsCoordinates', () => {
    it('returns empty array for empty input', () => {
      expect(convertGpsCoordinates([])).toEqual([]);
    });

    it('converts valid GPS coordinates from semicircles to decimal degrees', () => {
      const lat = 51.5074; // London
      const lng = -0.1278;

      const records: FitRecord[] = [
        {
          positionLat: toSemicircle(lat),
          positionLong: toSemicircle(lng),
        },
      ];

      const result = convertGpsCoordinates(records);

      expect(result).toHaveLength(1);
      expect(result[0][0]).toBeCloseTo(lat, 4);
      expect(result[0][1]).toBeCloseTo(lng, 4);
    });

    it('converts multiple records', () => {
      const coords = [
        { lat: 51.5074, lng: -0.1278 },  // London
        { lat: 48.8566, lng: 2.3522 },   // Paris
        { lat: 40.7128, lng: -74.0060 }, // New York
      ];

      const records: FitRecord[] = coords.map(c => ({
        positionLat: toSemicircle(c.lat),
        positionLong: toSemicircle(c.lng),
      }));

      const result = convertGpsCoordinates(records);

      expect(result).toHaveLength(3);
      coords.forEach((coord, i) => {
        expect(result[i][0]).toBeCloseTo(coord.lat, 4);
        expect(result[i][1]).toBeCloseTo(coord.lng, 4);
      });
    });

    it('filters out records with missing latitude', () => {
      const records: FitRecord[] = [
        { positionLat: toSemicircle(51.5), positionLong: toSemicircle(-0.1) },
        { positionLat: undefined, positionLong: toSemicircle(-0.1) },
        { positionLat: toSemicircle(48.8), positionLong: toSemicircle(2.3) },
      ];

      const result = convertGpsCoordinates(records);

      expect(result).toHaveLength(2);
    });

    it('filters out records with missing longitude', () => {
      const records: FitRecord[] = [
        { positionLat: toSemicircle(51.5), positionLong: toSemicircle(-0.1) },
        { positionLat: toSemicircle(51.5), positionLong: undefined },
        { positionLat: toSemicircle(48.8), positionLong: toSemicircle(2.3) },
      ];

      const result = convertGpsCoordinates(records);

      expect(result).toHaveLength(2);
    });

    it('filters out records with both coordinates missing', () => {
      const records: FitRecord[] = [
        { positionLat: toSemicircle(51.5), positionLong: toSemicircle(-0.1) },
        { positionLat: undefined, positionLong: undefined },
        { timestamp: new Date() }, // Record with no GPS at all
        { positionLat: toSemicircle(48.8), positionLong: toSemicircle(2.3) },
      ];

      const result = convertGpsCoordinates(records);

      expect(result).toHaveLength(2);
    });

    it('handles extreme coordinate values', () => {
      const records: FitRecord[] = [
        // North Pole
        { positionLat: toSemicircle(90), positionLong: toSemicircle(0) },
        // South Pole
        { positionLat: toSemicircle(-90), positionLong: toSemicircle(0) },
        // International Date Line (positive)
        { positionLat: toSemicircle(0), positionLong: toSemicircle(180) },
        // International Date Line (negative)
        { positionLat: toSemicircle(0), positionLong: toSemicircle(-180) },
      ];

      const result = convertGpsCoordinates(records);

      expect(result).toHaveLength(4);
      expect(result[0][0]).toBeCloseTo(90, 4);  // North Pole lat
      expect(result[1][0]).toBeCloseTo(-90, 4); // South Pole lat
      expect(result[2][1]).toBeCloseTo(180, 4); // Date line positive
      expect(result[3][1]).toBeCloseTo(-180, 4); // Date line negative
    });

    it('handles equator and prime meridian', () => {
      const records: FitRecord[] = [
        { positionLat: toSemicircle(0), positionLong: toSemicircle(0) },
      ];

      const result = convertGpsCoordinates(records);

      expect(result).toHaveLength(1);
      expect(result[0][0]).toBeCloseTo(0, 4);
      expect(result[0][1]).toBeCloseTo(0, 4);
    });

    it('preserves record order', () => {
      const coords = [
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
        { lat: 3, lng: 3 },
        { lat: 4, lng: 4 },
      ];

      const records: FitRecord[] = coords.map(c => ({
        positionLat: toSemicircle(c.lat),
        positionLong: toSemicircle(c.lng),
      }));

      const result = convertGpsCoordinates(records);

      expect(result).toHaveLength(4);
      coords.forEach((coord, i) => {
        expect(result[i][0]).toBeCloseTo(coord.lat, 4);
        expect(result[i][1]).toBeCloseTo(coord.lng, 4);
      });
    });

    it('handles records with other properties alongside GPS', () => {
      const records: FitRecord[] = [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          speed: 5.5,
          distance: 1000,
          positionLat: toSemicircle(51.5),
          positionLong: toSemicircle(-0.1),
        },
      ];

      const result = convertGpsCoordinates(records);

      expect(result).toHaveLength(1);
      expect(result[0][0]).toBeCloseTo(51.5, 4);
      expect(result[0][1]).toBeCloseTo(-0.1, 4);
    });
  });
});
