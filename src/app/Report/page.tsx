"use client"
import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNowStrict } from "date-fns";

interface AddressResult {
  success: boolean;
  address?: string;
  error?: string;
}

async function getAddressFromCoords(
  lat: number,
  lng: number
): Promise<AddressResult> {
  try {
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return {
        success: false,
        error: "Invalid coordinates",
      };
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      {
        headers: {
          "User-Agent": "EmergencyReportApp/1.0 (emergency-report@example.com)",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
      return {
        success: true,
        address: data.display_name,
      };
    } else if (data && data.error) {
      return {
        success: false,
        error: data.error,
      };
    } else {
      return {
        success: false,
        error: "No address found for these coordinates",
      };
    }
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch address",
    };
  }
}

interface Report {
  ReportID: number;
  EmergencyType: string;
  EmerDescription: string;
  MediaPhoto: string;
  MediaVoice: string;
  SharedWith: string;
  Report_Location: string;
  Report_Status: string;
  ReporterID: number;
  dateReported: string;
}

interface Reporter {
  FullName: string;
  Email: string;
  Username: string;
  PhoneNumber: string;
  UserType: string;
  ProfilePhoto: string | null;
}

function AudioPlayer({ base64String, index }: { base64String: string; index: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!base64String) {
      setError("No audio data available");
      setIsLoading(false);
      return;
    }

    const handleAudioProcessing = async () => {
      try {
        const cleanBase64 = base64String.replace(
          /^data:audio\/\w+;base64,/,
          ""
        );

        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        setLocalAudioUrl(url);
      } catch (err) {
        setError("Failed to process audio");
        console.error("Audio processing error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    handleAudioProcessing();

    return () => {
      if (localAudioUrl) URL.revokeObjectURL(localAudioUrl);
    };
  }, [base64String, localAudioUrl]);

  const handlePlay = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      setError("Playback failed. Please allow audio playback.");
      console.error("Playback error:", err);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card border-light">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mb-0">Processing audio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger">
        <div className="card-body">
          <p className="text-danger mb-0">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-light">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="avatar-sm bg-primary bg-opacity-10 d-flex align-items-center justify-content-center rounded">
              <span className="text-primary">MIC</span>
            </div>
            <div>
              <h6 className="fw-semibold mb-1">Voice Recording {index + 1}</h6>
              <small className="text-muted">Emergency audio evidence</small>
            </div>
          </div>
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className={`btn btn-sm ${
              isPlaying 
                ? 'btn-danger' 
                : 'btn-primary'
            }`}
            disabled={!localAudioUrl}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
        {localAudioUrl && (
          <audio
            ref={audioRef}
            src={localAudioUrl}
            onEnded={() => setIsPlaying(false)}
            className="w-100 mt-3"
            controls
          />
        )}
      </div>
    </div>
  );
}

