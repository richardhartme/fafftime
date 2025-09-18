import { AnalysisResult } from '../../types/analysis';
import { Icon } from './Icon';

interface FileSummaryProps {
  analysisResult: AnalysisResult;
}

export function FileSummary({ analysisResult }: FileSummaryProps): JSX.Element {
  return (
    <div id="activityData" className="file-summary">
      <h3>
        <Icon name="chart-column" />
        File Summary
      </h3>
      <p><strong>Total Records:</strong> <span>{analysisResult.records.length}</span></p>
      <p><strong>Sessions Found:</strong> <span>{analysisResult.sessions.length}</span></p>
      <p><strong>Timestamp Gaps:</strong> <span>{analysisResult.timestampGaps.length}</span></p>
    </div>
  );
}
