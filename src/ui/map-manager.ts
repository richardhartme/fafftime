// =============================================================================
// MAP MANAGER - LEAFLET MAPPING FUNCTIONALITY
// =============================================================================

import type { Layer, Map as LeafletMap, Polyline as LeafletPolyline, PolylineOptions } from 'leaflet';
import { FitData, SlowPeriod, TimestampGap } from '../types/app-types';
import { convertGpsCoordinates } from '../utils/gps-utils';
import { formatDuration } from '../core/time-utils';

declare const L: typeof import('leaflet');

// Global State
let activityMap: LeafletMap | null = null;
let currentSlowPeriods: SlowPeriod[] | null = null;
const miniMapsById = new Map<string, LeafletMap>();

interface FullRouteOverlay {
  polyline: LeafletPolyline;
  decorator: Layer | null;
}

type OverlayLayer = Layer & {
  options?: {
    isSlowPeriodOverlay?: boolean;
    isGapOverlay?: boolean;
  };
};

type ToggleInputWithHandler = HTMLInputElement & {
  __fullRouteToggleHandler?: (event: Event) => void;
};

const fullRouteOverlaysByMapId = new Map<string, FullRouteOverlay>();

const GAP_OVERLAY_MARKER_CLASS = 'flex h-[20px] w-[20px] items-center justify-center rounded-full bg-slate-500 text-[12px] text-white shadow-md';
const SLOW_OVERLAY_MARKER_CLASS = 'flex h-[20px] w-[20px] items-center justify-center rounded-full bg-amber-400 text-[12px] text-white shadow-md';
const GAP_START_MARKER_CLASS = 'flex items-center justify-center rounded border border-white bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white';
const GAP_END_MARKER_CLASS = 'flex items-center justify-center rounded border border-white bg-green-600 px-1.5 py-0.5 text-[11px] font-bold text-white';
const START_MARKER_CLASS = 'flex h-[20px] w-[20px] items-center justify-center rounded-full bg-green-600 text-[12px] font-bold text-white';
const END_MARKER_CLASS = 'flex h-[20px] w-[20px] items-center justify-center rounded-full bg-red-600 text-[12px] font-bold text-white';
const NO_GPS_MESSAGE_CLASS = 'flex h-full items-center justify-center italic text-gray-500';

/**
 * Initializes the main activity map with GPS route and markers
 */
export function initializeMap(fitData: FitData): void {
  const mapContainerElement = document.getElementById('mapContainer') as HTMLElement | null;
  const records = fitData.recordMesgs || [];
  const gpsPoints = convertGpsCoordinates(records);

  if (!mapContainerElement) {
    console.warn('Map container element not found');
    return;
  }

  if (gpsPoints.length === 0) {
    console.log('No GPS data found in FIT file');
    return;
  }

  // Show map container
  mapContainerElement.style.display = 'block';

  // Initialize map if not already created
  if (!activityMap) {
    // Center map on first GPS point
    activityMap = L.map('map').setView(gpsPoints[0], 13);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(activityMap);
  } else {
    // Clear existing layers
    activityMap.eachLayer((layer: Layer) => {
      if (!activityMap) {
        return;
      }
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        activityMap.removeLayer(layer);
      }
    });
  }

  const mapInstance = activityMap;
  if (!mapInstance) {
    return;
  }

  // Add activity route as polyline
  const polyline = L.polyline(gpsPoints, { color: 'red', weight: 3 }).addTo(mapInstance);

  // Add start marker
  if (gpsPoints.length > 0) {
    L.marker(gpsPoints[0])
      .addTo(mapInstance)
      .bindPopup('Start');
  }

  // Add end marker if different from start
  if (gpsPoints.length > 1) {
    const endPoint = gpsPoints[gpsPoints.length - 1];
    L.marker(endPoint)
      .addTo(mapInstance)
      .bindPopup('End');
  }

  // Fit map to show entire route
  mapInstance.fitBounds(polyline.getBounds(), { padding: [10, 10] });
}

/**
 * Updates map overlays to show/hide slow periods and recording gaps
 */