function LocationDisplay({ location }: { location: string }) {
  const [resolvedAddress, setResolvedAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!location || (!location.includes(",") && !location.includes(";"))) {
      setError("Invalid location format");
      return;
    }

    const parseAndResolveLocation = async () => {
      setIsLoading(true);
      setError("");

      try {
        const separator = location.includes(";") ? ";" : ",";
        const [latStr, lngStr] = location.split(separator).map((s) => s.trim());
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (isNaN(lat) || isNaN(lng)) {
          throw new Error("Invalid coordinates");
        }

        setCoordinates({ lat, lng });

        const result = await getAddressFromCoords(lat, lng);

        if (result.success && result.address) {
          setResolvedAddress(result.address);
        } else {
          setError(result.error || "Failed to resolve address");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse location"
        );
      } finally {
        setIsLoading(false);
      }
    };

    parseAndResolveLocation();
  }, [location]);
  
  const openInMaps = () => {
    if (coordinates) {
      const mapsUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      window.open(mapsUrl, "_blank");
    }
  };

  return (
    <div>
      <div className="d-flex gap-3 mb-3">
        <div className="avatar-sm bg-danger bg-opacity-10 d-flex align-items-center justify-content-center rounded flex-shrink-0">
          <span className="text-danger">MAP</span>
        </div>
        <div className="flex-grow-1">
          {isLoading ? (
            <div className="d-flex align-items-center gap-2">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="text-muted">Resolving address...</span>
            </div>
          ) : error ? (
            <div>
              <p className="text-danger mb-1">{error}</p>
              <p className="text-muted small mb-0">Raw coordinates: {location}</p>
            </div>
          ) : resolvedAddress ? (
            <div>
              <p className="fw-medium mb-1">{resolvedAddress}</p>
            </div>
          ) : (
            <p className="text-muted mb-0">No address available</p>
          )}
          <p className="text-muted small mb-0">Coordinates: {location}</p>
        </div>
      </div>
      {coordinates && (
        <button
          onClick={openInMaps}
          className="btn btn-primary btn-sm"
        >
          View on Google Maps
        </button>
      )}
    </div>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");
  const [report, setReport] = useState<Report | null>(null);
  const [reporter, setReporter] = useState<Reporter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!reportId) {
      setError("Missing report ID");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://myappapi-yo3p.onrender.com/getReportWithReporter?id=${reportId}`
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
          setReport(data.data.Report);
          setReporter(data.data.Reporter);
        } else {
          throw new Error(data.message || "Failed to fetch report data");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch report");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [reportId]);

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading emergency report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!report || !reporter) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning" role="alert">
          The requested emergency report could not be found.
        </div>
      </div>
    );
  }

  const statusConfig = {
    Pending: {
      color: "text-warning",
      bgColor: "bg-warning",
    },
    "In Progress": {
      color: "text-info",
      bgColor: "bg-info",
    },
    Resolved: {
      color: "text-success",
      bgColor: "bg-success",
    },
  };

  const emergencyTypeConfig = {
    Fire: { color: "text-danger", bgColor: "bg-danger", urgency: "Critical" },
    Accident: { color: "text-warning", bgColor: "bg-warning", urgency: "High" },
    Medical: { color: "text-danger", bgColor: "bg-danger", urgency: "Critical" },
    Theft: { color: "text-primary", bgColor: "bg-primary", urgency: "Medium" },
    Other: { color: "text-secondary", bgColor: "bg-secondary", urgency: "Low" },
  };

  const status = report.Report_Status;
  const emergencyConfig = emergencyTypeConfig[report.EmergencyType as keyof typeof emergencyTypeConfig] || emergencyTypeConfig.Other;

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
        
        .avatar-sm {
          width: 32px;
          height: 32px;
        }
        
        .avatar-lg {
          width: 64px;
          height: 64px;
          font-size: 1.5rem;
        }
        
        .card {
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
        }
        
        .emergency-type-card {
          border-left: 4px solid;
          padding: 1rem;
          border-radius: 0.375rem;
        }
        
        .timeline-item {
          position: relative;
          padding-left: 2rem;
        }
        
        .timeline-item::before {
          content: '';
          position: absolute;
          left: 0.5rem;
          top: 0.75rem;
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background: currentColor;
        }
        
        .timeline-item:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 0.75rem;
          top: 1.5rem;
          bottom: -1rem;
          width: 1px;
          background: #dee2e6;
        }
      `}</style>

      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2 bg-white px-3 py-2 rounded-pill shadow-sm border mb-3">
            <span className="small fw-medium text-muted">Emergency Response System</span>
          </div>
          <h1 className="h2 fw-bold text-dark mb-2">Emergency Report #{report.ReportID}</h1>
          <p className="text-muted">Detailed information and evidence for the reported emergency situation</p>
        </div>

        {/* Status Alert Bar */}
        <div className={`alert alert-${
          status === 'Pending' ? 'warning' : 
          status === 'In Progress' ? 'info' : 
          'success'
        } border-start border-4 mb-4`}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div>
                <p className="fw-semibold mb-1">Status: {status}</p>
                <p className="small mb-0">
                  {status === 'Pending' ? 'Awaiting emergency response' : 
                   status === 'In Progress' ? 'Emergency services are responding' : 
                   'Emergency has been resolved'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Main Content */}
          <div className="col-lg-8">
            {/* Emergency Details Card */}
            <div className="card mb-4">
              <div className="card-header text-white">
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar-sm bg-white bg-opacity-20 d-flex align-items-center justify-content-center rounded">
                    ALERT
                  </div>
                  <div>
                    <h5 className="mb-1">Emergency Details</h5>
                    <p className="mb-0 opacity-75 small">Critical incident information</p>
                  </div>
                </div>
              </div>
              
              <div className="card-body">
                {/* Emergency Type */}
                <div className="row g-3 mb-4">
                  <div className="col-12">
                    <div className={`emergency-type-card ${emergencyConfig.bgColor} bg-opacity-10 border-${emergencyConfig.bgColor.replace('bg-', '')}`}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h6 className="fw-semibold mb-0">Emergency Type</h6>
                      </div>
                      <p className="h5 fw-bold mb-0">{report.EmergencyType}</p>
                    </div>
                  </div>
                </div>

                {/* Time Reported */}
                <div className="bg-light rounded p-3 mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <h6 className="fw-semibold mb-0 text-muted">Time Reported</h6>
                  </div>
                  <p className="fw-medium mb-1">
                    {(() => {
                      const now = new Date();
                      const reportTime = new Date(report.dateReported);
                      const diffInMs = now.getTime() - reportTime.getTime();
                      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                      const diffInHours = Math.floor(diffInMinutes / 60);
                      const remainingMinutes = diffInMinutes % 60;
                      
                      if (diffInHours > 0) {
                        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ${remainingMinutes > 0 ? `and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` : ''} ago`;
                      } else {
                        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
                      }
                    })()}
                  </p>
                  <small className="text-muted">
                    {new Date(report.dateReported).toLocaleString()}
                  </small>
                </div>

                {/* Description */}
                <div className="bg-light rounded p-3 mb-4">
                  <h6 className="fw-semibold text-muted mb-3">Incident Description</h6>
                  <p className="mb-0 lh-lg">
                    {report.EmerDescription}
                  </p>
                </div>

                {/* Location */}
                <div className="bg-light rounded p-3 mb-4">
                  <h6 className="fw-semibold text-muted mb-3">Location</h6>
                  <LocationDisplay location={report.Report_Location} />
                </div>

                {/* Shared With */}
                <div className="bg-light rounded p-3">
                  <h6 className="fw-semibold text-muted mb-3">Notified Authorities</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {report.SharedWith.split(', ').map((authority, idx) => (
                      <span key={idx} className="badge bg-primary">
                        {authority}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Media Evidence Card */}
            <div className="card">
              <div className="card-header text-white">
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar-sm bg-white bg-opacity-20 d-flex align-items-center justify-content-center rounded">
                    CAM
                  </div>
                  <div>
                    <h5 className="mb-1">Evidence & Media</h5>
                    <p className="mb-0 opacity-75 small">Visual and audio documentation</p>
                  </div>
                </div>
              </div>
              
              <div className="card-body">
                {/* Photo Evidence */}
                {report.MediaPhoto && (
                  <div className="mb-4">
                    <h6 className="fw-semibold text-muted mb-3">
                      Photo Evidence
                    </h6>
                    <div className="row g-3">
                      {report.MediaPhoto.split(";")
                        .filter(Boolean)
                        .map((img, idx) => (
                          <div key={idx} className="col-sm-6">
                            <div className="position-relative overflow-hidden rounded border">
                             <Image
                                src={`data:image/jpeg;base64,${img}`}
                                alt={`Emergency photo ${idx + 1}`}
                                width={500}
                                height={300}
                                className="img-fluid"
                                unoptimized
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Audio Evidence 
                {report.MediaVoice && (
                  <div>
                    <h6 className="fw-semibold text-muted mb-3">
                      Audio Evidence
                    </h6>
                    <div className="d-flex flex-column gap-3">
                      {report.MediaVoice.split(";")
                        .filter(Boolean)
                        .map((audio, idx) => (
                          <AudioPlayer key={idx} base64String={audio} index={idx} />
                        ))}
                    </div>
                  </div>
                )}*/}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Quick Actions Card */}
            <div className="card mb-4">
              <div className="card-header text-white">
                <h6 className="mb-0">Quick Actions</h6>
              </div>
              <div className="card-body d-flex flex-column gap-2">
                <a
                  href={`tel:${reporter.PhoneNumber}`}
                  className="btn btn-danger d-flex align-items-center justify-content-center gap-2"
                >
                  Call Reporter Now
                </a>
                <a
                  href={`mailto:${reporter.Email}?subject=Emergency Report Update - Report #${report.ReportID}&body=Dear ${reporter.FullName},%0A%0AThis is an update regarding your emergency report #${report.ReportID} for ${report.EmergencyType}.%0A%0AStatus: ${report.Report_Status}%0A%0APlease let us know if you have any additional information or questions.%0A%0ABest regards,%0AEmergency Response Team`}
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                >
                  Send Email Update
                </a>
              </div>
            </div>

            {/* Reporter Information Card */}
            <div className="card mb-4">
              <div className="card-header text-white">
                <h6 className="mb-0">Reporter Information</h6>
              </div>
              
              <div className="card-body">
                <div className="d-flex gap-3 mb-4">
                  {reporter.ProfilePhoto ? (
                    
                    <Image
                      src={
                        reporter.ProfilePhoto.startsWith("http")
                          ? reporter.ProfilePhoto
                          : `data:image/jpeg;base64,${reporter.ProfilePhoto}`
                      }
                      alt="Reporter"
                      width={64}
                      height={64}
                      className="rounded-circle border"
                      style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                      unoptimized
                    />
                  ) : (
                    <div className="avatar avatar-lg">
                      USER
                    </div>
                  )}
                  <div className="flex-grow-1">
                    <h6 className="fw-semibold mb-1">{reporter.FullName}</h6>
                    <p className="text-muted mb-2">@{reporter.Username}</p>
                    <span className="badge bg-primary">
                      {reporter.UserType}
                    </span>
                  </div>
                </div>
                
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-3 p-2 bg-light rounded">
                    <div className="flex-grow-1">
                      <small className="text-muted">Phone</small>
                      <p className="fw-medium mb-0">{reporter.PhoneNumber}</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 p-2 bg-light rounded">
                    <div className="flex-grow-1">
                      <small className="text-muted">Email</small>
                      <p className="fw-medium mb-0 text-truncate">{reporter.Email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="card mb-4">
              <div className="card-header text-white">
                <h6 className="mb-0">Timeline</h6>
              </div>
              <div className="card-body">
                <div className="timeline-item text-danger mb-3">
                  <h6 className="fw-semibold mb-1">Report Created</h6>
                  <small className="text-muted">
                    {formatDistanceToNowStrict(new Date(report.dateReported), {
                      addSuffix: true,
                    })}
                  </small>
                  <br />
                  <small className="text-muted">
                    {new Date(report.dateReported).toLocaleString()}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="container-fluid py-4">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading emergency report...</p>
          </div>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}