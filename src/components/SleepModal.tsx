import React, { useState } from "react";
import { X, Clock, Shield, User } from "lucide-react";
import ReactDOM from "react-dom"; // Add this import

interface SleepModalProps {
  member?: {
    UserID: number;
    FullName: string;
  };
  onClose: () => void;
  onSleep: (duration: number, sleepType: string) => void;
}

const SleepModal: React.FC<SleepModalProps> = ({
  member,
  onClose,
  onSleep,
}) => {
  const [duration, setDuration] = useState<number>(24);
  const [sleepType, setSleepType] = useState<string>("Both");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (duration < 1) {
      setError("Duration must be at least 1 hour");
      return;
    }

    onSleep(duration, sleepType);
  };

  const getSleepTypeIcon = (type: string) => {
    switch (type) {
      case "Broadcast":
        return "📢";
      case "Report":
        return "📊";
      default:
        return "🔒";
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header with gradient */}
        <div
          className="px-6 py-4 text-white relative"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold">User Restriction</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info Card */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Restricting access for</p>
                <p className="font-semibold text-gray-900">
                  {member?.FullName || "Unknown User"}
                </p>
              </div>
            </div>
          </div>

          {/* Restriction Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Restriction Type
            </label>
            <div className="relative">
              <select
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white text-gray-900 font-medium transition-all duration-200"
                value={sleepType}
                onChange={(e) => setSleepType(e.target.value)}
                required
              >
                <option value="Broadcast">Broadcast Only</option>
                <option value="Report">Report Only</option>
                <option value="Both">Both Features</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Select which functionality to restrict
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Sleep Duration (hours)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="1"
                max="720"
                required
                placeholder="24"
              />
            </div>
            <p className="text-xs text-gray-500">
              User will be unable to access selected features for this duration
              (max 720 hours)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                boxShadow: "0 4px 12px rgba(255, 0, 0, 0.3)",
              }}
            >
              Confirm Restriction
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default SleepModal;
