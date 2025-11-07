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

  return (
    <div className="w-full">
      <div className="w-full">
        <header
          className="mx-auto max-w-6xl px-4 pt-6 pb-8 sm:flex sm:items-center sm:gap-10"
          aria-labelledby="site-title"
        >
          <div className="flex flex-shrink-0 justify-center sm:justify-start">
            <img
              src={logoImage}
              alt="Ultra Cycling Faff Time logo"
              className="w-auto h-28 sm:h-32"
            />
          </div>

          <div className="mt-6 sm:mt-0">
            <h1
              id="site-title"
              className="text-3xl font-bold tracking-tight text-zinc-900"
            >
              Ultra Cycling Faff Time
            </h1>

            <p className="mt-2 text-lg text-zinc-700">
              Find where you spent time stopped (faffing) instead of riding.
            </p>

            <p className="mt-4 text-base">
              <span className="font-semibold text-zinc-900">
                faff about / around
              </span>
              <span className="text-zinc-700">
                {' '}- phrasal verb: to spend your time doing things that are not important instead of the thing that you should be doing.
              </span>
            </p>
          </div>
        </header>
      </div>

      <div className="flex w-full flex-col gap-[30px] md:flex-row md:items-start md:gap-[30px] lg:gap-10">
        <aside className="py-2 scrollbar-hidden md:sticky md:top-[25px] md:basis-[240px] md:flex-none md:max-h-[calc(100vh-50px)] md:overflow-y-auto lg:top-[30px] lg:basis-[320px] lg:max-h-[calc(100vh-60px)]">
          <div className="flex flex-col gap-2.5">
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

            <span className="block text-xs text-gray-500">
              <p className="mb-2">FIT files are processed in your browser.</p>
              <p className="mb-2"><strong>Use the feedback link below to share any files that aren’t behaving so I can fix them.</strong></p>
              <a href="https://github.com/Hates/fafftime" target="_blank" rel="noopener noreferrer" className="text-gray-800">
                <Icon name="github" prefix="brands" className="text-gray-800" />View on Github
              </a>
              {' | '}
              <a href="mailto:info@fafftime.com?subject=Faff%20Time%20Feedback" className="text-gray-800">
                <Icon name="envelope" className="text-gray-800" />send feedback
              </a>
            </span>
          </div>
        </aside>

        <div className="w-full min-w-0 md:flex-1">
          {!parsedFile && status !== 'loading' && (
            <section className="mx-auto max-w-6xl px-6 py-2" id="screenshot">
              <figure className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center justify-between rounded-t-2xl border-b border-zinc-200 px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400"></span>
                  </div>
                  <div className="truncate text-xs text-zinc-500">example-output.png</div>
                  <div className="w-10"></div>
                </div>

                <div className="overflow-hidden rounded-b-2xl">
                  <img
                    src="screenshot.png"
                    className="block h-auto w-full mx-auto max-w-[500px]"
                    loading="lazy"
                  />
                </div>
              </figure>
            </section>
          )}

          {status === 'loading' && (
            <div className="flex my-2 items-center gap-2 text-blue-600">
              <Icon name="spinner fa-spin-pulse" />
              Parsing FIT file...
            </div>
          )}

          {combinedError && (
            <div className="text-red-600">
              <Icon name="circle-xmark" />
              {combinedError}
            </div>
          )}

          <div id="slowPeriodData">
            {analysisAvailable && analysisResult && (
              <div className="flex flex-col gap-5">
                {analysisResult.startTime && analysisResult.endTime ? (
                  <ActivitySummary analysisResult={analysisResult} />
                ) : (
                  <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-orange-600">
                    <Icon name="triangle-exclamation" />
                    <span>Could not determine start/end times from this FIT file.</span>
                  </div>
                )}

                <SlowPeriodSummary analysisResult={analysisResult} />

                <section
                  id="mapContainer"
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"
                  aria-labelledby="activity-map-title"
                >
                  <header className="flex items-center gap-3">
                    <div className="rounded-full bg-slate-500/15 p-1.5 text-slate-700">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                      </svg>
                    </div>
                    <h3 id="activity-map-title" className="text-base font-semibold text-slate-900">
                      Activity Map
                    </h3>
                  </header>

                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div id="activity-map" className="h-[360px] w-full sm:h-[420px] lg:h-[520px]"></div>
                  </div>
                </section>

                <SlowPeriodList analysisResult={analysisResult} />
              </div>
            )}
          </div>

          {analysisResult && (
            <FileSummary analysisResult={analysisResult} />
          )}
        </div>
      </div>
    </div>
  );
}
