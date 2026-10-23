import { describe, expect, it } from 'vitest';
import { formatDateTime, formatPeriodStart, formatTime, formatDuration, getSelectedRangeText, matchesTimeRange, periodDurationSeconds } from './time-utils';
import type { TimeRange } from '../types/app-types';

describe('time-utils', () => {
  describe('formatDuration', () => {
    it('formats zero seconds', () => {
      expect(formatDuration(0)).toBe('0m 0s');
    });

    it('formats seconds only (under 1 minute)', () => {
      expect(formatDuration(1)).toBe('0m 1s');
      expect(formatDuration(30)).toBe('0m 30s');
      expect(formatDuration(59)).toBe('0m 59s');
    });

    it('formats exact minutes', () => {
      expect(formatDuration(60)).toBe('1m 0s');
      expect(formatDuration(120)).toBe('2m 0s');
      expect(formatDuration(300)).toBe('5m 0s');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(61)).toBe('1m 1s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(125)).toBe('2m 5s');
      expect(formatDuration(599)).toBe('9m 59s');
    });

    it('formats exact hours', () => {
      expect(formatDuration(3600)).toBe('1h 0m 0s');
      expect(formatDuration(7200)).toBe('2h 0m 0s');
    });

    it('formats hours with minutes and seconds', () => {
      expect(formatDuration(3661)).toBe('1h 1m 1s');
      expect(formatDuration(3665)).toBe('1h 1m 5s');
      expect(formatDuration(7322)).toBe('2h 2m 2s');
      expect(formatDuration(5400)).toBe('1h 30m 0s');
    });

    it('formats large durations', () => {
      expect(formatDuration(86400)).toBe('24h 0m 0s');
      expect(formatDuration(90061)).toBe('25h 1m 1s');
    });

    it('preserves fractional seconds in output', () => {
      expect(formatDuration(1.5)).toBe('0m 1.5s');
      expect(formatDuration(60.5)).toBe('1m 0.5s');
    });
  });

  describe('getSelectedRangeText', () => {
    it('returns empty string for empty array', () => {
      expect(getSelectedRangeText([])).toBe('');
    });

    it('returns single range label', () => {
      expect(getSelectedRangeText(['2to5'])).toBe('2-5 minutes');
      expect(getSelectedRangeText(['5to10'])).toBe('5-10 minutes');
      expect(getSelectedRangeText(['10to30'])).toBe('10-30 minutes');
      expect(getSelectedRangeText(['30to60'])).toBe('30-60 minutes');
      expect(getSelectedRangeText(['1to2hours'])).toBe('1-2 hours');
      expect(getSelectedRangeText(['over2hours'])).toBe('Over 2 hours');
    });

    it('joins multiple ranges with commas', () => {
      expect(getSelectedRangeText(['2to5', '5to10'])).toBe('2-5 minutes, 5-10 minutes');
      expect(getSelectedRangeText(['2to5', '5to10', '10to30'])).toBe('2-5 minutes, 5-10 minutes, 10-30 minutes');
    });

    it('preserves order of provided ranges', () => {
      expect(getSelectedRangeText(['over2hours', '2to5'])).toBe('Over 2 hours, 2-5 minutes');
    });
  });

  describe('matchesTimeRange', () => {
    const MINUTE_MS = 60 * 1000;
    const ms = (minutes: number) => minutes * MINUTE_MS;

    const edges: [TimeRange, number, number | null][] = [
      ['2to5', 2, 5],
      ['5to10', 5, 10],
      ['10to30', 10, 30],
      ['30to60', 30, 60],
      ['1to2hours', 60, 120],
      ['over2hours', 120, null],
    ];

    describe.each(edges)('%s', (range, lower, upper) => {
      it('excludes durations just under the lower bound', () => {
        expect(matchesTimeRange(range, ms(lower) - 1)).toBe(false);
      });

      it('includes a duration exactly at the lower bound', () => {
        expect(matchesTimeRange(range, ms(lower))).toBe(true);
      });

      it('includes durations just over the lower bound', () => {
        expect(matchesTimeRange(range, ms(lower) + 1)).toBe(true);
      });

      if (upper !== null) {
        it('includes durations just under the upper bound', () => {
          expect(matchesTimeRange(range, ms(upper) - 1)).toBe(true);
        });

        it('excludes a duration exactly at the upper bound', () => {
          expect(matchesTimeRange(range, ms(upper))).toBe(false);
        });
      } else {
        it('has no upper bound', () => {
          expect(matchesTimeRange(range, ms(10_000))).toBe(true);
        });
      }
    });

    it('excludes durations under 2 minutes from every range', () => {
      edges.forEach(([range]) => {
        expect(matchesTimeRange(range, 0)).toBe(false);
        expect(matchesTimeRange(range, ms(1))).toBe(false);
      });
    });

    it('returns false for unknown range values', () => {
      expect(matchesTimeRange('invalid' as TimeRange, ms(30))).toBe(false);
      expect(matchesTimeRange('' as TimeRange, ms(30))).toBe(false);
    });
  });

  describe('date formatting', () => {
    // Local-time constructor keeps the assertions timezone-independent
    const date = new Date(2026, 9, 23, 14, 5, 9);

    it('formats a full date and time in en-GB', () => {
      expect(formatDateTime(date)).toBe('23/10/2026, 14:05:09');
    });

    it('formats a period start with weekday and month name', () => {
      expect(formatPeriodStart(date)).toBe('Fri 23 Oct, 14:05:09');
    });

    it('formats a time of day in 24-hour en-GB', () => {
      expect(formatTime(date)).toBe('14:05:09');
    });
  });
});

describe('periodDurationSeconds', () => {
  it('returns whole seconds between start and end', () => {
    const period = { startTime: new Date('2024-01-01T10:00:00Z'), endTime: new Date('2024-01-01T10:05:30Z') };
    expect(periodDurationSeconds(period)).toBe(330);
  });

  it('rounds to the nearest second', () => {
    const period = { startTime: new Date('2024-01-01T10:00:00.000Z'), endTime: new Date('2024-01-01T10:00:01.600Z') };
    expect(periodDurationSeconds(period)).toBe(2);
  });

  it('clamps a negative duration to zero', () => {
    const period = { startTime: new Date('2024-01-01T10:05:00Z'), endTime: new Date('2024-01-01T10:00:00Z') };
    expect(periodDurationSeconds(period)).toBe(0);
  });
});
