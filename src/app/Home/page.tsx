"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Dynamically import the MapContainer with no SSR
const DynamicMap = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      Loading map...
    </div>
  ),
});

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

export default function HomePage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [reportCount, setReportCount] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const pathname = usePathname(); // Use this hook instead
  const isHomePage = pathname === "/Home";

  // Simple client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch reports after component is mounted
  useEffect(() => {
    if (!isClient || !isHomePage) return;

    async function fetchReports() {
      try {
        const res = await fetch(
          "https://myappapi-yo3p.onrender.com/getReportsadmin"
        );
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
    async function fetchCommunityMemberCount() {
      try {
        const res = await fetch(
          "https://myappapi-yo3p.onrender.com/api/community/count"
        );
        const data = await res.json();
        if (data.success) {
          setMemberCount(data.count);
        } else {
          setMemberCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch community member count:", error);
        setMemberCount(0);
      }
    }
    async function fetchReportCount() {
      try {
        const res = await fetch(
          "https://myappapi-yo3p.onrender.com/reports/count"
        );
        const data = await res.json();
        if (data.success) {
          setReportCount(data.count);
        } else {
          setReportCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch report count:", error);
        setReportCount(0);
      }
    }
    async function fetchCompletedCount() {
      try {
        const res = await fetch(
          "https://myappapi-yo3p.onrender.com/reports/count/completed"
        );
        const data = await res.json();
        if (data.success) {
          setCompletedCount(data.count);
        } else {
          setCompletedCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch completed report count:", error);
        setCompletedCount(0);
      }
    }

    // Execute all fetches in parallel
    Promise.allSettled([
      fetchReports(),
      fetchCommunityMemberCount(),
      fetchReportCount(),
      fetchCompletedCount(),
    ]);
  }, [isClient, isHomePage]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-green-50 via-blue-50 to-white p-6 font-sans text-gray-800">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-4 md:mb-0">
          Siza Community Watch Dashboard 
          
        </h1>
        {/*<div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition">
            Manage Reports
          </button>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition">
            Add Notice
          </button>
        </div>*/}
      </header>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {[
          {
            title: "Community Members",
            count:
              memberCount !== null
                ? memberCount.toLocaleString()
                : "Loading...",
            icon: "fas fa-users",
            color: "text-blue-600",
          },
          {
            title: "Active members",
            count: "254",
            icon: "fas fa-user-check",
            color: "text-green-600",
          },
          {
            title: "Reports",
            count:
              reportCount !== null
                ? reportCount.toLocaleString()
                : "Loading...",
            icon: "fas fa-luggage-cart",
            color: "text-yellow-600",
          },
          {
            title: "Completed Report",
            count:
              completedCount !== null
                ? completedCount.toLocaleString()
                : "Loading...",
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
              <p className="text-sm font-semibold text-gray-500">
                {card.title}
              </p>
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

        <div
          style={{ height: "450px", borderRadius: "12px", overflow: "hidden" }}
        >
          {isClient && <DynamicMap incidents={incidents} router={router} />}
        </div>
      </section>
    </div>
  );
}
