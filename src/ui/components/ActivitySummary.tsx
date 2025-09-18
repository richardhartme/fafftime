import { useMemo } from 'react';
import { AnalysisResult } from '../../types/analysis';
import { formatDuration } from '../../core/time-utils';

function formatDistance(distanceMeters: number | null | undefined): string | null {
  if (distanceMeters == null) {
    return null;
  }
  const distanceKm = (distanceMeters / 1000).toFixed(2);
  const distanceMiles = (distanceMeters * 0.000621371).toFixed(2);
  return `${distanceKm} km (${distanceMiles} miles)`;
}

interface ActivitySummaryProps {
  analysisResult: AnalysisResult;
}

export function ActivitySummary({ analysisResult }: ActivitySummaryProps): JSX.Element {
  const totalDurationSeconds = analysisResult.durationSeconds ?? 0;
  const stoppedDuration = analysisResult.stats.totalDurationSeconds;
  const estimatedMovingTime = Math.max(0, totalDurationSeconds - stoppedDuration);

  const activityDistanceText = useMemo(
    () => formatDistance(analysisResult.totalDistance),
    [analysisResult.totalDistance]
  );

  return (
    <div className="activity-times">
      <h3>Activity Summary</h3>
      <p><strong>Start Time:</strong> <span>{analysisResult.startTime?.toLocaleString() ?? 'Unknown'}</span></p>
      <p><strong>End Time:</strong> <span>{analysisResult.endTime?.toLocaleString() ?? 'Unknown'}</span></p>
      <p><strong>Duration:</strong> <span>{formatDuration(totalDurationSeconds)}</span></p>
      <p><strong>Est. Stopped Time:</strong> <span>{formatDuration(stoppedDuration)}</span></p>
      <p><strong>Est. Moving Time:</strong> <span>{formatDuration(estimatedMovingTime)}</span></p>
      {activityDistanceText && (
        <p><strong>Total Distance:</strong> <span>{activityDistanceText}</span></p>
      )}
    </div>
  );
}
