// components/SleepModal.tsx
import React, { useState } from "react";

interface SleepModalProps {
  member: {
    UserID: number;
    FullName: string;
  };
  onClose: () => void;
  onSleep: (duration: number) => void;
}

const SleepModal: React.FC<SleepModalProps> = ({
  member,
  onClose,
  onSleep,
}) => {
  const [duration, setDuration] = useState<number>(24);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (duration < 1) {
      setError("Duration must be at least 1 hour");
      return;
    }

    onSleep(duration);
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Put User to Sleep</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p>
                Putting <strong>{member.FullName}</strong> to sleep will
                temporarily restrict their access to the app.
              </p>

              <div className="mb-3">
                <label htmlFor="duration" className="form-label">
                  Sleep Duration (hours)
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min="1"
                  max="720" // 30 days
                  required
                />
                <div className="form-text">
                  User will be unable to access the app for this duration
                </div>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-danger">
                Confirm Sleep
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SleepModal;
