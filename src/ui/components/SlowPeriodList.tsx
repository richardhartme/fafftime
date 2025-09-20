import {AnalysisResult} from '../../types/analysis';
import {SlowPeriod} from '../../types/app-types';
import {formatDuration} from '../../utils/time-utils';

function formatPeriodTimes(period: SlowPeriod): { startText: string; endText: string } {
  const startText = period.startTime.toLocaleString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const endText = period.endTime.toLocaleTimeString('en-GB');
  return {startText, endText};
}

function formatActivityShare(durationSeconds: number, activityDurationSeconds: number | null | undefined): string {
  if (!activityDurationSeconds || activityDurationSeconds <= 0) {
    return '—';
  }

  const percentage = Math.round((durationSeconds / activityDurationSeconds) * 1000) / 10;
  if (Number.isNaN(percentage)) {
    return '—';
  }

  const isWholeNumber = Number.isInteger(percentage);
  const percentageText = isWholeNumber ? `${percentage}%` : `${percentage.toFixed(1)}%`;
  return `${percentageText}`;
}

interface SlowPeriodListProps {
  analysisResult: AnalysisResult;
}

export function SlowPeriodList({analysisResult}: SlowPeriodListProps): JSX.Element {
  if (analysisResult.slowPeriods.length === 0) {
    return (
      <section
        className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-5 shadow-sm dark:border-sky-800 dark:bg-sky-900/30"
        role="status"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M10 15.172 5.828 11l-1.414 1.414L10 18l10-10-1.414-1.414z" />
          </svg>
        </div>

        <div>
          <h3 className="text-base font-semibold text-sky-900 dark:text-sky-100">
            No Faff Periods or Recording Gaps Detected
          </h3>
          <p className="mt-2 text-sm font-medium text-sky-900 dark:text-sky-100">
            Great job maintaining your pace and consistent recording!
          </p>
        </div>
      </section>
    );
  }

  const activityDurationSeconds = analysisResult.durationSeconds ?? null;
  const gapPercentageText = formatActivityShare(analysisResult.stats.gapDurationSeconds, activityDurationSeconds);
  const totalPercentageText = formatActivityShare(analysisResult.stats.totalDurationSeconds, activityDurationSeconds);
  const totalPercentageValue = totalPercentageText !== '—'
    ? totalPercentageText.replace(' of activity', '')
    : null;
  const gapPercentageValue = gapPercentageText !== '—' ? gapPercentageText : null;
  const totalPeriodCount = analysisResult.slowPeriods.length;
  const totalDurationText = formatDuration(analysisResult.stats.totalDurationSeconds);
  const gapDurationText = formatDuration(analysisResult.stats.gapDurationSeconds);

  return (
    <div>
      <section
        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/4"
        aria-labelledby="faff-summary-title"
      >
        <header className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-slate-500/15 p-1.5 text-slate-700 dark:text-slate-300">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm.75 5.5a.75.75 0 0 0-1.5 0v5.19l-3 1.74a.75.75 0 1 0 .75 1.3l3.375-1.96A.75.75 0 0 0 12.75 13V7.5Z" />
            </svg>
          </div>
          <div>
            <h3 id="faff-summary-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Faff Periods &amp; Recording Gaps
            </h3>
            <p className="mt-1 text-sm text-slate-900/80 dark:text-slate-200/90">
              Found <span className="font-semibold">{totalPeriodCount}</span> period(s) totalling{' '}
              <span className="font-semibold">{totalDurationText}</span>
              {totalPercentageValue ? (
                <>
                  {' '}
                  (<span className="font-medium">{totalPercentageValue}</span> of activity).
                </>
              ) : (
                <>.</>
              )}
            </p>
          </div>
        </header>

        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-900/30 dark:bg-slate-950/20">
            <dt className="text-slate-800 dark:text-slate-100">Faff periods</dt>
            <dd className="flex items-center gap-2">
              <span className="rounded-md bg-slate-500/15 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                speed {'<'} 1 m/s
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                {analysisResult.stats.slowCount}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-900/30 dark:bg-slate-950/20">
            <dt className="text-slate-800 dark:text-slate-100">Recording gaps</dt>
            <dd className="flex items-center gap-2">
              <span className="rounded-md bg-slate-500/15 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {gapPercentageValue ?? '—'}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50" title={gapDurationText}>
                {analysisResult.stats.gapCount}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-900/30 dark:bg-slate-950/20">
          <ul className="space-y-2 text-sm">
            {analysisResult.stats.rangeBreakdown.length === 0 && (
              <li className="text-slate-900/80 dark:text-slate-200/90">No thresholds selected</li>
            )}
            {analysisResult.stats.rangeBreakdown.map(entry => {
              const totalDuration = formatDuration(entry.totalDurationSeconds);
              const percentageText = formatActivityShare(entry.totalDurationSeconds, activityDurationSeconds);
              return (
                <li key={entry.range} className="flex items-baseline justify-between gap-4">
                  <span className="font-medium text-slate-900 dark:text-slate-50">{entry.label}</span>
                  <span className="text-slate-900/80 dark:text-slate-200/90">
                    <strong>{entry.count}</strong> ({totalDuration} · {percentageText})
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="mt-5">
        {analysisResult.slowPeriods.map((period, index) => {
          const {startText, endText} = formatPeriodTimes(period);
          const durationSeconds = Math.max(0, Math.round((period.endTime.getTime() - period.startTime.getTime()) / 1000));
          const durationText = formatDuration(durationSeconds);
          const startDistanceKm = (period.startDistance / 1000).toFixed(2);
          const miniMapId = `miniMap${index}`;

          if (period.isGap && period.gapData) {
            const endDistanceKm = (period.endDistance / 1000).toFixed(2);
            const gapNumber = index + 1;
            const titleId = `recording-gap-${gapNumber}-title`;
            const checkboxId = `show-route-gap-${gapNumber}`;
            const locationCoords = period.gapData.startGpsPoint ?? null;
            const googleMapsHref = locationCoords
              ? `https://www.google.com/maps?q=${locationCoords[0]},${locationCoords[1]}`
              : null;
            const streetViewHref = locationCoords
              ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${locationCoords[0]},${locationCoords[1]}`
              : null;

            return (
              <section
                key={miniMapId}
                className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
                aria-labelledby={titleId}
              >
                <header className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-slate-500/15 p-1.5 text-slate-700 dark:text-slate-300">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H8Zm7 0a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1Z" />
                    </svg>
                  </div>

                  <div className="flex-1">
                    <h3 id={titleId} className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Recording Gap {gapNumber}
                    </h3>

                    <dl className="mt-2 grid gap-1 text-sm">
                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-900 dark:text-slate-50">Time:</dt>
                        <dd className="text-slate-700 dark:text-slate-300">{startText} - {endText}</dd>
                      </div>

                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-900 dark:text-slate-50">Duration:</dt>
                        <dd className="text-slate-700 dark:text-slate-300">
                          {durationText}{' '}
                          <span className="text-slate-500 dark:text-slate-400">(no data recorded)</span>
                        </dd>
                      </div>

                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-900 dark:text-slate-50">Distance:</dt>
                        <dd className="text-slate-700 dark:text-slate-300">
                          {startDistanceKm} km → {endDistanceKm} km
                        </dd>
                      </div>
                    </dl>
                  </div>
                </header>

                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300" htmlFor={checkboxId}>
                    <input
                      id={checkboxId}
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 shadow-sm focus:ring-blue-500 dark:border-slate-700 dark:bg-transparent accent-blue-600"
                      data-role="full-route-toggle"
                      data-mini-map-id={miniMapId}
                    />
                    Show activity route on map
                  </label>

                  {locationCoords ? (
                    <nav className="flex items-center gap-4 text-sm">
                      <a
                        href={googleMapsHref ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                        </svg>
                        Google Maps
                      </a>
                      <span className="text-slate-600/60 dark:text-slate-400/40">|</span>
                      <a
                        href={streetViewHref ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12Zm0 2c-3 0-6 1.5-6 3.5V20h12v-2.5C18 15.5 15 14 12 14Z" />
                        </svg>
                        Street View
                      </a>
                    </nav>
                  ) : (
                    <span className="text-sm text-slate-600/70 dark:text-slate-400/70">No GPS data</span>
                  )}
                </div>

                <div className="mt-4">
                  <div
                    id={miniMapId}
                    className="h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/30"
                  ></div>
                </div>
              </section>
            );
          }

          const faffNumber = index + 1;
          const titleId = `faff-period-${faffNumber}-title`;
          const checkboxId = `show-route-${faffNumber}`;
          const hasLocation = Boolean(period.gpsPoints[0]);
          const locationCoords = hasLocation ? period.gpsPoints[0] : null;
          const googleMapsHref = locationCoords
            ? `https://www.google.com/maps?q=${locationCoords[0]},${locationCoords[1]}`
            : null;
          const streetViewHref = locationCoords
            ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${locationCoords[0]},${locationCoords[1]}`
            : null;

          return (
            <section
              key={miniMapId}
              className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30"
              aria-labelledby={titleId}
            >
              <header className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-amber-500/15 p-1.5 text-amber-700 dark:text-amber-300">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm.75 5.5a.75.75 0 0 0-1.5 0v5.2l-3 1.74a.75.75 0 0 0 .75 1.3l3.38-1.96a.75.75 0 0 0 .37-.65V7.5Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 id={titleId} className="text-base font-semibold text-amber-900 dark:text-amber-100">
                    Faff Period {faffNumber}
                  </h3>
                  <dl className="mt-2 grid gap-1 text-sm">
                    <div className="flex gap-2">
                      <dt className="font-semibold text-amber-900 dark:text-amber-50">Time:</dt>
                      <dd className="text-amber-900/90 dark:text-amber-200/90">
                        {startText} - {endText}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold text-amber-900 dark:text-amber-50">Duration:</dt>
                      <dd className="text-amber-900/90 dark:text-amber-200/90">
                        {durationText}{' '}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold text-amber-900 dark:text-amber-50">Distance:</dt>
                      <dd className="text-amber-900/90 dark:text-amber-200/90">{startDistanceKm} km</dd>
                    </div>
                  </dl>
                </div>
              </header>

              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-amber-900/90 dark:text-amber-200/90" htmlFor={checkboxId}>
                  <input
                    id={checkboxId}
                    type="checkbox"
                    className="h-4 w-4 rounded border-amber-300 text-blue-600 shadow-sm focus:ring-blue-500 dark:border-amber-800 dark:bg-transparent accent-blue-600"
                    data-role="full-route-toggle"
                    data-mini-map-id={miniMapId}
                  />
                  Show activity route on map
                </label>

                {hasLocation ? (
                  <nav className="flex items-center gap-4 text-sm">
                    <a
                      href={googleMapsHref ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                      </svg>
                      Google Maps
                    </a>
                    <span className="text-amber-800/50 dark:text-amber-300/40">|</span>
                    <a
                      href={streetViewHref ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12Zm0 2c-3 0-6 1.5-6 3.5V20h12v-2.5C18 15.5 15 14 12 14Z" />
                      </svg>
                      Street View
                    </a>
                  </nav>
                ) : (
                  <span className="text-sm text-amber-900/60 dark:text-amber-300/70">No GPS data</span>
                )}
              </div>

              <div className="mt-4">
                <div
                  id={miniMapId}
                  className="h-[320px] w-full overflow-hidden rounded-2xl border border-amber-200 bg-white dark:border-amber-900/30 dark:bg-amber-950/20"
                ></div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