export function updateMapOverlays(showOverlays: boolean = true): void {
  if (!activityMap || !currentSlowPeriods) {
    return;
  }

  const mapInstance = activityMap;

  // Remove existing overlay markers and lines
  mapInstance.eachLayer((layer: Layer) => {
    const overlayLayer = layer as OverlayLayer;
    if (overlayLayer.options?.isSlowPeriodOverlay || overlayLayer.options?.isGapOverlay) {
      mapInstance.removeLayer(layer);
    }
  });

  // Only add overlays if checkbox is checked
  if (!showOverlays) {
    return;
  }

  // Add markers for each slow period or gap
  currentSlowPeriods.forEach((period, index) => {
    if (period.isGap) {
      addGapOverlayToMap(period, index);
    } else {
      addSlowPeriodOverlayToMap(period, index);
    }
  });
}

/**
 * Adds gap overlay markers and lines to the map
 */
function addGapOverlayToMap(period: SlowPeriod, index: number): void {
  const map = activityMap;
  if (!map) {
    return;
  }

  const gap = period.gapData;

  if (!gap) {
    return;
  }

  if (gap.startGpsPoint) {
    const gapOverlayHtml = `<div class="${GAP_OVERLAY_MARKER_CLASS}"><i class="fa-solid fa-circle-pause" aria-hidden="true"></i></div>`;
    const marker = L.marker(gap.startGpsPoint, {
      icon: L.divIcon({
        className: GAP_OVERLAY_MARKER_CLASS,
        html: gapOverlayHtml,
        iconSize: [20, 20],
      }),
    }).addTo(map).bindPopup(`Recording Gap ${index + 1}<br>Duration: ${formatDuration(Math.round((period.endTime.getTime() - period.startTime.getTime()) / 1000))}`);
    const markerOverlay = marker as OverlayLayer;
    markerOverlay.options = {
      ...(markerOverlay.options ?? {}),
      isGapOverlay: true,
    };
  }

  if (gap.endGpsPoint && gap.startGpsPoint) {
    // Add dashed line for gap if both points exist
    const line = L.polyline([gap.startGpsPoint, gap.endGpsPoint], {
      color: '#dc3545',
      weight: 3,
      opacity: 0.8,
      dashArray: '15, 10',
    }).addTo(map);
    const lineOverlay = line as OverlayLayer;
    lineOverlay.options = {
      ...(lineOverlay.options ?? {}),
      isGapOverlay: true,
    };
  }
}

/**
 * Adds slow period overlay markers and lines to the map
 */
function addSlowPeriodOverlayToMap(period: SlowPeriod, index: number): void {
  const map = activityMap;
  if (!map) {
    return;
  }

  if (period.gpsPoints.length > 0) {
    const centerPoint = period.gpsPoints[Math.floor(period.gpsPoints.length / 2)];

    const slowOverlayHtml = `<div class="${SLOW_OVERLAY_MARKER_CLASS}"><i class="fa-solid fa-stopwatch" aria-hidden="true"></i></div>`;
    const marker = L.marker(centerPoint, {
      icon: L.divIcon({
        className: SLOW_OVERLAY_MARKER_CLASS,
        html: slowOverlayHtml,
        iconSize: [20, 20]
      })
    }).addTo(map).bindPopup(`Slow Period ${index + 1}<br>Duration: ${formatDuration(Math.round((period.endTime.getTime() - period.startTime.getTime()) / 1000))}<br>Records: ${period.recordCount}`);
    const markerOverlay = marker as OverlayLayer;
    markerOverlay.options = {
      ...(markerOverlay.options ?? {}),
      isSlowPeriodOverlay: true,
    };

    // Add highlighted route for slow period if multiple points
    if (period.gpsPoints.length > 1) {
      const line = L.polyline(period.gpsPoints, {
        color: '#ffc107',
        weight: 3,
        opacity: 0.9,
      }).addTo(map);
      const lineOverlay = line as OverlayLayer;
      lineOverlay.options = {
        ...(lineOverlay.options ?? {}),
        isSlowPeriodOverlay: true,
      };
    }
  }
}

/**
 * Sets the current slow periods for map overlay functionality
 */
export function setCurrentSlowPeriods(slowPeriods: SlowPeriod[]): void {
  currentSlowPeriods = slowPeriods;
}

