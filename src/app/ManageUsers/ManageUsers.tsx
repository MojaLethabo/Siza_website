"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SleepModal from "@/components/SleepModal";

interface CommunityMember {
  UserID: number;
  FullName: string;
  Username: string;
  Email: string;
  PhoneNumber: string;
  Role: string;
  DOB: string;
  CreatedAt: string;
  HomeAddress: string;
  requests: number;
  responses: number;
  isActive: boolean;
}

const CommunityMemberManagement = () => {
  const router = useRouter();
  // Removed unused currentUser
  const { user } = useAuth();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [sortBy, setSortBy] = useState<"ID" | "Name" | "Responses">("ID");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 5;

  const fetchCommunityMembers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/getCommunityMembers");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch community members");
      }

      const data = await response.json();
      console.log("API response:", data);

      let membersArray: CommunityMember[] = [];
      if (data.success && Array.isArray(data.CommunityMembers)) {
        membersArray = data.CommunityMembers;
      } else if (Array.isArray(data)) {
        membersArray = data;
      } else {
        throw new Error("Unexpected data format from API");
      }

      const formattedMembers: CommunityMember[] = membersArray.map((member: CommunityMember) => ({
        UserID: member.UserID,
        FullName: member.FullName,
        Username: member.Username,
        Email: member.Email,
        PhoneNumber: member.PhoneNumber,
        Role: member.Role,
        DOB: member.DOB,
        CreatedAt: member.CreatedAt,
        HomeAddress: member.HomeAddress,
        requests: 0,
        responses: 0,
        isActive: true
      }));

      setMembers(formattedMembers);
    } catch (err: any) {
      setError(err.message || "Error fetching community members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityMembers();
  }, []);

  const filteredMembers = members.filter((member) =>
    [member.FullName, member.Email, member.Role].some((field) =>
      field.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === "Name") return a.FullName.localeCompare(b.FullName);
    if (sortBy === "Responses") return b.responses - a.responses;
    return a.UserID - b.UserID;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedMembers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  if (loading) {
    return (
      <div className="container py-12 text-center text-secondary">
        <div className="spinner-border" role="status" />
        <p className="mt-3">Loading community members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: "900px" }}>
      <h2 className="mb-4 text-center text-primary fw-bold" style={{ letterSpacing: 1.2 }}>
        Community Member Management
      </h2>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="dropdown">
          <button
            className="btn btn-outline-primary btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Export data
          </button>
          <ul className="dropdown-menu shadow-sm">
            <li><a className="dropdown-item" href="#">CSV</a></li>
            <li><a className="dropdown-item" href="#">Excel</a></li>
          </ul>
        </div>

        <div className="dropdown">
          <button
            className="btn btn-outline-secondary btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Sort by: <span className="text-primary fw-semibold">{sortBy}</span>
          </button>
          <ul className="dropdown-menu shadow-sm">
            <li><button className="dropdown-item" onClick={() => setSortBy("Name")}>Name</button></li>
            <li><button className="dropdown-item" onClick={() => setSortBy("Responses")}>Responses</button></li>
            <li><button className="dropdown-item" onClick={() => setSortBy("ID")}>ID</button></li>
          </ul>
        </div>

        <div className="input-group w-100 w-md-50">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {currentItems.length === 0 ? (
        <div className="text-center text-muted py-5 border rounded-3">
          No community members found.
        </div>
      ) : (
        <div className="list-group shadow-sm rounded-3">
          {currentItems.map(member => (
            <div
              key={member.UserID}
              className="list-group-item list-group-item-action d-flex flex-column flex-md-row justify-content-between align-items-center gap-3"
              style={{ backgroundColor: "#f9fafd", borderRadius: 8 }}
            >
              <div className="d-flex flex-column flex-grow-1">
                <a
                  href={`/profile/${member.UserID}`}
                  className="text-decoration-none fw-semibold fs-5 text-primary mb-1"
                  onClick={e => {
                    e.preventDefault();
                    router.push(`/User?userID=${member.UserID}`);
                  }}
                >
                  {member.FullName}
                </a>
                <div className="text-muted small">
                  @{member.Username} • {member.Role}
                </div>
                <div className="text-muted small mt-1">
                  📧 {member.Email} | 📞 {member.PhoneNumber}
                </div>
                <div className="text-muted small mt-1">
                  🏠 {member.HomeAddress}
                </div>
                <div className="text-muted small mt-1">
                  🎂 DOB: {new Date(member.DOB).toLocaleDateString()} | Joined: {new Date(member.CreatedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="d-flex flex-column align-items-center">
                <span
                  title={member.isActive ? "Active" : "Inactive"}
                  className={`badge rounded-circle mb-3`}
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: member.isActive ? "#28a745" : "#dc3545",
                    boxShadow: "0 0 6px rgba(0,0,0,0.1)"
                  }}
                />
                <button
                  className="btn btn-sm btn-outline-danger"
                  disabled={!member.isActive}
                  onClick={() => {
                    setSelectedMember(member);
                    setShowSleepModal(true);
                  }}
                  title="Put member to sleep"
                >
                  Sleep
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav aria-label="Page navigation" className="mt-4 d-flex justify-content-center">
        <ul className="pagination pagination-sm">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              aria-label="Previous"
            >
              &laquo;
            </button>
          </li>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            return (
              <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                <button className="page-link" onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              </li>
            );
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <li className="page-item disabled">
              <span className="page-link">…</span>
            </li>
          )}

          {totalPages > 5 && (
            <li className={`page-item ${currentPage === totalPages ? "active" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </button>
            </li>
          )}

          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              aria-label="Next"
            >
              &raquo;
            </button>
          </li>
        </ul>
      </nav>

    </div>
  );
};

export default CommunityMemberManagement;
