// =============================================================================
// ANALYSIS-SPECIFIC TYPE DEFINITIONS
// =============================================================================

import { FitData, FitRecord, FitSession, SlowPeriod, TimeRange, TimestampGap } from './app-types';

export interface RangeBreakdownEntry {
  range: TimeRange;
  label: string;
  count: number;
  slowCount: number;
  gapCount: number;
  totalDurationSeconds: number;
}

export interface SlowPeriodStats {
  slowCount: number;
  gapCount: number;
  totalDurationSeconds: number;
  rangeBreakdown: RangeBreakdownEntry[];
  gapDurationSeconds: number;
}

export interface AnalysisResult {
  fitData: FitData;
  fileName: string;
  records: FitRecord[];
  sessions: FitSession[];
  timestampGaps: TimestampGap[];
  slowPeriods: SlowPeriod[];
  activityRoute: [number, number][];
  startTime: Date | null;
  endTime: Date | null;
  movingTime: number | null;
  totalDistance: number | null;
  durationSeconds: number | null;
  stats: SlowPeriodStats;
  selectedRangeText: string;
}

export interface ParsedFileState {
  fitData: FitData;
  fileName: string;
}
