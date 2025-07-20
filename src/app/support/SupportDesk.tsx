"use client";

import React, { useState, useMemo } from "react";

// Ticket interface
type TicketStatus = "New" | "Open" | "Urgent" | "Closed";
interface Ticket {
  id: number;
  title: string;
  email: string;
  message: string;
  createdAt: Date;
  status: TicketStatus;
}

// Sample tickets data
const initialTickets: Ticket[] = [
  {
    id: 1023,
    title: "Login Issue",
    email: "alice@example.com",
    message: "Cannot login with correct credentials.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: "Open",
  },
  {
    id: 1022,
    title: "Data Export Failing",
    email: "bob@example.com",
    message: "Export throws server error 500.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: "Urgent",
  },
  {
    id: 1021,
    title: "Feature Request: Dark Mode",
    email: "carol@example.com",
    message: "Please add dark mode.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: "Closed",
  },
  {
    id: 1020,
    title: "Unable to Upload Avatar",
    email: "dave@example.com",
    message: "Avatar upload hangs.",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: "New",
  },
  // ... more tickets
];

export default function SupportDeskClient() {
  const [tickets] = useState<Ticket[]>(initialTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const pageSize = 5;

  // Filtered and sorted tickets
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tickets
      .filter(
        (t) =>
          String(t.id).includes(term) ||
          t.title.toLowerCase().includes(term) ||
          t.email.toLowerCase().includes(term)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [tickets, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  // Relative time formatter
  function formatTime(date: Date) {
    const diff = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const year = 365 * day;

    if (diff < hour) return `${Math.floor(diff / minute)} minutes ago`;
    if (diff < 2 * hour) return `1 hour ago`;
    if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
    if (diff < 2 * day) return `1 day ago`;
    if (diff < week) return `${Math.floor(diff / day)} days ago`;
    if (diff < year) return `${Math.floor(diff / week)} weeks ago`;
    return `${Math.floor(diff / year)} years ago`;
  }

  return (
    <div className="page-inner">
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card p-4">
              <h4 className="mb-4">Support Desk</h4>

              {/* Search */}
              <div className="mb-3">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setCurrentPage(1)}
                  >
                    <i className="fa fa-search" />
                  </button>
                </div>
              </div>

              {/* Ticket list */}
              <ul className="list-group">
                {paginated.map((t) => (
                  <li
                    key={t.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>
                        [#{t.id}] {t.title}
                      </strong>
                      <br />
                      <small className="text-muted">
                        Submitted by {t.email} &middot;{" "}
                        {formatTime(t.createdAt)}
                      </small>
                    </div>
                    <span
                      className={`badge me-3 ${
                        t.status === "New"
                          ? "bg-primary"
                          : t.status === "Open"
                          ? "bg-warning text-dark"
                          : t.status === "Urgent"
                          ? "bg-danger"
                          : "bg-success"
                      }`}
                    >
                      {t.status}
                    </span>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setActiveTicket(t)}
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <nav className="mt-4">
                <ul className="pagination justify-content-center mb-0">
                  {[...Array(totalPages)].map((_, i) => (
                    <li
                      key={i + 1}
                      className={`page-item ${
                        currentPage === i + 1 ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {activeTicket && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setActiveTicket(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ticket [#{activeTicket.id}]</h5>
                <button
                  className="btn-close"
                  onClick={() => setActiveTicket(null)}
                />
              </div>
              <div className="modal-body">
                <p>
                  <strong>Title:</strong> {activeTicket.title}
                </p>
                <p>
                  <strong>Submitted by:</strong> {activeTicket.email}
                </p>
                <p>
                  <strong>Created at:</strong>{" "}
                  {activeTicket.createdAt.toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> {activeTicket.status}
                </p>
                <hr />
                <p>{activeTicket.message}</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveTicket(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
