import { describe, expect, it } from 'vitest';
import { DEFAULT_GAP_THRESHOLD_MS, GAP_THRESHOLD_OPTIONS, SPEED_THRESHOLD, SPEED_THRESHOLD_TEXT } from './constants';

describe('GAP_THRESHOLD_OPTIONS', () => {
  it('pairs each label with its real duration', () => {
    expect(GAP_THRESHOLD_OPTIONS).toEqual([
      { value: 60000, label: '1 minute' },
      { value: 120000, label: '2 minutes' },
      { value: 180000, label: '3 minutes' },
      { value: 300000, label: '5 minutes' },
      { value: 600000, label: '10 minutes' },
    ]);
  });

  it('includes the default gap threshold', () => {
    expect(GAP_THRESHOLD_OPTIONS.map(option => option.value)).toContain(DEFAULT_GAP_THRESHOLD_MS);
  });
});

describe('SPEED_THRESHOLD_TEXT', () => {
  it('shows the real speed threshold', () => {
    expect(SPEED_THRESHOLD).toBe(0.75);
    expect(SPEED_THRESHOLD_TEXT).toBe('speed < 0.75 m/s');
  });
});
