import React from "react";
import {
  X,
  Flag,
  CheckCircle,
  Calendar,
  User,
  Hash,
  FileText,
} from "lucide-react";
import ReactDOM from "react-dom";

// Define proper interface instead of 'any'
interface Flag {
  FlagID: number;
  FlagType: string;
  Description?: string;
  CreatedAt?: string;
  ReporterName?: string;
  Status: string;
}

interface FlagDetailsModalProps {
  flags: Flag[];
  onClose: () => void;
}

const FlagDetailsModal: React.FC<FlagDetailsModalProps> = ({
  flags,
  onClose,
}) => {
  const getStatusColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "spam":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "inappropriate":
        return "bg-red-100 text-red-800 border-red-200";
      case "harassment":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header with gradient */}
        <div
          className="px-6 py-4 text-white relative flex-shrink-0"
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
                <Flag className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Flag Details</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {flags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Flags Found
              </h3>
              <p className="text-gray-600 text-center">
                This user has no flags on their account.
              </p>
            </div>
          ) : (
            <div
              className="p-6 overflow-auto"
              style={{
                maxHeight: "calc(90vh - 200px)",
                scrollbarWidth: "thin",
                scrollbarColor: "#764ba2 #f1f1f1",
              }}
            >
              {/* Custom scrollbar styles for WebKit browsers */}
              <style>
                {`
                  ::-webkit-scrollbar {
                    width: 8px;
                  }
                  ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                  }
                  ::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 4px;
                  }
                  ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, #e60000 0%, #5a3d7a 100%);
                  }
                `}
              </style>
              <div className="p-6 overflow-auto">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Found{" "}
                    <span className="font-semibold text-gray-900">
                      {flags.length}
                    </span>{" "}
                    flag{flags.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="space-y-4">
                  {flags.map((flag, index) => (
                    <div
                      key={flag.FlagID || index}
                      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                            style={{
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            }}
                          >
                            <Hash className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              Flag #{flag.FlagID}
                            </p>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                                flag.FlagType
                              )}`}
                            >
                              {flag.FlagType}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Description
                              </p>
                              <p className="text-sm text-gray-900 mt-1">
                                {flag.Description || "No description provided"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Reported At
                              </p>
                              <p className="text-sm text-gray-900 mt-1">
                                {flag.CreatedAt
                                  ? new Date(flag.CreatedAt).toLocaleString()
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Reported By
                              </p>
                              <p className="text-sm text-gray-900 mt-1">
                                {flag.ReporterName || "System"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Status progress bar */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Pending</span>
                          <span>Reviewed</span>
                          <span>Resolved</span>
                        </div>
                        <div className="flex space-x-1">
                          {["Pending", "Reviewed", "Resolved"].map(
                            (status, idx) => (
                              <div
                                key={status}
                                className={`h-1 flex-1 rounded ${
                                  ["Pending", "Reviewed", "Resolved"].indexOf(
                                    flag.Status
                                  ) >= idx
                                    ? status === "Pending"
                                      ? "bg-red-400"
                                      : status === "Reviewed"
                                      ? "bg-blue-400"
                                      : "bg-green-400"
                                    : "bg-gray-200"
                                }`}
                              ></div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default FlagDetailsModal;
