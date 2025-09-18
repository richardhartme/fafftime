import { AnalysisResult } from '../../types/analysis';
import { SlowPeriod } from '../../types/app-types';
import { formatDuration } from '../../core/time-utils';

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
  return { startText, endText };
}

function createGoogleMapsLink([lat, lng]: [number, number], text = '📍 View on Google Maps'): JSX.Element {
  const href = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="google-maps-link">
      {text}
    </a>
  );
}

interface SlowPeriodListProps {
  analysisResult: AnalysisResult;
}

export function SlowPeriodList({ analysisResult }: SlowPeriodListProps): JSX.Element {
  if (analysisResult.slowPeriods.length === 0) {
    return (
      <div className="no-slow-periods">
        <h3>✅ No Faff Periods or Recording Gaps Detected</h3>
        <p>
          No periods found in selected ranges ({analysisResult.selectedRangeText}) where speed was {'<'} 1 m/s or where
          recording gaps occurred.
        </p>
        <p>Great job maintaining your pace and consistent recording! 🚴‍♀️💨</p>
      </div>
    );
  }

  return (
    <div className="slow-periods">
      <h3>🐌 Faff Periods &amp; Recording Gaps</h3>
      <p>
        Found <span>{analysisResult.slowPeriods.length}</span> period(s) in selected ranges ({analysisResult.selectedRangeText})
      </p>
      <p><strong>Faff periods:</strong> <span>{analysisResult.stats.slowCount}</span> (speed {'<'} 1 m/s)</p>
      <div className="threshold-breakdown">
        <strong>Faff periods by threshold:</strong>
        <ul>
          {analysisResult.stats.rangeBreakdown.length === 0 && (
            <li>No thresholds selected</li>
          )}
          {analysisResult.stats.rangeBreakdown.map(entry => (
            <li key={entry.range}>{entry.label}: {entry.count}</li>
          ))}
        </ul>
      </div>
      <p><strong>Recording gaps:</strong> <span>{analysisResult.stats.gapCount}</span></p>
      <p><strong>Total duration:</strong> <span>{formatDuration(analysisResult.stats.totalDurationSeconds)}</span></p>

      <div className="slow-periods-list">
        {analysisResult.slowPeriods.map((period, index) => {
          const { startText, endText } = formatPeriodTimes(period);
          const durationSeconds = Math.max(0, Math.round((period.endTime.getTime() - period.startTime.getTime()) / 1000));
          const durationText = formatDuration(durationSeconds);
          const startDistanceKm = (period.startDistance / 1000).toFixed(2);
          const miniMapId = `miniMap${index}`;

          if (period.isGap && period.gapData) {
            const endDistanceKm = (period.endDistance / 1000).toFixed(2);

            return (
              <div className="timestamp-gap-item" key={miniMapId}>
                <strong>⏸️ Recording Gap {index + 1}:</strong> <span>{startText} - {endText}</span><br />
                <strong>Duration:</strong> <span>{durationText}</span> (no data recorded)<br />
                <strong>Distance:</strong> <span>{startDistanceKm} km → {endDistanceKm} km</span><br />
                <label className="full-route-toggle">
                  <input type="checkbox" data-role="full-route-toggle" data-mini-map-id={miniMapId} />
                  Show activity route
                </label><br />
                <span className="location-links">
                  {period.gapData.startGpsPoint && createGoogleMapsLink(period.gapData.startGpsPoint, '📍 Start location')}
                  {period.gapData.startGpsPoint && period.gapData.endGpsPoint && <span> | </span>}
                  {period.gapData.endGpsPoint && createGoogleMapsLink(period.gapData.endGpsPoint, '📍 End location')}
                  {!period.gapData.startGpsPoint && !period.gapData.endGpsPoint && 'No GPS data'}
                </span><br />
                <div className="mini-map" id={miniMapId}></div>
              </div>
            );
          }

          const locationLink = period.gpsPoints[0]
            ? createGoogleMapsLink(period.gpsPoints[0])
            : null;

          return (
            <div className="slow-period-item" key={miniMapId}>
              <strong>🐌 Faff Period {index + 1}:</strong> <span>{startText} - {endText}</span><br />
              <strong>Duration:</strong> <span>{durationText}</span> (<span>{period.recordCount}</span> records)<br />
              <strong>Distance:</strong> <span>{startDistanceKm}</span> km<br />
              <label className="full-route-toggle">
                <input type="checkbox" data-role="full-route-toggle" data-mini-map-id={miniMapId} />
                Show activity route
              </label><br />
              <span className="location-link">
                {locationLink}
              </span><br />
              <div className="mini-map" id={miniMapId}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
