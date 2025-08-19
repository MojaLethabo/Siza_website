"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from 'next/image';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  MapPin,
  Clock,
  AlertCircle,
  User,
  Activity,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Download,
  Settings,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface User {
  UserID: number;
  FullName: string;
  Email: string;
  Username: string;
  PhoneNumber: string;
  Passcode: string;
  UserType: string;
  CreatedAt: string;
  ProfilePhoto: string | null;
}

interface Report {
  ReportID: number;
  EmergencyType: string;
  EmerDescription: string;
  Report_Location: string;
  Report_Status: string;
  dateReported: string;
}

const UserProfilePage = () => {
  const searchParams = useSearchParams();
  const userID = searchParams.get('userID');
  
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Report; direction: 'asc' | 'desc' } | null>({
    key: 'dateReported',
    direction: 'desc'
  });

  useEffect(() => {
    if (!userID) {
      setError("No user ID provided in URL");
      return;
    }

    async function fetchUser() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://myappapi-yo3p.onrender.com/user?userID=${userID}`
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load user data.");
          setUser(null);
        } else {
          setUser(data.User);
        }
      } catch (err) {
              const message = err instanceof Error ? err.message : "An unexpected error occurred.";
              setError(message);
               setUser(null);
            }finally {
        setIsLoading(false);
      }
    }

    async function fetchReports() {
      setReportsLoading(true);
      setReportsError(null);
      try {
        const response = await fetch(
          `https://myappapi-yo3p.onrender.com/getReportsByUser?userID=${userID}`
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load reports.");
        }

        setReports(data.reports || []);
      } catch (err: unknown) {  // Better than any
          setReportsError(
            err instanceof Error 
              ? err.message 
              : "An unexpected error occurred."
          );
        }finally {
        setReportsLoading(false);
      }
    }

    fetchUser();
    fetchReports();
  }, [userID]);

const getStatusBadge = (status: string) => {
  const baseClasses = "badge";

  switch (status) {
    case "Completed":
      return (
        <span className={`${baseClasses} bg-success text-white`}>
          <i className="fas fa-check-circle me-1"></i>
          Completed
        </span>
      );

    case "On-Going":
    case "On-going":
      return (
        <span className={`${baseClasses} bg-warning text-dark`}>
          <i className="fas fa-clock me-1"></i>
          In Progress
        </span>
      );

    case "Abandoned":
      return (
        <span className={`${baseClasses} bg-danger text-white`}>
          <i className="fas fa-times-circle me-1"></i>
          Abandoned
        </span>
      );

    case "Escalated":
      return (
        <span className={`${baseClasses} bg-warning text-dark`}>
          <i className="fas fa-exclamation-triangle me-1"></i>
          Escalated
        </span>
      );

    case "False report":
      return (
        <span className={`${baseClasses} bg-danger text-white`}>
          <i className="fas fa-times-circle me-1"></i>
          False report
        </span>
      );

    default:
      return (
        <span className={`${baseClasses} bg-secondary text-white`}>
          {status}
        </span>
      );
  }
};

  const sortedReports = [...reports].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    if (sortConfig.key === "dateReported") {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }

    if (valA < valB) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (valA > valB) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: keyof Report) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Report) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <i className="fas fa-sort opacity-50 ms-1"></i>;
    }
    return sortConfig.direction === 'asc' ? 
      <i className="fas fa-sort-up ms-1"></i> : 
      <i className="fas fa-sort-down ms-1"></i>;
  };

