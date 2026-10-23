// =============================================================================
// TIME UTILITY FUNCTIONS
// =============================================================================

import { TimeRange } from '../types/app-types';
import { RANGE_LABELS } from './constants';

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
  return selectedRanges.map(range => RANGE_LABELS[range]).join(', ');
}

/**
 * Checks if a duration matches a specific time range category
 */
export function matchesTimeRange(range: TimeRange, durationMinutes: number, durationHours: number): boolean {
  switch (range) {
    case '2to5': return durationMinutes >= 2 && durationMinutes < 5;
    case '5to10': return durationMinutes >= 5 && durationMinutes < 10;
    case '10to30': return durationMinutes >= 10 && durationMinutes < 30;
    case '30to60': return durationMinutes >= 30 && durationMinutes < 60;
    case '1to2hours': return durationHours >= 1 && durationHours < 2;
    case 'over2hours': return durationHours >= 2;
    default: return false;
  }
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
