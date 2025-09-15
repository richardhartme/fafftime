// =============================================================================
// GOOGLE ANALYTICS UTILITIES
// =============================================================================

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

/**
 * Tracks custom events in Google Analytics
 */
export function trackEvent(eventName: string, parameters?: Record<string, any>): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
}

/**
 * Tracks when a FIT file is successfully parsed
 */
export function trackFitFileParsed(): void {
  trackEvent('fit_file_parsed');
}

/**
 * Tracks when the example file button is pressed
 */
export function trackExampleFileLoaded(): void {
  trackEvent('example_file_loaded');
}