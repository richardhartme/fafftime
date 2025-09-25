import { useMemo } from 'react';
import { AnalysisResult } from '../../types/analysis';
import { formatDuration } from '../../utils/time-utils';

interface ActivitySummaryProps {
  analysisResult: AnalysisResult;
}

export function ActivitySummary({ analysisResult }: ActivitySummaryProps): JSX.Element {
  const totalDurationSeconds = analysisResult.durationSeconds ?? 0;
  const stoppedDuration = analysisResult.stats.totalDurationSeconds;
  const estimatedMovingTime = Math.max(0, totalDurationSeconds - stoppedDuration);
  const activityDistance = useMemo(() => {
    const distanceMeters = analysisResult.totalDistance;
    if (distanceMeters == null) {
      return null;
    }
    const distanceKm = (distanceMeters / 1000).toFixed(2);
    const distanceMiles = (distanceMeters * 0.000621371).toFixed(2);
    return { distanceKm, distanceMiles };
  }, [analysisResult.totalDistance]);

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"
      aria-labelledby="activity-summary-title"
    >
      <header className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-slate-500/15 p-1.5 text-slate-700">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8Zm-.75 2.5a.75.75 0 0 0-1.5 0v4.69a.75.75 0 0 0 .33.62l3 2a.75.75 0 0 0 .84-1.24l-2.67-1.78V6.5Z" />
          </svg>
        </div>
        <div>
          <h3 id="activity-summary-title" className="text-base font-semibold text-slate-900">
            Activity Summary
          </h3>
          <p className="mt-1 text-sm text-slate-900/80">
            Overall timings, stops, and distance for the loaded ride.
          </p>
        </div>
      </header>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-3">
      <ul className="space-y-2 text-sm">
          <li className="flex items-baseline justify-between gap-4">
            <span className="font-medium text-slate-900">Start time</span>
            <span className="text-slate-900/80">
              <strong>{analysisResult.startTime?.toLocaleString() ?? 'Unknown'}</strong>
            </span>
          </li>
          <li className="flex items-baseline justify-between gap-4">
            <span className="font-medium text-slate-900">End time</span>
            <span className="text-slate-900/80">
                <strong>{analysisResult.endTime?.toLocaleString() ?? 'Unknown'}</strong>
              </span>
          </li>
          <li className="flex items-baseline justify-between gap-4">
            <span className="font-medium text-slate-900">Duration</span>
            <span className="text-slate-900/80">
                <strong>{formatDuration(totalDurationSeconds)}</strong>
              </span>
          </li>
          <li className="flex items-baseline justify-between gap-4">
            <span className="font-medium text-slate-900">Est. stopped</span>
            <span className="text-slate-900/80">
                <strong>{formatDuration(stoppedDuration)}</strong>
              </span>
          </li>
          <li className="flex items-baseline justify-between gap-4">
            <span className="font-medium text-slate-900">Est. moving</span>
            <span className="text-slate-900/80">
                  <strong>{formatDuration(estimatedMovingTime)}</strong>
                </span>
          </li>
        {activityDistance && (
          <li className="flex items-baseline justify-between gap-4">
            <span className="font-medium text-slate-900">Total distance</span>
            <span className="text-slate-900/80">
                <strong>{activityDistance.distanceKm} km{' '}</strong> ({activityDistance.distanceMiles} mi)
              </span>
          </li>
        )}
      </ul>
      </div>

    </section>
  );
}
