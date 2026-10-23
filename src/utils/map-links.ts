// =============================================================================
// GOOGLE MAPS LINK BUILDERS
// =============================================================================

export interface MapLinks {
  googleMaps: string;
  streetView: string;
}

/**
 * Builds Google Maps and Street View URLs for a [lat, lng] point
 */
export function mapLinks(point: [number, number] | null | undefined): MapLinks | null {
  if (!point) return null;
  const [lat, lng] = point;
  return {
    googleMaps: `https://www.google.com/maps?q=${lat},${lng}`,
    streetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`,
  };
}
