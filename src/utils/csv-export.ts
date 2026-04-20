// =============================================================================
// CSV EXPORT UTILITY
// =============================================================================

import {AnalysisResult} from '../types/analysis';
import {SlowPeriod} from '../types/app-types';
import {formatDuration} from './time-utils';

const CSV_HEADERS = [
  'type',
  'start_time',
  'end_time',
  'duration_seconds',
  'duration',
  'start_distance_km',
  'end_distance_km',
  'start_lat',
  'start_lng',
  'end_lat',
  'end_lng',
  'google_maps_url',
  'street_view_url',
];

function getStartCoords(period: SlowPeriod): [number, number] | null {
  if (period.isGap && period.gapData) {
    return period.gapData.startGpsPoint;
  }
  return period.gpsPoints[0] ?? null;
}

function getEndCoords(period: SlowPeriod): [number, number] | null {
  if (period.isGap && period.gapData) {
    return period.gapData.endGpsPoint;
  }
  const last = period.gpsPoints[period.gpsPoints.length - 1];
  return last ?? null;
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function periodToRow(period: SlowPeriod): string {
  const type = period.isGap ? 'Recording Gap' : 'Faff Period';
  const startTime = period.startTime.toISOString();
  const endTime = period.endTime.toISOString();
  const durationSeconds = Math.round((period.endTime.getTime() - period.startTime.getTime()) / 1000);
  const duration = formatDuration(durationSeconds);
  const startDistanceKm = (period.startDistance / 1000).toFixed(3);
  const endDistanceKm = (period.endDistance / 1000).toFixed(3);

  const startCoords = getStartCoords(period);
  const endCoords = getEndCoords(period);

  const startLat = startCoords ? String(startCoords[0]) : '';
  const startLng = startCoords ? String(startCoords[1]) : '';
  const endLat = endCoords ? String(endCoords[0]) : '';
  const endLng = endCoords ? String(endCoords[1]) : '';

  const googleMapsUrl = startCoords
    ? `https://www.google.com/maps?q=${startCoords[0]},${startCoords[1]}`
    : '';
  const streetViewUrl = startCoords
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${startCoords[0]},${startCoords[1]}`
    : '';

  const values = [
    type,
    startTime,
    endTime,
    String(durationSeconds),
    duration,
    startDistanceKm,
    endDistanceKm,
    startLat,
    startLng,
    endLat,
    endLng,
    googleMapsUrl,
    streetViewUrl,
  ];

  return values.map(escapeCsvValue).join(',');
}

export function generateCsvExport(analysisResult: AnalysisResult): string {
  const rows = [
    CSV_HEADERS.join(','),
    ...analysisResult.slowPeriods.map(periodToRow),
  ];
  return rows.join('\n');
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
