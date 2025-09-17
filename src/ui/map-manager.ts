// =============================================================================
// MAP MANAGER - LEAFLET MAPPING FUNCTIONALITY
// =============================================================================

import { FitData, SlowPeriod, TimestampGap } from '../types/app-types';
import { convertGpsCoordinates } from '../utils/gps-utils';
import { formatDuration } from '../core/time-utils';
import { createElementFromTemplate } from './dom-manager';

// Global State
let activityMap: L.Map | null = null;
let currentSlowPeriods: SlowPeriod[] | null = null;

/**
 * Initializes the main activity map with GPS route and markers
 */
export function initializeMap(fitData: FitData): void {
  const mapContainerElement = document.getElementById('mapContainer') as HTMLElement | null;
  const records = fitData.recordMesgs || [];
  const gpsPoints = convertGpsCoordinates(records);

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
    activityMap.eachLayer(layer => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        activityMap.removeLayer(layer);
      }
    });
  }

  // Add activity route as polyline
  const polyline = L.polyline(gpsPoints, { color: 'red', weight: 3 }).addTo(activityMap);

  // Add start marker
  if (gpsPoints.length > 0) {
    L.marker(gpsPoints[0])
      .addTo(activityMap)
      .bindPopup('Start');
  }

  // Add end marker if different from start
  if (gpsPoints.length > 1) {
    const endPoint = gpsPoints[gpsPoints.length - 1];
    L.marker(endPoint)
      .addTo(activityMap)
      .bindPopup('End');
  }

  // Fit map to show entire route
  activityMap.fitBounds(polyline.getBounds(), { padding: [10, 10] });

  // Add slow periods and gaps overlay if enabled
  updateMapOverlays();
}

/**
 * Updates map overlays to show/hide slow periods and recording gaps
 */
