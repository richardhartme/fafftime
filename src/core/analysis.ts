// =============================================================================
// ANALYSIS AGGREGATION LOGIC
// =============================================================================

import { FitData, SlowPeriod, TimeRange } from '../types/app-types';
import { AnalysisResult, RangeBreakdownEntry, SlowPeriodStats } from '../types/analysis';
import { findSlowPeriodsWithRanges, findTimestampGaps } from './data-analyzer';
import { extractActivityTimes } from './fit-parser';
import { convertGpsCoordinates } from '../utils/gps-utils';
import { RANGE_LABELS } from '../utils/constants';
import { getSelectedRangeText, matchesTimeRange } from './time-utils';

export function calculateSlowPeriodStatistics(
  slowPeriods: SlowPeriod[],
  selectedRanges: TimeRange[]
): SlowPeriodStats {
  const slowCount = slowPeriods.filter(period => !period.isGap).length;
  const gapCount = slowPeriods.filter(period => period.isGap).length;
  const totalDurationSeconds = slowPeriods.reduce((total, period) => {
    const durationSeconds = Math.max(0, Math.round((period.endTime.getTime() - period.startTime.getTime()) / 1000));
    return total + durationSeconds;
  }, 0);
  const gapDurationSeconds = slowPeriods.reduce((total, period) => {
    if (!period.isGap) return total;
    const durationSeconds = Math.max(0, Math.round((period.endTime.getTime() - period.startTime.getTime()) / 1000));
    return total + durationSeconds;
  }, 0);

  const rangeBreakdown: RangeBreakdownEntry[] = selectedRanges.map(range => {
    const matchingPeriods = slowPeriods.filter(period => {
      if (period.isGap) return false;
      const durationMs = period.endTime.getTime() - period.startTime.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      const durationHours = durationMinutes / 60;
      return matchesTimeRange(range, durationMinutes, durationHours);
    });

    const totalDurationSeconds = matchingPeriods.reduce((total, period) => {
      const durationMs = period.endTime.getTime() - period.startTime.getTime();
      const durationSeconds = Math.max(0, Math.round(durationMs / 1000));
      return total + durationSeconds;
    }, 0);

    return {
      range,
      label: RANGE_LABELS[range],
      count: matchingPeriods.length,
      totalDurationSeconds,
    };
  });

  return {
    slowCount,
    gapCount,
    totalDurationSeconds,
    gapDurationSeconds,
    rangeBreakdown,
  };
}

export function buildAnalysisResult(
  fitData: FitData,
  fileName: string,
  selectedRanges: TimeRange[],
  gapThreshold: number
): AnalysisResult {
  const sessions = fitData.sessionMesgs || [];
  const records = fitData.recordMesgs || [];
  const { startTime, endTime, movingTime, totalDistance } = extractActivityTimes(sessions, records);
  const slowPeriods = findSlowPeriodsWithRanges(records, selectedRanges, gapThreshold);
  const timestampGaps = findTimestampGaps(records, gapThreshold);
  const activityRoute = convertGpsCoordinates(records);
  const stats = calculateSlowPeriodStatistics(slowPeriods, selectedRanges);
  const selectedRangeText = selectedRanges.length > 0 ? getSelectedRangeText(selectedRanges) : 'None selected';

  const durationSeconds = startTime && endTime
    ? Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000))
    : null;

  return {
    fitData,
    fileName,
    records,
    sessions,
    timestampGaps,
    slowPeriods,
    activityRoute,
    startTime,
    endTime,
    movingTime,
    totalDistance,
    durationSeconds,
    stats,
    selectedRangeText,
  };
}
