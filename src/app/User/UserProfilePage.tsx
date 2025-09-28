"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Settings,
  ChevronUp,
  ChevronDown,
  Filter,
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
  const router = useRouter();

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
      } finally {
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
      } catch (err: unknown) {
        setReportsError(
          err instanceof Error 
            ? err.message 
            : "An unexpected error occurred."
        );
      } finally {
        setReportsLoading(false);
      }
    }

    fetchUser();
    fetchReports();
  }, [userID]);

  // Get report statistics
  const getReportStats = () => {
    const completed = reports.filter(r => r.Report_Status === "Completed").length;
    const ongoing = reports.filter(r => r.Report_Status === "On-Going" || r.Report_Status === "On-going").length;
    const abandoned = reports.filter(r => r.Report_Status === "Abandoned").length;
    const falseReports = reports.filter(r => r.Report_Status === "False report").length;
    const escalated = reports.filter(r => r.Report_Status === "Escalated").length;
    return { 
      completed, 
      ongoing, 
      abandoned, 
      falseReports, 
      escalated, 
      total: reports.length 
    };
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "badge";

    switch (status) {
      case "Completed":
        return (
          <span className={`${baseClasses} bg-success text-white`}>
            <CheckCircle className="me-1" size={14} />
            Completed
          </span>
        );

      case "On-Going":
      case "On-going":
        return (
          <span className={`${baseClasses} bg-warning text-dark`}>
            <Clock className="me-1" size={14} />
            In Progress
          </span>
        );

      case "Abandoned":
        return (
          <span className={`${baseClasses} bg-danger text-white`}>
            <XCircle className="me-1" size={14} />
            Abandoned
          </span>
        );

      case "Escalated":
        return (
          <span className={`${baseClasses} bg-warning text-dark`}>
            <AlertTriangle className="me-1" size={14} />
            Escalated
          </span>
        );

      case "False report":
        return (
          <span className={`${baseClasses} bg-danger text-white`}>
            <XCircle className="me-1" size={14} />
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
      return <ChevronUp className="ms-1 opacity-50" size={14} />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="ms-1" size={14} /> : 
      <ChevronDown className="ms-1" size={14} />;
  };

  type EmergencyType = "Fire" | "Crime" | "SOS" | string;
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

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <AlertCircle className="text-danger mb-3" size={48} />
                <h3 className="mb-3">Unable to Load Profile</h3>
                <p className="text-muted mb-4">{error}</p>
                <button
                  onClick={() => window.history.back()}
                  className="btn btn-primary"
                >
                  <ArrowLeft className="me-2" size={16} />
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
          color: #ffffffff;
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

        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>

      <div className="container-fluid py-4" id="user-profile-content">
        {/* Header */}
        <div className="card mb-4">
          <div className="card-header text-white py-4">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <button
                  onClick={() => window.history.back()}
                  className="btn btn-light btn-sm me-3"
                >
                  <ArrowLeft className="me-2" size={16} />
                  Back to Dashboard
                </button>
                <div>
                  <h3 className="mb-1">
                    <User className="me-2" size={24} />
                    User Profile Management
                  </h3>
                  <p className="mb-0 opacity-75">Comprehensive user account overview with advanced analytics</p>
                </div>
              </div>
              
              <div className="d-flex gap-3 align-items-center">
                <div className="stat-badge">
                  <Shield className="me-1" size={14} />
                  User ID: {userID || 'N/A'}
                </div>
                
               {/*} <button className="btn btn-light btn-sm">
                  <Settings size={14} />
                </button>*/}
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
                  <h5 className="mb-0 text-white">
                    <User className="me-2 " size={18} />
                    Profile Information
                  </h5>
                 
                </div>
              </div>
              
              <div className="card-body text-center">
                <div className="profile-avatar">
                  {user.ProfilePhoto ? (
                    <Image
                       src={
                        user.ProfilePhoto.startsWith("http")
                          ? user.ProfilePhoto
                          : `data:image/jpeg;base64,${user.ProfilePhoto}`
                      }
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
                  <Shield className="me-1" size={12} />
                  {user.UserType}
                </span>
                
                <hr />
                
                <div className="text-start">
                  <div className="d-flex align-items-center mb-3">
                    <Mail className="text-muted me-3" size={16} />
                    <small className="text-break">{user.Email}</small>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <Phone className="text-muted me-3" size={16} />
                    <small>{user.PhoneNumber || "Not provided"}</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <Calendar className="text-muted me-3" size={16} />
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
                <h5 className="mb-0 text-white">
                  <Activity className="me-2" size={18} />
                  Activity Analytics
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
                      <small className="text-muted d-block mb-2">Success Rate</small>
                      <div className="completion-bar mb-2">
                        <div 
                          className="completion-fill"
                          style={{ width: `${((stats.completed + stats.escalated) / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <small className="text-success fw-bold">
                        {Math.round(((stats.completed + stats.escalated) / stats.total) * 100)}% Success Rate
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
                  <div className="mb-1 text-white">
                    <h5 className="mb-1 text-white">
                      <FileText className="me-2" size={18} />
                      Incident Reports Database
                    </h5>

                    <small className="text-muted text-white">
                      {reports.length} {reports.length === 1 ? 'report' : 'reports'} submitted • 
                      Last updated: {reports.length > 0 ? new Date(Math.max(...reports.map(r => new Date(r.dateReported).getTime()))).toLocaleDateString() : 'Never'}
                    </small>
                  </div>
                 {/* <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary">
                      <Filter className="me-1" size={14} />
                      Filter
                    </button>
                  </div>*/}
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
                    <AlertCircle className="text-danger mb-3" size={48} />
                    <h5 className="mb-3">Unable to Load Reports</h5>
                    <p className="text-muted">{reportsError}</p>
                  </div>
                )}

                {reports.length === 0 && !reportsLoading && (
                  <div className="text-center py-5">
                    <FileText className="text-muted mb-3 opacity-50" size={48} />
                    <h5 className="mb-3">No Reports Found</h5>
                    <p className="text-muted">This user has not submitted any incident reports yet.</p>
                    <small className="text-muted">Reports will appear here once the user starts submitting them.</small>
                  </div>
                )}

                {reports.length > 0 && (
                  <div className="table-responsive text-black ">
                    <table className="table table-hover mb-0 text-black">
                      <thead>
                        <tr>
                          <th 
                            className="cursor-pointer text-black"
                            onClick={() => requestSort('ReportID')}
                          >
                            Report ID
                            {getSortIcon('ReportID')}
                          </th>
                          <th className="text-black">Report Details</th>
                          <th className="text-black">Location</th>
                          <th className="text-black">Status</th>
                          <th 
                            className="cursor-pointer text-black"
                            onClick={() => requestSort('dateReported')}
                          >
                            Date Submitted
                            {getSortIcon('dateReported')}
                          </th>
                          <th className="text-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedReports.map((report, index) => {
                          const priority = getPriorityLevel(report.EmergencyType);
                          return (
                            <tr key={report.ReportID} className={index % 2 === 0 ? 'table-light' : ''}>
                              <td>
                                <button
                                  className="btn btn-link p-0 fw-bold"
                                  onClick={() => router.push(`/Report?id=${report.ReportID}`)}
                                >
                                  #{report.ReportID}
                                </button>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span className={`priority-dot ${priority.color}`}></span>
                                  <div>
                                    <div className="fw-semibold">{report.EmergencyType}</div>
                                    <small className="text-muted text-truncate d-block" style={{maxWidth: '250px'}}>
                                      {report.EmerDescription}
                                    </small>
                                    <small className="badge bg-light text-dark">
                                      {priority.level}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <MapPin className="text-muted me-2" size={14} />
                                  <small>{report.Report_Location}</small>
                                </div>
                              </td>
                              <td>
                                {getStatusBadge(report.Report_Status)}
                              </td>
                              <td>
                                <div>
                                  <div className="d-flex align-items-center">
                                    <Calendar className="text-muted me-2" size={14} />
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
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => router.push(`/Report?id=${report.ReportID}`)}
                                    title="View Details"
                                  >
                                    <FileText size={14} />
                                  </button>
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