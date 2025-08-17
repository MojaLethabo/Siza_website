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
        return "bg-red-100 text-red-800";
      case "Reviewed":
        return "bg-yellow-100 text-yellow-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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
        return (
          <span className="bg-red-500 text-white p-1 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case "flagged":
        return (
          <span className="bg-blue-500 text-white p-1 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="page-inner">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            minHeight: "400px",
            background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
            borderRadius: "12px",
            color: "white",
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
            <h5 className="fw-light">Loading community members...</h5>
          </div>
        </div>
      </div>
    );
  }
  {
    /*background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)", */
  }
  return (
    <div className="page-inner">
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          borderRadius: "12px",

          padding: "1rem",
        }}
      >
        <div>
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <div
                className="mb-8 bg-white rounded-xl shadow p-6"
                style={{
                  background:
                    "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
                }}
              >
                <h1 className="text-3xl font-bold text-white">
                  Support Dashboard
                </h1>
                <p className="mt-2 text-white">
                  Manage and resolve misuse reports and flagged messages
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-3 rounded-lg mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Pending</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalPending}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-3 rounded-lg mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Misuse Reports</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.misusePending} pending
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Flagged Messages</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.flaggedPending} pending
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-white rounded-xl shadow mb-6 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex space-x-2">
                    <button
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        activeTab === "all"
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => setActiveTab("all")}
                    >
                      All Items
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        activeTab === "misuse"
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => setActiveTab("misuse")}
                    >
                      Misuse Reports
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        activeTab === "flagged"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => setActiveTab("flagged")}
                    >
                      Flagged Messages
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by ID, name, or content..."
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 absolute right-3 top-2.5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as "newest" | "oldest")
                      }
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-xl shadow overflow-hidden">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mx-auto text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No items found
                    </h3>
                    <p className="mt-1 text-gray-500">
                      Try adjusting your search or filter criteria
                    </p>
                    <button
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      onClick={fetchSupportData}
                    >
                      Refresh Data
                    </button>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Item
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Details
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Reporter
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr
                          key={`${item.type}-${item.id}`}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleItemClick(item)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getTypeIcon(item.type)}
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.type === "misuse"
                                    ? "Misuse Report"
                                    : "Flagged Message"}{" "}
                                  #{item.id}
                                </div>
                                {item.type === "misuse" && item.reportId && (
                                  <div className="text-sm text-gray-500">
                                    Report ID: {item.reportId}
                                  </div>
                                )}
                                {item.type === "flagged" && item.messageId && (
                                  <div className="text-sm text-gray-500">
                                    Message ID: {item.messageId}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-md truncate">
                              {item.type === "misuse"
                                ? item.description
                                : item.messageContent || "No content"}
                            </div>
                            {item.type === "misuse" &&
                              item.filerCount &&
                              item.filerCount > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.filerCount} filer
                                  {item.filerCount > 1 ? "s" : ""}
                                </div>
                              )}
                            {item.type === "flagged" && item.reason && (
                              <div className="text-xs text-gray-500 mt-1">
                                Reason: {item.reason}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.reporterName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {item.reporterId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {safeFormatDate(item?.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Item Detail Modal */}
        {selectedItem && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div
                className="flex justify-between items-center p-6 border-b"
                style={{
                  background:
                    "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
                }}
              >
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedItem.type === "misuse"
                    ? "Misuse Report"
                    : "Flagged Message"}{" "}
                  #{selectedItem.id}
                </h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Reporter
                    </h3>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedItem.reporterName}
                    </p>
                    <p className="text-gray-600">
                      ID: {selectedItem.reporterId}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Date Reported
                    </h3>
                    <p className="text-lg font-medium text-gray-900">
                      {safeFormatDate(selectedItem?.createdAt)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Status
                    </h3>
                    <span
                      className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                        selectedItem.status
                      )}`}
                    >
                      {selectedItem.status}
                    </span>
                  </div>

                  {selectedItem.type === "misuse" && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Report ID
                      </h3>
                      <p className="text-lg font-medium text-gray-900">
                        #{selectedItem.reportId}
                      </p>
                    </div>
                  )}
                  {selectedItem.type === "flagged" && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Message ID
                      </h3>
                      <p className="text-lg font-medium text-gray-900">
                        #{selectedItem.messageId}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {selectedItem.type === "misuse" ? "Description" : "Content"}
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800">
                      {selectedItem.type === "misuse"
                        ? selectedItem.description
                        : selectedItem.messageContent || "No content"}
                    </p>
                  </div>
                </div>

                {selectedItem.type === "misuse" && filers.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Filers ({filers.length})
                    </h3>
                    <div className="space-y-3">
                      {filers.map((filer) => (
                        <div
                          key={filer.id}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {filer.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {filer.email}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">
                              {safeFormatDate(filer?.filedAt)}
                            </p>
                          </div>
                          {filer.additionalDescription && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-700">
                                {filer.additionalDescription}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.type === "flagged" && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Reason
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800">
                        {selectedItem.type === "flagged" &&
                          selectedItem.reason && (
                            <div className="text-xs text-gray-500 mt-1">
                              Reason:{" "}
                              {selectedItem.reason.length > 500
                                ? selectedItem.reason.slice(0, 977) + "..."
                                : selectedItem.reason}
                            </div>
                          )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t flex justify-between">
                <div>
                  {selectedItem.status === "Resolved" ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Resolved
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedItem.status === "Reviewed"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {selectedItem.status}
                    </span>
                  )}
                </div>

                {selectedItem.status !== "Resolved" && (
                  <button
                    onClick={resolveItem}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportDashboard;
