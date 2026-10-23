import { describe, expect, it } from 'vitest';
import { mapLinks } from './map-links';

describe('mapLinks', () => {
  it('builds Google Maps and Street View URLs for a point', () => {
    expect(mapLinks([51.5074, -0.1278])).toEqual({
      googleMaps: 'https://www.google.com/maps?q=51.5074,-0.1278',
      streetView: 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=51.5074,-0.1278',
    });
  });

  it('returns null when there is no point', () => {
    expect(mapLinks(null)).toBeNull();
    expect(mapLinks(undefined)).toBeNull();
  });
});