type EmergencyType = "Fire" | "Crime" | "SOS" | string;  // Explicit union type
const getPriorityLevel = (type: EmergencyType) => { 
    switch (type) {
      case "Fire":
        return { color: "bg-danger", level: "Critical" };
      case "Crime":
        return { color: "bg-primary", level: "High" };
      case "SOS":
        return { color: "bg-warning", level: "Urgent" };
      default:
        return { color: "bg-secondary", level: "Standard" };
    }
  };

  const getReportStats = () => {
    const completed = reports.filter(r => r.Report_Status === "Completed").length;
    const ongoing = reports.filter(r => r.Report_Status === "On-Going" || r.Report_Status === "On-going").length;
    const abandoned = reports.filter(r => r.Report_Status === "Abandoned").length;
    const falseReports = reports.filter(r => r.Report_Status === "False report").length;
    const escalated = reports.filter(r => r.Report_Status === "Escalated").length;
    return { completed, ongoing, abandoned, falseReports, escalated, total: reports.length };
  };

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="fas fa-exclamation-circle text-danger fa-3x mb-3"></i>
                <h3 className="mb-3">Unable to Load Profile</h3>
                <p className="text-muted mb-4">{error}</p>
                <button
                  onClick={() => window.history.back()}
                  className="btn btn-primary"
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading user profile...</p>
        </div>
      </div>
    );
  }

  const stats = getReportStats();

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
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.5rem;
        }
        
        .profile-avatar {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 2rem;
          margin: 0 auto 1rem;
          position: relative;
        }
        
        .online-indicator {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 16px;
          height: 16px;
          background-color: #28a745;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
        }
        
        .card {
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
        }
        
        .table th {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          color: #495057;
        }
        
        .priority-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
        }
        
        .completion-bar {
          height: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .completion-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
          transition: width 0.3s ease;
        }
      `}</style>

      <div className="container-fluid py-4">
        {/* Header */}
        <div className="card mb-4">
          <div className="card-header text-white py-4">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <button
                  onClick={() => window.history.back()}
                  className="btn btn-light btn-sm me-3"
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Dashboard
                </button>
                <div>
                  <h3 className="mb-1">
                    <i className="fas fa-user me-2"></i>
                    User Profile Management
                  </h3>
                  <p className="mb-0 opacity-75">Comprehensive user account overview</p>
                </div>
              </div>
              
              <div className="d-flex gap-3 align-items-center">
                <div className="stat-badge">
                  <i className="fas fa-id-badge me-1"></i>
                  User ID: {userID || 'N/A'}
                </div>
                <button className="btn btn-light btn-sm">
                  <i className="fas fa-cog"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Profile Card */}
          <div className="col-lg-4">
            <div className="card mb-4">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-user me-2"></i>
                    Profile Information
                  </h5>
                  <button className="btn btn-sm btn-outline-secondary">
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
              </div>
              
              <div className="card-body text-center">
                <div className="profile-avatar">
                  {user.ProfilePhoto ? (
                    <Image
                      src={user.ProfilePhoto}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="rounded-circle"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    user.FullName.split(" ").map(n => n[0]).join("").toUpperCase()
                  )}
                  <div className="online-indicator"></div>
                </div>
                
                <h4 className="mb-1">{user.FullName}</h4>
                <p className="text-muted mb-3">@{user.Username}</p>
                
                <span className="badge bg-primary mb-3">
                  <i className="fas fa-shield-alt me-1"></i>
                  {user.UserType}
                </span>
                
                <hr />
                
                <div className="text-start">
                  <div className="d-flex align-items-center mb-3">
                    <i className="fas fa-envelope text-muted me-3"></i>
                    <small className="text-break">{user.Email}</small>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <i className="fas fa-phone text-muted me-3"></i>
                    <small>{user.PhoneNumber || "Not provided"}</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="fas fa-calendar text-muted me-3"></i>
                    <small>
                      Member since {new Date(user.CreatedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="card">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Activity Overview
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center mb-3">
                  <div className="col">
                    <h3 className="text-primary mb-0">{stats.total}</h3>
                    <small className="text-muted">Total Reports</small>
                  </div>
                </div>
                
                <hr />
                
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Completed</span>
                  <span className="badge bg-success">{stats.completed}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">In Progress</span>
                  <span className="badge bg-warning text-dark">{stats.ongoing}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Abandoned</span>
                  <span className="badge bg-danger">{stats.abandoned}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Escalated</span>
                  <span className="badge bg-warning text-dark">{stats.escalated}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted small">False Reports</span>
                  <span className="badge bg-danger">{stats.falseReports}</span>
                </div>
                
                {stats.total > 0 && (
                  <>
                    <hr />
                    <div className="text-center">
                      <small className="text-muted d-block mb-2">Completion Rate</small>
                      <div className="completion-bar mb-2">
                        <div 
                          className="completion-fill"
                          style={{ width: `${((stats.completed + stats.escalated)/ stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <small className="text-success fw-bold">
                        {Math.round(((stats.completed + stats.escalated )/ stats.total) * 100)}% Complete
                      </small>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">
                      <i className="fas fa-clipboard-list me-2"></i>
                      Incident Reports
                    </h5>
                    <small className="text-muted">
                      {reports.length} {reports.length === 1 ? 'report' : 'reports'} submitted by this user
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary">
                      <i className="fas fa-download me-1"></i>
                      Export
                    </button>
                    <button className="btn btn-sm btn-outline-secondary">
                      <i className="fas fa-ellipsis-h"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-body p-0">
                {reportsLoading && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-3"></div>
                    <p className="text-muted">Loading incident reports...</p>
                  </div>
                )}

                {reportsError && (
                  <div className="text-center py-5">
                    <i className="fas fa-exclamation-circle text-danger fa-3x mb-3"></i>
                    <h5 className="mb-3">Unable to Load Reports</h5>
                    <p className="text-muted">{reportsError}</p>
                  </div>
                )}

                {reports.length === 0 && !reportsLoading && (
                  <div className="text-center py-5">
                    <i className="fas fa-file-alt text-muted fa-3x mb-3 opacity-50"></i>
                    <h5 className="mb-3">No Reports Found</h5>
                    <p className="text-muted">This user has not submitted any incident reports.</p>
                  </div>
                )}

                {reports.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th 
                            className="cursor-pointer"
                            onClick={() => requestSort('ReportID')}
                          >
                            Report ID
                            {getSortIcon('ReportID')}
                          </th>
                          <th>Report Details</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th 
                            className="cursor-pointer"
                            onClick={() => requestSort('dateReported')}
                          >
                            Date Submitted
                            {getSortIcon('dateReported')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedReports.map((report, index) => {
                          const priority = getPriorityLevel(report.EmergencyType);
                          return (
                            <tr key={report.ReportID} className={index % 2 === 0 ? 'table-light' : ''}>
                              <td>
                                <span className="fw-bold">#{report.ReportID}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span className={`priority-dot ${priority.color}`}></span>
                                  <div>
                                    <div className="fw-semibold">{report.EmergencyType}</div>
                                    <small className="text-muted text-truncate d-block" style={{maxWidth: '250px'}}>
                                      {report.EmerDescription}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="fas fa-map-marker-alt text-muted me-2"></i>
                                  <small>{report.Report_Location}</small>
                                </div>
                              </td>
                              <td>
                                {getStatusBadge(report.Report_Status)}
                              </td>
                              <td>
                                <div>
                                  <div className="d-flex align-items-center">
                                    <i className="fas fa-calendar text-muted me-2"></i>
                                    <small>
                                      {new Date(report.dateReported).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </small>
                                  </div>
                                  <small className="text-muted">
                                    {new Date(report.dateReported).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </small>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfilePage;