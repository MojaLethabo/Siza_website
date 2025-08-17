import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import "leaflet/dist/leaflet.css";

// Define TypeScript interface for mapped incident
interface Incident {
  id: number;
  lat: number;
  lng: number;
  description: string;
  status: string;
}

interface MapComponentProps {
  incidents: Incident[];
  router: AppRouterInstance;
}

// Custom pin icons
const redPinIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  tooltipAnchor: [16, -28],
});

const greenPinIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  tooltipAnchor: [16, -28],
});

export default function MapComponent({ incidents, router }: MapComponentProps) {
  return (
    <MapContainer
      center={[-26.14, 28.0125]}
      zoom={14}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &amp; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {incidents
        .filter(
          (incident) =>
            typeof incident.lat === "number" &&
            typeof incident.lng === "number" &&
            !isNaN(incident.lat) &&
            !isNaN(incident.lng)
        )
        .map(({ id, lat, lng, description, status }) => (
          <Marker
            key={id}
            position={[lat, lng]}
            icon={status === "Completed" ? greenPinIcon : redPinIcon}
          >
            <Tooltip direction="top" offset={[0, -30]} opacity={1} permanent>
              Incident #{id}
            </Tooltip>
            <Popup>
              <strong className="block mb-1 text-red-600">Emergency:</strong>
              <p className="mb-2">{description}</p>
              <button
                onClick={() => {
                  router.push(`/Report?id=${id}`);
                }}
                className="text-red-600 hover:text-red-800 underline font-semibold"
              >
                View Report
              </button>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
