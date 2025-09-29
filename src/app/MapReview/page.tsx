"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DateTime } from "luxon";
import Chart from "chart.js/auto";
import "chartjs-adapter-luxon";

// Dynamic import with SSR disabled
const HeatmapComponent = dynamic(
  () => import("@/components/HeatmapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="text-center py-8">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading heatmap...</span>
        </div>
        <p className="mt-2">Loading heatmap visualization...</p>
      </div>
    ),
  }
);

// Type definitions
interface ReportWithSuburb {
  ReportID: number;
  Report_Location: string;
  suburb: string;
}

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface SuburbApiResponse {
  success: boolean;
  reports: ReportWithSuburb[];
  uniqueSuburbs: string[];
  totalReports: number;
  uniqueSuburbCount: number;
}

interface SuburbCount {
  suburb: string;
  count: number;
  percentage: number;
}

interface StatusDataItem {
  suburb: string;
  Completed: number;
  Escalated: number;
  "False report": number;
  "On-Going": number;
  Abandoned: number;
}

interface StatusRow {
  suburbName?: string;
  Report_Status?: string;
  report_count: number;
}

type StatusKey = keyof Omit<StatusDataItem, "suburb">;

interface FireIncident {
  suburbName: string;
  dateReported: string;
  hour: number;
  timestamp: Date;
}

// Add interface for average response time
interface AverageResponseTime {
  averageResponseTimeMinutes: number;
  totalReports: number;
  respondedReports: number;
}

interface AverageResponseTimeApiResponse {
  success: boolean;
  emergencyType: string;
  data: AverageResponseTime;
}

const reportTypes = [
  "Crime",
  "Fire",
  "Natural Disaster",
  "SOS",
  "Suspicious Activity",
] as const;

interface FireIncidentApiResponse {
  suburbName: string;
  dateReported: string;
}

const statusColors = {
  Completed: "#10b981",
  Escalated: "#f59e0b",
  "False report": "#ef4444",
  "On-Going": "#3b82f6",
  Abandoned: "#9caa1dff",
} as const;

function isStatusKey(key: string): key is StatusKey {
  return [
    "Completed",
    "Escalated",
    "False report",
    "On-Going",
    "Abandoned",
  ].includes(key);
}

