"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";

interface SupportItem {
  id: number;
  type: "misuse" | "flagged";
  status: "Pending" | "Reviewed" | "Resolved";
  createdAt: string;
  reporterId: number;
  reporterName: string;
  filerCount?: number;
  reportId?: number;
  description?: string;
  messageId?: number;
  messageContent?: string;
  reason?: string;
}

interface Filer {
  id: number;
  name: string;
  email: string;
  filedAt: string;
  additionalDescription?: string;
}

interface SupportStats {
  totalPending: number;
  misusePending: number;
  flaggedPending: number;
}

const SupportDashboard = () => {
  const [activeTab, setActiveTab] = useState<"all" | "misuse" | "flagged">(
    "all"
  );
  const [items, setItems] = useState<SupportItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SupportItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SupportItem | null>(null);
  const [filers, setFilers] = useState<Filer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [stats, setStats] = useState<SupportStats>({
    totalPending: 0,
    misusePending: 0,
    flaggedPending: 0,
  });

  const BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://myappapi-yo3p.onrender.com";

  // Fetch support data
  const fetchSupportData = async () => {
    try {
      setLoading(true);

      // Fetch items
      const itemsRes = await fetch(`${BASE}/api/support/items`);
      if (!itemsRes.ok) throw new Error("Failed to fetch support items");
      const itemsData = await itemsRes.json();

      // Fetch stats
      const statsRes = await fetch(`${BASE}/api/support/stats`);
      if (!statsRes.ok) throw new Error("Failed to fetch support stats");
      const statsData = await statsRes.json();

      setItems(itemsData);
      setStats(statsData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching support data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportData();
  }, []);

  useEffect(() => {
    let result = [...items];

    // Apply tab filter
    if (activeTab !== "all") {
      result = result.filter((item) => item.type === activeTab);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          (item.reporterName &&
            item.reporterName.toLowerCase().includes(term)) ||
          (item.description && item.description.toLowerCase().includes(term)) ||
          (item.messageContent &&
            item.messageContent.toLowerCase().includes(term)) ||
          item.id.toString().includes(term) ||
          (item.reportId && item.reportId.toString().includes(term)) ||
          (item.messageId && item.messageId.toString().includes(term))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "newest"
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    setFilteredItems(result);
  }, [items, activeTab, searchTerm, sortOrder]);

  const handleItemClick = async (item: SupportItem) => {
    setSelectedItem(item);

    // If it's a misuse and has filers, load filers
    if (item.type === "misuse" && item.filerCount && item.filerCount > 0) {
      try {
        const filersRes = await fetch(
          `${BASE}/api/support/misuse/filers/${item.id}`
        );
        if (!filersRes.ok) throw new Error("Failed to fetch filers");
        const filersData = await filersRes.json();
        setFilers(filersData);
      } catch (err) {
        console.error("Error fetching filers:", err);
      }
    }

    // Update status to Reviewed if it was Pending
    if (item.status === "Pending") {
      try {
        await fetch(
          `${BASE}/api/support/items/${item.type}/${item.id}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ status: "Reviewed" }),
          }
        );

        // Update local state
        // In handleItemClick
        const updatedItems = items.map((i) =>
          i.id === item.id && i.type === item.type
            ? ({ ...i, status: "Reviewed" } as SupportItem)
            : i
        );

        setItems(updatedItems);
        setSelectedItem({ ...item, status: "Reviewed" });

        // Update stats if needed
        setStats((prev) => ({
          ...prev,
          totalPending: prev.totalPending - 1,
          ...(item.type === "misuse"
            ? { misusePending: prev.misusePending - 1 }
            : { flaggedPending: prev.flaggedPending - 1 }),
        }));
      } catch (err) {
        console.error("Error updating item status:", err);
      }
    }
  };

  const resolveItem = async () => {
    if (!selectedItem) return;

    try {
      await fetch(
        `${BASE}/api/support/items/${selectedItem.type}/${selectedItem.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: "Resolved" }),
        }
      );

      // Update local state
      const updatedItems = items.map((i) =>
        i.id === selectedItem.id && i.type === selectedItem.type
          ? ({ ...i, status: "Resolved" } as SupportItem)
          : i
      );

      setItems(updatedItems);
      setSelectedItem({ ...selectedItem, status: "Resolved" });

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalPending: prev.totalPending - 1,
        ...(selectedItem.type === "misuse"
          ? { misusePending: prev.misusePending - 1 }
          : { flaggedPending: prev.flaggedPending - 1 }),
      }));
    } catch (err) {
      console.error("Error resolving item:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-danger";
      case "Reviewed":
        return "bg-warning";
      case "Resolved":
        return "bg-success";
      default:
        return "bg-secondary";
    }
  };

  // Create a safe date formatting function
  const safeFormatDate = (input: string | Date | null | undefined) => {
    if (!input) return "N/A";

    try {
      // If it's already a Date object
      if (input instanceof Date && !isNaN(input.getTime())) {
        return format(input, "MMM d, yyyy 'at' h:mm a");
      }

      // If it's a string
      if (typeof input === "string") {
        // Handle SQL Server format
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(input)) {
          const date = parseISO(input.replace(" ", "T") + "Z");
          return format(date, "MMM d, yyyy 'at' h:mm a");
        }

        // Handle ISO format
        return format(parseISO(input), "MMM d, yyyy 'at' h:mm a");
      }

      // Fallback to generic date parsing
      return format(new Date(input), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Invalid Date";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "misuse":
        return <i className="fas fa-exclamation-triangle text-danger"></i>;
      case "flagged":
        return <i className="fas fa-flag text-primary"></i>;
      default:
        return <i className="fas fa-question-circle text-secondary"></i>;
    }
  };

  const renderStats = () => (
    <div className="d-flex gap-2">
      <div className="stat-badge">
        <i className="fas fa-exclamation-circle me-1"></i>
        {stats.totalPending} Total Pending
      </div>
      <div className="stat-badge">
        <i className="fas fa-ban me-1"></i>
        {stats.misusePending} Misuse
      </div>
      <div className="stat-badge">
        <i className="fas fa-flag me-1"></i>
        {stats.flaggedPending} Flagged
      </div>
    </div>
  );

  const renderTableRow = (item: SupportItem, index: number) => (
    <tr 
      key={`${item.type}-${item.id}`} 
      className={`${index % 2 === 0 ? "table-light" : ""} cursor-pointer`}
      onClick={() => handleItemClick(item)}
      style={{ cursor: 'pointer' }}
    >
      <td>
        <div className="d-flex align-items-center">
          <div className="avatar me-2">
            {getTypeIcon(item.type)}
          </div>
          <div>
            <div className="fw-semibold">
              {item.type === "misuse" ? "Misuse Report" : "Flagged Message"} #{item.id}
            </div>
            <small className="text-muted">
              {item.type === "misuse" && item.reportId && `Report ID: ${item.reportId}`}
              {item.type === "flagged" && item.messageId && `Message ID: ${item.messageId}`}
            </small>
          </div>
        </div>
      </td>
      <td>
        <div className="text-truncate" style={{ maxWidth: "300px" }}>
          {item.type === "misuse" ? item.description : item.messageContent || "No content"}
        </div>
        {item.type === "misuse" && item.filerCount && item.filerCount > 0 && (
          <small className="text-muted d-block">
            {item.filerCount} filer{item.filerCount > 1 ? "s" : ""}
          </small>
        )}
        {item.type === "flagged" && item.reason && (
          <small className="text-muted d-block">
            Reason: {item.reason.length > 50 ? item.reason.slice(0, 47) + "..." : item.reason}
          </small>
        )}
      </td>
      <td>
        <div className="fw-medium">{item.reporterName}</div>
        <small className="text-muted">ID: {item.reporterId}</small>
      </td>
      <td>
        <small className="text-muted">{safeFormatDate(item?.createdAt)}</small>
      </td>
      <td className="text-center">
        <span className={`badge ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      </td>
    </tr>
  );

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading support items...</p>
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
        
        .table th {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          color: #495057;
        }
        
        .card {
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
        }
        
        .modal-backdrop-custom {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
        }
        
        .btn-tab {
          border-radius: 20px;
          padding: 8px 20px;
          border: none;
          font-weight: 600;
          margin-right: 8px;
          transition: all 0.3s ease;
        }
        
        .btn-tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-tab:not(.active) {
          background-color: #f8f9fa;
          color: #6c757d;
        }
        
        .btn-tab:not(.active):hover {
          background-color: #e9ecef;
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .cursor-pointer:hover {
          background-color: rgba(0, 0, 0, 0.05) !important;
        }

        .modal-fade-in {
          animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .info-card {
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
        }

        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .info-card.reporter-card {
          border-left-color: #667eea;
        }

        .info-card.date-card {
          border-left-color: #764ba2;
        }

        .info-card.status-card {
          border-left-color: #28a745;
        }

        .info-card.id-card {
          border-left-color: #ffc107;
        }

        .content-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: none;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .filer-card {
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .filer-card:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .filer-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .status-indicator {
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.85rem;
        }

        .status-resolved {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }

        .status-reviewed {
          background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
        }

        .status-pending {
          background: linear-gradient(135deg, #dc3545 0%, #e91e63 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
        }

        .action-button {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
          transition: all 0.3s ease;
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
          background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #495057;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title:before {
          content: '';
          width: 4px;
          height: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }

        .modal-header-enhanced {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
        }

        .modal-header-enhanced:before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .type-badge {
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .type-badge.misuse {
          background: linear-gradient(135deg, #dc3545 0%, #e91e63 100%);
          color: white;
        }

        .type-badge.flagged {
          background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);
          color: white;
        }
      `}</style>

      <div className="container-fluid py-4">
        <div className="card">
          <div className="card-header text-white py-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-1">
                  <i className="fas fa-life-ring me-2"></i>
                  Support Dashboard
                </h3>
                <p className="mb-0 opacity-75">Manage and resolve misuse reports and flagged messages</p>
              </div>
              
              <div className="d-flex gap-3 align-items-center">
                {renderStats()}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="card-body border-bottom">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="d-flex">
                  <button
                    className={`btn btn-tab ${activeTab === "all" ? "active" : ""}`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Items
                  </button>
                  <button
                    className={`btn btn-tab ${activeTab === "misuse" ? "active" : ""}`}
                    onClick={() => setActiveTab("misuse")}
                  >
                    Misuse Reports
                  </button>
                  <button
                    className={`btn btn-tab ${activeTab === "flagged" ? "active" : ""}`}
                    onClick={() => setActiveTab("flagged")}
                  >
                    Flagged Messages
                  </button>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="d-flex gap-2">
                  <div className="flex-grow-1">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by ID, name, or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <select
                    className="form-select"
                    style={{ width: 'auto', minWidth: '140px' }}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Details</th>
                    <th>Reporter</th>
                    <th>Date</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <i className="fas fa-inbox fs-1 text-muted opacity-50"></i>
                        <p className="mt-3 text-muted">
                          {searchTerm || activeTab !== "all" ? "No items match your criteria" : "No support items found"}
                        </p>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={fetchSupportData}
                        >
                          <i className="fas fa-sync me-1"></i>
                          Refresh Data
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => renderTableRow(item, index))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Enhanced Item Detail Modal */}
        {selectedItem && (
          <div className="modal show d-block modal-backdrop-custom" style={{ zIndex: 9999 }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable modal-fade-in">
              <div className="modal-content" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                <div className="modal-header modal-header-enhanced border-0 py-4">
                  <div className="d-flex align-items-center">
                    <span className={`type-badge ${selectedItem.type} me-3`}>
                      {selectedItem.type === "misuse" ? (
                        <i className="fas fa-exclamation-triangle"></i>
                      ) : (
                        <i className="fas fa-flag"></i>
                      )}
                      {selectedItem.type === "misuse" ? "Misuse Report" : "Flagged Message"}
                    </span>
                    <h5 className="modal-title text-white mb-0 fw-bold">
                      #{selectedItem.id}
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedItem(null)}
                    style={{ fontSize: '1.2rem' }}
                  ></button>
                </div>
                
                <div className="modal-body p-4">
                  {/* Key Information Cards */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="card info-card reporter-card">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-user-circle text-primary me-2"></i>
                            <h6 className="card-subtitle mb-0 text-muted">Reporter</h6>
                          </div>
                          <h5 className="card-title mb-1 fw-bold">{selectedItem.reporterName}</h5>
                          <p className="text-muted mb-0 small">
                            <i className="fas fa-id-badge me-1"></i>
                            ID: {selectedItem.reporterId}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="card info-card date-card">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-calendar-alt text-info me-2"></i>
                            <h6 className="card-subtitle mb-0 text-muted">Date Reported</h6>
                          </div>
                          <h6 className="card-title mb-0 fw-bold">{safeFormatDate(selectedItem?.createdAt)}</h6>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="card info-card status-card">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-info-circle text-success me-2"></i>
                            <h6 className="card-subtitle mb-0 text-muted">Current Status</h6>
                          </div>
                          <div>
                            <span className={`status-indicator ${
                              selectedItem.status === "Resolved" ? "status-resolved" : 
                              selectedItem.status === "Reviewed" ? "status-reviewed" : "status-pending"
                            }`}>
                              <i className={`fas ${
                                selectedItem.status === "Resolved" ? "fa-check-circle" :
                                selectedItem.status === "Reviewed" ? "fa-eye" : "fa-clock"
                              }`}></i>
                              {selectedItem.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="card info-card id-card">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-hashtag text-warning me-2"></i>
                            <h6 className="card-subtitle mb-0 text-muted">
                              {selectedItem.type === "misuse" ? "Report ID" : "Message ID"}
                            </h6>
                          </div>
                          <h5 className="card-title mb-0 fw-bold">
                            #{selectedItem.type === "misuse" ? selectedItem.reportId : selectedItem.messageId}
                          </h5>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="mb-4">
                    <div className="section-title">
                      <i className={`fas ${selectedItem.type === "misuse" ? "fa-file-alt" : "fa-comment-alt"}`}></i>
                      {selectedItem.type === "misuse" ? "Report Description" : "Message Content"}
                    </div>
                    <div className="card content-card">
                      <div className="card-body">
                        <p className="mb-0 lh-lg">
                          {selectedItem.type === "misuse"
                            ? selectedItem.description || "No description provided"
                            : selectedItem.messageContent || "No content available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filers Section for Misuse Reports */}
                  {selectedItem.type === "misuse" && filers.length > 0 && (
                    <div className="mb-4">
                      <div className="section-title">
                        <i className="fas fa-users"></i>
                        Additional Filers ({filers.length})
                      </div>
                      <div className="row g-3">
                        {filers.map((filer, index) => (
                          <div key={filer.id} className="col-lg-6">
                            <div className="card filer-card">
                              <div className="card-body pt-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h6 className="mb-1 fw-bold">
                                      <i className="fas fa-user me-2 text-primary"></i>
                                      {filer.name}
                                    </h6>
                                    <p className="text-muted mb-0 small">
                                      <i className="fas fa-envelope me-1"></i>
                                      {filer.email}
                                    </p>
                                  </div>
                                  <div className="text-end">
                                    <span className="badge bg-secondary">
                                      <i className="fas fa-clock me-1"></i>
                                      Filer #{index + 1}
                                    </span>
                                    <div className="small text-muted mt-1">
                                      {safeFormatDate(filer?.filedAt)}
                                    </div>
                                  </div>
                                </div>
                                {filer.additionalDescription && (
                                  <div className="mt-3 pt-3 border-top">
                                    <h6 className="small text-muted mb-2">
                                      <i className="fas fa-quote-left me-1"></i>
                                      Additional Details:
                                    </h6>
                                    <p className="mb-0 small bg-light p-3 rounded">
                                  {`"${filer.additionalDescription}"`}
                                </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reason Section for Flagged Messages */}
                  {selectedItem.type === "flagged" && selectedItem.reason && (
                    <div className="mb-4">
                      <div className="section-title">
                        <i className="fas fa-exclamation-circle"></i>
                        Flag Reason
                      </div>
                      <div className="card content-card">
                        <div className="card-body">
                          <p className="mb-0 lh-lg">{`"${selectedItem.reason}"`}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Footer */}
                <div className="modal-footer bg-light p-4 border-0">
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="d-flex align-items-center gap-3">
                      <div>
                        <span className={`status-indicator ${
                          selectedItem.status === "Resolved" ? "status-resolved" : 
                          selectedItem.status === "Reviewed" ? "status-reviewed" : "status-pending"
                        }`}>
                          <i className={`fas ${
                            selectedItem.status === "Resolved" ? "fa-check-circle" :
                            selectedItem.status === "Reviewed" ? "fa-eye" : "fa-clock"
                          }`}></i>
                          {selectedItem.status}
                        </span>
                      </div>
                      <div className="small text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        Last updated: {safeFormatDate(selectedItem?.createdAt)}
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      {selectedItem.status !== "Resolved" && (
                        <button
                          onClick={resolveItem}
                          className="btn action-button text-white"
                        >
                          <i className="fas fa-check-double me-2"></i>
                          Mark as Resolved
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="btn btn-outline-secondary px-4"
                        style={{ borderRadius: '25px' }}
                      >
                        <i className="fas fa-times me-1"></i>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SupportDashboard;