// =============================================================================
// TIME UTILITY FUNCTIONS
// =============================================================================

import { TimeRange } from '../types/app-types';
import { TIME_RANGES } from './constants';

const MS_PER_MINUTE = 60 * 1000;

/**
 * Formats a duration in seconds to a human-readable string
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (totalSeconds >= 3600) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Whole seconds between a period's start and end, never negative
 */
export function periodDurationSeconds(period: { startTime: Date; endTime: Date }): number {
  return Math.max(0, Math.round((period.endTime.getTime() - period.startTime.getTime()) / 1000));
}

/**
 * Converts selected time range keys to human-readable text
 */
export function getSelectedRangeText(selectedRanges: TimeRange[]): string {
  return selectedRanges.map(getRangeLabel).join(', ');
}

/**
 * Display label for a time range
 */
export function getRangeLabel(range: TimeRange): string {
  return TIME_RANGES.find(({ id }) => id === range)?.label ?? '';
}

/**
 * Checks if a duration matches a specific time range category
 */
export function matchesTimeRange(range: TimeRange, durationMs: number): boolean {
  const definition = TIME_RANGES.find(({ id }) => id === range);
  if (!definition) return false;
  return durationMs >= definition.minMinutes * MS_PER_MINUTE && durationMs < definition.maxMinutes * MS_PER_MINUTE;
}

const LOCALE = 'en-GB';

export function formatDateTime(date: Date): string {
  return date.toLocaleString(LOCALE);
}

export function formatPeriodStart(date: Date): string {
  return date.toLocaleString(LOCALE, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE);
}