export default function CrimeHeatmapPage() {
  const [heatData, setHeatData] = useState<HeatPoint[]>([]);
  const [statusData, setStatusData] = useState<StatusDataItem[]>([]);
  const [suburbCounts, setSuburbCounts] = useState<SuburbCount[]>([]);
  const [selectedType, setSelectedType] = useState<string>("Crime");
  const [totalReports, setTotalReports] = useState(0);
  const [uniqueSuburbCount, setUniqueSuburbCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fireIncidents, setFireIncidents] = useState<FireIncident[]>([]);
  const [chartInstance, setChartInstance] = useState<Chart | null>(null);
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [chartStatus, setChartStatus] = useState<string>("Loading data...");
  // Add state for average response time
  const [averageResponseTime, setAverageResponseTime] = useState<AverageResponseTime | null>(null);
  const [loadingResponseTime, setLoadingResponseTime] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setLoadingResponseTime(true);
      try {
        // Fetch main report data
        const res = await fetch(
          `https://myappapi-yo3p.onrender.com/getSuburbsByType?type=${encodeURIComponent(
            selectedType
          )}`
        );
        const data: SuburbApiResponse = await res.json();

        if (data.success && Array.isArray(data.reports)) {
          const pointMap: Record<string, number> = {};
          const points: HeatPoint[] = [];

          data.reports.forEach((report) => {
            const [latStr, lngStr] = report.Report_Location.split(";");
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            if (!isNaN(lat) && !isNaN(lng)) {
              const key = `${lat},${lng}`;
              pointMap[key] = (pointMap[key] || 0) + 1;
            }
          });

          Object.entries(pointMap).forEach(([key, count]) => {
            const [lat, lng] = key.split(",").map(Number);
            points.push({ lat, lng, intensity: count });
          });

          setHeatData(points);
          setTotalReports(data.totalReports);
          setUniqueSuburbCount(data.uniqueSuburbCount);
        } else {
          setHeatData([]);
          setTotalReports(0);
          setUniqueSuburbCount(0);
        }

        // Fetch status data
        const statusRes = await fetch(
          `https://myappapi-yo3p.onrender.com/getcountbyemergency?type=${encodeURIComponent(
            selectedType
          )}`
        );
        const statusJson = await statusRes.json();

        if (statusJson.success && Array.isArray(statusJson.data)) {
          const pivot: Record<string, StatusDataItem> = {};
          statusJson.data.forEach((row: StatusRow) => {
            const suburb = row.suburbName || "Unknown";
            const status = row.Report_Status || "Unknown";

            if (!pivot[suburb]) {
              pivot[suburb] = {
                suburb,
                Completed: 0,
                Escalated: 0,
                "False report": 0,
                "On-Going": 0,
                Abandoned: 0,
              };
            }

            if (isStatusKey(status)) {
              pivot[suburb][status] += row.report_count;
            }
          });

          const statusDataArray = Object.values(pivot);
          setStatusData(statusDataArray);

          const suburbCountsArray: SuburbCount[] = statusDataArray
            .map((item) => {
              const totalCount =
                item.Completed +
                item.Escalated +
                item["False report"] +
                item["On-Going"] +
                item.Abandoned;

              return {
                suburb: item.suburb,
                count: totalCount,
                percentage:
                  totalReports > 0 ? (totalCount / totalReports) * 100 : 0,
              };
            })
            .sort((a, b) => b.count - a.count);

          setSuburbCounts(suburbCountsArray);
        } else {
          setStatusData([]);
          setSuburbCounts([]);
        }

        // Fetch average response time
        const responseTimeRes = await fetch(
          `https://myappapi-yo3p.onrender.com/getAverageResponseTimeByEmergencyType?emergencyType=${encodeURIComponent(
            selectedType
          )}`
        );
        const responseTimeData: AverageResponseTimeApiResponse = await responseTimeRes.json();

        if (responseTimeData.success) {
          setAverageResponseTime(responseTimeData.data);
        } else {
          setAverageResponseTime(null);
        }

        // Fetch fire incidents data if Crime is selected
        if (selectedType === "Crime") {
          const fireRes = await fetch(
            "https://myappapi-yo3p.onrender.com/getDatesByEmergencyType?emergencyType=Crime"
          );
          const fireData = await fireRes.json();

          if (fireData.success && Array.isArray(fireData.data)) {
            const incidents = fireData.data.map(
              (incident: FireIncidentApiResponse) => ({
                ...incident,
                timestamp: new Date(incident.dateReported),
                hour: new Date(incident.dateReported).getHours(),
              })
            );
            setFireIncidents(incidents);
            setChartStatus(`Loaded ${incidents.length} incidents`);
          } else {
            setFireIncidents([]);
            setChartStatus("No Crime incidents available");
          }
        }
      } catch (error) {
        console.error("Error loading reports:", error);
        setHeatData([]);
        setStatusData([]);
        setSuburbCounts([]);
        setTotalReports(0);
        setUniqueSuburbCount(0);
        setFireIncidents([]);
        setAverageResponseTime(null);
        setChartStatus("Error loading data");
      } finally {
        setLoading(false);
        setLoadingResponseTime(false);
      }
    }

    fetchReports();
  }, [selectedType]);

  useEffect(() => {
    if (selectedType === "Crime" && fireIncidents.length > 0) {
      updateChart();
    }

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
        setChartInstance(null);
      }
    };
  }, [selectedSuburb, fireIncidents]);

  const updateChart = () => {
    const ctx = document.getElementById("incidentChart") as HTMLCanvasElement;
    if (!ctx) return;

    // Filter incidents if suburb is selected
    const filteredIncidents = selectedSuburb
      ? fireIncidents.filter((item) => item.suburbName === selectedSuburb)
      : fireIncidents;

    if (filteredIncidents.length === 0) {
      if (chartInstance) {
        chartInstance.destroy();
        setChartInstance(null);
      }
      setChartStatus(
        selectedSuburb
          ? `No incidents found in ${selectedSuburb}`
          : "No incidents available"
      );
      return;
    }

    // Group incidents by hour
    const hourlyCounts = Array(24)
      .fill(0)
      .map((_, i) => ({
        hour: i,
        count: 0,
        suburbs: new Set<string>(),
      }));

    filteredIncidents.forEach((incident) => {
      hourlyCounts[incident.hour].count++;
      hourlyCounts[incident.hour].suburbs.add(incident.suburbName);
    });

    // Prepare chart data
    const labels = hourlyCounts.map((item) =>
      DateTime.fromObject({ hour: item.hour }).toFormat("h a")
    );
    const dataPoints = hourlyCounts.map((item) => item.count);
    const suburbCounts = hourlyCounts.map((item) =>
      Array.from(item.suburbs).join(", ")
    );

    // Create or update chart
    if (chartInstance) {
      chartInstance.destroy();
    }

    const newChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: selectedSuburb || "All Suburbs",
            data: dataPoints,
            backgroundColor: "rgba(220, 53, 69, 0.2)",
            borderColor: "rgba(220, 53, 69, 1)",
            borderWidth: 3,
            pointBackgroundColor: "rgba(220, 53, 69, 1)",
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Incidents",
              font: {
                weight: "bold",
              },
            },
            ticks: {
              precision: 0,
            },
          },
          x: {
            title: {
              display: true,
              text: "Hour of Day",
              font: {
                weight: "bold",
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                if (!selectedSuburb) {
                  const hourIndex = context.dataIndex;
                  const suburbs = suburbCounts[hourIndex];
                  return `Suburbs: ${suburbs}`;
                }
                return "";
              },
            },
          },
        },
        elements: {
          line: {
            borderJoinStyle: "round",
          },
        },
      },
    });

    setChartInstance(newChartInstance);
    setChartStatus(
      selectedSuburb
        ? `Showing ${filteredIncidents.length} incidents in ${selectedSuburb} by hour`
        : `Showing all ${filteredIncidents.length} incidents by hour`
    );
  };

  const getReportIcon = (type: string) => {
    const icons: Record<string, string> = {
      Crime: "fas fa-shield-alt",
      Fire: "fas fa-fire",
      "Natural Disaster": "fas fa-tornado",
      SOS: "fas fa-exclamation-triangle",
      "Suspicious Activity": "fas fa-eye",
    };
    return icons[type] || "fas fa-chart-bar";
  };

  const getResponseTimeColor = (minutes: number) => {
    if (minutes <= 5) return "text-success";
    if (minutes <= 10) return "text-warning";
    return "text-danger";
  };

  const getResponseTimeStatus = (minutes: number) => {
    if (minutes <= 5) return "Excellent";
    if (minutes <= 10) return "Good";
    if (minutes <= 15) return "Average";
    return "Needs Improvement";
  };

  const renderStats = () => {
    return (
      <div className="d-flex gap-2">
        <div className="stat-badge">
          <i className="fas fa-file-alt me-1"></i>
          {totalReports.toLocaleString()} Reports
        </div>
        <div className="stat-badge">
          <i className="fas fa-map-marker-alt me-1"></i>
          {heatData.length} Heat Points
        </div>
        {averageResponseTime && (
          <div className="stat-badge">
            <i className="fas fa-clock me-1"></i>
            {averageResponseTime.averageResponseTimeMinutes.toFixed(1)}min Avg
          </div>
        )}
      </div>
    );
  };

  const renderTypeSelector = () => (
    <div className="dropdown">
      <select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        className="form-select"
        disabled={loading}
        style={{ minWidth: "180px" }}
      >
        {reportTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );

  const suburbOptions = [
    { value: "", label: "All Suburbs" },
    ...Array.from(new Set(fireIncidents.map((item) => item.suburbName)))
      .sort((a, b) => a.localeCompare(b))
      .map((suburb) => ({ value: suburb, label: suburb })),
  ];

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <style jsx>{`
        .stat-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
        }

        .card {
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
        }

        .status-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: white;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .chart-container {
          height: 400px;
        }

        .affected-areas-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .area-item {
          border-left: 4px solid transparent;
          transition: all 0.2s ease;
        }

        .area-item:hover {
          background-color: #f8f9fa;
          border-left-color: #667eea;
        }

        .area-item.high-risk {
          border-left-color: #dc3545;
        }

        .area-item.medium-risk {
          border-left-color: #ffc107;
        }

        .area-item.low-risk {
          border-left-color: #28a745;
        }

        .progress-thin {
          height: 4px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          height: 100%;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .response-time-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          height: 100%;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .response-time-value {
          font-size: 2.2rem;
          font-weight: bold;
          margin-bottom: 0.3rem;
          line-height: 1;
        }

        .response-time-status {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
        }

        .response-time-stats {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
          margin-top: 8px;
          font-size: 0.85rem;
        }

        .metric-icon {
          font-size: 2.2rem;
          margin-bottom: 0.5rem;
        }

        .metric-value {
          font-size: 2.2rem;
          font-weight: bold;
          margin-bottom: 0.3rem;
          line-height: 1;
        }

        .metric-label {
          font-size: 0.9rem;
          color: #6c757d;
          margin-bottom: 0;
        }

        .form-select {
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #495057;
        }

        .form-select:focus {
          background-color: white;
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
        }

        .dashboard {
          background-color: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f1f1f1;
          border-radius: 8px;
        }

        .controls label {
          font-weight: 600;
          color: #495057;
        }

        .controls select {
          padding: 10px 15px;
          font-size: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          min-width: 250px;
          background-color: white;
        }

        .status {
          margin-left: auto;
          font-style: italic;
          color: #6c757d;
        }

        .loading {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #dc3545;
          animation: spin 1s ease-in-out infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Ensure all metric cards have the same height */
        .metrics-row .col-md-3 {
          display: flex;
        }

        .metrics-row .card {
          flex: 1;
        }
      `}</style>

      {/* Main Header Card */}
      <div className="card mb-4">
        <div className="card-header text-white py-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="mb-1">
                <i className={`${getReportIcon(selectedType)} me-2`}></i>
                {selectedType} Analytics Dashboard
              </h3>
              <p className="mb-0 opacity-75">
                Real-time incident monitoring and analysis
              </p>
            </div>

            <div className="d-flex gap-3 align-items-center">
              {renderStats()}
              {renderTypeSelector()}
            </div>
          </div>
        </div>
      </div>

      {!loading && heatData.length > 0 ? (
        <div className="row g-4">
          {/* Quick Metrics Row */}
          <div className="col-12">
            <div className="row g-3 metrics-row">
              <div className="col-md-3">
                <div className="card metric-card">
                  <div className="card-body text-center d-flex flex-column justify-content-center">
                    <i className="fas fa-file-alt metric-icon text-primary"></i>
                    <div className="metric-value text-primary">
                      {totalReports.toLocaleString()}
                    </div>
                    <p className="metric-label">Total Reports</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card metric-card">
                  <div className="card-body text-center d-flex flex-column justify-content-center">
                    <i className="fas fa-map-marker-alt metric-icon text-success"></i>
                    <div className="metric-value text-success">
                      {heatData.length}
                    </div>
                    <p className="metric-label">Heat Points</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card metric-card">
                  <div className="card-body text-center d-flex flex-column justify-content-center">
                    <i className="fas fa-chart-line metric-icon text-warning"></i>
                    <div className="metric-value text-warning">
                      {uniqueSuburbCount
                        ? (totalReports / uniqueSuburbCount).toFixed(1)
                        : "0"}
                    </div>
                    <p className="metric-label">Average per Area</p>
                  </div>
                </div>
              </div>
              {/* Average Response Time Card */}
              <div className="col-md-3">
                <div className="card response-time-card text-white">
                  <div className="card-body text-center d-flex flex-column justify-content-center text-white">
                    <i className="fas fa-clock metric-icon opacity-75"></i>
                    {loadingResponseTime ? (
                      <div className="spinner-border spinner-border-sm mb-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : averageResponseTime ? (
                      <>
                        <div className={`response-time-value ${getResponseTimeColor(averageResponseTime.averageResponseTimeMinutes)}`}>
                          {averageResponseTime.averageResponseTimeMinutes.toFixed(1)}min
                        </div>
                        <div className="response-time-status">
                          {getResponseTimeStatus(averageResponseTime.averageResponseTimeMinutes)}
                        </div>
                        <div className="response-time-stats">
                          <small>
                            {averageResponseTime.respondedReports} of {averageResponseTime.totalReports} responded
                          </small>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="response-time-value opacity-75">N/A</div>
                        <div className="response-time-status opacity-75">No data</div>
                      </>
                    )}
                    <p className="metric-label opacity-75 mt-2 text-White">Avg Response Time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap Section */}
          <div className="col-12">
            <div className="card">
              <div className="card-header text-white py-3">
                <h4 className="mb-0">
                  <i className="fas fa-map me-2"></i>
                  Geographic Distribution Heatmap
                </h4>
              </div>
              <div className="card-body">
                <HeatmapComponent data={heatData} />
              </div>
            </div>
          </div>

          {/* Status Breakdown Chart */}
          {statusData.length > 0 && (
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header text-white py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">
                      <i className="fas fa-chart-bar me-2"></i>
                      Report Status Distribution
                    </h4>
                    <div className="status-legend">
                      {Object.entries(statusColors).map(([status, color]) => (
                        <div key={status} className="legend-item">
                          <div
                            className="legend-dot"
                            style={{ backgroundColor: color }}
                          ></div>
                          <span>{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={statusData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="suburb"
                          angle={-45}
                          textAnchor="end"
                          interval={0}
                          height={60}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="Completed"
                          stackId="a"
                          fill={statusColors["Completed"]}
                        />
                        <Bar
                          dataKey="Escalated"
                          stackId="a"
                          fill={statusColors["Escalated"]}
                        />
                        <Bar
                          dataKey="False report"
                          stackId="a"
                          fill={statusColors["False report"]}
                        />
                        <Bar
                          dataKey="On-Going"
                          stackId="a"
                          fill={statusColors["On-Going"]}
                        />
                        <Bar
                          dataKey="Abandoned"
                          stackId="a"
                          fill={statusColors["Abandoned"]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Affected Areas List */}
          {suburbCounts.length > 0 && (
            <div className="col-lg-4">
              <div className="card">
                <div className="card-header text-white py-3">
                  <h4 className="mb-0">
                    <i className="fas fa-map-marked-alt me-2"></i>
                    Most Affected Areas
                  </h4>
                </div>
                <div className="card-body p-0">
                  <div className="affected-areas-list">
                    {suburbCounts.map((item, index) => {
                      let riskClass = "low-risk";
                      let riskIcon = "fas fa-check-circle text-success";

                      if (item.percentage >= 10) {
                        riskClass = "high-risk";
                        riskIcon = "fas fa-exclamation-triangle text-danger";
                      } else if (item.percentage >= 5) {
                        riskClass = "medium-risk";
                        riskIcon = "fas fa-exclamation-circle text-warning";
                      }

                      return (
                        <div
                          key={item.suburb}
                          className={`area-item p-3 border-bottom ${riskClass}`}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-2">
                                <span className="badge bg-secondary me-2">
                                  #{index + 1}
                                </span>
                                <h6 className="mb-0 fw-semibold">
                                  {item.suburb}
                                </h6>
                                <i className={`${riskIcon} ms-2`}></i>
                              </div>

                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted small">
                                  {item.count} reports
                                </span>
                                <span className="fw-bold text-primary">
                                  {item.percentage.toFixed(1)}%
                                </span>
                              </div>

                              <div className="progress progress-thin">
                                <div
                                  className={`progress-bar ${
                                    item.percentage >= 10
                                      ? "bg-danger"
                                      : item.percentage >= 5
                                      ? "bg-warning"
                                      : "bg-success"
                                  }`}
                                  role="progressbar"
                                  style={{
                                    width: `${Math.min(
                                      item.percentage * 2,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="card-footer bg-light text-center py-2">
                  <small className="text-muted">
                    Showing {suburbCounts.length} affected areas
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Hourly Fire Incidents */}
          {selectedType === "Crime" && (
            <div className="col-12">
              <div className="card mt-4">
                <div className="card-header text-white py-3">
                  <h4 className="mb-0">
                    <i className="fas fa-clock me-2"></i>
                    Hourly Crime Incidents
                  </h4>
                </div>
                <div className="card-body">
                  <div className="dashboard">
                    <div className="controls">
                      <label htmlFor="suburbSelect">Suburb:</label>
                      <select
                        id="suburbSelect"
                        value={selectedSuburb}
                        onChange={(e) => setSelectedSuburb(e.target.value)}
                        className="form-select"
                        disabled={loading || fireIncidents.length === 0}
                      >
                        {suburbOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="status">
                        {loading ? (
                          <>
                            <span className="loading"></span> Loading data...
                          </>
                        ) : (
                          chartStatus
                        )}
                      </div>
                    </div>

                    <div id="chartContainer" style={{ height: "500px" }}>
                      <canvas id="incidentChart"></canvas>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        !loading && (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-chart-bar fs-1 text-muted opacity-50"></i>
                <h4 className="mt-3 text-muted">No Data Available</h4>
                <p className="text-muted">
                  No reports found for the selected type: {selectedType}
                </p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}