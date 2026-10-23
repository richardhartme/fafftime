// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

import { TimeRange } from '../types/app-types';

export const RANGE_LABELS: Record<TimeRange, string> = {
  '2to5': '2-5 minutes',
  '5to10': '5-10 minutes',
  '10to30': '10-30 minutes',
  '30to60': '30-60 minutes',
  '1to2hours': '1-2 hours',
  'over2hours': 'Over 2 hours'
};

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

export const DEFAULT_SELECTED_RANGES: TimeRange[] = [
  '2to5',
  '5to10',
  '10to30',
  '30to60',
  '1to2hours',
  'over2hours'
];
