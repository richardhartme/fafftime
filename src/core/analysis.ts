// =============================================================================
// ANALYSIS AGGREGATION LOGIC
// =============================================================================

import { FitData, SlowPeriod, TimeRange } from '../types/app-types';
import { AnalysisResult, RangeBreakdownEntry, SlowPeriodStats } from '../types/analysis';
import { findSlowPeriodsWithRanges, findTimestampGaps } from './data-analyzer';
import { extractActivityTimes } from './fit-parser';
import { convertGpsCoordinates } from '../utils/gps-utils';
import { getRangeLabel, getSelectedRangeText, matchesTimeRange, periodDurationSeconds } from '../utils/time-utils';

export function calculateSlowPeriodStatistics(
  slowPeriods: SlowPeriod[],
  selectedRanges: TimeRange[]
): SlowPeriodStats {
  const timed = slowPeriods.map(period => ({
    period,
    durationMs: period.endTime.getTime() - period.startTime.getTime(),
    durationSeconds: periodDurationSeconds(period),
  }));

  const summarise = (entries: typeof timed) => {
    const gaps = entries.filter(({ period }) => period.isGap);
    return {
      slowCount: entries.length - gaps.length,
      gapCount: gaps.length,
      totalDurationSeconds: sumDurations(entries),
      gapDurationSeconds: sumDurations(gaps),
    };
  };

  const rangeBreakdown: RangeBreakdownEntry[] = selectedRanges.map(range => {
    const matching = timed.filter(({ durationMs }) => matchesTimeRange(range, durationMs));
    const { slowCount, gapCount, totalDurationSeconds } = summarise(matching);

    return {
      range,
      label: getRangeLabel(range),
      count: matching.length,
      slowCount,
      gapCount,
      totalDurationSeconds,
    };
  });

  return { ...summarise(timed), rangeBreakdown };
}

function sumDurations(entries: { durationSeconds: number }[]): number {
  return entries.reduce((total, { durationSeconds }) => total + durationSeconds, 0);
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
  const timestampGaps = findTimestampGaps(records, gapThreshold);
  const slowPeriods = findSlowPeriodsWithRanges(records, selectedRanges, gapThreshold, timestampGaps);
  const activityRoute = convertGpsCoordinates(records);
  const stats = calculateSlowPeriodStatistics(slowPeriods, selectedRanges);
  const selectedRangeText = selectedRanges.length > 0 ? getSelectedRangeText(selectedRanges) : 'None selected';

  const durationSeconds = startTime && endTime
    ? periodDurationSeconds({ startTime, endTime })
    : null;

  return {
    fitData,
    fileName,
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
