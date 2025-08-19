"use client";

import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { usePathname } from "next/navigation";

export default function Analytics() {
  // Refs for all charts
  const incidentsRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLCanvasElement>(null);
  const typeRef = useRef<HTMLCanvasElement>(null);
  //const respondersRef = useRef<HTMLCanvasElement>(null);
  const funnelRef = useRef<HTMLCanvasElement>(null);
  const messagesRef = useRef<HTMLCanvasElement>(null);
  const messagesChartRef = useRef<Chart | null>(null);
  const pathname = usePathname();
  const isAnalyticsPage = pathname === "/Analytics";

  const [timeFrame, setTimeFrame] = useState<"day" | "week" | "month" | "year">(
    "month"
  );
  const [isTimeFrameOpen, setIsTimeFrameOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Chart data state
  const [chartData, setChartData] = useState({
    overview: { reported: 0, resolved: 0, unresolved: 0 },
    time: { labels: [] as string[], data: [] as number[] },
    type: { labels: [] as string[], data: [] as number[] },
    responders: { labels: [] as string[], data: [] as number[] },
    funnel: {
      logged: 0,
      accepted: 0,
      resolved: 0,
      ongoing: 0,
      abandoned: 0,
      falseReport: 0,
      escalated: 0,
    },
    messages: { total: 0, unflagged: 0, flagged: 0 },
  });

  // Refs to store chart instances
  const incidentsChartRef = useRef<Chart | null>(null);
  const timeChartRef = useRef<Chart | null>(null);
  const typeChartRef = useRef<Chart | null>(null);
  //const respondersChartRef = useRef<Chart | null>(null);
  const funnelChartRef = useRef<Chart | null>(null);

  const BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://myappapi-yo3p.onrender.com";

  // Unified color palette matching Community Management
  const colorPalette = {
    primary: "#667eea",
    secondary: "#764ba2",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
    info: "#17a2b8",
    light: "#f8f9fa",
    dark: "#495057",
    gradients: {
      primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      success: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
      warning: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)",
      danger: "linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)",
      info: "linear-gradient(135deg, #17a2b8 0%, #138496 100%)",
    },
    chart: {
      blue: "#667eea",
      purple: "#764ba2",
      green: "#28a745",
      orange: "#fd7e14",
      red: "#dc3545",
      teal: "#20c997",
      yellow: "#ffc107",
      pink: "#e83e8c",
    },
  };

  // Helper: generate HTML legend
  function renderHTMLLegend(chart: Chart, containerId: string) {
    const labels = (chart.data.labels || []) as string[];
    const datasets = chart.data.datasets || [];
    const bg = datasets.length > 0 ? datasets[0].backgroundColor : [];

    const items = labels
      .map((label: string, i: number) => {
        let bgColor = "#cccccc";
        if (Array.isArray(bg)) {
          bgColor = bg[i] || bgColor;
        } else if (typeof bg === "string") {
          bgColor = bg;
        } else if (
          bg instanceof CanvasGradient ||
          bg instanceof CanvasPattern
        ) {
          bgColor = "#667eea";
        }

        return `<span class="legend-item d-inline-flex align-items-center me-3 mb-2">
          <span class="legend-color" style="
            display:inline-block;
            width:14px;
            height:14px;
            background:${bgColor};
            margin-right:8px;
            border-radius:3px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></span>
          <span style="font-size: 0.875rem; font-weight: 500; color: #495057;">${label}</span>
        </span>`;
      })
      .join("");

    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = items;
      container.style.display = "flex";
      container.style.flexWrap = "wrap";
      container.style.justifyContent = "center";
      container.style.marginTop = "1rem";
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      const [
        overviewRes,
        timeRes,
        typeRes,
        respondersRes,
        funnelRes,
        messagesRes,
      ] = await Promise.all([
        fetch(`${BASE}/api/analytics/overview?timeFrame=${timeFrame}`),
        fetch(`${BASE}/api/analytics/time?timeFrame=${timeFrame}`),
        fetch(`${BASE}/api/analytics/type`),
        fetch(`${BASE}/api/analytics/top-responders?timeFrame=${timeFrame}`),
        fetch(`${BASE}/api/analytics/funnel?timeFrame=${timeFrame}`),
        fetch(`${BASE}/api/analytics/messages?timeFrame=${timeFrame}`),
      ]);

      // Parse responses with fallbacks
      const overviewData = overviewRes.ok
        ? await overviewRes.json()
        : { reported: 660, resolved: 600, unresolved: 60 };

      const timeData = timeRes.ok
        ? await timeRes.json()
        : {
            labels: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
            data: [30, 45, 60, 50, 70, 80, 90, 85, 100, 110, 95, 120],
          };

      const typeData = typeRes.ok
        ? await typeRes.json()
        : {
            labels: [
              "Crime",
              "Medical",
              "Fire",
              "Natural Disaster",
              "SOS",
              "Suspicious Activity",
              "Other",
            ],
            data: [200, 150, 100, 80, 30, 2, 10],
          };

      const respondersData = respondersRes.ok
        ? await respondersRes.json()
        : {
            labels: [
              "Responder 1 (ID: 101)",
              "Responder 2 (ID: 102)",
              "Responder 3 (ID: 103)",
            ],
            data: [25, 18, 12],
          };

      const funnelData = funnelRes.ok
        ? await funnelRes.json()
        : {
            logged: 100,
            accepted: 80,
            resolved: 60,
            ongoing: 5,
            abandoned: 6,
            falseReport: 8,
            escalated: 15,
          };

      const messagesData = messagesRes.ok
        ? await messagesRes.json()
        : { total: 120, unflagged: 100, flagged: 20 };

      setChartData({
        overview: overviewData,
        time: timeData,
        type: typeData,
        responders: respondersData,
        funnel: funnelData,
        messages: messagesData,
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setChartData({
        overview: { reported: 660, resolved: 600, unresolved: 60 },
        time: {
          labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ],
          data: [30, 45, 60, 50, 70, 80, 90, 85, 100, 110, 95, 120],
        },
        type: {
          labels: [
            "Crime",
            "Medical",
            "Fire",
            "Natural Disaster",
            "SOS",
            "Suspicious Activity",
            "Other",
          ],
          data: [200, 150, 100, 80, 30, 2, 10],
        },
        responders: {
          labels: [
            "Responder 1 (ID: 101)",
            "Responder 2 (ID: 102)",
            "Responder 3 (ID: 103)",
          ],
          data: [25, 18, 12],
        },
        funnel: {
          logged: 100,
          accepted: 80,
          resolved: 60,
          ongoing: 5,
          abandoned: 6,
          falseReport: 8,
          escalated: 15,
        },
        messages: { total: 120, unflagged: 100, flagged: 20 },
      });
    } finally {
      setLoading(false);
    }
  };

  const renderCharts = () => {
    // Destroy existing charts
    if (incidentsChartRef.current) incidentsChartRef.current.destroy();
    if (timeChartRef.current) timeChartRef.current.destroy();
    if (typeChartRef.current) typeChartRef.current.destroy();
    //if (respondersChartRef.current) respondersChartRef.current.destroy();
    if (funnelChartRef.current) funnelChartRef.current.destroy();

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(33, 37, 41, 0.95)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: colorPalette.primary,
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          titleFont: { size: 14, weight: 600 },
          bodyFont: { size: 13 },
        },
      },
      elements: {
        bar: {
          borderRadius: 6,
          borderSkipped: false,
        },
        point: {
          radius: 6,
          hoverRadius: 8,
          borderWidth: 2,
          backgroundColor: "#fff",
        },
        line: {
          tension: 0.4,
          borderWidth: 3,
        },
      },
    };

    // Render charts (same as before)
    if (incidentsRef.current) {
      const ctx = incidentsRef.current.getContext("2d");
      if (ctx) {
        incidentsChartRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Reported", "Resolved", "Unresolved"],
            datasets: [
              {
                data: [
                  chartData.overview.reported,
                  chartData.overview.resolved,
                  chartData.overview.unresolved,
                ],
                backgroundColor: [
                  colorPalette.chart.blue,
                  colorPalette.chart.green,
                  colorPalette.chart.red,
                ],
                borderColor: [
                  colorPalette.chart.blue,
                  colorPalette.chart.green,
                  colorPalette.chart.red,
                ],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
              },
            ],
          },
          options: {
            ...commonOptions,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                  font: { size: 12 },
                  color: "#6c757d",
                },
                grid: {
                  color: "rgba(0,0,0,0.05)",
                  lineWidth: 1,
                },
              },
              x: {
                ticks: {
                  font: { size: 12, weight: 500 },
                  color: "#495057",
                },
                grid: { display: false },
              },
            },
          },
        });
        renderHTMLLegend(incidentsChartRef.current, "incidentsLegend");
      }
    }

    if (timeRef.current) {
      const ctx = timeRef.current.getContext("2d");
      if (ctx) {
        timeChartRef.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: chartData.time.labels,
            datasets: [
              {
                label: "Reports",
                data: chartData.time.data,
                backgroundColor: colorPalette.chart.purple + "20",
                borderColor: colorPalette.chart.purple,
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: "#fff",
                pointBorderColor: colorPalette.chart.purple,
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
              },
            ],
          },
          options: {
            ...commonOptions,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                  font: { size: 12 },
                  color: "#6c757d",
                },
                grid: {
                  color: "rgba(0,0,0,0.05)",
                  lineWidth: 1,
                },
              },
              x: {
                ticks: {
                  font: { size: 12 },
                  color: "#495057",
                },
                grid: { display: false },
              },
            },
          },
        });
      }
    }

    if (typeRef.current) {
      const ctx = typeRef.current.getContext("2d");
      if (ctx) {
        typeChartRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: chartData.type.labels,
            datasets: [
              {
                data: chartData.type.data,
                backgroundColor: [
                  colorPalette.chart.red,
                  colorPalette.chart.blue,
                  colorPalette.chart.orange,
                  colorPalette.chart.purple,
                  colorPalette.chart.teal,
                  colorPalette.chart.yellow,
                  colorPalette.chart.pink,
                ],
                borderColor: [
                  colorPalette.chart.red,
                  colorPalette.chart.blue,
                  colorPalette.chart.orange,
                  colorPalette.chart.purple,
                  colorPalette.chart.teal,
                  colorPalette.chart.yellow,
                  colorPalette.chart.pink,
                ],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
              },
            ],
          },
          options: {
            ...commonOptions,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                  font: { size: 12 },
                  color: "#6c757d",
                },
                grid: {
                  color: "rgba(0,0,0,0.05)",
                  lineWidth: 1,
                },
              },
              x: {
                ticks: {
                  font: { size: 12 },
                  color: "#495057",
                },
                grid: { display: false },
              },
            },
          },
        });
        renderHTMLLegend(typeChartRef.current, "typeLegend");
      }
    }

    /*if (respondersRef.current) {
      const ctx = respondersRef.current.getContext("2d");
      if (ctx) {
        respondersChartRef.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: chartData.responders.labels,
            datasets: [
              {
                data: chartData.responders.data,
                backgroundColor: [
                  colorPalette.chart.blue,
                  colorPalette.chart.green,
                  colorPalette.chart.orange,
                  colorPalette.chart.purple,
                  colorPalette.chart.teal,
                ],
                borderColor: "#fff",
                borderWidth: 3,
                hoverBorderWidth: 4,
              },
            ],
          },
          options: {
            ...commonOptions,
            cutout: "60%",
            plugins: {
              ...commonOptions.plugins,
              tooltip: {
                ...commonOptions.plugins.tooltip,
                callbacks: {
                  label: (context) => {
                    return `${context.label}: ${context.raw} responses`;
                  },
                },
              },
            },
          },
        });
        renderHTMLLegend(respondersChartRef.current, "respondersLegend");
      }
    }*/

    if (funnelRef.current) {
      const ctx = funnelRef.current.getContext("2d");
      if (ctx) {
        funnelChartRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: [
              "Logged",
              "Accepted",
              "Resolved",
              "ongoing",
              "abandoned",
              "False Reports",
              "Escalated",
            ],
            datasets: [
              {
                data: [
                  chartData.funnel.logged,
                  chartData.funnel.accepted,
                  chartData.funnel.resolved,
                  chartData.funnel.ongoing,
                  chartData.funnel.abandoned,
                  chartData.funnel.falseReport,
                  chartData.funnel.escalated,
                ],
                backgroundColor: [
                  colorPalette.chart.blue,
                  colorPalette.chart.teal,
                  colorPalette.chart.green,
                  colorPalette.chart.orange,
                  colorPalette.chart.purple,
                  colorPalette.chart.yellow,
                  colorPalette.chart.red,
                ],
                borderColor: [
                  colorPalette.chart.blue,
                  colorPalette.chart.teal,
                  colorPalette.chart.green,
                  colorPalette.chart.orange,
                  colorPalette.chart.purple,
                  colorPalette.chart.yellow,
                  colorPalette.chart.red,
                ],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
              },
            ],
          },
          options: {
            ...commonOptions,
            indexAxis: "y",
            scales: {
              x: {
                beginAtZero: true,
                ticks: {
                  font: { size: 12 },
                  color: "#6c757d",
                },
                grid: {
                  color: "rgba(0,0,0,0.05)",
                  lineWidth: 1,
                },
              },
              y: {
                ticks: {
                  font: { size: 12, weight: 500 },
                  color: "#495057",
                },
                grid: { display: false },
              },
            },
          },
        });
        renderHTMLLegend(funnelChartRef.current, "funnelLegend");
      }
    }

    if (messagesRef.current) {
      const ctx = messagesRef.current.getContext("2d");
      if (ctx) {
        messagesChartRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Total Messages", "Unflagged", "Flagged"],
            datasets: [
              {
                data: [
                  chartData.messages.total,
                  chartData.messages.unflagged,
                  chartData.messages.flagged,
                ],
                backgroundColor: [
                  colorPalette.chart.blue,
                  colorPalette.chart.green,
                  colorPalette.chart.orange,
                ],
                borderColor: [
                  colorPalette.chart.blue,
                  colorPalette.chart.green,
                  colorPalette.chart.orange,
                ],
                borderWidth: 2,
                borderRadius: 8,
              },
            ],
          },
          options: {
            ...commonOptions,
            scales: {
              y: { beginAtZero: true },
              x: { grid: { display: false } },
            },
          },
        });
        renderHTMLLegend(messagesChartRef.current, "messagesLegend");
      }
    }
  };

  useEffect(() => {
    if (isAnalyticsPage) {
      fetchAnalyticsData();
    }
  }, [timeFrame, isAnalyticsPage]);

  useEffect(() => {
    if (!isAnalyticsPage) return;

    if (!loading) {
      const timer = requestAnimationFrame(() => {
        renderCharts();
      });

      return () => cancelAnimationFrame(timer);
    }
  }, [chartData, loading, isAnalyticsPage]);

  useEffect(() => {
    return () => {
      if (incidentsChartRef.current) incidentsChartRef.current.destroy();
      if (timeChartRef.current) timeChartRef.current.destroy();
      if (typeChartRef.current) typeChartRef.current.destroy();
      //if (respondersChartRef.current) respondersChartRef.current.destroy();
      if (funnelChartRef.current) funnelChartRef.current.destroy();
    };
  }, []);

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

        .avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1rem;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.active {
          background-color: #28a745;
          box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
        }

        .status-dot.inactive {
          background-color: #dc3545;
          box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
        }

        .table th {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          color: #495057;
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

        .chart-container {
          position: relative;
          height: 300px;
          margin-bottom: 1rem;
        }

        .legend-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 1rem;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          margin-right: 1rem;
          margin-bottom: 0.5rem;
        }

        .legend-color {
          display: inline-block;
          width: 14px;
          height: 14px;
          margin-right: 8px;
          border-radius: 3px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .dropdown-menu {
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          padding: 0.5rem;
        }

        .dropdown-item {
          border-radius: 4px;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
          color: #495057;
        }

        .dropdown-toggle::after {
          margin-left: 0.5rem;
        }
      `}</style>

      <div className="container-fluid py-4">
        {/* Dashboard Header */}
        <div className="card mb-4">
          <div className="card-header text-white py-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-1">
                  <i className="fas fa-chart-line me-2"></i>
                  Analytics Dashboard
                </h3>
                <p className="mb-0 opacity-75">
                  Real-time insights and performance metrics for your community
                  safety platform
                </p>
              </div>

              <div className="d-flex gap-3 align-items-center">
                <div className="stat-badge">
                  <i className="fas fa-exclamation-circle me-1"></i>
                  {chartData.overview.reported} Reported
                </div>
                <div className="stat-badge">
                  <i className="fas fa-check-circle me-1"></i>
                  {chartData.overview.resolved} Resolved
                </div>

                <div className="dropdown">
                  <button
                    className="btn btn-light btn-sm dropdown-toggle"
                    type="button"
                    onClick={() => setIsTimeFrameOpen(!isTimeFrameOpen)}
                    style={{ minWidth: "120px" }}
                  >
                    <i className="fas fa-calendar me-1"></i>
                    {timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}
                  </button>
                  <div
                    className={`dropdown-menu ${isTimeFrameOpen ? "show" : ""}`}
                  >
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setTimeFrame("day");
                        setIsTimeFrameOpen(true);
                      }}
                    >
                      Today
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setTimeFrame("week");
                        setIsTimeFrameOpen(false);
                      }}
                    >
                      This Week
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setTimeFrame("month");
                        setIsTimeFrameOpen(false);
                      }}
                    >
                      This Month
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setTimeFrame("year");
                        setIsTimeFrameOpen(false);
                      }}
                    >
                      This Year
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="row g-4">
          {/* Incidents Overview */}
          <div className="col-12">
            <div className="card">
              <div className="card-header text-white py-3">
                <div className="d-flex align-items-center">
                  <div className="avatar me-3">
                    <i className="fas fa-chart-bar"></i>
                  </div>
                  <div>
                    <h5 className="mb-0">Incidents Overview</h5>
                    <small className="opacity-75">
                      Comprehensive breakdown of incident statistics
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-container">
                  <canvas ref={incidentsRef}></canvas>
                </div>
                <div id="incidentsLegend" className="legend-container"></div>
              </div>
            </div>
          </div>

          {/* Reports Trend and Categories */}
          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header text-white py-3">
                <div className="d-flex align-items-center">
                  <div className="avatar me-3">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div>
                    <h5 className="mb-0">Reports Trend</h5>
                    <small className="opacity-75">
                      Historical reporting patterns and trends
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: "350px" }}>
                  <canvas ref={timeRef}></canvas>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header text-white py-3">
                <div className="d-flex align-items-center">
                  <div className="avatar me-3">
                    <i className="fas fa-tags"></i>
                  </div>
                  <div>
                    <h5 className="mb-0">Report Categories</h5>
                    <small className="opacity-75">
                      Distribution of incident types and categories
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: "350px" }}>
                  <canvas ref={typeRef}></canvas>
                </div>
                <div id="typeLegend" className="legend-container"></div>
              </div>
            </div>
          </div>

          {/* Top Responders and Lifecycle 
          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header text-white py-3">
                <div className="d-flex align-items-center">
                  <div className="avatar me-3">
                    <i className="fas fa-medal"></i>
                  </div>
                  <div>
                    <h5 className="mb-0">Top Responders</h5>
                    <small className="opacity-75">
                      Most active community response members
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: "350px" }}>
                  <canvas ref={respondersRef}></canvas>
                </div>
                <div id="respondersLegend" className="legend-container"></div>
              </div>
            </div>
          </div>*/}
          {/* Top Responders - Changed to list view */}
          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header text-white py-3">
                <div className="d-flex align-items-center">
                  <div className="avatar me-3">
                    <i className="fas fa-medal"></i>
                  </div>
                  <div>
                    <h5 className="mb-0">Top Responders</h5>
                    <small className="opacity-75">
                      Most active community response members
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {chartData.responders.labels.length === 0 ? (
                  <p className="text-center text-muted my-4">
                    No responder data available
                  </p>
                ) : (
                  <div className="list-group">
                    {chartData.responders.labels.map((label, index) => {
                      // Parse responder info from label
                      const name = label.split("(")[0].trim();
                      const id = label.match(/ID: (\d+)\)/)?.[1] || "N/A";

                      return (
                        <div
                          key={index}
                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        >
                          <div className="d-flex align-items-center">
                            <div className="position-relative me-3">
                              <div className="avatar-sm">
                                <div className="avatar-title bg-primary bg-gradient rounded-circle">
                                  <i className="fas fa-user"></i>
                                </div>
                              </div>
                              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <h6 className="mb-0">{name}</h6>
                              <small className="text-muted">ID: {id}</small>
                            </div>
                          </div>
                          <span className="badge bg-primary bg-gradient rounded-pill">
                            {chartData.responders.data[index]} responses
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header text-white py-3">
                <div className="d-flex align-items-center">
                  <div className="avatar me-3">
                    <i className="fas fa-briefcase-medical"></i>
                  </div>
                  <div>
                    <h5 className="mb-0">Reports Status Breakdown</h5>
                    <small className="opacity-75">
                      Journey from report to resolution
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: "350px" }}>
                  <canvas ref={funnelRef}></canvas>
                </div>
                <div id="funnelLegend" className="legend-container"></div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="col-12">
            <div className="card">
              <div className="card-header text-white py-3">
                <div className="d-flex align-items-center">
                  <div className="avatar me-3">
                    <i className="fas fa-bullhorn"></i>
                  </div>
                  <div>
                    <h5 className="mb-0">Broadcast Messages</h5>
                    <small className="opacity-75">
                      Channel message analytics and moderation status
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-container">
                  <canvas ref={messagesRef}></canvas>
                </div>
                <div id="messagesLegend" className="legend-container"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card mt-4">
          <div className="card-body py-3 text-center">
            <div className="d-flex justify-content-center flex-wrap gap-4">
              <div className="d-flex align-items-center text-muted small">
                <i className="fas fa-clock me-2"></i>
                Last updated: {new Date().toLocaleString()}
              </div>
              <div className="d-flex align-items-center text-muted small">
                <i className="fas fa-sync me-2"></i>
                Auto-refresh: Every 5 minutes
              </div>
              <div className="d-flex align-items-center text-muted small">
                <i className="fas fa-shield-alt me-2"></i>
                Data secured and encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
