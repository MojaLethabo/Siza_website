"use client";

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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
    )
  }
);

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

type StatusKey = keyof Omit<StatusDataItem, 'suburb'>;

const reportTypes = [
  "Crime",
  "Fire",
  "Natural Disaster",
  "SOS",
  "Suspicious Activity",
] as const;

const statusColors = {
  "Completed": "#10b981",
  "Escalated": "#f59e0b",
  "False report": "#ef4444",
  "On-Going": "#3b82f6",
  "Abandoned": "#9caa1dff",
} as const;

function isStatusKey(key: string): key is StatusKey {
  return ['Completed', 'Escalated', 'False report', 'On-Going', 'Abandoned'].includes(key);
}

export default function CrimeHeatmapPage() {
  const [heatData, setHeatData] = useState<HeatPoint[]>([]);
  const [statusData, setStatusData] = useState<StatusDataItem[]>([]);
  const [suburbCounts, setSuburbCounts] = useState<SuburbCount[]>([]);
  const [selectedType, setSelectedType] = useState<string>("Crime");
  const [totalReports, setTotalReports] = useState(0);
  const [uniqueSuburbCount, setUniqueSuburbCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
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

          const suburbCountsArray: SuburbCount[] = statusDataArray.map((item) => {
            const totalCount =
              item.Completed +
              item.Escalated +
              item["False report"] +
              item["On-Going"] +
              item.Abandoned;
              
            return {
              suburb: item.suburb,
              count: totalCount,
              percentage: totalReports > 0 ? (totalCount / totalReports) * 100 : 0
            };
          }).sort((a, b) => b.count - a.count);

          setSuburbCounts(suburbCountsArray);
        } else {
          setStatusData([]);
          setSuburbCounts([]);
        }
      } catch (error) {
        console.error("Error loading reports:", error);
        setHeatData([]);
        setStatusData([]);
        setSuburbCounts([]);
        setTotalReports(0);
        setUniqueSuburbCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [selectedType]);

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

  const renderStats = () => {
    const avgPerArea = uniqueSuburbCount ? (totalReports / uniqueSuburbCount).toFixed(1) : "0";
    
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
        <div className="stat-badge">
          <i className="fas fa-chart-line me-1"></i>
          {avgPerArea} Avg/Area
        </div>
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
        style={{ minWidth: '180px' }}
      >
        {reportTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );

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
                <p className="mb-0 opacity-75">Real-time incident monitoring and analysis</p>
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
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="card metric-card">
                    <div className="card-body text-center">
                      <i className="fas fa-file-alt fs-2 text-primary mb-2"></i>
                      <h4 className="text-primary mb-1">{totalReports.toLocaleString()}</h4>
                      <p className="text-muted mb-0">Total Reports</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card metric-card">
                    <div className="card-body text-center">
                      <i className="fas fa-map-marker-alt fs-2 text-success mb-2"></i>
                      <h4 className="text-success mb-1">{heatData.length}</h4>
                      <p className="text-muted mb-0">Heat Points</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card metric-card">
                    <div className="card-body text-center">
                      <i className="fas fa-chart-line fs-2 text-warning mb-2"></i>
                      <h4 className="text-warning mb-1">
                        {uniqueSuburbCount ? (totalReports / uniqueSuburbCount).toFixed(1) : "0"}
                      </h4>
                      <p className="text-muted mb-0">Average per Area</p>
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
                        let riskClass = 'low-risk';
                        let riskIcon = 'fas fa-check-circle text-success';
                        
                        if (item.percentage >= 10) {
                          riskClass = 'high-risk';
                          riskIcon = 'fas fa-exclamation-triangle text-danger';
                        } else if (item.percentage >= 5) {
                          riskClass = 'medium-risk';
                          riskIcon = 'fas fa-exclamation-circle text-warning';
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
                                      item.percentage >= 10 ? 'bg-danger' :
                                      item.percentage >= 5 ? 'bg-warning' : 'bg-success'
                                    }`}
                                    role="progressbar" 
                                    style={{ width: `${Math.min(item.percentage * 2, 100)}%` }}
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
          </div>
        ) : (
          !loading && (
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="fas fa-chart-bar fs-1 text-muted opacity-50"></i>
                  <h4 className="mt-3 text-muted">No Data Available</h4>
                  <p className="text-muted">No reports found for the selected type: {selectedType}</p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}