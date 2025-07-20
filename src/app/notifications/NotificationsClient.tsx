"use client";

import React, { useState, useMemo } from "react";

type Notification = {
  id: number;
  title: string;
  body: string;
  createdAt: Date; // use a real Date to sort by
  seen: boolean;
};

// sample data with timestamps
const notifications: Notification[] = [
  {
    id: 1,
    title: "New user registered",
    body: "A new user with username 'jsmith' has just registered.",
    createdAt: new Date("2025-06-20T14:30:00"),
    seen: false,
  },
  {
    id: 2,
    title: "Account deregistered",
    body: "User 'adoe' has deregistered their account on 28 Mar, 2025.",
    createdAt: new Date("2025-06-19T09:15:00"),
    seen: true,
  },
  // …add more items with proper createdAt…
];

export default function NotificationsClient() {
  const [active, setActive] = useState<Notification | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // memoize sorted list
  const sorted = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (sortOrder === "newest") {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
    });
  }, [sortOrder]);

  return (
    <div className="page-inner">
      <div className="container-fluid py-5">
        <div
          className="card mx-auto"
          style={{ maxWidth: "800px", borderRadius: "8px" }}
        >
          {/* Header with sort dropdown */}
          <div className="card-header d-flex justify-content-between align-items-center bg-white">
            <h4 className="mb-0">Notifications</h4>
            {/* React‐controlled dropdown */}
            <div className="dropdown" style={{ position: "relative" }}>
              <button
                className="btn btn-outline-secondary btn-sm dropdown-toggle"
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
              >
                Sort: {sortOrder === "newest" ? "Newest" : "Oldest"}
              </button>

              <ul className={`dropdown-menu${dropdownOpen ? " show" : ""}`}>
                <li>
                  <button
                    className={`dropdown-item${
                      sortOrder === "newest" ? " active" : ""
                    }`}
                    onClick={() => {
                      setSortOrder("newest");
                      setDropdownOpen(false);
                    }}
                  >
                    Newest
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item${
                      sortOrder === "oldest" ? " active" : ""
                    }`}
                    onClick={() => {
                      setSortOrder("oldest");
                      setDropdownOpen(false);
                    }}
                  >
                    Oldest
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Notification list */}
          <div className="card-body p-0">
            <ul className="list-group list-group-flush">
              {sorted.map((n) => (
                <li
                  key={n.id}
                  className="list-group-item d-flex justify-content-between align-items-start"
                >
                  <div>
                    <span
                      className={`badge ${
                        n.seen ? "bg-success" : "bg-danger"
                      } me-2`}
                    >
                      &nbsp;
                    </span>
                    <strong>{n.title}:</strong>{" "}
                    <small className="text-muted">
                      {n.createdAt.toLocaleString()}
                    </small>
                  </div>
                  <button
                    className="btn btn-link btn-sm"
                    onClick={() => setActive(n)}
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* React-controlled Modal */}
      {active && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setActive(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{active.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActive(null)}
                />
              </div>
              <div className="modal-body">{active.body}</div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActive(null)}
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
