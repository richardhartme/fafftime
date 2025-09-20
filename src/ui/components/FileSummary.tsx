import { AnalysisResult } from '../../types/analysis';

interface FileSummaryProps {
  analysisResult: AnalysisResult;
}

export function FileSummary({ analysisResult }: FileSummaryProps): JSX.Element {
  const totalRecords = analysisResult.records.length.toLocaleString();
  const sessionsFound = analysisResult.sessions.length.toLocaleString();
  const timestampGaps = analysisResult.timestampGaps.length.toLocaleString();

  return (
    <section
      id="activityData"
      className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/80 p-5 shadow-sm"
      aria-labelledby="file-summary-title"
    >
      <header className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-sky-500/15 p-1.5 text-sky-700">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 3v18h18V3H3Zm8 14H7v-2h4v2Zm6-4H7v-2h10v2Zm0-4H7V7h10v2Z" />
          </svg>
        </div>

        <h3 id="file-summary-title" className="text-base font-semibold text-sky-900">
          File Summary
        </h3>
      </header>

      <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2 sm:gap-x-6">
        <div className="flex gap-2">
          <dt className="font-semibold text-sky-900">Total Records:</dt>
          <dd className="text-sky-800">{totalRecords}</dd>
        </div>

        <div className="flex gap-2">
          <dt className="font-semibold text-sky-900">Sessions Found:</dt>
          <dd className="text-sky-800">{sessionsFound}</dd>
        </div>

        <div className="flex gap-2">
          <dt className="font-semibold text-sky-900">Timestamp Gaps:</dt>
          <dd className="text-sky-800">{timestampGaps}</dd>
        </div>
      </dl>
    </section>
  );
}
