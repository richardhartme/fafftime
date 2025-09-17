import {ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState} from 'react';
import {
  FitData,
  FitRecord,
  FitSession,
  SlowPeriod,
  TimeRange,
  TimestampGap
} from '../types/app-types';
import {decodeFitFile, extractActivityTimes} from '../core/fit-parser';
import {
  findSlowPeriodsWithRanges,
  findTimestampGaps
} from '../core/data-analyzer';
import {convertGpsCoordinates} from '../utils/gps-utils';
import {
  DEFAULT_GAP_THRESHOLD_MS,
  DEFAULT_SELECTED_RANGES,
  RANGE_LABELS
} from '../utils/constants';
import {
  formatDuration,
  getSelectedRangeText,
  matchesTimeRange
} from '../core/time-utils';
import {
  initializeCombinedMiniMaps,
  initializeMap,
  setCurrentSlowPeriods,
  updateMapOverlays
} from './map-manager';
import {
  trackExampleFileLoaded,
  trackFitFileParsed
} from '../utils/analytics';

interface ParsedFileState {
  fitData: FitData;
  fileName: string;
}

interface RangeBreakdownEntry {
  range: TimeRange;
  label: string;
  count: number;
}

interface SlowPeriodStats {
  slowCount: number;
  gapCount: number;
  totalDurationSeconds: number;
  rangeBreakdown: RangeBreakdownEntry[];
}

interface AnalysisResult {
  fitData: FitData;
  fileName: string;
  records: FitRecord[];
  sessions: FitSession[];
  timestampGaps: TimestampGap[];
  slowPeriods: SlowPeriod[];
  activityRoute: [number, number][];
  startTime: Date | null;
  endTime: Date | null;
  movingTime: number | null;
  totalDistance: number | null;
  durationSeconds: number | null;
  stats: SlowPeriodStats;
  selectedRangeText: string;
}

const GAP_THRESHOLD_OPTIONS: Array<{value: number; label: string}> = [
  {value: 60000, label: '1 minute'},
  {value: 120000, label: '2 minutes'},
  {value: 240000, label: '3 minutes'},
  {value: 300000, label: '5 minutes'},
  {value: 600000, label: '10 minutes'}
];

const RANGE_OPTIONS: Array<{value: TimeRange; label: string}> = DEFAULT_SELECTED_RANGES.map(range => ({
  value: range,
  label: RANGE_LABELS[range]
}));

function calculateSlowPeriodStatistics(slowPeriods: SlowPeriod[], selectedRanges: TimeRange[]): SlowPeriodStats {
  const slowCount = slowPeriods.filter(period => !period.isGap).length;
  const gapCount = slowPeriods.filter(period => period.isGap).length;
  const totalDurationSeconds = slowPeriods.reduce((total, period) => {
    const durationSeconds = Math.max(0, Math.round((period.endTime.getTime() - period.startTime.getTime()) / 1000));
    return total + durationSeconds;
  }, 0);

  const rangeBreakdown = selectedRanges.map(range => {
    const matchingPeriods = slowPeriods.filter(period => {
      if (period.isGap) return false;
      const durationMs = period.endTime.getTime() - period.startTime.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      const durationHours = durationMinutes / 60;
      return matchesTimeRange(range, durationMinutes, durationHours);
    });

    return {
      range,
      label: RANGE_LABELS[range],
      count: matchingPeriods.length
    };
  });

  return {
    slowCount,
    gapCount,
    totalDurationSeconds,
    rangeBreakdown
  };
}

function buildAnalysisResult(
  fitData: FitData,
  fileName: string,
  selectedRanges: TimeRange[],
  gapThreshold: number
): AnalysisResult {
  const sessions = fitData.sessionMesgs || [];
  const records = fitData.recordMesgs || [];
  const timestampGaps = findTimestampGaps(records, gapThreshold);
  const {startTime, endTime, movingTime, totalDistance} = extractActivityTimes(sessions, records);
  const slowPeriods = findSlowPeriodsWithRanges(records, selectedRanges, gapThreshold);
  const activityRoute = convertGpsCoordinates(records);
  const stats = calculateSlowPeriodStatistics(slowPeriods, selectedRanges);
  const selectedRangeText = selectedRanges.length > 0 ? getSelectedRangeText(selectedRanges) : 'None selected';

  const durationSeconds = startTime && endTime
    ? Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000))
    : null;

  return {
    fitData,
    fileName,
    records,
    sessions,
    timestampGaps,
    slowPeriods,
    activityRoute,
    startTime,
    endTime,
    movingTime,
    totalDistance,
    durationSeconds,
    stats,
    selectedRangeText
  };
}

function formatPeriodTimes(period: SlowPeriod): {startText: string; endText: string} {
  const startText = period.startTime.toLocaleString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const endText = period.endTime.toLocaleTimeString('en-GB');
  return {startText, endText};
}