/**
 * Creates mini-maps for individual slow periods and recording gaps
 */
export function initializeCombinedMiniMaps(periods: SlowPeriod[], fullRoute: [number, number][]): void {
  const activeMapIds = new Set<string>();

  periods.forEach((period, index) => {
    const mapId = `miniMap${index}`;
    const mapElement = document.getElementById(mapId);

    if (!mapElement) {
      return;
    }

    activeMapIds.add(mapId);
    destroyMiniMap(mapId);

    if (period.isGap) {
      initializeGapMiniMap(period, index, mapElement, mapId, fullRoute);
    } else {
      initializeSlowPeriodMiniMap(period, index, mapElement, mapId, fullRoute);
    }
  });

  // Clean up any mini-maps that are no longer active
  Array.from(miniMapsById.keys()).forEach(mapId => {
    if (!activeMapIds.has(mapId)) {
      destroyMiniMap(mapId);
    }
  });
}

/**
 * Initializes a mini-map for a recording gap
 */
function initializeGapMiniMap(
  period: SlowPeriod,
  index: number,
  mapElement: HTMLElement,
  mapId: string,
  fullRoute: [number, number][]
): void {
  const gap = period.gapData;

  if (!gap) {
    disableFullRouteToggle(mapId);
    showNoGpsMessage(mapElement, 'No GPS data available for this gap');
    return;
  }

  if (!gap.startGpsPoint && !gap.endGpsPoint) {
    disableFullRouteToggle(mapId);
    showNoGpsMessage(mapElement, 'No GPS data available for this gap');
    return;
  }

  const miniMap = createBasicMiniMap(mapId);
  setupFullRouteToggle(mapId, miniMap, fullRoute);
  const availablePoints = collectAvailableGpsPoints(gap);

  if (availablePoints.length === 1) {
    setupSinglePointGapMap(miniMap, gap, index, availablePoints[0]);
  } else {
    setupDualPointGapMap(miniMap, gap, index);
  }
}

/**
 * Initializes a mini-map for a slow period
 */
function initializeSlowPeriodMiniMap(
  period: SlowPeriod,
  index: number,
  mapElement: HTMLElement,
  mapId: string,
  fullRoute: [number, number][]
): void {
  if (period.gpsPoints.length === 0) {
    disableFullRouteToggle(mapId);
    showNoGpsMessage(mapElement, 'No GPS data for this period');
    return;
  }

  const miniMap = createBasicMiniMap(mapId);
  setupFullRouteToggle(mapId, miniMap, fullRoute);

  if (period.gpsPoints.length === 1) {
    setupSinglePointSlowPeriodMap(miniMap, period, index);
  } else {
    setupMultiPointSlowPeriodMap(miniMap, period);
  }
}

/**
 * Creates a basic mini-map with common settings
 */
function createBasicMiniMap(mapId: string): LeafletMap {
  const miniMap = L.map(mapId, {
    zoomControl: true,
    attributionControl: false,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: ''
  }).addTo(miniMap);

  miniMapsById.set(mapId, miniMap);

  return miniMap;
}

function setupFullRouteToggle(mapId: string, miniMap: LeafletMap, fullRoute: [number, number][]): void {
  const toggleInput = document.querySelector(`input[data-mini-map-id="${mapId}"]`) as ToggleInputWithHandler | null;

  if (!toggleInput) {
    return;
  }

  if (!fullRoute || fullRoute.length < 2) {
    disableFullRouteToggle(mapId);
    return;
  }

  if (toggleInput.__fullRouteToggleHandler) {
    toggleInput.removeEventListener('change', toggleInput.__fullRouteToggleHandler);
  }

  toggleInput.disabled = false;
  toggleInput.checked = false;
  removeFullRouteOverlay(mapId);

  const handleChange = () => {
    if (toggleInput.checked) {
      addFullRouteOverlay(mapId, miniMap, fullRoute);
    } else {
      removeFullRouteOverlay(mapId);
    }
  };

  toggleInput.__fullRouteToggleHandler = handleChange;
  toggleInput.addEventListener('change', handleChange);
}

