// =============================================================================
// DATA ANALYSIS FUNCTIONS (CORE BUSINESS LOGIC)
// =============================================================================

import { FitRecord, TimestampGap, SlowPeriod, TimeRange } from '../types/app-types';
import { SPEED_THRESHOLD, DEFAULT_GAP_THRESHOLD_MS } from '../utils/constants';
import { convertGpsCoordinates, toGpsPoint } from '../utils/gps-utils';
import { matchesTimeRange } from '../utils/time-utils';

/**
 * Finds slow periods and recording gaps from FIT file records that match the selected time ranges.
 * This function combines two types of "faff time":
 * 1. Slow periods: Consecutive sequences where speed < SPEED_THRESHOLD (rider is moving slowly or stopped)
 * 2. Recording gaps: Periods where no data was recorded (device off/paused) for longer than the gap threshold
 *
 * Pass `timestampGaps` when the caller has already run `findTimestampGaps` with the same records and
 * threshold, to avoid scanning the records twice.
 *
 * @returns Both kinds of period, sorted chronologically
 */
export function findSlowPeriodsWithRanges(
  records: FitRecord[],
  selectedRanges: TimeRange[],
  gapThreshold: number = DEFAULT_GAP_THRESHOLD_MS,
  timestampGaps: TimestampGap[] = findTimestampGaps(records, gapThreshold)
): SlowPeriod[] {
  if (selectedRanges.length === 0) return [];

  const slowPeriods = findSpeedBasedSlowPeriods(records, selectedRanges, gapThreshold);
  const gapPeriods = findMatchingRecordingGaps(timestampGaps, selectedRanges);

  return [...slowPeriods, ...gapPeriods].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Finds slow periods based on speed analysis
 */
function findSpeedBasedSlowPeriods(
  records: FitRecord[],
  selectedRanges: TimeRange[],
  gapThreshold: number
): SlowPeriod[] {
  const slowPeriods: SlowPeriod[] = [];
  let currentSlowSequence: FitRecord[] = [];

  // Turns the accumulated slow sequence (if it matches a selected range) into a period
  const flush = () => {
    const slowPeriod = processSlowSequence(currentSlowSequence, selectedRanges);
    if (slowPeriod) {
      slowPeriods.push(slowPeriod);
    }
  };

  for (const record of records) {
    const speed = record.enhancedSpeed || record.speed || 0;

    if (speed >= SPEED_THRESHOLD) {
      flush();
      currentSlowSequence = [];
    } else if (shouldBreakSequenceForTimestampGap(currentSlowSequence, record, gapThreshold)) {
      flush();
      currentSlowSequence = [record];
    } else {
      currentSlowSequence.push(record);
    }
  }

  flush();

  return slowPeriods;
}

/**
 * Determines if a slow sequence should be broken due to a timestamp gap
 */
function shouldBreakSequenceForTimestampGap(
  currentSlowSequence: FitRecord[],
  record: FitRecord,
  gapThreshold: number
): boolean {
  if (currentSlowSequence.length === 0) {
    return false;
  }

  const previousRecord = currentSlowSequence[currentSlowSequence.length - 1];
  const currentTimestamp = record.timestamp?.getTime();
  const previousTimestamp = previousRecord.timestamp?.getTime();

  if (currentTimestamp == null || previousTimestamp == null) {
    return false;
  }

  const timeDifference = currentTimestamp - previousTimestamp;

  return timeDifference > gapThreshold;
}

/**
 * Converts the recording gaps that match the selected time ranges into slow-period form
 */
function findMatchingRecordingGaps(
  timestampGaps: TimestampGap[],
  selectedRanges: TimeRange[]
): SlowPeriod[] {
  return timestampGaps
    .filter(gap => selectedRanges.some(range => matchesTimeRange(range, gap.gapDuration)))
    .map(convertGapToPeriod);
}

/**
 * Converts a recording gap to the same format as slow periods for unified handling
 */
function convertGapToPeriod(gap: TimestampGap): SlowPeriod {
  return {
    startTime: gap.startTime,
    endTime: gap.endTime,
    recordCount: 0, // No records exist during a gap
    startDistance: gap.startDistance,
    endDistance: gap.endDistance,
    gpsPoints: buildGpsPointsFromGap(gap),
    isGap: true, // Flag to distinguish gaps from speed-based slow periods
    gapData: gap // Preserve original gap data for specialized rendering
  };
}

/**
 * Builds GPS points array from available gap coordinates
 */
function buildGpsPointsFromGap(gap: TimestampGap): [number, number][] {
  if (gap.startGpsPoint && gap.endGpsPoint) {
    return [gap.startGpsPoint, gap.endGpsPoint];
  } else if (gap.startGpsPoint) {
    return [gap.startGpsPoint];
  } else if (gap.endGpsPoint) {
    return [gap.endGpsPoint];
  }
  return [];
}

/**
 * Detects recording gaps in FIT file data by analyzing timestamp differences between consecutive records.
 * Recording gaps occur when a GPS device is turned off, paused, or loses signal for extended periods.
 * Only gaps longer than the specified threshold are considered significant.
 *
 * @param threshold - Optional threshold in milliseconds. Defaults to DEFAULT_GAP_THRESHOLD_MS
 * @returns Gaps with timing, location, and distance information
 */
export function findTimestampGaps(records: FitRecord[], threshold?: number | null): TimestampGap[] {
  const gaps: TimestampGap[] = [];

  const gapThreshold = typeof threshold === 'number' ? threshold : DEFAULT_GAP_THRESHOLD_MS;

  // Iterate through consecutive record pairs to find timestamp jumps
  for (let i = 1; i < records.length; i++) {
    const previousRecord = records[i - 1];
    const currentRecord = records[i];

    // Skip records that don't have valid timestamps
    if (!previousRecord.timestamp || !currentRecord.timestamp) {
      continue;
    }

    // Calculate the time difference between consecutive records
    const previousTimestamp = previousRecord.timestamp.getTime();
    const currentTimestamp = currentRecord.timestamp.getTime();
    const timeDifference = currentTimestamp - previousTimestamp;

    // Check if the gap exceeds our threshold
    if (timeDifference > gapThreshold) {
      // Convert gap duration to more readable units
      const gapDurationMinutes = Math.round(timeDifference / (1000 * 60));
      const gapDurationHours = gapDurationMinutes / 60;

      const startGpsPoint = toGpsPoint(previousRecord);
      const endGpsPoint = toGpsPoint(currentRecord);

      // Create gap object with comprehensive information for analysis and display
      gaps.push({
        startTime: previousRecord.timestamp,  // When recording stopped
        endTime: currentRecord.timestamp,     // When recording resumed
        gapDuration: timeDifference,          // Gap duration in milliseconds
        gapDurationMinutes,
        gapDurationHours,
        startDistance: previousRecord.distance ?? 0,  // Distance when recording stopped
        endDistance: currentRecord.distance ?? 0,     // Distance when recording resumed
        startGpsPoint,
        endGpsPoint,
      });
    }
  }

  return gaps;
}

/**
 * Processes a sequence of consecutive slow records to create a slow period object.
 * This function validates that the sequence duration matches the user's selected time ranges,
 * and extracts relevant information like GPS coordinates, distances, and timing.
 *
 * @param currentSlowSequence - Consecutive FIT records where speed < SPEED_THRESHOLD
 * @returns The slow period with timing and location data, or null if no selected range matches
 */
export function processSlowSequence(currentSlowSequence: FitRecord[], selectedRanges: TimeRange[]): SlowPeriod | null {
  // Early return for empty sequences - no slow period to process
  if (currentSlowSequence.length === 0) return null;

  // Extract boundary records to calculate the overall duration of this slow period
  const startRecord = currentSlowSequence[0];
  const endRecord = currentSlowSequence[currentSlowSequence.length - 1];
  const startTimestamp = startRecord.timestamp?.getTime();
  const endTimestamp = endRecord.timestamp?.getTime();

  if (startTimestamp == null || endTimestamp == null) {
    return null;
  }

  const durationMs = endTimestamp - startTimestamp;

  // Check if this slow period's duration falls within any of the user's selected time ranges
  // This filtering allows users to focus on specific types of stops (e.g., only long breaks)
  const matchesRange = selectedRanges.some(range =>
    matchesTimeRange(range, durationMs)
  );

  // Only create a period object if it matches the user's filtering criteria
  if (matchesRange) {
    // Extract distance information to show where in the ride this slow period occurred
    const startDistance = startRecord.distance ?? 0;
    const endDistance = endRecord.distance ?? startDistance; // Fallback if no end distance

    // Return comprehensive slow period object for display and map rendering
    return {
      startTime: startRecord.timestamp!,    // When the slow period began
      endTime: endRecord.timestamp!,        // When the slow period ended
      recordCount: currentSlowSequence.length,  // Number of GPS records in this period
      startDistance: startDistance,        // Distance marker at start of slow period
      endDistance: endDistance,           // Distance marker at end of slow period
      gpsPoints: convertGpsCoordinates(currentSlowSequence)  // GPS trail during slow period
    };
  }

  // Return null if this slow period doesn't match the user's selected time ranges
  return null;
}
