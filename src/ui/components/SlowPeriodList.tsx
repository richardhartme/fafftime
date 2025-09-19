import {AnalysisResult} from '../../types/analysis';
import {SlowPeriod} from '../../types/app-types';
import {formatDuration} from '../../core/time-utils';
import {Icon} from './Icon';

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

function createGoogleMapsLink([lat, lng]: [number, number], text = 'View on Google Maps'): JSX.Element {
  const href = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="google-maps-link">
      <Icon name="location-dot"/>
      {text}
    </a>
  );
}

function createStreetViewLink([lat, lng]: [number, number], text = 'View on Street View'): JSX.Element {
  const href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="google-street-view-link">
      <Icon name="street-view"/>
      {text}
    </a>
  );
}

function createLocationLinkGroup(point: [number, number], labelPrefix = ''): JSX.Element {
  return (
    <>
      {createGoogleMapsLink(point, `${labelPrefix}Google Maps`)}
      <span> | </span>
      {createStreetViewLink(point, `${labelPrefix}Street View`)}
    </>
  );
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
  return `${percentageText} of activity`;
}

interface SlowPeriodListProps {
  analysisResult: AnalysisResult;
}

export function SlowPeriodList({analysisResult}: SlowPeriodListProps): JSX.Element {
  if (analysisResult.slowPeriods.length === 0) {
    return (
      <div className="no-slow-periods">
        <h3>
          <Icon name="circle-check"/>
          No Faff Periods or Recording Gaps Detected
        </h3>
        <p>
          No periods found in selected ranges ({analysisResult.selectedRangeText}) where speed was {'<'} 1 m/s or where
          recording gaps occurred.
        </p>
        <p>
          Great job maintaining your pace and consistent recording!
        </p>
      </div>
    );
  }

  const activityDurationSeconds = analysisResult.durationSeconds ?? null;
  const gapPercentageText = formatActivityShare(analysisResult.stats.gapDurationSeconds, activityDurationSeconds);

  return (
    <div>
      <div className="slow-periods">
        <h3>
          <Icon name="stopwatch"/>
          Faff Periods &amp; Recording Gaps
        </h3>
        <p>
          Found <strong>{analysisResult.slowPeriods.length}</strong> period(s)
          totalling <strong>{formatDuration(analysisResult.stats.totalDurationSeconds)}</strong>.
        </p>
        <p>
          <strong>Recording gaps:</strong>{' '}
          <span>{analysisResult.stats.gapCount}</span>{' '}
          <span>
            (
            {formatDuration(analysisResult.stats.gapDurationSeconds)} ·{' '}
            {gapPercentageText}
            )
          </span>
        </p>
        <p><strong>Faff periods:</strong> <span>{analysisResult.stats.slowCount}</span> (speed {'<'} 1 m/s)</p>
        <div className="threshold-breakdown">
          <ul>
            {analysisResult.stats.rangeBreakdown.length === 0 && (
              <li>No thresholds selected</li>
            )}
            {analysisResult.stats.rangeBreakdown.map(entry => {
              const totalDuration = formatDuration(entry.totalDurationSeconds);
              const percentageText = formatActivityShare(entry.totalDurationSeconds, activityDurationSeconds);
              return (
                <li key={entry.range}>
                  <strong>{entry.label}:</strong> {entry.count} <span>({totalDuration} · {percentageText})</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="slow-periods-list">
        {analysisResult.slowPeriods.map((period, index) => {
          const {startText, endText} = formatPeriodTimes(period);
          const durationSeconds = Math.max(0, Math.round((period.endTime.getTime() - period.startTime.getTime()) / 1000));
          const durationText = formatDuration(durationSeconds);
          const startDistanceKm = (period.startDistance / 1000).toFixed(2);
          const miniMapId = `miniMap${index}`;

          if (period.isGap && period.gapData) {
            const endDistanceKm = (period.endDistance / 1000).toFixed(2);

            return (
              <div className="timestamp-gap-item" key={miniMapId}>
                <strong>
                  <Icon name="circle-pause"/>
                  Recording Gap {index + 1}
                </strong><br/>
                <strong>Time:</strong> <span>{startText} - {endText}</span><br/>
                <strong>Duration:</strong> <span>{durationText}</span> (no data recorded)<br/>
                <strong>Distance:</strong> <span>{startDistanceKm} km → {endDistanceKm} km</span><br/>
                <label className="full-route-toggle">
                  <input type="checkbox" data-role="full-route-toggle" data-mini-map-id={miniMapId}/>
                  Show activity route on map
                </label><br/>
                <span className="location-links">
                  {period.gapData.startGpsPoint && createLocationLinkGroup(period.gapData.startGpsPoint)}
                </span><br/>
                <div className="mini-map" id={miniMapId}></div>
              </div>
            );
          }

          const locationLink = period.gpsPoints[0]
            ? createLocationLinkGroup(period.gpsPoints[0])
            : null;

          return (
            <div className="slow-period-item" key={miniMapId}>
              <strong>
                <Icon name="stopwatch"/>
                Faff Period {index + 1}
              </strong><br/>
              <strong>Time:</strong> <span>{startText} - {endText}</span><br/>
              <strong>Duration:</strong> <span>{durationText}</span> (<span>{period.recordCount}</span> records)<br/>
              <strong>Distance:</strong> <span>{startDistanceKm}</span> km<br/>
              <label className="full-route-toggle">
                <input type="checkbox" data-role="full-route-toggle" data-mini-map-id={miniMapId}/>
                Show activity route on map
              </label><br/>
              <span className="location-link">
                {locationLink ?? 'No GPS data'}
              </span><br/>
              <div className="mini-map" id={miniMapId}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
