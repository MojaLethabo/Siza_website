"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SleepModal from "@/components/SleepModal";
import { usePathname } from "next/navigation";
import MisuseDetailsModal from "@/components/MisuseDetailsModal";
import FlagDetailsModal from "@/components/FlagDetailsModal";

interface CommunityMember {
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber: string;
  requests: number;
  responses: number;
  isActive: boolean;
  Role: string;
  flagCount: number;
  misuseCount: number;

}

interface MisuseReport {
  MisuseID: number;
  ReportType: string;
  Status: string;
  InitialDescription: string;
  Filers: string;
  FilerCount: number;
  CreatedAt: string;
  MisuseStatus: string;
}

interface Flag {
  FlagID: number;
  FlagType: string;
  Description?: string;
  CreatedAt?: string;
  ReporterName?: string;
  Status: string;
}

type SortOption = "ID" | "Name" | "Responses" | "Flags" | "Misuses";

const CommunityMemberManagement = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const pathname = usePathname();
  
  // State management
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Modal states
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showMisuseModal, setShowMisuseModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [selectedMisuses, setSelectedMisuses] = useState<MisuseReport[]>([]);
  const [selectedFlags, setSelectedFlags] = useState<Flag[]>([]);
  
  // Table controls
  const [sortBy, setSortBy] = useState<SortOption>("ID");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "https://myappapi-yo3p.onrender.com";
  const isManageUsersPage = pathname === "/ManageUsers";

  // Data fetching
  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      setError("");

      const [volunteersRes, flagRes, misuseRes] = await Promise.all([
        fetch(`${BASE}/api/volunteers`),
        fetch(`${BASE}/api/flags/counts`),
        fetch(`${BASE}/api/misuses/counts`)
      ]);

      if (!volunteersRes.ok) {
        throw new Error("Failed to fetch volunteers");
      }

      const volunteersData = await volunteersRes.json();
      const flagCountsData = flagRes.ok ? await flagRes.json() : {};
      const misuseCountsData = misuseRes.ok ? await misuseRes.json() : {};

      if (!volunteersData.volunteers || !Array.isArray(volunteersData.volunteers)) {
        throw new Error("Invalid volunteers data format");
      }

      const updatedVolunteers = volunteersData.volunteers.map(
        (volunteer: CommunityMember) => ({
          ...volunteer,
          flagCount: flagCountsData[volunteer.UserID.toString()] || 0,
          misuseCount: misuseCountsData[volunteer.UserID.toString()] || 0,
        })
      );

      setMembers(updatedVolunteers);
    }  catch (err: unknown) {
                const error = err instanceof Error ? err.message : "Error fetching volunteers:";
      setError(error || "Failed to load community members");
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const handleOpenMisuseModal = async (userId: number) => {
   try {
    const response = await fetch(`${BASE}/api/misuses/user/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch misuse details");
    
    const data = await response.json();
    
    // Transform the API response to match MisuseReport
    const misuses: MisuseReport[] = data.map((item: {
      id: number;
      type?: string;
      status?: string;
      description?: string;
      reporters?: string[];
      reporter_count?: number;
      created_at?: string;
      resolution_status?: string;
    }) => ({
      MisuseID: item.id,
      ReportType: item.type || 'Unknown',
      Status: item.status || 'Pending',
      InitialDescription: item.description || 'No description provided',
      Filers: item.reporters?.join(', ') || 'Anonymous',
      FilerCount: item.reporter_count || 1,
      CreatedAt: item.created_at || new Date().toISOString(),
      MisuseStatus: item.resolution_status || 'Pending'
    }));
    
    setSelectedMisuses(misuses);
    setShowMisuseModal(true);
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to load misuse details";
    console.error("Error fetching misuses:", error);
    setError(error);
  }
  };

  const handleOpenFlagModal = async (userId: number) => {
   try {
    const response = await fetch(`${BASE}/api/flags/user/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch flag details");
    
    const apiFlags = await response.json();
    
    // Transform API response to match Flag interface
    const flags: Flag[] = apiFlags.map((item: {
      id: number;
      type?: string;
      description?: string;
      created_at?: string;
      reporter_name?: string;
      reporter?: { name?: string };
      status?: string;
    }) => ({
      FlagID: item.id,
      FlagType: item.type || 'General',
      Description: item.description,
      CreatedAt: item.created_at,
      ReporterName: item.reporter_name || item.reporter?.name || 'Anonymous',
      Status: item.status || 'Pending'
    }));
    
    setSelectedFlags(flags);
    setShowFlagModal(true);
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to load flag details";
    console.error("Error fetching flags:", error);
    setError(error);
  }
  };

  const handleSleepUser = async (userId: number, durationHours: number, sleepType: string) => {
    try {
      const response = await fetch(`${BASE}/api/sleep`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId, durationHours, sleepType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to put user to sleep");
      }

      setMembers(prevMembers =>
        prevMembers.map(member =>
          member.UserID === userId ? { ...member, isActive: false } : member
        )
      );

      setShowSleepModal(false);
    } catch (err: unknown) {
  const error = err instanceof Error ? err.message : "Error putting user to sleep:";
  setError(error|| "Failed to put user to sleep");
    
    }
  };

  // Utility functions
  const getStatusIcon = (count: number, type: 'flag' | 'misuse') => {
    const configs = {
      flag: {
        icons: [
          { icon: "fas fa-shield-alt", color: "#28a745" },
          { icon: "fas fa-flag", color: "#ffc107" },
          { icon: "fas fa-exclamation-triangle", color: "#fd7e14" },
          { icon: "fas fa-ban", color: "#dc3545" }
        ],
        thresholds: [0, 2, 5]
      },
      misuse: {
        icons: [
          { icon: "fas fa-check-circle", color: "#28a745" },
          { icon: "fas fa-exclamation-circle", color: "#ffc107" },
          { icon: "fas fa-radiation", color: "#fd7e14" },
          { icon: "fas fa-skull-crossbones", color: "#dc3545" }
        ],
        thresholds: [0, 2, 5]
      }
    };

    const config = configs[type];
    const thresholds = config.thresholds;
    
    if (count === thresholds[0]) return config.icons[0];
    if (count <= thresholds[1]) return config.icons[1];
    if (count <= thresholds[2]) return config.icons[2];
    return config.icons[3];
  };

  // Sorting and pagination
  const sortedMembers = [...members].sort((a, b) => {
    switch (sortBy) {
      case "Name":
        return a.FullName.localeCompare(b.FullName);
      case "Responses":
        return b.responses - a.responses;
      case "Flags":
        return b.flagCount - a.flagCount;
      case "Misuses":
        return b.misuseCount - a.misuseCount;
      default:
        return a.UserID - b.UserID;
    }
  });

  const totalPages = Math.ceil(members.length / itemsPerPage);
  const currentItems = sortedMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Effects
  useEffect(() => {
    if (isManageUsersPage && currentUser?.UserID) {
      fetchVolunteers();
    }
  }, [currentUser, isManageUsersPage]);

  // Render components
  const renderStats = () => {
    const activeMembers = members.filter(m => m.isActive).length;
    const totalFlags = members.reduce((sum, m) => sum + m.flagCount, 0);
    const totalMisuses = members.reduce((sum, m) => sum + m.misuseCount, 0);

    return (
      <div className="d-flex gap-2">
        <div className="stat-badge">
          <i className="fas fa-user-check me-1"></i>
          {activeMembers} Active
        </div>
        <div className="stat-badge">
          <i className="fas fa-flag me-1"></i>
          {totalFlags} Flags
        </div>
        <div className="stat-badge">
          <i className="fas fa-exclamation-triangle me-1"></i>
          {totalMisuses} Misuses
        </div>
      </div>
    );
  };

  const renderSortDropdown = () => (
    <div className="dropdown">
      <button
        className="btn btn-light btn-sm dropdown-toggle"
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        style={{ minWidth: '120px' }}
      >
        <i className="fas fa-sort me-1"></i>
        Sort by: {sortBy}
      </button>
      {isDropdownOpen && (
        <div className="dropdown-menu show position-absolute">
          {(["Name", "Responses", "ID", "Flags", "Misuses"] as SortOption[]).map(option => (
            <button
              key={option}
              className="dropdown-item"
              onClick={() => {
                setSortBy(option);
                setIsDropdownOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderTableRow = (member: CommunityMember, index: number) => {
    const flagInfo = getStatusIcon(member.flagCount, 'flag');
    const misuseInfo = getStatusIcon(member.misuseCount, 'misuse');

    return (
      <tr key={member.UserID} className={index % 2 === 0 ? "table-light" : ""}>
        <td>
          <div className="d-flex align-items-center">
            <div className="avatar me-2">
              {member.FullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <button
                className="btn btn-link p-0 text-start"
                onClick={() => router.push(`/User?userID=${member.UserID}`)}
              >
                <div className="fw-semibold">{member.FullName}</div>
                <small className="text-muted">ID: #{member.UserID}</small>
              </button>
            </div>
          </div>
        </td>
        <td>
          <span className="text-muted">{member.Email}</span>
        </td>
        <td className="text-center">
          <span className="badge bg-warning text-dark">{member.requests}</span>
        </td>
        <td className="text-center">
          <span className="badge bg-primary">{member.responses}</span>
        </td>
        <td className="text-center">
          <button
            className="btn btn-link p-0"
            onClick={() => handleOpenFlagModal(member.UserID)}
            disabled={member.flagCount === 0}
          >
            <i className={flagInfo.icon} style={{ color: flagInfo.color }}></i>
            <span className="badge ms-1" style={{ backgroundColor: flagInfo.color }}>
              {member.flagCount}
            </span>
          </button>
        </td>
        <td className="text-center">
          <button
            className="btn btn-link p-0"
            onClick={() => handleOpenMisuseModal(member.UserID)}
            disabled={member.misuseCount === 0}
          >
            <i className={misuseInfo.icon} style={{ color: misuseInfo.color }}></i>
            <span className="badge ms-1" style={{ backgroundColor: misuseInfo.color }}>
              {member.misuseCount}
            </span>
          </button>
        </td>
        <td className="text-center">
          <div className="status-indicator">
            <span className={`status-dot ${member.isActive ? 'active' : 'inactive'}`}></span>
            <span className={member.isActive ? 'text-success' : 'text-danger'}>
              {member.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </td>
        <td className="text-center">
          <button
            className={`btn btn-sm ${member.isActive ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
            onClick={() => {
              setSelectedMember(member);
              setShowSleepModal(true);
            }}
            disabled={!member.isActive}
          >
            <i className={`fas ${member.isActive ? 'fa-moon' : 'fa-zzz'} me-1`}></i>
            {member.isActive ? 'Sleep' : 'Sleeping'}
          </button>
        </td>
      </tr>
    );
  };

  const renderPagination = () => (
    <nav className="d-flex justify-content-center">
      <ul className="pagination">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
        </li>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
          return (
            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            </li>
          );
        })}
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading community members...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button
            className="btn btn-outline-danger btn-sm ms-3"
            onClick={fetchVolunteers}
          >
            <i className="fas fa-sync me-1"></i>
            Retry
          </button>
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
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
        }
      `}</style>

      <div className="container-fluid py-4">
        <div className="card">
          <div className="card-header text-white py-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-1">
                  <i className="fas fa-users me-2"></i>
                  Community Management
                </h3>
                <p className="mb-0 opacity-75">Manage and monitor community members</p>
              </div>
              
              <div className="d-flex gap-3 align-items-center">
                {renderStats()}
                {renderSortDropdown()}
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th className="text-center">Requests</th>
                    <th className="text-center">Responses</th>
                    <th className="text-center">Flags</th>
                    <th className="text-center">Misuses</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5">
                        <i className="fas fa-users fs-1 text-muted opacity-50"></i>
                        <p className="mt-3 text-muted">No members found</p>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((member, index) => renderTableRow(member, index))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-footer bg-light py-3">
            {renderPagination()}
            <div className="text-center mt-3 text-muted small">
              Page {currentPage} of {totalPages} • {members.length} total members
            </div>
          </div>
        </div>

        {/* Modals */}
        {showSleepModal && selectedMember && (
          <SleepModal
            member={selectedMember}
            onClose={() => setShowSleepModal(false)}
            onSleep={(duration, sleepType) => 
              handleSleepUser(selectedMember.UserID, duration, sleepType)
            }
          />
        )}

        {showMisuseModal && (
          <MisuseDetailsModal
            misuses={selectedMisuses}
            onClose={() => setShowMisuseModal(false)}
          />
        )}

        {showFlagModal && (
          <FlagDetailsModal
            flags={selectedFlags}
            onClose={() => setShowFlagModal(false)}
          />
        )}
      </div>
    </>
  );
};

export default CommunityMemberManagement;