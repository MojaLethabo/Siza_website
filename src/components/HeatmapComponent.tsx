"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet.heat";

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface Props {
  data: HeatPoint[];
}

function HeatLayerWrapper({ data }: Props) {
  const map = useMap();

  useEffect(() => {
    const heatLayer = L.heatLayer(
      data.map((p) => [p.lat, p.lng, p.intensity]),
      {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.1: "#ffffb2", // pale yellow
          0.3: "#fecc5c", // orange-yellow
          0.5: "#fd8d3c", // orange
          0.7: "#f03b20", // red-orange
          1.0: "#bd0026", // dark red
        },
      }
    );

    heatLayer.addTo(map);
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [data, map]);

  return null;
}

export default function HeatmapComponent({ data }: Props) {
  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden shadow-lg bg-white">
      <MapContainer
        center={[-26.180980, 27.989677]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> & <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        />
        <HeatLayerWrapper data={data} />
      </MapContainer>
    </div>
  );
}
