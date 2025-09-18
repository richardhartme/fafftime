import { useCallback, useState } from 'react';
import { TimeRange } from '../types/app-types';
import { DEFAULT_GAP_THRESHOLD_MS, DEFAULT_SELECTED_RANGES, RANGE_LABELS } from '../utils/constants';
import { decodeFitFile } from '../core/fit-parser';
import { trackExampleFileLoaded, trackFitFileParsed } from '../utils/analytics';
import { ParsedFileState } from '../types/analysis';
import { useAnalysisResult } from './hooks/useAnalysisResult';
import { useMapManager } from './hooks/useMapManager';
import { FileDropzone } from './components/FileDropzone';
import { AnalysisControls, GapThresholdOption, RangeOption } from './components/AnalysisControls';
import { ActivitySummary } from './components/ActivitySummary';
import { SlowPeriodList } from './components/SlowPeriodList';
import { FileSummary } from './components/FileSummary';
import { Icon } from './components/Icon';
import logoImage from '../assets/images/logo.png';

const GAP_THRESHOLD_OPTIONS: GapThresholdOption[] = [
  { value: 60000, label: '1 minute' },
  { value: 120000, label: '2 minutes' },
  { value: 240000, label: '3 minutes' },
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' },
];

const RANGE_OPTIONS: RangeOption[] = DEFAULT_SELECTED_RANGES.map(range => ({
  value: range,
  label: RANGE_LABELS[range],
}));

export default function App(): JSX.Element {
  const [parsedFile, setParsedFile] = useState<ParsedFileState | null>(null);
  const [selectedRanges, setSelectedRanges] = useState<TimeRange[]>(DEFAULT_SELECTED_RANGES);
  const [gapThreshold, setGapThreshold] = useState<number>(DEFAULT_GAP_THRESHOLD_MS);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [fileError, setFileError] = useState<string | null>(null);

  const { analysisResult, analysisError } = useAnalysisResult({ parsedFile, selectedRanges, gapThreshold });

  useMapManager(analysisResult, showOverlays);

  const handleFileSelection = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.fit')) {
      window.alert('Please select a .fit file');
      return;
    }

    try {
      setStatus('loading');
      setFileError(null);
      const fitData = await decodeFitFile(file);
      setParsedFile({ fitData, fileName: file.name });
      trackFitFileParsed();
    } catch (error) {
      console.error('Error parsing FIT file', error);
      setFileError(error instanceof Error ? error.message : 'Unknown error parsing FIT file');
    } finally {
      setStatus('idle');
    }
  }, []);

  const handleExampleLoad = useCallback(async () => {
    try {
      setStatus('loading');
      setFileError(null);
      trackExampleFileLoaded();
      const response = await fetch('GreatBritishEscapades2025.fit');
      if (!response.ok) {
        throw new Error(`Failed to load example file: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const file = new File([arrayBuffer], 'GreatBritishEscapades2025.fit', { type: 'application/octet-stream' });
      const fitData = await decodeFitFile(file);
      setParsedFile({ fitData, fileName: file.name });
      trackFitFileParsed();
    } catch (error) {
      console.error('Failed to load example file', error);
      setFileError(error instanceof Error ? error.message : 'Unable to load example file');
    } finally {
      setStatus('idle');
    }
  }, []);

  const toggleRangeSelection = (range: TimeRange) => {
    setSelectedRanges(current => (
      current.includes(range)
        ? current.filter(item => item !== range)
        : [...current, range]
    ));
  };

  const analysisAvailable = Boolean(analysisResult && analysisResult.records.length > 0);
  const combinedError = fileError ?? analysisError;

  return (
    <div className="app">
      <div className="page-header">
        <header className="app-header">
          <div className="header-brand">
            <img src={logoImage} alt="Ultra Cycling Faff Time" className="header-logo" />
            <div className="header-copy">
              <h1>Ultra Cycling Faff Time</h1>
              <h4>Find where you spent time stopped (faffing) instead of riding.</h4>
              <strong>faff about / around</strong> phrasal verb - to spend your time doing things that are not important instead of the thing that you should be doing.
              <span className="description">
                After realising there was a 20-hour difference between my elapsed time and moving time during my last ultra event. I wanted a tool to be able to see where all that time went. Faff Time shows where you spent time stopped and for how long.
              </span>
            </div>
          </div>
        </header>
      </div>

      <div className="app-layout">
        <aside className="app-sidebar">
          <div className="app-sidebar-content">
            <FileDropzone onFileSelected={handleFileSelection} onExampleLoad={handleExampleLoad} isLoading={status === 'loading'} />

            <div className="sidebar-section">
              <div id="activitySummary">
                {analysisResult && analysisResult.startTime && analysisResult.endTime && (
                  <ActivitySummary analysisResult={analysisResult} />
                )}
                {analysisResult && (!analysisResult.startTime || !analysisResult.endTime) && (
                  <div className="warning-message">
                    <Icon name="triangle-exclamation" />
                    Could not determine start/end times from this FIT file.
                  </div>
                )}
              </div>
            </div>

            <AnalysisControls
              isVisible={Boolean(parsedFile)}
              rangeOptions={RANGE_OPTIONS}
              selectedRanges={selectedRanges}
              onToggleRange={toggleRangeSelection}
              gapThreshold={gapThreshold}
              gapThresholdOptions={GAP_THRESHOLD_OPTIONS}
              onGapThresholdChange={setGapThreshold}
              showOverlays={showOverlays}
              onShowOverlaysChange={setShowOverlays}
            />

            <span className="disclaimer">
              <strong>Use the feedback link below to share any files that aren’t behaving so I can fix them.</strong>
              <br />
              <br />
              FIT files are processed in your browser.<br />
              <a href="https://github.com/Hates/fafftime" target="_blank" rel="noopener noreferrer">
                <Icon name="github" prefix="brands" />github.com/Hates/fafftime
              </a>
              {' | '}
              <a href="mailto:info@fafftime.com?subject=Faff%20Time%20Feedback">
                <Icon name="envelope" />send feedback
              </a>
            </span>
          </div>
        </aside>

        <div className="app-content">
          {!parsedFile && status !== 'loading' && (
            <div id="screenshot">
              <div className="screenshotContents">
                <h3>Example Output</h3>
                <img src="screenshot.png" alt="Example analysis output" />
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="loading-message">
              <Icon name="spinner fa-spin-pulse" />
              Parsing FIT file...
            </div>
          )}

          {combinedError && (
            <div className="error-message">
              <Icon name="circle-xmark" />
              {combinedError}
            </div>
          )}

          {analysisAvailable && (
            <div id="mapContainer" style={{ display: analysisAvailable ? 'block' : 'none' }}>
              <h3>
                <Icon name="location-dot" />
                Activity Map
              </h3>
              <div id="map"></div>
            </div>
          )}

          <div id="slowPeriodData">
            {analysisAvailable && analysisResult && <SlowPeriodList analysisResult={analysisResult} />}
          </div>

          {analysisResult && (
            <FileSummary analysisResult={analysisResult} />
          )}
        </div>
      </div>
    </div>
  );
}
