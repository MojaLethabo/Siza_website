"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

type User = {
  UserID: number;
  FullName: string;
  Email: string;
  ProfilePhoto?: string;
};

type Nomination = {
  NominationID: number;
  NomineeID: number;
  NominatedBy: number;
  Status: "Pending" | "Accepted" | "Rejected";
  NominatedAt: string;
  RespondedAt?: string;
  Message?: string;
  VoteCount: number;
};

type Vote = {
  VoteID: number;
  VoterID: number;
  NomineeID: number;
  VotedAt: string;
};

type VotingSettings = {
  SettingID?: number;
  VotingEnabled: boolean;
  StartDate: string;
  EndDate: string;
  UpdatedBy?: number;
  UpdatedAt?: string;
};

const DefaultProfileIcon = ({ className = "w-12 h-12" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} text-slate-400`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

export default function VotingSessionPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const pathname = usePathname();

  const [votingSettings, setVotingSettings] = useState<VotingSettings>({
    VotingEnabled: false,
    StartDate: new Date().toISOString(),
    EndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);
  const [hasSessionEnded, setHasSessionEnded] = useState(false);

  const BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://myappapi-yo3p.onrender.com";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Add to fetchData function
        const endCheckRes = await fetch(
          "https://myappapi-yo3p.onrender.com/api/voting-settings/has-ended"
        );
        const endCheckData = await endCheckRes.json();
        setHasSessionEnded(endCheckData.hasEnded);

        // First: Check and disable expired sessions
        await fetch(
          "https://myappapi-yo3p.onrender.com/api/voting-settings/check-expiry",
          { method: "PUT" }
        );

        const [settingsRes, nominationsRes, votesRes, usersRes] =
          await Promise.all([
            fetch(`${BASE}/api/voting-settings`),
            fetch(`${BASE}/api/nominations`),
            fetch(`${BASE}/api/votes`),
            fetch(`${BASE}/api/users-minimal`),
          ]);

        setVotingSettings(await settingsRes.json());
        setNominations(await nominationsRes.json());
        setVotes(await votesRes.json());
        setUsers(await usersRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (votes.length > 0) {
      const counts = votes.reduce((acc, vote) => {
        acc[vote.NomineeID] = (acc[vote.NomineeID] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      setVoteCounts(counts);
      setNominations((prevNominations) =>
        prevNominations.map((nomination) => ({
          ...nomination,
          VoteCount: counts[nomination.NomineeID] || 0,
        }))
      );
    }
  }, [votes]);

  const toggleVotingSession = async () => {
    const newSettings = {
      ...votingSettings,
      VotingEnabled: !votingSettings.VotingEnabled,
      UpdatedBy: currentUser?.UserID,
    };
    try {
      const response = await fetch(`${BASE}/api/voting-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });
      if (response.ok) {
        setVotingSettings(newSettings);
      }
    } catch (error) {
      console.error("Error updating voting settings:", error);
    }
  };

  const updateVotingDates = async (start: Date, end: Date) => {
    const newSettings = {
      ...votingSettings,
      StartDate: start.toISOString(),
      EndDate: end.toISOString(),
      UpdatedBy: currentUser?.UserID,
    };
    try {
      const response = await fetch(`${BASE}/api/voting-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });
      if (response.ok) {
        setVotingSettings(newSettings);
      }
    } catch (error) {
      console.error("Error updating voting dates:", error);
    }
  };

  const getUserById = (id: number) => {
    return users.find((user) => user.UserID === id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // subtract 2 hours (in ms)
    date.setHours(date.getHours() - 2);

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Add promoteUser function to your component
  const promoteUser = async (userId: number) => {
    try {
      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/community-members/${userId}/promote`,
        { method: "PUT" }
      );

      if (response.ok) {
        //const result = await response.json();
        alert(`Successfully promoted user to Community Leader!`);
      } else {
        alert("Failed to promote user. Please try again.");
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      alert("An error occurred while promoting the user.");
    }
  };

  const handleVote = async (nomineeId: number) => {
    if (!currentUser) return;

    try {
      const newVote: Omit<Vote, "VoteID"> = {
        VoterID: currentUser.UserID,
        NomineeID: nomineeId,
        VotedAt: new Date().toISOString(),
      };
      const response = await fetch(`${BASE}/api/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newVote),
      });
      if (response.ok) {
        const votesRes = await fetch(`${BASE}/api/votes`);
        setVotes(await votesRes.json());
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  const hasUserVoted = useMemo(() => {
    return currentUser
      ? votes.some((vote) => vote.VoterID === currentUser.UserID)
      : false;
  }, [votes, currentUser]);

  const sortedNominations = useMemo(() => {
    return [...nominations].sort((a, b) => b.VoteCount - a.VoteCount);
  }, [nominations]);

  const topNominees = useMemo(() => {
    return sortedNominations.slice(0, 3);
  }, [sortedNominations]);

  const votingStats = useMemo(() => {
    const totalVotes = votes.length;
    const totalVoters = [...new Set(votes.map((vote) => vote.VoterID))].length;
    const participationRate =
      users.length > 0 ? Math.round((totalVoters / users.length) * 100) : 0;
    return {
      totalVotes,
      totalVoters,
      participationRate,
    };
  }, [votes, users]);

  const NominationDetailsModal = ({
    nomination,
    onClose,
  }: {
    nomination: Nomination;
    onClose: () => void;
  }) => {
    const nominee = getUserById(nomination.NomineeID);
    const nominator = getUserById(nomination.NominatedBy);
    // Check if voting session is active
    const isVotingActive = votingSettings.VotingEnabled;
    // Check if current time is after end date (session ended)
    const isSessionEnded = hasSessionEnded;
    const isCurrentUser = currentUser?.UserID === nomination.NomineeID;
    const hasVotedFor = currentUser
      ? votes.some(
          (vote) =>
            vote.VoterID === currentUser.UserID &&
            vote.NomineeID === nomination.NomineeID
        )
      : false;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Nomination Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
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

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {nominee?.ProfilePhoto ? (
                    <img
                      className="h-16 w-16 rounded-full"
                      src={
                        nominee.ProfilePhoto.startsWith("http")
                          ? nominee.ProfilePhoto
                          : `data:image/jpeg;base64,${nominee.ProfilePhoto}`
                      }
                      alt={nominee.FullName}
                    />
                  ) : (
                    <DefaultProfileIcon className="h-16 w-16" />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    {nominee?.FullName || "Unknown User"}
                  </h4>
                  <p className="text-gray-600">Nominee</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {nominator?.ProfilePhoto ? (
                    <img
                      className="h-16 w-16 rounded-full"
                      src={nominator.ProfilePhoto}
                      alt={nominator.FullName}
                    />
                  ) : (
                    <DefaultProfileIcon className="h-16 w-16" />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    {nominator?.FullName || "Unknown User"}
                  </h4>
                  <p className="text-gray-600">Nominated By</p>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-500">STATUS</h5>
                <div
                  className={`mt-1 px-3 py-1 inline-flex text-sm font-medium rounded-full ${
                    nomination.Status === "Accepted"
                      ? "bg-green-100 text-green-800"
                      : nomination.Status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {nomination.Status}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-500">MESSAGE</h5>
                <p className="mt-1 text-gray-700">
                  {nomination.Message || "No message provided"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-500">
                    NOMINATED AT
                  </h5>
                  <p className="mt-1 text-gray-700">
                    {formatDate(nomination.NominatedAt)}
                  </p>
                </div>
                {nomination.RespondedAt && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">
                      RESPONDED AT
                    </h5>
                    <p className="mt-1 text-gray-700">
                      {formatDate(nomination.RespondedAt)}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-gray-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="text-gray-700 font-medium">
                      {nomination.VoteCount} votes
                    </span>
                  </div>

                  {!isCurrentUser && currentUser && (
                    <button
                      onClick={() => handleVote(nomination.NomineeID)}
                      disabled={hasUserVoted || hasVotedFor}
                      className={`px-4 py-2 rounded-md font-medium ${
                        hasUserVoted || hasVotedFor
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {hasVotedFor
                        ? "Vote Submitted"
                        : hasUserVoted
                        ? "Already Voted"
                        : "Vote for Nominee"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  {/* Add promotion button at the bottom */}
                  {!isVotingActive && isSessionEnded && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => nominee && promoteUser(nominee.UserID)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Promote to Community Leader
                      </button>
                      <p className="text-gray-500 text-sm mt-2 text-center">
                        This nominee has been elected and will now become a
                        community leader
                      </p>
                    </div>
                  )}
                  {/* Disabled state when voting is active */}
                  {isVotingActive && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 font-medium py-3 px-4 rounded-lg flex items-center justify-center cursor-not-allowed"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Promotion available after voting ends
                      </button>
                    </div>
                  )}
                  {/* Disabled state when session hasn't ended */}
                  {!isVotingActive && !isSessionEnded && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        disabled
                        className="w-full bg-yellow-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center cursor-not-allowed"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Voting session ended but results pending
                      </button>
                    </div>
                  )}{" "}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading voting session data...</p>
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

        .leader-badge {
          background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
          color: #7a5c00;
          font-weight: bold;
        }

        .nomination-status-badge {
          min-width: 80px;
          text-align: center;
        }
      `}</style>

      <div className="container-fluid py-4">
        {selectedNomination && (
          <NominationDetailsModal
            nomination={selectedNomination}
            onClose={() => setSelectedNomination(null)}
          />
        )}

        <div className="card">
          <div className="card-header text-white py-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-1">
                  <i className="fas fa-vote-yea me-2"></i>
                  Voting Session Manager
                </h3>
                <p className="mb-0 opacity-75">
                  Control and monitor ongoing voting sessions
                </p>
              </div>

              <div className="d-flex gap-3 align-items-center">
                <div className="stat-badge">
                  <i className="fas fa-users me-1"></i>
                  {users.length} Members
                </div>
                <div className="stat-badge">
                  <i className="fas fa-check-circle me-1"></i>
                  {votingStats.totalVotes} Votes
                </div>
                <div className="stat-badge">
                  <i className="fas fa-chart-pie me-1"></i>
                  {votingStats.participationRate}% Participation
                </div>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="p-4">
              {/* Voting Status Section */}
              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-semibold">
                    <i className="fas fa-cog me-2"></i>
                    Voting Session Status
                  </h4>
                 <div
  className={`px-3 py-1 rounded-pill text-white ${
    votingSettings.VotingEnabled
      ? "bg-success bg-opacity-10"
      : "bg-secondary bg-opacity-10"
  }`}
>
  <i
    className={`fas ${
      votingSettings.VotingEnabled
        ? "fa-check-circle"
        : "fa-pause-circle"
    } me-1`}
  ></i>
  {votingSettings.VotingEnabled ? "Active" : "Inactive"}
</div>

                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Session Status</h6>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={votingSettings.VotingEnabled}
                              onChange={toggleVotingSession}
                              style={{ width: "2.5em", height: "1.5em" }}
                            />
                          </div>
                        </div>
                        <i className="fas fa-power-off fs-4 text-primary"></i>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 border rounded">
                      <h6 className="text-muted mb-1">Start Date</h6>
                      <h5 className="mb-0">
                        {formatDate(votingSettings.StartDate)}
                      </h5>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 border rounded">
                      <h6 className="text-muted mb-1">End Date</h6>
                      <h5 className="mb-0">
                        {formatDate(votingSettings.EndDate)}
                      </h5>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      const start = new Date();
                      const end = new Date(
                        Date.now() + 7 * 24 * 60 * 60 * 1000
                      );
                      updateVotingDates(start, end);
                    }}
                    className="btn btn-outline-primary"
                  >
                    <i className="fas fa-calendar-week me-2"></i>1 Week Session
                  </button>

                  <button
                    onClick={() => {
                      const start = new Date();
                      const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
                      updateVotingDates(start, end);
                    }}
                    className="btn btn-outline-primary"
                  >
                    <i className="fas fa-clock me-2"></i>
                    24-Hour Session
                  </button>

                  <button
                    onClick={() => toggleVotingSession()}
                    className={`btn ${
                      votingSettings.VotingEnabled
                        ? "btn-danger"
                        : "btn-success"
                    }`}
                  >
                    <i
                      className={`fas ${
                        votingSettings.VotingEnabled ? "fa-stop" : "fa-play"
                      } me-2`}
                    ></i>
                    {votingSettings.VotingEnabled
                      ? "Stop Voting"
                      : "Start Voting"}
                  </button>
                </div>
              </div>

              {/* Top Nominees Section */}
              {votingSettings.VotingEnabled && (
                <div className="mb-5">
                  <h4 className="fw-semibold mb-3">
                    <i className="fas fa-trophy me-2 text-warning"></i>
                    Current Leaders
                  </h4>

                  <div className="row g-4">
                    {topNominees.map((nomination, index) => {
                      const nominee = getUserById(nomination.NomineeID);
                      const isCurrentUser =
                        currentUser?.UserID === nomination.NomineeID;
                      const hasVotedFor = currentUser
                        ? votes.some(
                            (vote) =>
                              vote.VoterID === currentUser.UserID &&
                              vote.NomineeID === nomination.NomineeID
                          )
                        : false;

                      return (
                        <div key={nomination.NominationID} className="col-md-4">
                          <div
                            className={`card h-100 border-0 shadow-sm ${
                              index === 0 ? "border-warning border-2" : ""
                            }`}
                          >
                            <div className="card-body text-center">
                              {index === 0 && (
                                <div className="position-absolute top-0 start-50 translate-middle">
                                  <span className="badge leader-badge rounded-pill px-3 py-1">
                                    <i className="fas fa-crown me-1"></i>
                                    Leader
                                  </span>
                                </div>
                              )}

                              <div className="avatar mx-auto mb-3">
                                {nominee?.ProfilePhoto ? (
                                  <img
                                    src={
                        nominee.ProfilePhoto.startsWith("http")
                          ? nominee.ProfilePhoto
                          : `data:image/jpeg;base64,${nominee.ProfilePhoto}`
                      }
                                    alt={nominee.FullName}
                                    className="rounded-circle w-100 h-100 object-cover"
                                  />
                                ) : (
                                  <>
                                    {nominee?.FullName.charAt(
                                      0
                                    ).toUpperCase() || "U"}
                                  </>
                                )}
                              </div>

                              <h5 className="mb-1">
                                {nominee?.FullName || "Unknown User"}
                                {isCurrentUser && (
                                  <span className="badge bg-primary ms-2">
                                    You
                                  </span>
                                )}
                              </h5>
                              <p className="text-muted mb-3">
                                {nomination.VoteCount} votes
                              </p>

                              {!isCurrentUser && currentUser && (
                                <button
                                  onClick={() =>
                                    handleVote(nomination.NomineeID)
                                  }
                                  disabled={hasUserVoted || hasVotedFor}
                                  className={`btn btn-sm ${
                                    hasUserVoted || hasVotedFor
                                      ? "btn-outline-secondary"
                                      : "btn-primary"
                                  }`}
                                >
                                  {hasVotedFor ? (
                                    <>
                                      <i className="fas fa-check me-1"></i>
                                      Voted
                                    </>
                                  ) : hasUserVoted ? (
                                    "Already Voted"
                                  ) : (
                                    <>
                                      <i className="fas fa-vote-yea me-1"></i>
                                      Vote Now
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nominations Section */}
              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-semibold">
                    <i className="fas fa-users me-2"></i>
                    Nominations
                    <span className="badge bg-primary ms-2">
                      {nominations.length}
                    </span>
                  </h4>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Nominee</th>
                        <th>Nominated By</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Votes</th>
                        <th className="text-center">Date</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nominations.map((nomination) => {
                        const nominee = getUserById(nomination.NomineeID);
                        const nominator = getUserById(nomination.NominatedBy);

                        return (
                          <tr key={nomination.NominationID}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar me-2">
                                  {nominee?.ProfilePhoto ? (
                                    <img
                                      src={
                        nominee.ProfilePhoto.startsWith("http")
                          ? nominee.ProfilePhoto
                          : `data:image/jpeg;base64,${nominee.ProfilePhoto}`
                      }
                                      alt={nominee.FullName}
                                      className="rounded-circle w-100 h-100 object-cover"
                                    />
                                  ) : (
                                    <>
                                      {nominee?.FullName.charAt(
                                        0
                                      ).toUpperCase() || "U"}
                                    </>
                                  )}
                                </div>
                                <div>
                                  <div className="fw-semibold">
                                    {nominee?.FullName || "Unknown User"}
                                  </div>
                                  <small className="text-muted">
                                    {nominee?.Email || "No email"}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar me-2">
                                  {nominator?.ProfilePhoto ? (
                                    <img
                                     
                                      src={
                        nominator.ProfilePhoto.startsWith("http")
                          ? nominator.ProfilePhoto
                          : `data:image/jpeg;base64,${nominator.ProfilePhoto}`
                      }
                                      alt={nominator.FullName}
                                      className="rounded-circle w-100 h-100 object-cover"
                                    />
                                  ) : (
                                    <>
                                      {nominator?.FullName.charAt(
                                        0
                                      ).toUpperCase() || "U"}
                                    </>
                                  )}
                                </div>
                                <div>
                                  <div className="fw-semibold">
                                    {nominator?.FullName || "Unknown User"}
                                  </div>
                                  <small className="text-muted">
                                    {nominator?.Email || "No email"}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td className="text-center">
                              <span
                                className={`badge nomination-status-badge ${
                                  nomination.Status === "Accepted"
                                    ? "bg-success"
                                    : nomination.Status === "Rejected"
                                    ? "bg-danger"
                                    : "bg-warning"
                                }`}
                              >
                                {nomination.Status}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-primary">
                                {nomination.VoteCount}
                              </span>
                            </td>
                            <td className="text-center">
                              <small className="text-muted">
                                {formatDate(nomination.NominatedAt)}
                              </small>
                            </td>
                            <td className="text-center">
                              <button
                                onClick={() =>
                                  setSelectedNomination(nomination)
                                }
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="fas fa-eye me-1"></i>
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Votes Section */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-semibold">
                    <i className="fas fa-check-circle me-2"></i>
                    Recent Votes
                    <span className="badge bg-primary ms-2">
                      {votes.length}
                    </span>
                  </h4>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Voter</th>
                        <th>Nominee</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {votes.map((vote) => {
                        const voter = getUserById(vote.VoterID);
                        const nominee = getUserById(vote.NomineeID);
                        return (
                          <tr key={vote.VoteID}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar me-2">
                                  {voter?.ProfilePhoto ? (
                                    <img
                                      src={voter.ProfilePhoto}
                                      alt={voter.FullName}
                                      className="rounded-circle w-100 h-100 object-cover"
                                    />
                                  ) : (
                                    <>
                                      {voter?.FullName.charAt(
                                        0
                                      ).toUpperCase() || "U"}
                                    </>
                                  )}
                                </div>
                                <div>
                                  <div className="fw-semibold">
                                    {voter?.FullName || "Unknown User"}
                                  </div>
                                  <small className="text-muted">
                                    {voter?.Email || "No email"}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar me-2">
                                  {nominee?.ProfilePhoto ? (
                                    <img
                                      src={
                        nominee.ProfilePhoto.startsWith("http")
                          ? nominee.ProfilePhoto
                          : `data:image/jpeg;base64,${nominee.ProfilePhoto}`
                      }
                                      alt={nominee.FullName}
                                      className="rounded-circle w-100 h-100 object-cover"
                                    />
                                  ) : (
                                    <>
                                      {nominee?.FullName.charAt(
                                        0
                                      ).toUpperCase() || "U"}
                                    </>
                                  )}
                                </div>
                                <div>
                                  <div className="fw-semibold">
                                    {nominee?.FullName || "Unknown User"}
                                  </div>
                                  <small className="text-muted">
                                    {nominee?.Email || "No email"}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">
                                {formatDate(vote.VotedAt)}
                              </small>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="card-footer bg-light py-3">
            <div className="text-center text-muted small">
              <i className="fas fa-clock me-1"></i>
              Last updated: {formatDate(new Date().toISOString())}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
