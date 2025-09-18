// =============================================================================
// DATA ANALYSIS FUNCTIONS (CORE BUSINESS LOGIC)
// =============================================================================

import { FitRecord, TimestampGap, SlowPeriod, TimeRange } from '../types/app-types';
import { SPEED_THRESHOLD, DEFAULT_GAP_THRESHOLD_MS } from '../utils/constants';
import { convertGpsCoordinates, SEMICIRCLE_TO_DEGREES } from '../utils/gps-utils';
import { matchesTimeRange } from './time-utils';

function toGpsPoint(record: FitRecord): [number, number] | null {
  const { positionLat, positionLong } = record;
  if (typeof positionLat !== 'number' || typeof positionLong !== 'number') {
    return null;
  }
  return [
    positionLat * SEMICIRCLE_TO_DEGREES,
    positionLong * SEMICIRCLE_TO_DEGREES,
  ];
}

/**
 * Finds slow periods and recording gaps from FIT file records that match the selected time ranges.
 * This function combines two types of "faff time":
 * 1. Slow periods: Consecutive sequences where speed < 0.75 m/s (rider is moving slowly or stopped)
 * 2. Recording gaps: Periods where no data was recorded (device off/paused) for 5+ minutes
 *
 * @param {Array} records - Array of record messages from FIT file containing timestamps, speeds, GPS, etc.
 * @param {Array} selectedRanges - Array of selected time range strings (e.g., ['5to10', '30to60'])
 * @returns {Array} Array of period objects containing both slow periods and recording gaps, sorted chronologically
 */
export function findSlowPeriodsWithRanges(
  records: FitRecord[],
  selectedRanges: TimeRange[],
  gapThreshold: number = DEFAULT_GAP_THRESHOLD_MS
): SlowPeriod[] {
  if (selectedRanges.length === 0) return [];

  const slowPeriods = findSpeedBasedSlowPeriods(records, selectedRanges, gapThreshold);
  const gapPeriods = findMatchingRecordingGaps(records, selectedRanges, gapThreshold);

  return [...slowPeriods, ...gapPeriods].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Finds slow periods based on speed analysis
 */
export function findSpeedBasedSlowPeriods(
  records: FitRecord[],
  selectedRanges: TimeRange[],
  gapThreshold: number = DEFAULT_GAP_THRESHOLD_MS
): SlowPeriod[] {
  const slowPeriods: SlowPeriod[] = [];
  let currentSlowSequence: FitRecord[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const speed = record.enhancedSpeed || record.speed || 0;

    if (speed < SPEED_THRESHOLD) {
      if (shouldBreakSequenceForTimestampGap(currentSlowSequence, record, gapThreshold)) {
        const slowPeriod = processSlowSequence(currentSlowSequence, selectedRanges);
        if (slowPeriod) {
          slowPeriods.push(slowPeriod);
        }
        currentSlowSequence = [record];
      } else {
        currentSlowSequence.push(record);
      }
    } else {
      // Record is fast, process any accumulated slow sequence
      const slowPeriod = processSlowSequence(currentSlowSequence, selectedRanges);
      if (slowPeriod) {
        slowPeriods.push(slowPeriod);
      }
      currentSlowSequence = [];
    }
  }

  // Handle final sequence
  const finalSlowPeriod = processSlowSequence(currentSlowSequence, selectedRanges);
  if (finalSlowPeriod) {
    slowPeriods.push(finalSlowPeriod);
  }

  return slowPeriods;
}

/**
 * Determines if a slow sequence should be broken due to a timestamp gap
 */
export function shouldBreakSequenceForTimestampGap(
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
 * Finds recording gaps that match the selected time ranges
 */
export function findMatchingRecordingGaps(
  records: FitRecord[],
  selectedRanges: TimeRange[],
  gapThreshold: number = DEFAULT_GAP_THRESHOLD_MS
): SlowPeriod[] {
  const timestampGaps = findTimestampGaps(records, gapThreshold);
  const matchingGaps: SlowPeriod[] = [];

  timestampGaps.forEach(gap => {
    const matchesRange = selectedRanges.some(range =>
      matchesTimeRange(range, gap.gapDurationMinutes, gap.gapDurationHours)
    );

    if (matchesRange) {
      matchingGaps.push(convertGapToPeriod(gap));
    }
  });

  return matchingGaps;
}

/**
 * Converts a recording gap to the same format as slow periods for unified handling
 */
export function convertGapToPeriod(gap: TimestampGap): SlowPeriod {
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
export function buildGpsPointsFromGap(gap: TimestampGap): [number, number][] {
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
 * @param {Array} records - Array of record messages from FIT file, each containing timestamp and position data
 * @param {Number} threshold - Optional threshold in milliseconds. Defaults to current UI setting or 5 minutes
 * @returns {Array} Array of gap objects with timing, location, and distance information
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
 * @param {Array} currentSlowSequence - Array of consecutive FIT records where speed < SPEED_THRESHOLD
 * @param {Array} selectedRanges - Array of user-selected time range filters (e.g., ['5to10', '30to60'])
 * @returns {Object|null} Slow period object with timing and location data, or null if no match
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
  const durationMinutes = durationMs / (1000 * 60);
  const durationHours = durationMinutes / 60;

  // Check if this slow period's duration falls within any of the user's selected time ranges
  // This filtering allows users to focus on specific types of stops (e.g., only long breaks)
  const matchesRange = selectedRanges.some(range =>
    matchesTimeRange(range, durationMinutes, durationHours)
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
