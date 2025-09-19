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
      <div className="w-full mb-[30px]">
        <header className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:text-left">
            <img
              src={logoImage}
              alt="Ultra Cycling Faff Time"
              className="h-auto w-[80px] max-h-[80px] flex-shrink-0 object-contain md:w-auto md:max-h-[190px]"
            />
            <div className="text-center md:text-left">
              <h1 className="m-0 mb-1 text-[1.8rem] md:text-[1.6rem] lg:text-[2rem]">Ultra Cycling Faff Time</h1>
              <h4 className="m-0 mb-2 text-base md:text-lg">Find where you spent time stopped (faffing) instead of riding.</h4>
              <strong className="my-2 block md:text-left">faff about / around</strong> phrasal verb - to spend your time doing things that are not important instead of the thing that you should be doing.
              <span className="block py-2 text-sm md:text-left">
                After realising there was a 20-hour difference between my elapsed time and moving time during my last ultra event. I wanted a tool to be able to see where all that time went. Faff Time shows where you spent time stopped and for how long.
              </span>
            </div>
          </div>
        </header>
      </div>

      <div className="flex w-full flex-col gap-[30px] md:flex-row md:items-start md:gap-[30px] lg:gap-10">
        <aside className="py-2.5 md:sticky md:top-[25px] md:basis-[240px] md:flex-none md:max-h-[calc(100vh-50px)] md:overflow-y-auto lg:top-[30px] lg:basis-[320px] lg:max-h-[calc(100vh-60px)]">
          <div className="flex flex-col gap-2.5">
            <FileDropzone onFileSelected={handleFileSelection} onExampleLoad={handleExampleLoad} isLoading={status === 'loading'} />

            <div className="w-full">
              <div id="activitySummary">
                {analysisResult && analysisResult.startTime && analysisResult.endTime && (
                  <ActivitySummary analysisResult={analysisResult} />
                )}
                {analysisResult && (!analysisResult.startTime || !analysisResult.endTime) && (
                  <div className="text-orange-500">
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

            <span className="block text-xs text-gray-500">
              <strong className="block">Use the feedback link below to share any files that aren’t behaving so I can fix them.</strong>
              <br />
              FIT files are processed in your browser.<br />
              <a href="https://github.com/Hates/fafftime" target="_blank" rel="noopener noreferrer" className="text-gray-800">
                <Icon name="github" prefix="brands" className="text-gray-800" />github.com/Hates/fafftime
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
            <div id="screenshot">
              <div className="text-center">
                <h3>Example Output</h3>
                <img src="screenshot.png" alt="Example analysis output" className="mx-auto max-w-[660px]" />
              </div>
            </div>
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

          {analysisAvailable && (
            <div
              id="mapContainer"
              className="my-[15px] rounded bg-gray-100 p-[10px]"
              style={{ display: analysisAvailable ? 'block' : 'none' }}
            >
              <h3 className="mb-[10px]">
                <Icon name="location-dot" />
                Activity Map
              </h3>
              <div id="map" className="h-[300px] rounded md:h-[400px]"></div>
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
