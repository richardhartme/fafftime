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
    <div className="mb-4 p-5 rounded bg-gray-100">
      <h3>Activity Summary</h3>
      <p className="my-1"><strong>Start Time:</strong> <span>{analysisResult.startTime?.toLocaleString() ?? 'Unknown'}</span></p>
      <p className="my-1"><strong>End Time:</strong> <span>{analysisResult.endTime?.toLocaleString() ?? 'Unknown'}</span></p>
      <p className="my-1"><strong>Duration:</strong> <span>{formatDuration(totalDurationSeconds)}</span></p>
      <p className="my-1"><strong>Est. Stopped Time:</strong> <span>{formatDuration(stoppedDuration)}</span></p>
      <p className="my-1"><strong>Est. Moving Time:</strong> <span>{formatDuration(estimatedMovingTime)}</span></p>
      {activityDistanceText && (
        <p className="my-1"><strong>Total Distance:</strong> <span>{activityDistanceText}</span></p>
      )}
    </div>
  );
}
