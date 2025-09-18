import { useEffect } from 'react';
import { AnalysisResult } from '../../types/analysis';
import {
  initializeCombinedMiniMaps,
  initializeMap,
  setCurrentSlowPeriods,
  updateMapOverlays,
} from '../map-manager';

export function useMapManager(analysisResult: AnalysisResult | null, showOverlays: boolean): void {
  useEffect(() => {
    if (!analysisResult) {
      return;
    }

    initializeMap(analysisResult.fitData);
    setCurrentSlowPeriods(analysisResult.slowPeriods);
    updateMapOverlays(showOverlays);

    const handle = window.setTimeout(() => {
      initializeCombinedMiniMaps(analysisResult.slowPeriods, analysisResult.activityRoute);
    }, 100);

    return () => {
      window.clearTimeout(handle);
    };
  }, [analysisResult]);

  useEffect(() => {
    if (!analysisResult) {
      return;
    }
    updateMapOverlays(showOverlays);
  }, [analysisResult, showOverlays]);
}
