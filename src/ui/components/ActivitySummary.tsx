import { CSSProperties, useMemo } from 'react';
import { AnalysisResult } from '../../types/analysis';
import { formatDuration } from '../../utils/time-utils';

interface ActivitySummaryProps {
  analysisResult: AnalysisResult;
}

export function ActivitySummary({ analysisResult }: ActivitySummaryProps): JSX.Element {
  const totalDurationSeconds = analysisResult.durationSeconds ?? 0;
  const stoppedDuration = analysisResult.stats.totalDurationSeconds;
  const estimatedMovingTime = Math.max(0, totalDurationSeconds - stoppedDuration);
  const moveFraction = totalDurationSeconds > 0 ? estimatedMovingTime / totalDurationSeconds : 0;
  const movePercent = Math.min(100, Math.max(0, moveFraction * 100));
  const stopPercent = Math.max(0, 100 - movePercent);

  const ratioStyle = useMemo(
    () => ({ '--move': `${movePercent.toFixed(1)}%` } as CSSProperties),
    [movePercent]
  );

  const movingPercentLabel = Math.round(movePercent);
  const stoppedPercentLabel = Math.round(stopPercent);

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
    <section className="max-w-md rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Activity Summary
      </h2>

      <dl className="mt-4 grid grid-cols-[auto,1fr] items-baseline gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-500 dark:text-zinc-400">Start Time</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">
          {analysisResult.startTime?.toLocaleString() ?? 'Unknown'}
        </dd>

        <dt className="text-zinc-500 dark:text-zinc-400">End Time</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">
          {analysisResult.endTime?.toLocaleString() ?? 'Unknown'}
        </dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Duration</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">
          {formatDuration(totalDurationSeconds)}
        </dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Est. Stopped</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">
          {formatDuration(stoppedDuration)}
        </dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Est. Moving</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">
          {formatDuration(estimatedMovingTime)}
        </dd>

        {activityDistance && (
          <>
            <dt className="text-zinc-500 dark:text-zinc-400">Total Distance</dt>
            <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
              {activityDistance.distanceKm} km{' '}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                ({activityDistance.distanceMiles} mi)
              </span>
            </dd>
          </>
        )}
      </dl>

      <div className="mt-5">
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Moving</span>
          <span>Stopped</span>
        </div>
        <div
          className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          style={ratioStyle}
        >
          <div className="h-full w-[var(--move)] rounded-full bg-blue-500" />
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          ~{movingPercentLabel}% moving, ~{stoppedPercentLabel}% stopped
        </p>
      </div>
    </section>
  );
}
