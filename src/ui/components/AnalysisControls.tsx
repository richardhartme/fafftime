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
  const sectionClassName = [
    'mb-4',
    'max-w-md rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur',
    'dark:border-zinc-800 dark:bg-zinc-900/70',
    visibilityClass,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="w-full">
      <section id="analysisControls" className={sectionClassName}>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Analysis Settings
        </h2>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Faff Period Thresholds
          </legend>

          <ul className="mt-3 space-y-2">
            {rangeOptions.map(option => {
              const checkboxId = `threshold-${option.value}`;
              return (
                <li key={option.value} className="flex items-start gap-3">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 shadow-sm focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 accent-blue-600"
                    value={option.value}
                    checked={selectedRanges.includes(option.value)}
                    onChange={() => onToggleRange(option.value)}
                  />
                  <label htmlFor={checkboxId} className="text-sm text-zinc-800 dark:text-zinc-100">
                    {option.label}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <hr className="my-5 border-zinc-200 dark:border-zinc-800" />

        <fieldset>
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Recording Gap Threshold
          </legend>

          <div className="mt-3">
            <label htmlFor="gap-threshold" className="sr-only">
              Recording Gap threshold
            </label>
            <div className="relative">
              <select
                id="gap-threshold"
                value={gapThreshold}
                onChange={handleGapThresholdChange}
                title="Increase if you have excessive recording gaps"
                className="w-full appearance-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {gapThresholdOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 111.04 1.08l-4.24 3.36a.75.75 0 01-.94 0L5.21 8.31a.75.75 0 01.02-1.1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Periods shorter than this are ignored when detecting gaps.
            </p>
          </div>
        </fieldset>

        <hr className="my-5 border-zinc-200 dark:border-zinc-800" />

        <div className="flex items-start gap-3">
          <input
            id="show-overlays"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 shadow-sm focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 accent-blue-600"
            checked={showOverlays}
            onChange={(event) => onShowOverlaysChange(event.target.checked)}
          />
          <label htmlFor="show-overlays" className="text-sm text-zinc-800 dark:text-zinc-100">
            Show slow periods and gaps on main activity map
          </label>
        </div>
      </section>
    </div>
  );
}
