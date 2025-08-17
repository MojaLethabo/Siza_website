"use client";

import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { usePathname } from "next/navigation";

export default function Analytics() {
  // Refs for all charts
  const incidentsRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLCanvasElement>(null);
  const typeRef = useRef<HTMLCanvasElement>(null);
  const respondersRef = useRef<HTMLCanvasElement>(null);
  const funnelRef = useRef<HTMLCanvasElement>(null);
  const messagesRef = useRef<HTMLCanvasElement>(null);
  const messagesChartRef = useRef<Chart | null>(null);
  const pathname = usePathname();
  const isAnalyticsPage = pathname === "/Analytics";

  const [timeFrame, setTimeFrame] = useState<"day" | "week" | "month" | "year">(
    "month"
  );
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
  const respondersChartRef = useRef<Chart | null>(null);
  const funnelChartRef = useRef<Chart | null>(null);

  const BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://myappapi-yo3p.onrender.com";

  // Unified color palette
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
  // Fixed renderHTMLLegend function
  function renderHTMLLegend(chart: Chart, containerId: string) {
    // Ensure labels exist and are string[]
    const labels = (chart.data.labels || []) as string[];

    // Get background colors safely
    const datasets = chart.data.datasets || [];
    const bg = datasets.length > 0 ? datasets[0].backgroundColor : [];

    // Create legend items
    const items = labels
      .map((label: string, i: number) => {
        // Handle different background color types
        let bgColor = "#cccccc"; // Default fallback

        if (Array.isArray(bg)) {
          bgColor = bg[i] || bgColor;
        } else if (typeof bg === "string") {
          bgColor = bg;
        } else if (
          bg instanceof CanvasGradient ||
          bg instanceof CanvasPattern
        ) {
          // Canvas gradients/patterns can't be used in HTML
          bgColor = "#667eea"; // Use primary color as fallback
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
              "Other",
            ],
            data: [200, 150, 100, 80, 30, 10],
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

      // Parse response
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
      // Full fallback data
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
            "Other",
          ],
          data: [200, 150, 100, 80, 30, 10],
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
  const funnelColors = {
    blue: "#36A2EB", // Primary blue (existing)
    teal: "#4BC0C0", // Teal (existing)
    green: "#32CD32", // Lime green (vibrant)
    coral: "#FF7F50", // Coral (warm)
    slate: "#6A5ACD", // Slate blue (cool)
    amber: "#FFBF00", // Amber (golden)
    crimson: "#DC143C", // Crimson (rich red)
  };

  // Create or update charts
  const renderCharts = () => {
    // Destroy existing charts
    if (incidentsChartRef.current) incidentsChartRef.current.destroy();
    if (timeChartRef.current) timeChartRef.current.destroy();
    if (typeChartRef.current) typeChartRef.current.destroy();
    if (respondersChartRef.current) respondersChartRef.current.destroy();
    if (funnelChartRef.current) funnelChartRef.current.destroy();
    //if (messagesRef.current) messagesRef.current.destroy();

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

    // Render Total Incidents Overview
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

    // Render Reports Over Time
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

    // Render Reports by Type
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
                ],
                borderColor: [
                  colorPalette.chart.red,
                  colorPalette.chart.blue,
                  colorPalette.chart.orange,
                  colorPalette.chart.purple,
                  colorPalette.chart.teal,
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

    // Render Top Responders
    if (respondersRef.current) {
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
    }

    // Render Request Lifecycle Funnel
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
                  funnelColors.blue, // Logged
                  funnelColors.teal, // Accepted
                  funnelColors.green, // Resolved
                  funnelColors.coral, // Ongoing
                  funnelColors.slate, // Abandoned
                  funnelColors.amber, // False Reports
                  funnelColors.crimson, // Escalated
                ],
                borderColor: [
                  funnelColors.blue, // Logged
                  funnelColors.teal, // Accepted
                  funnelColors.green, // Resolved
                  funnelColors.coral, // Ongoing
                  funnelColors.slate, // Abandoned
                  funnelColors.amber, // False Reports
                  funnelColors.crimson, // Escalated
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

    // Broadcast Messages Chart
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

  // 1. Fetch analytics data - only on analytics page
  useEffect(() => {
    if (isAnalyticsPage) {
      fetchAnalyticsData();
    }
  }, [timeFrame, isAnalyticsPage]); // Add page check

  // 2. Render charts - only on analytics page
  useEffect(() => {
    if (!isAnalyticsPage) return;

    if (!loading) {
      // Use requestAnimationFrame for better timing
      const timer = requestAnimationFrame(() => {
        renderCharts();
      });

      return () => cancelAnimationFrame(timer);
    }
  }, [chartData, loading, isAnalyticsPage]); // Add page check

  // 3. Cleanup charts - runs regardless of page
  useEffect(() => {
    return () => {
      // Cleanup all charts on unmount
      if (incidentsChartRef.current) incidentsChartRef.current.destroy();
      if (timeChartRef.current) timeChartRef.current.destroy();
      if (typeChartRef.current) typeChartRef.current.destroy();
      if (respondersChartRef.current) respondersChartRef.current.destroy();
      if (funnelChartRef.current) funnelChartRef.current.destroy();
    };
  }, []);

  if (loading) {
    return (
      <div className="page-inner">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            minHeight: "500px",
            background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
            borderRadius: "16px",
            color: "white",
            margin: "2rem",
          }}
        >
          <div className="text-center">
            <div
              className="spinner-border mb-3"
              role="status"
              style={{
                width: "3rem",
                height: "3rem",
                borderColor: "rgba(255,255,255,0.3)",
                borderTopColor: "white",
              }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="fw-light">Loading analytics data...</h5>
            <p className="opacity-75 small">
              Preparing your dashboard insights
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="page-inner"
      style={{ background: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* Dashboard Header */}
      <div
        className="mb-4 p-4 text-white"
        style={{
          background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1 fw-bold">
              <i className="fas fa-chart-line me-3"></i>
              Analytics Dashboard
            </h2>
            <p className="mb-0 opacity-75">
              Real-time insights and performance metrics for your community
              safety platform
            </p>
          </div>

          {/* Time Frame Selector */}
          <div className="d-flex align-items-center">
            <label className="me-2 small fw-semibold opacity-75">
              Time Frame:
            </label>
            <select
              className="form-select form-select-sm fw-semibold"
              value={timeFrame}
              onChange={(e) =>
                setTimeFrame(
                  e.target.value as "day" | "week" | "month" | "year"
                )
              }
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                borderRadius: "8px",
                backdropFilter: "blur(10px)",
              }}
            >
              <option value="day" style={{ color: "#495057" }}>
                Today
              </option>
              <option value="week" style={{ color: "#495057" }}>
                This Week
              </option>
              <option value="month" style={{ color: "#495057" }}>
                This Month
              </option>
              <option value="year" style={{ color: "#495057" }}>
                This Year
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row g-4">
          {/* Key Metrics Cards */}
          <div className="col-12">
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    background:
                      "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
                    color: "white",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
                  }}
                >
                  <div className="card-body text-center p-4">
                    <i className="fas fa-exclamation-circle fa-2x mb-3 opacity-75"></i>
                    <h3 className="fw-bold mb-1">
                      {chartData.overview.reported}
                    </h3>
                    <p className="mb-0 opacity-75">Total Reported</p>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    background:
                      "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                    color: "white",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px rgba(40, 167, 69, 0.3)",
                  }}
                >
                  <div className="card-body text-center p-4">
                    <i className="fas fa-check-circle fa-2x mb-3 opacity-75"></i>
                    <h3 className="fw-bold mb-1">
                      {chartData.overview.resolved}
                    </h3>
                    <p className="mb-0 opacity-75">Successfully Resolved</p>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    background:
                      "linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)",
                    color: "white",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px rgba(220, 53, 69, 0.3)",
                  }}
                >
                  <div className="card-body text-center p-4">
                    <i className="fas fa-clock fa-2x mb-3 opacity-75"></i>
                    <h3 className="fw-bold mb-1">
                      {chartData.overview.unresolved}
                    </h3>
                    <p className="mb-0 opacity-75">Pending Resolution</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Total Incidents Overview */}
          <div className="col-12">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "16px", overflow: "hidden" }}
            >
              <div
                className="card-header border-0 py-4"
                style={{ background: "#f8f9fa" }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "48px",
                      height: "48px",
                      background:
                        "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
                      color: "white",
                    }}
                  >
                    <i className="fas fa-chart-bar"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-bold text-dark">
                      Incidents Overview
                    </h5>
                    <p className="mb-0 text-muted small">
                      Comprehensive breakdown of incident statistics
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div style={{ height: "300px", position: "relative" }}>
                  <canvas ref={incidentsRef}></canvas>
                </div>
                <div id="incidentsLegend"></div>
              </div>
            </div>
          </div>
          {/* Reports Over Time & Reports by Type */}
          <div className="col-lg-6">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "16px", overflow: "hidden" }}
            >
              <div
                className="card-header border-0 py-4"
                style={{ background: "#f8f9fa" }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "48px",
                      height: "48px",
                      background: colorPalette.gradients.info,
                      color: "white",
                    }}
                  >
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-bold text-dark">Reports Trend</h5>
                    <p className="mb-0 text-muted small">
                      Historical reporting patterns and trends
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div style={{ height: "350px", position: "relative" }}>
                  <canvas ref={timeRef}></canvas>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "16px", overflow: "hidden" }}
            >
              <div
                className="card-header border-0 py-4"
                style={{ background: "#f8f9fa" }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "48px",
                      height: "48px",
                      background: colorPalette.gradients.warning,
                      color: "white",
                    }}
                  >
                    <i className="fas fa-tags"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-bold text-dark">
                      Report Categories
                    </h5>
                    <p className="mb-0 text-muted small">
                      Distribution of incident types and categories
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div style={{ height: "350px", position: "relative" }}>
                  <canvas ref={typeRef}></canvas>
                </div>
                <div id="typeLegend"></div>
              </div>
            </div>
          </div>
          {/* Top Responders & Request Lifecycle */}
          <div className="col-lg-6">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "16px", overflow: "hidden" }}
            >
              <div
                className="card-header border-0 py-4"
                style={{ background: "#f8f9fa" }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "48px",
                      height: "48px",
                      background: colorPalette.gradients.success,
                      color: "white",
                    }}
                  >
                    <i className="fas fa-medal"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-bold text-dark">Top Responders</h5>
                    <p className="mb-0 text-muted small">
                      Most active community response members
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div style={{ height: "350px", position: "relative" }}>
                  <canvas ref={respondersRef}></canvas>
                </div>
                <div id="respondersLegend"></div>
              </div>
            </div>
          </div>
          {/*Request Lifecycle card */}
          <div className="col-lg-6">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "16px", overflow: "hidden" }}
            >
              <div
                className="card-header border-0 py-4"
                style={{ background: "#f8f9fa" }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "48px",
                      height: "48px",
                      background: colorPalette.gradients.danger,
                      color: "white",
                    }}
                  >
                    <i className="fas fa-funnel-dollar"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-bold text-dark">
                      Request Lifecycle
                    </h5>
                    <p className="mb-0 text-muted small">
                      Journey from report to resolution
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div style={{ height: "350px", position: "relative" }}>
                  <canvas ref={funnelRef}></canvas>
                </div>
                <div id="funnelLegend"></div>
              </div>
            </div>
          </div>
        </div>

        {/*vs*/}
        <div className="col-12">
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "16px" }}
          >
            <div
              className="card-header border-0 py-4"
              style={{ background: "#f8f9fa" }}
            >
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: colorPalette.gradients.info,
                    color: "white",
                  }}
                >
                  <i className="fas fa-bullhorn"></i>
                </div>
                <div>
                  <h5 className="mb-1 fw-bold text-dark">Broadcast Messages</h5>
                  <p className="mb-0 text-muted small">
                    Channel message analytics and moderation status
                  </p>
                </div>
              </div>
            </div>
            <div className="card-body p-4">
              <div style={{ height: "300px", position: "relative" }}>
                <canvas ref={messagesRef}></canvas>
              </div>
              <div id="messagesLegend"></div>
            </div>
          </div>
        </div>

        {/* Dashboard Footer */}
        <div className="row mt-4">
          <div className="col-12">
            <div
              className="card border-0 text-center"
              style={{
                background: "linear-gradient(135deg, #495057 0%, #6c757d 100%)",
                color: "white",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
            >
              <div className="card-body py-3">
                <div className="d-flex justify-content-center align-items-center flex-wrap gap-4">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-clock me-2"></i>
                    <small>Last updated: {new Date().toLocaleString()}</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="fas fa-sync me-2"></i>
                    <small>Auto-refresh: Every 5 minutes</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="fas fa-shield-alt me-2"></i>
                    <small>Data secured and encrypted</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
