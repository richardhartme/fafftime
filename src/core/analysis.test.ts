import { describe, expect, it } from 'vitest';

import { calculateSlowPeriodStatistics, buildAnalysisResult } from './analysis';
import { getSelectedRangeText } from '../utils/time-utils';
import { SEMICIRCLE_TO_DEGREES } from '../utils/gps-utils';
import type { SlowPeriod, TimeRange, FitData, FitRecord, FitSession } from '../types/app-types';

const toSemicircle = (degrees: number): number => Math.round(degrees / SEMICIRCLE_TO_DEGREES);

describe('calculateSlowPeriodStatistics', () => {
  const selectedRanges: TimeRange[] = ['2to5', '5to10'];

  const baseTime = new Date('2024-01-01T08:00:00Z');

  const createPeriod = (startOffsetMinutes: number, durationMinutes: number): SlowPeriod => {
    const start = new Date(baseTime.getTime() + startOffsetMinutes * 60 * 1000);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return {
      startTime: start,
      endTime: end,
      recordCount: durationMinutes,
      startDistance: 10 * startOffsetMinutes,
      endDistance: 10 * startOffsetMinutes + durationMinutes,
      gpsPoints: [],
    };
  };

  it('aggregates slow and gap durations into summary statistics', () => {
    const slowA = createPeriod(0, 3); // Matches 2-5
    const slowB = createPeriod(10, 7); // Matches 5-10
    const gap: SlowPeriod = {
      ...createPeriod(30, 6),
      isGap: true,
    };

    const stats = calculateSlowPeriodStatistics([slowA, slowB, gap], selectedRanges);

    expect(stats.slowCount).toBe(2);
    expect(stats.gapCount).toBe(1);
    expect(stats.totalDurationSeconds).toBe((3 + 7 + 6) * 60);
    expect(stats.gapDurationSeconds).toBe(6 * 60);

    expect(stats.rangeBreakdown).toEqual([
      {
        range: '2to5',
        label: '2-5 minutes',
        count: 1,
        totalDurationSeconds: 3 * 60,
      },
      {
        range: '5to10',
        label: '5-10 minutes',
        count: 1,
        totalDurationSeconds: 7 * 60,
      },
    ]);
  });

  it('produces zeroed breakdown entries when no periods match', () => {
    const stats = calculateSlowPeriodStatistics([createPeriod(0, 3)], ['30to60']);

    expect(stats.rangeBreakdown).toEqual([
      {
        range: '30to60',
        label: '30-60 minutes',
        count: 0,
        totalDurationSeconds: 0,
      },
    ]);
  });
});

describe('getSelectedRangeText', () => {
  it('joins selected range labels with commas', () => {
    expect(getSelectedRangeText(['2to5', '5to10'])).toBe('2-5 minutes, 5-10 minutes');
  });

  it('returns an empty string when no ranges selected', () => {
    expect(getSelectedRangeText([])).toBe('');
  });
});

describe('buildAnalysisResult', () => {
  const startTime = new Date('2024-01-02T08:00:00Z');
  const session: FitSession = {
    startTime,
    totalTimerTime: 540,
    totalElapsedTime: 600,
    totalDistance: 12_345,
  };

  const records: FitRecord[] = [
    {
      timestamp: startTime,
      speed: 2.0,
      distance: 0,
      positionLat: toSemicircle(52.0),
      positionLong: toSemicircle(-1.2),
    },
    {
      timestamp: new Date(startTime.getTime() + 60_000),
      speed: 0.2,
      distance: 50,
      positionLat: toSemicircle(52.0005),
      positionLong: toSemicircle(-1.2005),
    },
    {
      timestamp: new Date(startTime.getTime() + 180_000),
      speed: 0.2,
      distance: 75,
      positionLat: toSemicircle(52.001),
      positionLong: toSemicircle(-1.201),
    },
    {
      timestamp: new Date(startTime.getTime() + 240_000),
      speed: 1.5,
      distance: 120,
      positionLat: toSemicircle(52.002),
      positionLong: toSemicircle(-1.202),
    },
  ];

  const fitData: FitData = {
    sessionMesgs: [session],
    recordMesgs: records,
  };

  it('builds a full analysis result from FIT data and selections', () => {
    const result = buildAnalysisResult(fitData, 'example.fit', ['2to5'], 120_000);

    expect(result.fileName).toBe('example.fit');
    expect(result.records).toBe(records);
    expect(result.sessions).toBe(fitData.sessionMesgs);
    expect(result.startTime?.getTime()).toBe(session.startTime?.getTime());

    const lastRecordTimestamp = records[records.length - 1]?.timestamp;
    expect(result.endTime?.getTime()).toBe(lastRecordTimestamp?.getTime());

    const expectedDurationSeconds = Math.max(0, Math.round(((lastRecordTimestamp?.getTime() ?? 0) - startTime.getTime()) / 1000));
    expect(result.durationSeconds).toBe(expectedDurationSeconds);
    expect(result.movingTime).toBe(session.totalTimerTime);
    expect(result.totalDistance).toBe(session.totalDistance);

    expect(result.slowPeriods).toHaveLength(1);
    expect(result.slowPeriods[0].recordCount).toBe(2);
    expect(result.stats.slowCount).toBe(1);
    expect(result.stats.gapCount).toBe(0);
    expect(result.stats.totalDurationSeconds).toBe(120);
    expect(result.stats.rangeBreakdown[0]).toMatchObject({
      range: '2to5',
      count: 1,
      totalDurationSeconds: 120,
    });

    expect(result.activityRoute).toHaveLength(records.length);
    expect(result.activityRoute[0][0]).toBeCloseTo(52.0, 6);
    expect(result.activityRoute[0][1]).toBeCloseTo(-1.2, 6);
    expect(result.timestampGaps).toEqual([]);
    expect(result.selectedRangeText).toBe('2-5 minutes');
  });
});
