import { describe, expect, it } from 'vitest';
import { formatDuration, getSelectedRangeText, matchesTimeRange } from './time-utils';
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
    describe('2to5 range (2-5 minutes)', () => {
      const range: TimeRange = '2to5';

      it('returns false for durations under 2 minutes', () => {
        expect(matchesTimeRange(range, 0, 0)).toBe(false);
        expect(matchesTimeRange(range, 1, 1 / 60)).toBe(false);
        expect(matchesTimeRange(range, 1.99, 1.99 / 60)).toBe(false);
      });

      it('returns true for durations at or above 2 minutes', () => {
        expect(matchesTimeRange(range, 2, 2 / 60)).toBe(true);
        expect(matchesTimeRange(range, 2.5, 2.5 / 60)).toBe(true);
        expect(matchesTimeRange(range, 3, 3 / 60)).toBe(true);
        expect(matchesTimeRange(range, 4.99, 4.99 / 60)).toBe(true);
      });

      it('returns false for durations at or above 5 minutes', () => {
        expect(matchesTimeRange(range, 5, 5 / 60)).toBe(false);
        expect(matchesTimeRange(range, 6, 6 / 60)).toBe(false);
      });
    });

    describe('5to10 range (5-10 minutes)', () => {
      const range: TimeRange = '5to10';

      it('returns false for durations under 5 minutes', () => {
        expect(matchesTimeRange(range, 4.99, 4.99 / 60)).toBe(false);
      });

      it('returns true for durations from 5 to under 10 minutes', () => {
        expect(matchesTimeRange(range, 5, 5 / 60)).toBe(true);
        expect(matchesTimeRange(range, 7, 7 / 60)).toBe(true);
        expect(matchesTimeRange(range, 9.99, 9.99 / 60)).toBe(true);
      });

      it('returns false for durations at or above 10 minutes', () => {
        expect(matchesTimeRange(range, 10, 10 / 60)).toBe(false);
      });
    });

    describe('10to30 range (10-30 minutes)', () => {
      const range: TimeRange = '10to30';

      it('returns false for durations under 10 minutes', () => {
        expect(matchesTimeRange(range, 9.99, 9.99 / 60)).toBe(false);
      });

      it('returns true for durations from 10 to under 30 minutes', () => {
        expect(matchesTimeRange(range, 10, 10 / 60)).toBe(true);
        expect(matchesTimeRange(range, 20, 20 / 60)).toBe(true);
        expect(matchesTimeRange(range, 29.99, 29.99 / 60)).toBe(true);
      });

      it('returns false for durations at or above 30 minutes', () => {
        expect(matchesTimeRange(range, 30, 30 / 60)).toBe(false);
      });
    });

    describe('30to60 range (30-60 minutes)', () => {
      const range: TimeRange = '30to60';

      it('returns false for durations under 30 minutes', () => {
        expect(matchesTimeRange(range, 29.99, 29.99 / 60)).toBe(false);
      });

      it('returns true for durations from 30 to under 60 minutes', () => {
        expect(matchesTimeRange(range, 30, 30 / 60)).toBe(true);
        expect(matchesTimeRange(range, 45, 45 / 60)).toBe(true);
        expect(matchesTimeRange(range, 59.99, 59.99 / 60)).toBe(true);
      });

      it('returns false for durations at or above 60 minutes', () => {
        expect(matchesTimeRange(range, 60, 1)).toBe(false);
      });
    });

    describe('1to2hours range (1-2 hours)', () => {
      const range: TimeRange = '1to2hours';

      it('returns false for durations under 1 hour', () => {
        expect(matchesTimeRange(range, 59, 59 / 60)).toBe(false);
        expect(matchesTimeRange(range, 59.99, 0.999)).toBe(false);
      });

      it('returns true for durations from 1 to under 2 hours', () => {
        expect(matchesTimeRange(range, 60, 1)).toBe(true);
        expect(matchesTimeRange(range, 90, 1.5)).toBe(true);
        expect(matchesTimeRange(range, 119, 1.98)).toBe(true);
      });

      it('returns false for durations at or above 2 hours', () => {
        expect(matchesTimeRange(range, 120, 2)).toBe(false);
        expect(matchesTimeRange(range, 150, 2.5)).toBe(false);
      });
    });

    describe('over2hours range (2+ hours)', () => {
      const range: TimeRange = 'over2hours';

      it('returns false for durations under 2 hours', () => {
        expect(matchesTimeRange(range, 119, 1.98)).toBe(false);
        expect(matchesTimeRange(range, 119.99, 1.999)).toBe(false);
      });

      it('returns true for durations at or above 2 hours', () => {
        expect(matchesTimeRange(range, 120, 2)).toBe(true);
        expect(matchesTimeRange(range, 150, 2.5)).toBe(true);
        expect(matchesTimeRange(range, 600, 10)).toBe(true);
      });
    });

    describe('unknown range handling', () => {
      it('returns false for unknown range values', () => {
        expect(matchesTimeRange('invalid' as TimeRange, 30, 0.5)).toBe(false);
        expect(matchesTimeRange('' as TimeRange, 30, 0.5)).toBe(false);
      });
    });
  });
});
