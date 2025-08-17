"use client";

import { useEffect, useState } from "react";
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
  const userID = 1;
  
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
  const baseClasses =
    "inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold border";

  switch (status) {
    case "Completed":
      return (
        <span className={`${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`}>
          <CheckCircle className="w-3 h-3 mr-1.5" />
          Completed
        </span>
      );

    case "On-Going":
      return (
        <span className={`${baseClasses} bg-orange-50 text-orange-700 border-orange-200`}>
          <Clock className="w-3 h-3 mr-1.5" />
          In Progress
        </span>
      );

    case "On-going":
      return (
        <span className={`${baseClasses} bg-orange-50 text-orange-700 border-orange-200`}>
          <Clock className="w-3 h-3 mr-1.5" />
          In Progress
        </span>
      );

    case "Abandoned":
      return (
        <span className={`${baseClasses} bg-rose-50 text-rose-700 border-rose-200`}>
          <XCircle className="w-3 h-3 mr-1.5" />
          Abandoned
        </span>
      );

    case "Escalated":
      return (
        <span className={`${baseClasses} bg-amber-50 text-amber-700 border-amber-200`}>
          <AlertTriangle className="w-3 h-3 mr-1.5" />
          Escalated
        </span>
      );

    case "False report":
      return (
        <span className={`${baseClasses} bg-red-50 text-red-700 border-red-200`}>
          <XCircle className="w-3 h-3 mr-1.5" />
          False report
        </span>
      );

    default:
      return (
        <span className={`${baseClasses} bg-slate-50 text-slate-700 border-slate-200`}>
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
      return <span className="opacity-30"><ChevronUp className="w-3 h-3 inline" /></span>;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-3 h-3 inline" /> : 
      <ChevronDown className="w-3 h-3 inline" />;
  };

type EmergencyType = "Fire" | "Crime" | "SOS" | string;  // Explicit union type
const getPriorityLevel = (type: EmergencyType) => { 
    switch (type) {
      case "Fire":
        return { color: "bg-red-500", level: "Critical" };
      case "Crime":
        return { color: "bg-blue-500", level: "High" };
      case "SOS":
        return { color: "bg-orange-500", level: "Urgent" };
      default:
        return { color: "bg-slate-500", level: "Standard" };
    }
  };

  const getReportStats = () => {
    const completed = reports.filter(r => r.Report_Status === "Completed").length;
    const ongoing = reports.filter(r => r.Report_Status === "On-Going").length;
    const Abondoned = reports.filter(r => r.Report_Status === "Abondoned").length;
    const False = reports.filter(r => r.Report_Status === "False report").length;
    const escalate = reports.filter(r => r.Report_Status === "Escalated").length;
    return { completed, ongoing, Abondoned,False, escalate, total: reports.length };
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Profile</h3>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="w-full inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-sm text-slate-600 font-medium">Loading user profile...</p>
        </div>
      </div>
    );
  }

  const stats = getReportStats();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <div className="border-l border-slate-300 pl-4">
                <h1 className="text-xl font-semibold text-slate-900">User Profile Management</h1>
                <p className="text-sm text-slate-500 mt-0.5">Comprehensive user account overview</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                User ID: {user.UserID}
              </span>
              <button className="p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-md">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-lg border border-slate-200">
              
              {/* Profile Header */}
              <div className="px-6 py-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
                  <button className="p-1 text-slate-400 hover:text-slate-600">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                      {user.ProfilePhoto ? (
                        <Image
                            src={user.ProfilePhoto}
                            alt="Profile"
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-full"
                          />
                      ) : (
                        user.FullName.split(" ").map(n => n[0]).join("").toUpperCase()
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-slate-900">{user.FullName}</h3>
                    <p className="text-sm text-slate-500">@{user.Username}</p>
                  </div>
                  
                  <div className="mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Shield className="w-3 h-3 mr-1" />
                      {user.UserType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="px-6 py-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Contact Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" />
                    <span className="text-slate-600 break-all">{user.Email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" />
                    <span className="text-slate-600">{user.PhoneNumber || "Not provided"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" />
                    <span className="text-slate-600">
                      Member since {new Date(user.CreatedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Overview */}
            <div className="bg-white shadow-sm rounded-lg border border-slate-200 mt-6">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Activity Overview</h3>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-3">
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-slate-500">Total Reports</dt>
                    <dd className="text-sm font-semibold text-slate-900">{stats.total}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-slate-500">Completed</dt>
                    <dd className="text-sm font-semibold text-emerald-600">{stats.completed}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-slate-500">In Progress</dt>
                    <dd className="text-sm font-semibold text-orange-600">{stats.ongoing}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-slate-500">Abondoned</dt>
                    <dd className="text-sm font-semibold text-rose-500">{stats.Abondoned}</dd>
                  </div>
                    <div className="flex justify-between items-center">
                    <dt className="text-sm text-slate-500">Escalated</dt>
                    <dd className="text-sm font-semibold text-amber-600">{stats.escalate}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-slate-500">False Report</dt>
                    <dd className="text-sm font-semibold text-red-500">{stats.False}</dd>
                  </div>

                </dl>
                
                {stats.total > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="text-xs text-slate-500 mb-2">Completion Rate</div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full" 
                        style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {Math.round((stats.completed / stats.total) * 100)}% Complete
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow-sm rounded-lg border border-slate-200">
              
              {/* Reports Header */}
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-slate-400" />
                      Incident Reports
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {reports.length} {reports.length === 1 ? 'report' : 'reports'} submitted by this user
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="inline-flex items-center px-3 py-2 border border-slate-300 text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                      <Download className="w-3 h-3 mr-1.5" />
                      Export
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Reports Content */}
              <div className="px-6 py-6">
                {reportsLoading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
                    <p className="text-sm text-slate-600">Loading incident reports...</p>
                  </div>
                )}

                {reportsError && (
                  <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 mb-2">Unable to Load Reports</h3>
                    <p className="text-sm text-slate-600">{reportsError}</p>
                  </div>
                )}

                {reports.length === 0 && !reportsLoading && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-sm font-medium text-slate-900 mb-2">No Reports Found</h3>
                    <p className="text-sm text-slate-500">This user has not submitted any incident reports.</p>
                  </div>
                )}

                {/* Reports Table */}
                {reports.length > 0 && (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('ReportID')}
                          >
                            <div className="flex items-center">
                              Report ID
                              <span className="ml-1">
                                {getSortIcon('ReportID')}
                              </span>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                          >
                            Report Details
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                          >
                            Location
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('dateReported')}
                          >
                            <div className="flex items-center">
                              Date Submitted
                              <span className="ml-1">
                                {getSortIcon('dateReported')}
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {sortedReports.map((report) => {
                          const priority = getPriorityLevel(report.EmergencyType);
                          return (
                            <tr key={report.ReportID} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {report.ReportID}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${priority.color} mr-3`}></div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-900">
                                      {report.EmergencyType}
                                    </div>
                                    <div className="text-sm text-slate-600 mt-1 max-w-xs truncate">
                                      {report.EmerDescription}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-slate-600">
                                  <MapPin className="w-4 h-4 text-slate-400 mr-1.5" />
                                  {report.Report_Location}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(report.Report_Status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-600 flex items-center">
                                  <Clock className="w-4 h-4 text-slate-400 mr-1.5" />
                                  {new Date(report.dateReported).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {new Date(report.dateReported).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
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
    </div>
  );
};

export default UserProfilePage;