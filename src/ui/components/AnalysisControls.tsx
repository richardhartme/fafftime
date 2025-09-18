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

  const analysisControlsStyle = { display: isVisible ? 'block' : 'none' };

  return (
    <div className="sidebar-section">
      <div id="analysisControls" style={analysisControlsStyle}>
        <label>Faff Period Thresholds:</label>
        <div>
          {rangeOptions.map(option => (
            <label key={option.value}>
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
        <div className="timestamp-gap-control">
          <label htmlFor="timestampGapThreshold">Gap Threshold:</label>
          <select
            id="timestampGapThreshold"
            value={gapThreshold}
            onChange={handleGapThresholdChange}
            title="Increase if you have excessive recording gaps"
          >
            {gapThresholdOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="map-overlay-control">
          <label>
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
