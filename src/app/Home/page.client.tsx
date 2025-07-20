"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Define TypeScript interface for a report
interface Report {
  ReportID: number;
  EmerDescription: string;
  EmergencyType: string;
  Report_Location: string;
  Report_Status: string;
  ReporterID: number;
}

// Define TypeScript interface for mapped incident
interface Incident {
  id: number;
  lat: number;
  lng: number;
  description: string;
  status: string;
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

export default function HomePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Reload logic to prevent flicker - runs only on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasReloaded = sessionStorage.getItem("reloaded");
      if (!hasReloaded) {
        sessionStorage.setItem("reloaded", "true");
        location.replace(location.href); // smoother than reload()
      } else {
        setIsMounted(true);
      }
    }
  }, []);

  // Fetch reports after component is mounted post-reload
  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("http://localhost:3000/getReports");
        const data: { success: boolean; Reports: Report[] } = await res.json();
        console.log("API response:", data.Reports[0]);

        if (data.success && Array.isArray(data.Reports)) {
          const mappedIncidents = data.Reports.map((report: Report) => {
            const [latStr, lngStr] = report.Report_Location.split(";");
            return {
              id: report.ReportID,
              lat: parseFloat(latStr),
              lng: parseFloat(lngStr),
              description: `${report.EmergencyType}: ${report.EmerDescription}`,
              status: report.Report_Status,
            };
          });
          setIncidents(mappedIncidents);
        } else {
          setIncidents([]);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setIncidents([]);
      }
    }

    if (isMounted) {
      fetchReports();
    }
  }, [isMounted]);

  // Prevent rendering until reload logic completes
  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-green-50 via-blue-50 to-white p-6 font-sans text-gray-800">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-4 md:mb-0">
          Siza Community Watch Dashboard - Westdene
        </h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition">
            Manage Reports
          </button>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition">
            Add Notice
          </button>
        </div>
      </header>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {[
          {
            title: "Community Members",
            count: "1,294",
            icon: "fas fa-users",
            color: "text-blue-600",
          },
          {
            title: "Active members",
            count: "150",
            icon: "fas fa-user-check",
            color: "text-green-600",
          },
          {
            title: "Reports",
            count: "900",
            icon: "fas fa-luggage-cart",
            color: "text-yellow-600",
          },
          {
            title: "Solved Cases",
            count: "806",
            icon: "far fa-check-circle",
            color: "text-purple-600",
          },
        ].map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4 hover:shadow-lg transition cursor-default"
          >
            <div
              className={`text-4xl ${card.color} w-14 h-14 flex justify-center items-center rounded-full bg-gray-100`}
            >
              <i className={card.icon}></i>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">{card.title}</p>
              <h4 className="text-2xl font-bold text-gray-900">{card.count}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Incident Map */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">
          Community Watch Incident Map
        </h2>

        {/* Legend */}
        <div className="flex gap-6 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-500 rounded-full border border-white shadow-sm"></div>
            <span>Incident</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full border border-white shadow-sm"></div>
            <span>Resolved</span>
          </div>
        </div>

        <div style={{ height: "450px", borderRadius: "12px", overflow: "hidden" }}>
          <MapContainer
            center={[-26.140, 28.0125]}
            zoom={14}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &amp; <a href="https://openstreetmap.org">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {incidents.map(({ id, lat, lng, description, status }) => (
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
        </div>
      </section>
    </div>
  );
}