export function updateMapOverlays(): void {
  const showPeriodsOnMapCheckbox = document.getElementById('showPeriodsOnMap') as HTMLInputElement | null;

  if (!activityMap || !currentSlowPeriods) {
    return;
  }

  // Remove existing overlay markers and lines
  activityMap.eachLayer(layer => {
    if (layer.options && (layer.options.isSlowPeriodOverlay || layer.options.isGapOverlay)) {
      activityMap.removeLayer(layer);
    }
  });

  // Only add overlays if checkbox is checked
  if (!showPeriodsOnMapCheckbox.checked) {
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
  const gap = period.gapData;

  if (gap.startGpsPoint) {
    L.marker(gap.startGpsPoint, {
      icon: L.divIcon({
        className: 'gap-overlay-marker',
        html: '<div class="gap-overlay-marker">⏸️</div>',
        iconSize: [20, 20]
      }),
      isGapOverlay: true
    }).addTo(activityMap).bindPopup(`Recording Gap ${index + 1}<br>Duration: ${formatDuration(Math.round((period.endTime - period.startTime) / 1000))}`);
  }

  if (gap.endGpsPoint && gap.startGpsPoint) {
    // Add dashed line for gap if both points exist
    L.polyline([gap.startGpsPoint, gap.endGpsPoint], {
      color: '#dc3545',
      weight: 3,
      opacity: 0.8,
      dashArray: '15, 10',
      isGapOverlay: true
    }).addTo(activityMap);
  }
}

/**
 * Adds slow period overlay markers and lines to the map
 */
function addSlowPeriodOverlayToMap(period: SlowPeriod, index: number): void {
  if (period.gpsPoints.length > 0) {
    const centerPoint = period.gpsPoints[Math.floor(period.gpsPoints.length / 2)];

    L.marker(centerPoint, {
      icon: L.divIcon({
        className: 'slow-overlay-marker',
        html: '<div class="slow-overlay-marker">🐌</div>',
        iconSize: [20, 20]
      }),
      isSlowPeriodOverlay: true
    }).addTo(activityMap).bindPopup(`Slow Period ${index + 1}<br>Duration: ${formatDuration(Math.round((period.endTime - period.startTime) / 1000))}<br>Records: ${period.recordCount}`);

    // Add highlighted route for slow period if multiple points
    if (period.gpsPoints.length > 1) {
      L.polyline(period.gpsPoints, {
        color: '#ffc107',
        weight: 3,
        opacity: 0.9,
        isSlowPeriodOverlay: true
      }).addTo(activityMap);
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
  periods.forEach((period, index) => {
    const mapId = `miniMap${index}`;
    const mapElement = document.getElementById(mapId);

    if (!mapElement) {
      return;
    }

    if (period.isGap) {
      initializeGapMiniMap(period, index, mapElement, mapId, fullRoute);
    } else {
      initializeSlowPeriodMiniMap(period, index, mapElement, mapId, fullRoute);
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

  if (!gap.startGpsPoint && !gap.endGpsPoint) {
    showNoGpsMessage(mapElement, 'No GPS data available for this gap');
    return;
  }

  const miniMap = createBasicMiniMap(mapId);
  plotFullRouteOnMiniMap(miniMap, fullRoute);
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
    showNoGpsMessage(mapElement, 'No GPS data for this period');
    return;
  }

  const miniMap = createBasicMiniMap(mapId);
  plotFullRouteOnMiniMap(miniMap, fullRoute);

  if (period.gpsPoints.length === 1) {
    setupSinglePointSlowPeriodMap(miniMap, period, index);
  } else {
    setupMultiPointSlowPeriodMap(miniMap, period, index);
  }
}

/**
 * Creates a basic mini-map with common settings
 */
function createBasicMiniMap(mapId: string): L.Map {
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

  return miniMap;
}

/**
 * Plots the full activity route on a mini-map when GPS data is available
 */
function plotFullRouteOnMiniMap(miniMap: L.Map, fullRoute: [number, number][]): void {
  if (!fullRoute || fullRoute.length < 2) {
    return;
  }

  const fullRouteLine = L.polyline(fullRoute, {
    color: 'red',
    weight: 3,
    opacity: 0.6,
    interactive: false,
    className: 'full-route-overlay'
  }).addTo(miniMap);

  addDirectionalChevrons(miniMap, fullRouteLine);
}

/**
 * Shows a "no GPS data" message in the map element
 */
function showNoGpsMessage(mapElement: HTMLElement, message: string): void {
  while (mapElement.firstChild) {
    mapElement.removeChild(mapElement.firstChild);
  }
  const noGpsElement = createElementFromTemplate('no-gps-message-template', {
    message: message
  });
  mapElement.appendChild(noGpsElement);
}

/**
 * Collects available GPS points from a gap
 */
function collectAvailableGpsPoints(gap: TimestampGap): [number, number][] {
  const availablePoints = [];
  if (gap.startGpsPoint) availablePoints.push(gap.startGpsPoint);
  if (gap.endGpsPoint) availablePoints.push(gap.endGpsPoint);
  return availablePoints;
}

/**
 * Sets up a gap mini-map with a single GPS point
 */
function setupSinglePointGapMap(
  miniMap: L.Map,
  gap: TimestampGap,
  index: number,
  point: [number, number]
): void {
  const isStartPoint = gap.startGpsPoint && !gap.endGpsPoint;
  const markerConfig = isStartPoint
    ? { className: 'gap-start-marker', html: '<div class="gap-start-marker">Gap Start</div>', size: [70, 25], popup: `Recording Gap ${index + 1} - Recording stopped here` }
    : { className: 'gap-end-marker', html: '<div class="gap-end-marker">Gap End</div>', size: [70, 25], popup: `Recording Gap ${index + 1} - Recording resumed here` };

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
  miniMap: L.Map,
  gap: TimestampGap,
  index: number
): void {
  if (!gap.startGpsPoint || !gap.endGpsPoint) {
    return;
  }

  // Add start marker
  L.marker(gap.startGpsPoint, {
    icon: L.divIcon({
      className: 'gap-start-marker',
      html: '<div class="gap-start-marker">Stop</div>',
      iconSize: [40, 25]
    })
  }).addTo(miniMap).bindPopup(`Recording Gap ${index + 1} - Recording stopped`);

  // Add end marker
  L.marker(gap.endGpsPoint, {
    icon: L.divIcon({
      className: 'gap-end-marker',
      html: '<div class="gap-end-marker">Resume</div>',
      iconSize: [50, 25]
    })
  }).addTo(miniMap).bindPopup(`Recording Gap ${index + 1} - Recording resumed`);

  // Add dashed line
  const gapLine = L.polyline([gap.startGpsPoint, gap.endGpsPoint], {
    color: '#dc3545',
    weight: 4,
    opacity: 0.7,
    dashArray: '10, 10'
  }).addTo(miniMap);

  addDirectionalChevrons(miniMap, gapLine);

  const bounds = L.latLngBounds([gap.startGpsPoint, gap.endGpsPoint]);
  miniMap.fitBounds(bounds, { padding: [20, 20] });
}

/**
 * Sets up a slow period mini-map with a single GPS point
 */
function setupSinglePointSlowPeriodMap(
  miniMap: L.Map,
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
  miniMap: L.Map,
  period: SlowPeriod,
  index: number
): void {
  const polyline = L.polyline(period.gpsPoints, {
    color: '#ffc107',
    weight: 4,
    opacity: 0.8
  }).addTo(miniMap);

  addDirectionalChevrons(miniMap, polyline);

  // Add start marker
  L.marker(period.gpsPoints[0], {
    icon: L.divIcon({
      className: 'start-marker',
      html: '<div class="start-marker">S</div>',
      iconSize: [20, 20]
    })
  }).addTo(miniMap);

  // Add end marker
  L.marker(period.gpsPoints[period.gpsPoints.length - 1], {
    icon: L.divIcon({
      className: 'end-marker',
      html: '<div class="end-marker">E</div>',
      iconSize: [20, 20]
    })
  }).addTo(miniMap);

  miniMap.fitBounds(polyline.getBounds(), { padding: [10, 10] });
}

/**
 * Adds chevron markers along a polyline to show travel direction
 */
function addDirectionalChevrons(miniMap: L.Map, polyline: L.Polyline): void {
  if (typeof L.polylineDecorator !== 'function' || !L.Symbol || typeof L.Symbol.arrowHead !== 'function') {
    return;
  }

  const polylineOptions = polyline.options as L.PolylineOptions;
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
}

/**
 * Gets the current activity map instance
 */
export function getActivityMap(): L.Map | null {
  return activityMap;
}
