// src/types/leaflet-heat.d.ts
import * as L from "leaflet";

declare module "leaflet" {
  export function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      radius?: number;
      blur?: number;
      max?: number;
      gradient?: Record<string, string>;
    }
  ): L.Layer;
}
