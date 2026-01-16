import { useCallback, useState } from 'react';
import { TimeRange } from '../types/app-types';
import { DEFAULT_GAP_THRESHOLD_MS, DEFAULT_SELECTED_RANGES, RANGE_LABELS } from '../utils/constants';
import { decodeFitFile } from '../core/fit-parser';
import { trackExampleFileLoaded, trackFitFileParsed } from '../utils/analytics';
import { ParsedFileState } from '../types/analysis';
import { useAnalysisResult } from './hooks/useAnalysisResult';
import { useMapManager } from './hooks/useMapManager';
import { AnalysisControls, GapThresholdOption, RangeOption } from './components/AnalysisControls';
import { ActivitySummary } from './components/ActivitySummary';
import { SlowPeriodList, SlowPeriodSummary } from './components/SlowPeriodList';
import { FileSummary } from './components/FileSummary';
import { Icon } from './components/Icon';
import { UploadPanel } from './components/UploadPanel';
import { HeroSection } from './components/HeroSection';
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      trackFitFileParsed();
    } catch (error) {
      console.error('Failed to load example file', error);
      setFileError(error instanceof Error ? error.message : 'Unable to load example file');
    } finally {
      setStatus('idle');
    }
  }, []);

  const sortRanges = useCallback((ranges: TimeRange[]) => (
    [...ranges].sort((a, b) => {
      const orderA = DEFAULT_SELECTED_RANGES.indexOf(a);
      const orderB = DEFAULT_SELECTED_RANGES.indexOf(b);
      const safeOrderA = orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA;
      const safeOrderB = orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB;
      return safeOrderA - safeOrderB;
    })
  ), []);

  const toggleRangeSelection = (range: TimeRange) => {
    setSelectedRanges(current => (
      sortRanges(
        current.includes(range)
          ? current.filter(item => item !== range)
          : [...current, range]
      )
    ));
  };

  const analysisAvailable = Boolean(analysisResult && analysisResult.records.length > 0);
  const combinedError = fileError ?? analysisError;

  // Show hero landing page when no file is loaded
  if (!parsedFile && status !== 'loading') {
    return (
      <HeroSection
        onFileSelected={handleFileSelection}
        onExampleLoad={handleExampleLoad}
        isLoading={status === 'loading'}
      />
    );
  }

  // Show analysis view when file is loaded or loading
  return (
    <div className="w-full bg-slate-50/50 min-h-screen">
      {/* Compact header for analysis view */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => setParsedFile(null)}
              className="flex items-center gap-3 transition-opacity hover:opacity-70"
            >
              <img
                src={logoImage}
                alt="FaffTime logo"
                className="w-auto h-9"
              />
              <span className="text-lg font-semibold text-slate-900">FaffTime</span>
            </button>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/Hates/fafftime"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Icon name="github" prefix="brands" className="mr-1" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Sidebar */}
          <aside className="scrollbar-hidden lg:sticky lg:w-80 lg:flex-none lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
            <div className="flex flex-col gap-4">
              <UploadPanel
                parsedFile={parsedFile}
                onFileSelected={handleFileSelection}
                onExampleLoad={handleExampleLoad}
                isLoading={status === 'loading'}
              />

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

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                <p className="mb-2">Your FIT files are processed locally in your browser.</p>
                <p className="mb-3 text-slate-600 font-medium">Have feedback or issues? Let us know.</p>
                <div className="flex items-center gap-3">
                  <a href="https://github.com/Hates/fafftime" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition-colors">
                    <Icon name="github" prefix="brands" />
                    GitHub
                  </a>
                  <span className="text-slate-300">|</span>
                  <a href="mailto:info@fafftime.com?subject=Faff%20Time%20Feedback" className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition-colors">
                    <Icon name="envelope" />
                    Email
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="w-full min-w-0 lg:flex-1">
            <div className="flex flex-col gap-6">
              {status === 'loading' && (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-8 text-blue-700">
                  <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-lg font-medium">Analysing your FIT file...</span>
                </div>
              )}

              {combinedError && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-700">
                  <Icon name="circle-xmark" className="text-xl" />
                  <span>{combinedError}</span>
                </div>
              )}

              {analysisAvailable && analysisResult && (
                <>
                  {analysisResult.startTime && analysisResult.endTime ? (
                    <ActivitySummary analysisResult={analysisResult} />
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-orange-700">
                      <Icon name="triangle-exclamation" />
                      <span>Could not determine start/end times from this FIT file.</span>
                    </div>
                  )}

                  <SlowPeriodSummary analysisResult={analysisResult} />

                  <section
                    id="mapContainer"
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    aria-labelledby="activity-map-title"
                  >
                    <header className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                        </svg>
                      </div>
                      <h3 id="activity-map-title" className="text-lg font-semibold text-slate-900">
                        Activity Map
                      </h3>
                    </header>

                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <div id="activity-map" className="h-[360px] w-full sm:h-[420px] lg:h-[520px]"></div>
                    </div>
                  </section>

                  <SlowPeriodList analysisResult={analysisResult} />
                </>
              )}

              {analysisResult && (
                <FileSummary analysisResult={analysisResult} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