function disableFullRouteToggle(mapId: string): void {
  const toggleInput = document.querySelector(`input[data-mini-map-id="${mapId}"]`) as ToggleInputWithHandler | null;

  if (!toggleInput) {
    return;
  }

  if (toggleInput.__fullRouteToggleHandler) {
    toggleInput.removeEventListener('change', toggleInput.__fullRouteToggleHandler);
    delete toggleInput.__fullRouteToggleHandler;
  }

  toggleInput.checked = false;
  toggleInput.disabled = true;
  removeFullRouteOverlay(mapId);
}

function addFullRouteOverlay(mapId: string, miniMap: LeafletMap, fullRoute: [number, number][]): void {
  removeFullRouteOverlay(mapId);

  const overlay = plotFullRouteOnMiniMap(miniMap, fullRoute);
  if (overlay) {
    fullRouteOverlaysByMapId.set(mapId, overlay);
  }
}

function removeFullRouteOverlay(mapId: string): void {
  const overlay = fullRouteOverlaysByMapId.get(mapId);
  if (!overlay) {
    return;
  }

  overlay.polyline.remove();
  if (overlay.decorator) {
    overlay.decorator.remove();
  }

  fullRouteOverlaysByMapId.delete(mapId);
}

/**
 * Plots the full activity route on a mini-map when GPS data is available
 */
function plotFullRouteOnMiniMap(miniMap: LeafletMap, fullRoute: [number, number][]): FullRouteOverlay | null {
  if (!fullRoute || fullRoute.length < 2) {
    return null;
  }

  const fullRouteLine = L.polyline(fullRoute, {
    color: 'red',
    weight: 3,
    opacity: 0.6,
    interactive: false,
    className: 'full-route-overlay'
  }).addTo(miniMap);

  const decorator = addDirectionalChevrons(miniMap, fullRouteLine);

  return {
    polyline: fullRouteLine,
    decorator
  };
}

/**
 * Shows a "no GPS data" message in the map element
 */
function showNoGpsMessage(mapElement: HTMLElement, message: string): void {
  destroyMiniMap(mapElement.id);
  while (mapElement.firstChild) {
    mapElement.removeChild(mapElement.firstChild);
  }
  const noGpsElement = document.createElement('div');
  noGpsElement.className = NO_GPS_MESSAGE_CLASS;
  noGpsElement.textContent = message;
  mapElement.appendChild(noGpsElement);
}

/**
 * Collects available GPS points from a gap
 */
function collectAvailableGpsPoints(gap: TimestampGap): [number, number][] {
  const availablePoints: [number, number][] = [];
  if (gap.startGpsPoint) availablePoints.push(gap.startGpsPoint);
  if (gap.endGpsPoint) availablePoints.push(gap.endGpsPoint);
  return availablePoints;
}

/**
 * Sets up a gap mini-map with a single GPS point
 */
function setupSinglePointGapMap(
  miniMap: LeafletMap,
  gap: TimestampGap,
  index: number,
  point: [number, number]
): void {
  const isStartPoint = gap.startGpsPoint && !gap.endGpsPoint;
  const markerConfig = isStartPoint
    ? {
        className: GAP_START_MARKER_CLASS,
        html: `<div class="${GAP_START_MARKER_CLASS}">Gap Start</div>`,
        size: [70, 25] as [number, number],
        popup: `Recording Gap ${index + 1} - Recording stopped here`,
      }
    : {
        className: GAP_END_MARKER_CLASS,
        html: `<div class="${GAP_END_MARKER_CLASS}">Gap End</div>`,
        size: [70, 25] as [number, number],
        popup: `Recording Gap ${index + 1} - Recording resumed here`,
      };

  L.marker(point, {
    icon: L.divIcon({
      className: markerConfig.className,
      html: markerConfig.html,
      iconSize: markerConfig.size
    })
  }).addTo(miniMap).bindPopup(markerConfig.popup);

  miniMap.setView(point, 15);
}

/**
 * Sets up a gap mini-map with both start and end GPS points
 */
