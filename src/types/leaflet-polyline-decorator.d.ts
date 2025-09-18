// TypeScript declarations for leaflet-polylinedecorator
// Provides minimal typings so we can safely call the plugin from our codebase

import 'leaflet';

declare module 'leaflet' {
  namespace Symbol {
    interface ArrowHeadOptions {
      pixelSize?: number;
      headAngle?: number;
      polygon?: boolean;
      pathOptions?: PathOptions;
    }

    function arrowHead(options?: ArrowHeadOptions): Symbol;
  }

  interface PolylineDecoratorPattern {
    offset?: number | string;
    endOffset?: number | string;
    repeat?: number | string;
    symbol: Symbol;
  }

  interface PolylineDecoratorOptions {
    patterns: PolylineDecoratorPattern[];
  }

  interface PolylineDecorator extends Layer {}

  function polylineDecorator(
    leafletObject:
      | Polyline
      | Polygon
      | MultiPolyline
      | MultiPolygon
      | LatLngExpression[]
      | LatLngExpression[][],
    options: PolylineDecoratorOptions
  ): PolylineDecorator;
}

declare namespace L {
  type Symbol = any;
}
