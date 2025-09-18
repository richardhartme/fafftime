import { useEffect, useState } from 'react';
import { buildAnalysisResult } from '../../core/analysis';
import { AnalysisResult, ParsedFileState } from '../../types/analysis';
import { TimeRange } from '../../types/app-types';

interface UseAnalysisResultParams {
  parsedFile: ParsedFileState | null;
  selectedRanges: TimeRange[];
  gapThreshold: number;
}

interface UseAnalysisResultReturn {
  analysisResult: AnalysisResult | null;
  analysisError: string | null;
}

export function useAnalysisResult({
  parsedFile,
  selectedRanges,
  gapThreshold,
}: UseAnalysisResultParams): UseAnalysisResultReturn {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!parsedFile) {
      setAnalysisResult(null);
      setAnalysisError(null);
      return;
    }

    try {
      const result = buildAnalysisResult(parsedFile.fitData, parsedFile.fileName, selectedRanges, gapThreshold);
      setAnalysisResult(result);
      setAnalysisError(null);
    } catch (error) {
      console.error('Error building analysis', error);
      setAnalysisResult(null);
      setAnalysisError(error instanceof Error ? error.message : 'Unknown analysis error');
    }
  }, [parsedFile, selectedRanges, gapThreshold]);

  return {
    analysisResult,
    analysisError,
  };
}