function setupDualPointGapMap(
  miniMap: LeafletMap,
  gap: TimestampGap,
  index: number
): void {
  if (!gap.startGpsPoint || !gap.endGpsPoint) {
    return;
  }

  // Add start marker
  L.marker(gap.startGpsPoint, {
    icon: L.divIcon({
      className: GAP_START_MARKER_CLASS,
      html: `<div class="${GAP_START_MARKER_CLASS}">Stop</div>`,
      iconSize: [40, 25]
    })
  }).addTo(miniMap).bindPopup(`Recording Gap ${index + 1} - Recording stopped`);

  // Add end marker
  L.marker(gap.endGpsPoint, {
    icon: L.divIcon({
      className: GAP_END_MARKER_CLASS,
      html: `<div class="${GAP_END_MARKER_CLASS}">Resume</div>`,
      iconSize: [50, 25]
    })
  }).addTo(miniMap).bindPopup(`Recording Gap ${index + 1} - Recording resumed`);

  // Add dashed line
  L.polyline([gap.startGpsPoint, gap.endGpsPoint], {
    color: '#dc3545',
    weight: 4,
    opacity: 0.7,
    dashArray: '10, 10'
  }).addTo(miniMap);

  const bounds = L.latLngBounds([gap.startGpsPoint, gap.endGpsPoint]);
  miniMap.fitBounds(bounds, { padding: [20, 20] });
}

/**
 * Sets up a slow period mini-map with a single GPS point
 */
function setupSinglePointSlowPeriodMap(
  miniMap: LeafletMap,
  period: SlowPeriod,
  index: number
): void {
  const point = period.gpsPoints[0];
  L.marker(point)
    .addTo(miniMap)
    .bindPopup(`Slow period ${index + 1}`);

  miniMap.setView(point, 16);
}

/**
 * Sets up a slow period mini-map with multiple GPS points
 */
function setupMultiPointSlowPeriodMap(
  miniMap: LeafletMap,
  period: SlowPeriod
): void {
  const polyline = L.polyline(period.gpsPoints, {
    color: '#ffc107',
    weight: 4,
    opacity: 0.8
  }).addTo(miniMap);

  // Add start marker
  L.marker(period.gpsPoints[0], {
    icon: L.divIcon({
      className: START_MARKER_CLASS,
      html: `<div class="${START_MARKER_CLASS}">S</div>`,
      iconSize: [20, 20]
    })
  }).addTo(miniMap);

  // Add end marker
  L.marker(period.gpsPoints[period.gpsPoints.length - 1], {
    icon: L.divIcon({
      className: END_MARKER_CLASS,
      html: `<div class="${END_MARKER_CLASS}">E</div>`,
      iconSize: [20, 20]
    })
  }).addTo(miniMap);

  miniMap.fitBounds(polyline.getBounds(), { padding: [10, 10] });
}

/**
 * Adds chevron markers along a polyline to show travel direction
 */
function addDirectionalChevrons(miniMap: LeafletMap, polyline: LeafletPolyline): Layer | null {
  if (typeof L.polylineDecorator !== 'function' || !L.Symbol || typeof L.Symbol.arrowHead !== 'function') {
    return null;
  }

  const polylineOptions = polyline.options as PolylineOptions;
  const arrowColor = polylineOptions.color ?? '#3388ff';
  const arrowWeight = polylineOptions.weight ?? 3;
  const arrowOpacity = polylineOptions.opacity ?? 0.9;

  const decorator = L.polylineDecorator(polyline, {
    patterns: [
      {
        offset: 25,
        repeat: 240,
        symbol: L.Symbol.arrowHead({
          pixelSize: Math.max(10, arrowWeight * 3),
          polygon: false,
          pathOptions: {
            color: arrowColor,
            weight: arrowWeight,
            opacity: arrowOpacity
          }
        })
      }
    ]
  });

  decorator.addTo(miniMap);
  return decorator;
}

/**
 * Gets the current activity map instance
 */
export function getActivityMap(): LeafletMap | null {
  return activityMap;
}

function destroyMiniMap(mapId: string): void {
  const existingMap = miniMapsById.get(mapId);
  if (existingMap) {
    existingMap.off();
    existingMap.remove();
    miniMapsById.delete(mapId);
  }

  const mapElement = document.getElementById(mapId);
  if (mapElement && (mapElement as any)._leaflet_id) {
    delete (mapElement as any)._leaflet_id;
  }
  if (mapElement) {
    mapElement.innerHTML = '';
  }
}