function formatDistance(distanceMeters: number | null | undefined): string | null {
  if (distanceMeters == null) return null;
  const distanceKm = (distanceMeters / 1000).toFixed(2);
  const distanceMiles = (distanceMeters * 0.000621371).toFixed(2);
  return `${distanceKm} km (${distanceMiles} miles)`;
}

function createGoogleMapsLink([lat, lng]: [number, number], text: string = '📍 View on Google Maps'): JSX.Element {
  const href = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="google-maps-link">
      {text}
    </a>
  );
}

export default function App(): JSX.Element {
  const [parsedFile, setParsedFile] = useState<ParsedFileState | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedRanges, setSelectedRanges] = useState<TimeRange[]>(DEFAULT_SELECTED_RANGES);
  const [gapThreshold, setGapThreshold] = useState<number>(DEFAULT_GAP_THRESHOLD_MS);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!parsedFile) {
      setAnalysisResult(null);
      return;
    }

    try {
      const result = buildAnalysisResult(parsedFile.fitData, parsedFile.fileName, selectedRanges, gapThreshold);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error building analysis', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setStatus('error');
    }
  }, [parsedFile, selectedRanges, gapThreshold]);

  useEffect(() => {
    if (!analysisResult) {
      return;
    }

    initializeMap(analysisResult.fitData);
    setCurrentSlowPeriods(analysisResult.slowPeriods);
    updateMapOverlays(showOverlays);

    const handle = window.setTimeout(() => {
      initializeCombinedMiniMaps(analysisResult.slowPeriods, analysisResult.activityRoute);
    }, 100);

    return () => {
      window.clearTimeout(handle);
    };
  }, [analysisResult]);

  useEffect(() => {
    if (!analysisResult) {
      return;
    }
    updateMapOverlays(showOverlays);
  }, [showOverlays]);

  const handleFileSelection = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.fit')) {
      window.alert('Please select a .fit file');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage(null);
      const fitData = await decodeFitFile(file);
      setParsedFile({fitData, fileName: file.name});
      trackFitFileParsed();
      setStatus('idle');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error parsing FIT file', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error parsing FIT file');
    }
  };

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileSelection(file);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await handleFileSelection(files[0]);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const handleExampleLoad = async () => {
    try {
      setStatus('loading');
      setErrorMessage(null);
      trackExampleFileLoaded();
      const response = await fetch('GreatBritishEscapades2025.fit');
      if (!response.ok) {
        throw new Error(`Failed to load example file: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const file = new File([arrayBuffer], 'GreatBritishEscapades2025.fit', {type: 'application/octet-stream'});
      const fitData = await decodeFitFile(file);
      setParsedFile({fitData, fileName: file.name});
      trackFitFileParsed();
      setStatus('idle');
    } catch (error) {
      console.error('Failed to load example file', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load example file');
    }
  };

  const toggleRangeSelection = (range: TimeRange) => {
    setSelectedRanges(current => {
      if (current.includes(range)) {
        return current.filter(item => item !== range);
      }
      return [...current, range];
    });
  };

  const resetDragState = () => setIsDragActive(false);

  const activityDistanceText = useMemo(() => formatDistance(analysisResult?.totalDistance ?? null), [analysisResult?.totalDistance]);

  const isAnalysisAvailable = Boolean(analysisResult && analysisResult.records.length > 0);

  const renderSlowPeriodContent = () => {
    if (!analysisResult || analysisResult.slowPeriods.length === 0) {
      return (
        <div className="no-slow-periods">
          <h3>✅ No Faff Periods or Recording Gaps Detected</h3>
          <p>
            No periods found in selected ranges ({analysisResult ? analysisResult.selectedRangeText : getSelectedRangeText(selectedRanges)}) where speed was
            {' '} &lt; 1 m/s or where recording gaps occurred.
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
        <p><strong>Faff periods:</strong> <span>{analysisResult.stats.slowCount}</span> (speed &lt; 1 m/s)</p>
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
            const {startText, endText} = formatPeriodTimes(period);
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
  };

  const renderActivityTimes = () => {
    if (!analysisResult) return null;

    if (!analysisResult.startTime || !analysisResult.endTime) {
      return (
        <div className="warning-message">
          ⚠️ Could not determine start/end times from this FIT file.
        </div>
      );
    }

    const {startTime, endTime, durationSeconds, stats} = analysisResult;
    const totalDurationSeconds = durationSeconds ?? 0;
    const estimatedMovingTime = Math.max(0, totalDurationSeconds - stats.totalDurationSeconds);

    return (
      <div className="activity-times">
        <h3>⏰ Activity Times</h3>
        <p><strong>Start Time:</strong> <span>{startTime.toLocaleString()}</span></p>
        <p><strong>End Time:</strong> <span>{endTime.toLocaleString()}</span></p>
        <p><strong>Duration:</strong> <span>{formatDuration(totalDurationSeconds)}</span></p>
        <p><strong>Est. Stopped Time:</strong> <span>{formatDuration(stats.totalDurationSeconds)}</span></p>
        <p><strong>Est. Moving Time:</strong> <span>{formatDuration(estimatedMovingTime)}</span></p>
        {activityDistanceText && (
          <p><strong>Total Distance:</strong> <span>{activityDistanceText}</span></p>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <div className="page-header">
        <div className="container">
          <header>
            <h1>Ultra Cycling Faff Time</h1>
            <h4>Find where you spent time stopped (faffing) instead of riding.</h4>
            <span className="description">
              After realising there was a 20-hour difference between my elapsed time and moving time during my last ultra event. I wanted a tool to be able to see where all that time went!
            </span>
          </header>
        </div>
      </div>

      <div className="app-layout">
        <aside className="app-sidebar">
          <div className="app-sidebar-content">
            <div className="sidebar-section">
              <div className="file-selection-box">
                <div
                  className={`file-drop-area${isDragActive ? ' drag-over' : ''}`}
                  id="fileDropArea"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="drop-zone-content">
                    <h3>Drop your FIT file here</h3>
                    <p>or <button type="button" className="file-select-button" id="fileSelectButton" onClick={(event) => { event.stopPropagation(); fileInputRef.current?.click(); }}>choose a file</button></p>
                    <p className="file-types">Accepts .fit files</p>
                  </div>
                  <input
                    type="file"
                    id="fitFile"
                    accept=".fit"
                    style={{display: 'none'}}
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    onClick={resetDragState}
                  />
                </div>

                <div className="example-file-link">
                  <a href="#" id="loadExampleFile" onClick={(event) => { event.preventDefault(); handleExampleLoad(); }}>
                    🚴 Load example FIT file
                  </a>
                </div>
              </div>
            </div>

            <div className="sidebar-section" id="sidebarActivitySummary">
              <div id="activitySummary">
                {renderActivityTimes()}
              </div>
            </div>

            <div className="sidebar-section">
              <div id="analysisControls" style={{display: parsedFile ? 'block' : 'none'}}>
                <label>Faff Period Thresholds:</label>
                <div>
                  {RANGE_OPTIONS.map(option => (
                    <label key={option.value}>
                      <input
                        type="checkbox"
                        id={`threshold_${option.value}`}
                        value={option.value}
                        checked={selectedRanges.includes(option.value)}
                        onChange={() => toggleRangeSelection(option.value)}
                      />
                      {' '} {option.label}
                    </label>
                  ))}
                </div>
                <div className="timestamp-gap-control">
                  <label htmlFor="timestampGapThreshold">Gap Threshold:</label>
                  <select
                    id="timestampGapThreshold"
                    value={gapThreshold}
                    onChange={(event) => setGapThreshold(parseInt(event.target.value, 10))}
                    title="Increase if you have excessive recording gaps"
                  >
                    {GAP_THRESHOLD_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="map-overlay-control">
                  <label>
                    <input
                      type="checkbox"
                      id="showPeriodsOnMap"
                      checked={showOverlays}
                      onChange={(event) => setShowOverlays(event.target.checked)}
                    />
                    {' '} Show slow periods and gaps on main activity map
                  </label>
                </div>
              </div>
            </div>

            <span className="disclaimer">
              <strong>Use the feedback link below to share any files that aren’t behaving so I can fix them.</strong>
              <br />
              <br />
              FIT files are processed in your browser.<br />
              <a href="https://github.com/Hates/fafftime" target="_blank" rel="noopener noreferrer">🐙 github.com/Hates/fafftime</a> | {' '}
              <a href="mailto:info@fafftime.com?subject=Faff%20Time%20Feedback">✉️ send feedback</a>
            </span>
          </div>
        </aside>

        <div className="app-content">
          <div className="container">
            {!parsedFile && status !== 'loading' && (
              <div id="screenshot">
                <div className="screenshotContents">
                  <h3>Example Output</h3>
                  <img src="screenshot.png" alt="Example analysis output" />
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="loading-message">📊 Parsing FIT file...</div>
            )}

            {status === 'error' && errorMessage && (
              <div className="error-message">❌ Error parsing FIT file: {errorMessage}</div>
            )}

            {isAnalysisAvailable && (
              <div id="mapContainer" style={{display: isAnalysisAvailable ? 'block' : 'none'}}>
                <h3>📍 Activity Map</h3>
                <div id="map"></div>
              </div>
            )}

            <div id="slowPeriodData">
              {isAnalysisAvailable && renderSlowPeriodContent()}
            </div>

            {analysisResult && (
              <div id="activityData" className="file-summary">
                <h3>📊 File Summary</h3>
                <p><strong>Total Records:</strong> <span>{analysisResult.records.length}</span></p>
                <p><strong>Sessions Found:</strong> <span>{analysisResult.sessions.length}</span></p>
                <p><strong>Timestamp Gaps:</strong> <span>{analysisResult.timestampGaps.length}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
