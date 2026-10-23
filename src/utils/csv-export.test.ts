import { describe, expect, it } from 'vitest';
import { generateCsvExport } from './csv-export';
import type { AnalysisResult } from '../types/analysis';
import type { SlowPeriod } from '../types/app-types';

const faffPeriod: SlowPeriod = {
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T10:05:30Z'),
  recordCount: 330,
  startDistance: 12345,
  endDistance: 12400,
  gpsPoints: [[51.5, -0.1], [51.6, -0.2]],
};

const toResult = (slowPeriods: SlowPeriod[]) => ({ slowPeriods }) as AnalysisResult;

describe('generateCsvExport', () => {
  it('writes duration and Google Maps links for a faff period', () => {
    const [, row] = generateCsvExport(toResult([faffPeriod])).split('\n');
    // URLs contain commas, so the CSV quotes them
    expect(row).toBe([
      'Faff Period,2024-01-01T10:00:00.000Z,2024-01-01T10:05:30.000Z,330,5m 30s,12.345,12.400,51.5,-0.1,51.6,-0.2',
      '"https://www.google.com/maps?q=51.5,-0.1"',
      '"https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=51.5,-0.1"',
    ].join(','));
  });

  it('leaves location columns empty when there is no GPS', () => {
    const [, row] = generateCsvExport(toResult([{ ...faffPeriod, gpsPoints: [] }])).split('\n');
    expect(row).toBe('Faff Period,2024-01-01T10:00:00.000Z,2024-01-01T10:05:30.000Z,330,5m 30s,12.345,12.400,,,,,,');
  });
});
