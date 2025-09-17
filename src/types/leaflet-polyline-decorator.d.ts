// TypeScript declarations for leaflet-polylinedecorator
// Provides minimal typings so we can safely call the plugin from our codebase

declare namespace L {
  // Minimal symbol support from leaflet-polylinedecorator
  type Symbol = any;

  interface PolylineDecoratorPattern {
    offset?: number | string;
    endOffset?: number | string;
    repeat?: number | string;
    symbol: L.Symbol;
  }

  interface PolylineDecoratorOptions {
    patterns: PolylineDecoratorPattern[];
  }

  interface PolylineDecorator extends L.Layer {}

  function polylineDecorator(
    leafletObject:
      | L.Polyline
      | L.Polygon
      | L.MultiPolyline
      | L.MultiPolygon
      | L.LatLngExpression[]
      | L.LatLngExpression[][],
    options: PolylineDecoratorOptions
  ): PolylineDecorator;

  namespace Symbol {
    interface ArrowHeadOptions {
      pixelSize?: number;
      headAngle?: number;
      polygon?: boolean;
      pathOptions?: L.PathOptions;
    }

    function arrowHead(options?: ArrowHeadOptions): L.Symbol;
  }
}
