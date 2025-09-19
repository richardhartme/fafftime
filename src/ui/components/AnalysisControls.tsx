import { ChangeEvent } from 'react';
import { TimeRange } from '../../types/app-types';

export interface RangeOption {
  value: TimeRange;
  label: string;
}

export interface GapThresholdOption {
  value: number;
  label: string;
}

interface AnalysisControlsProps {
  isVisible: boolean;
  rangeOptions: RangeOption[];
  selectedRanges: TimeRange[];
  onToggleRange: (range: TimeRange) => void;
  gapThreshold: number;
  gapThresholdOptions: GapThresholdOption[];
  onGapThresholdChange: (value: number) => void;
  showOverlays: boolean;
  onShowOverlaysChange: (value: boolean) => void;
}

export function AnalysisControls({
  isVisible,
  rangeOptions,
  selectedRanges,
  onToggleRange,
  gapThreshold,
  gapThresholdOptions,
  onGapThresholdChange,
  showOverlays,
  onShowOverlaysChange,
}: AnalysisControlsProps): JSX.Element {
  const handleGapThresholdChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onGapThresholdChange(parseInt(event.target.value, 10));
  };

  const visibilityClass = isVisible ? 'block' : 'hidden';

  return (
    <div className="w-full">
      <div id="analysisControls" className={`mb-4 p-5 rounded bg-gray-100 ${visibilityClass}`}>
        <label className="mb-1 block text-sm font-medium">Faff Period Thresholds:</label>
        <div className="mt-2.5 space-y-1">
          {rangeOptions.map(option => (
            <label key={option.value} className="mr-2 block items-center gap-2 text-sm">
              <input
                type="checkbox"
                id={`threshold_${option.value}`}
                value={option.value}
                checked={selectedRanges.includes(option.value)}
                onChange={() => onToggleRange(option.value)}
              />
              {' '}
              {option.label}
            </label>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-300">
          <label htmlFor="timestampGapThreshold" className="mb-1 block text-sm font-medium">Gap Threshold:</label>
          <select
            id="timestampGapThreshold"
            value={gapThreshold}
            onChange={handleGapThresholdChange}
            title="Increase if you have excessive recording gaps"
            className="w-full rounded border border-gray-300 p-2 text-sm"
          >
            {gapThresholdOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-300">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              id="showPeriodsOnMap"
              checked={showOverlays}
              onChange={(event) => onShowOverlaysChange(event.target.checked)}
            />
            {' '} Show slow periods and gaps on main activity map
          </label>
        </div>
      </div>
    </div>
  );
}
