// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

export interface TimeRangeDefinition {
  id: string;
  label: string;
  minMinutes: number; // inclusive
  maxMinutes: number; // exclusive
}

// Single source of truth for range ids, bounds, labels and display order
export const TIME_RANGES = [
  { id: '2to5', label: '2-5 minutes', minMinutes: 2, maxMinutes: 5 },
  { id: '5to10', label: '5-10 minutes', minMinutes: 5, maxMinutes: 10 },
  { id: '10to30', label: '10-30 minutes', minMinutes: 10, maxMinutes: 30 },
  { id: '30to60', label: '30-60 minutes', minMinutes: 30, maxMinutes: 60 },
  { id: '1to2hours', label: '1-2 hours', minMinutes: 60, maxMinutes: 120 },
  { id: 'over2hours', label: 'Over 2 hours', minMinutes: 120, maxMinutes: Infinity },
] as const satisfies readonly TimeRangeDefinition[];

export type TimeRange = (typeof TIME_RANGES)[number]['id'];

export const MS_PER_MINUTE = 60 * 1000;

export const SPEED_THRESHOLD: number = 0.75; // m/s threshold for slow periods

export const SPEED_THRESHOLD_TEXT = `speed < ${SPEED_THRESHOLD} m/s`;

export const DEFAULT_GAP_THRESHOLD_MS = 120000;

export const GAP_THRESHOLD_OPTIONS: { value: number; label: string }[] = [
  { value: 60000, label: '1 minute' },
  { value: 120000, label: '2 minutes' },
  { value: 180000, label: '3 minutes' },
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' },
];

export const DEFAULT_SELECTED_RANGES: TimeRange[] = TIME_RANGES.map(range => range.id);
