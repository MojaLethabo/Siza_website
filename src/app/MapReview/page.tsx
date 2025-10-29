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
  Legend,
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
        <p className="mt-2 text-muted">Loading heatmap visualization...</p>
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
  Completed: "#28a745",
  Escalated: "#ffc107",
  "False report": "#dc3545",
  "On-Going": "#17a2b8",
  Abandoned: "#6c757d",
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

    const labels = hourlyCounts.map((item) =>
      DateTime.fromObject({ hour: item.hour }).toFormat("h a")
    );
    const dataPoints = hourlyCounts.map((item) => item.count);
    const suburbCounts = hourlyCounts.map((item) =>
      Array.from(item.suburbs).join(", ")
    );

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
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            borderColor: "rgba(102, 126, 234, 1)",
            borderWidth: 3,
            pointBackgroundColor: "rgba(102, 126, 234, 1)",
            pointBorderColor: "#fff",
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.4,
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
                size: 14,
              },
              color: "#495057",
            },
            ticks: {
              precision: 0,
              color: "#6c757d",
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Hour of Day",
              font: {
                weight: "bold",
                size: 14,
              },
              color: "#495057",
            },
            ticks: {
              color: "#6c757d",
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              font: {
                size: 12,
                weight: "bold",
              },
              color: "#495057",
            },
          },
          tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            titleColor: "#495057",
            bodyColor: "#495057",
            borderColor: "rgba(102, 126, 234, 0.3)",
            borderWidth: 1,
            boxPadding: 10,
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

  const getResponseTimeStatus = (minutes: number) => {
    if (minutes <= 5) return "Excellent";
    if (minutes <= 10) return "Good";
    if (minutes <= 15) return "Average";
    return "Needs Improvement";
  };

  const getResponseTimeColor = (minutes: number) => {
    if (minutes <= 5) return "text-success";
    if (minutes <= 10) return "text-warning";
    return "text-danger";
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
          {uniqueSuburbCount} Areas
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
        style={{ minWidth: "200px" }}
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
    <>
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
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-radius: 12px;
        }
        
        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
          border-radius: 12px 12px 0 0 !important;
        }

        .metric-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #e9ecef;
          height: 100%;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .metric-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          opacity: 0.8;
        }

        .metric-value {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          line-height: 1;
        }

        .metric-label {
          font-size: 0.9rem;
          color: #6c757d;
          font-weight: 500;
          margin-bottom: 0;
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
          background: white;
          border-radius: 8px;
          padding: 1rem;
        }

        .affected-areas-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .area-item {
          border-left: 4px solid transparent;
          transition: all 0.2s ease;
          padding: 1rem;
          border-bottom: 1px solid #e9ecef;
        }

        .area-item:last-child {
          border-bottom: none;
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
          height: 6px;
          border-radius: 3px;
        }

        .controls-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #e9ecef;
        }

        .form-select {
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 0.75rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .form-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .chart-status {
          font-style: italic;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .response-time-status {
          font-size: 0.9rem;
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .suburb-selector {
          min-width: 250px;
        }

        .heatmap-container {
          border-radius: 12px;
          overflow: hidden;
          background: white;
        }

        .section-title {
          color: #1e293b;
          font-weight: 600;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .risk-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-weight: 600;
        }
      `}</style>

      <div className="container-fluid py-4">
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
                  Real-time incident monitoring and geographic analysis
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
            {/* Key Metrics Row */}
            <div className="col-12">
              <div className="row g-4">
                <div className="col-md-3">
                  <div className="metric-card text-center">
                    <i className="fas fa-file-alt metric-icon text-primary"></i>
                    <div className="metric-value text-primary">
                      {totalReports.toLocaleString()}
                    </div>
                    <p className="metric-label">Total Reports</p>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="metric-card text-center">
                    <i className="fas fa-map-marker-alt metric-icon text-success"></i>
                    <div className="metric-value text-success">
                      {uniqueSuburbCount}
                    </div>
                    <p className="metric-label">Affected Areas</p>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="metric-card text-center">
                    <i className="fas fa-chart-line metric-icon text-warning"></i>
                    <div className="metric-value text-warning">
                      {uniqueSuburbCount ? (totalReports / uniqueSuburbCount).toFixed(1) : "0"}
                    </div>
                    <p className="metric-label">Avg per Area</p>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="metric-card text-center">
                    <i className="fas fa-clock metric-icon text-danger"></i>
                    {loadingResponseTime ? (
                      <div className="spinner-border spinner-border-sm text-danger mb-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : averageResponseTime ? (
                      <>
                        <div className={`metric-value ${getResponseTimeColor(averageResponseTime.averageResponseTimeMinutes)}`}>
                          {averageResponseTime.averageResponseTimeMinutes.toFixed(1)}min
                        </div>
                        <div className={`response-time-status ${getResponseTimeColor(averageResponseTime.averageResponseTimeMinutes)}`}>
                          {getResponseTimeStatus(averageResponseTime.averageResponseTimeMinutes)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="metric-value text-muted">N/A</div>
                        <div className="response-time-status text-muted">No data</div>
                      </>
                    )}
                    <p className="metric-label">Avg Response Time</p>
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
                <div className="card-body p-0">
                  <div className="heatmap-container">
                    <HeatmapComponent data={heatData} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Lists Row */}
            <div className="col-12">
              <div className="row g-4">
                {/* Status Breakdown Chart */}
                {statusData.length > 0 && (
                  <div className="col-lg-8">
                    <div className="card">
                      <div className="card-header text-white py-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h4 className="mb-0">
                            <i className="fas fa-chart-bar me-2"></i>
                            Report Status Distribution by Area
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
                              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis
                                dataKey="suburb"
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={60}
                                tick={{ fontSize: 12 }}
                                tickMargin={10}
                              />
                              <YAxis allowDecimals={false} />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  border: '1px solid #e9ecef',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                              />
                              
                              <Bar
                                dataKey="Completed"
                                stackId="a"
                                fill={statusColors["Completed"]}
                                name="Completed"
                              />
                              <Bar
                                dataKey="On-Going"
                                stackId="a"
                                fill={statusColors["On-Going"]}
                                name="On-Going"
                              />
                              <Bar
                                dataKey="Escalated"
                                stackId="a"
                                fill={statusColors["Escalated"]}
                                name="Escalated"
                              />
                              <Bar
                                dataKey="False report"
                                stackId="a"
                                fill={statusColors["False report"]}
                                name="False Report"
                              />
                              <Bar
                                dataKey="Abandoned"
                                stackId="a"
                                fill={statusColors["Abandoned"]}
                                name="Abandoned"
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
                          {suburbCounts.slice(0, 10).map((item, index) => {
                            let riskClass = "low-risk";
                            let riskColor = "success";
                            let riskIcon = "fas fa-check-circle";

                            if (item.percentage >= 10) {
                              riskClass = "high-risk";
                              riskColor = "danger";
                              riskIcon = "fas fa-exclamation-triangle";
                            } else if (item.percentage >= 5) {
                              riskClass = "medium-risk";
                              riskColor = "warning";
                              riskIcon = "fas fa-exclamation-circle";
                            }

                            return (
                              <div
                                key={item.suburb}
                                className={`area-item ${riskClass}`}
                              >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="d-flex align-items-center">
                                    <span className="badge bg-secondary me-2">
                                      #{index + 1}
                                    </span>
                                    <h6 className="mb-0 fw-semibold text-dark">
                                      {item.suburb}
                                    </h6>
                                  </div>
                                  <span className={`badge bg-${riskColor} risk-badge`}>
                                    <i className={`${riskIcon} me-1`}></i>
                                    {item.percentage.toFixed(1)}%
                                  </span>
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
                                    className={`progress-bar bg-${riskColor}`}
                                    role="progressbar"
                                    style={{
                                      width: `${Math.min(item.percentage * 3, 100)}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="card-footer bg-light text-center py-2">
                        <small className="text-muted">
                          Showing top 10 of {suburbCounts.length} affected areas
                        </small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hourly Crime Incidents Chart */}
            {selectedType === "Crime" && (
              <div className="col-12">
                <div className="card">
                  <div className="card-header text-white py-3">
                    <h4 className="mb-0">
                      <i className="fas fa-chart-line me-2"></i>
                      Hourly Crime Incidents Pattern
                    </h4>
                  </div>
                  <div className="card-body">
                    <div className="controls-container">
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <label htmlFor="suburbSelect" className="form-label fw-semibold">
                            <i className="fas fa-filter me-2"></i>
                            Filter by Suburb:
                          </label>
                          <select
                            id="suburbSelect"
                            value={selectedSuburb}
                            onChange={(e) => setSelectedSuburb(e.target.value)}
                            className="form-select suburb-selector"
                            disabled={loading || fireIncidents.length === 0}
                          >
                            {suburbOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <div className="chart-status text-end">
                            {loading ? (
                              <>
                                <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                Loading data...
                              </>
                            ) : (
                              chartStatus
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="chart-container mt-3">
                      <canvas id="incidentChart"></canvas>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          !loading && (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-chart-bar fs-1 text-muted opacity-50 mb-3"></i>
                <h4 className="text-muted mb-2">No Data Available</h4>
                <p className="text-muted mb-0">
                  No reports found for {selectedType}. Try selecting a different emergency type.
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}