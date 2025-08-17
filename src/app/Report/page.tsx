"use client"
import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Share2,
  CheckCircle,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  Camera,
  Mic,
  ExternalLink,
  Phone,
  Mail,
  Shield,
} from "lucide-react";
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
  Report_CreatedAt?: string;
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
        // Clean base64 string
        const cleanBase64 = base64String.replace(
          /^data:audio\/\w+;base64,/,
          ""
        );

        // Convert to Blob
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
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
          <p className="text-slate-600 text-sm">Processing audio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4 shadow-sm">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <Mic className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Voice Recording {index + 1}</p>
            <p className="text-sm text-slate-500">Emergency audio evidence</p>
          </div>
        </div>
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            isPlaying 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
          disabled={!localAudioUrl}
        >
          {isPlaying ? (
            <>
              <div className="w-2 h-4 bg-white rounded-sm"></div>
              <div className="w-2 h-4 bg-white rounded-sm"></div>
              <span className="text-sm font-medium">Pause</span>
            </>
          ) : (
            <>
              <div className="w-0 h-0 border-l-4 border-l-white border-y-2 border-y-transparent"></div>
              <span className="text-sm font-medium">Play</span>
            </>
          )}
        </button>
      </div>
      {localAudioUrl && (
        <audio
          ref={audioRef}
          src={localAudioUrl}
          onEnded={() => setIsPlaying(false)}
          className="w-full mt-3"
          controls
        />
      )}
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
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
          <MapPin className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-slate-600">Resolving address...</span>
            </div>
          ) : error ? (
            <div>
              <p className="text-red-600 text-sm mb-1">{error}</p>
              <p className="text-slate-500 text-sm">Raw coordinates: {location}</p>
            </div>
          ) : resolvedAddress ? (
            <div>
              <p className="text-slate-900 font-medium leading-relaxed">{resolvedAddress}</p>
            </div>
          ) : (
            <p className="text-slate-600">No address available</p>
          )}
          <p className="text-slate-500 text-sm mt-1">Coordinates: {location}</p>
        </div>
      </div>
      {coordinates && (
        <button
          onClick={openInMaps}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <ExternalLink className="w-4 h-4" />
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 font-medium">Loading emergency report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md p-6 bg-red-50 rounded-xl border border-red-200 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Error Loading Report
          </h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!report || !reporter) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            No Data Found
          </h2>
          <p className="text-slate-600">
            The requested emergency report could not be found.
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    Pending: {
      color: "text-amber-800",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    "In Progress": {
      color: "text-blue-800",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: <Clock className="w-4 h-4" />,
    },
    Resolved: {
      color: "text-emerald-800",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  };

  const emergencyTypeConfig = {
    Fire: { color: "text-red-600", bgColor: "bg-red-50", icon: "🔥", urgency: "Critical" },
    Accident: { color: "text-orange-600", bgColor: "bg-orange-50", icon: "🚗", urgency: "High" },
    Medical: { color: "text-pink-600", bgColor: "bg-pink-50", icon: "🏥", urgency: "Critical" },
    Theft: { color: "text-purple-600", bgColor: "bg-purple-50", icon: "🚨", urgency: "Medium" },
    Other: { color: "text-slate-600", bgColor: "bg-slate-50", icon: "⚠️", urgency: "Low" },
  };

  const status = report.Report_Status;
  const emergencyConfig = emergencyTypeConfig[report.EmergencyType as keyof typeof emergencyTypeConfig] || emergencyTypeConfig.Other;
  const createdAt = report.Report_CreatedAt || new Date().toISOString();
  const timeAgo = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Emergency Response System</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Emergency Report #{report.ReportID}
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Detailed information and evidence for the reported emergency situation
          </p>
        </div>

        {/* Status Alert Bar */}
        <div className={`mb-8 p-4 rounded-xl border-l-4 ${
          status === 'Pending' ? 'bg-amber-50 border-amber-400' : 
          status === 'In Progress' ? 'bg-blue-50 border-blue-400' : 
          'bg-emerald-50 border-emerald-400'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {statusConfig[status as keyof typeof statusConfig]?.icon}
              <div>
                <p className={`font-semibold ${statusConfig[status as keyof typeof statusConfig]?.color}`}>
                  Status: {status}
                </p>
                <p className="text-sm text-slate-600">
                  {status === 'Pending' ? 'Awaiting emergency response' : 
                   status === 'In Progress' ? 'Emergency services are responding' : 
                   'Emergency has been resolved'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Mark Resolved
              </button>
              <button className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                <Share2 className="w-4 h-4 inline mr-2" />
                Share Report
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Emergency Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${emergencyConfig.bgColor}`}>
                    <AlertCircle className={`w-5 h-5 ${emergencyConfig.color}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Emergency Details</h2>
                    <p className="text-slate-600 text-sm">Critical incident information</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Emergency Type & Urgency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border ${emergencyConfig.bgColor} ${emergencyConfig.color.replace('text-', 'border-').replace('600', '200')}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{emergencyConfig.icon}</span>
                      <h3 className="font-semibold">Emergency Type</h3>
                    </div>
                    <p className="text-lg font-bold">{report.EmergencyType}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-700">Urgency Level</h3>
                    </div>
                    <p className={`text-lg font-bold ${
                      emergencyConfig.urgency === 'Critical' ? 'text-red-600' :
                      emergencyConfig.urgency === 'High' ? 'text-orange-600' :
                      emergencyConfig.urgency === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {emergencyConfig.urgency}
                    </p>
                  </div>
                </div>

                {/* Time Reported */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-700">Time Reported</h3>
                  </div>
                  <p className="text-slate-900 font-medium">
                    {formatDistanceToNowStrict(new Date(createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {new Date(createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Description */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-3">Incident Description</h3>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                    {report.EmerDescription}
                  </p>
                </div>

                {/* Location */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-4">Location</h3>
                  <LocationDisplay location={report.Report_Location} />
                </div>

                {/* Shared With */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-3">Notified Authorities</h3>
                  <div className="flex flex-wrap gap-2">
                    {report.SharedWith.split(', ').map((authority, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {authority}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Media Evidence Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Camera className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Evidence & Media</h2>
                    <p className="text-slate-600 text-sm">Visual and audio documentation</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Photo Evidence */}
                {report.MediaPhoto && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-slate-600" />
                      Photo Evidence
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {report.MediaPhoto.split(";")
                        .filter(Boolean)
                        .map((img, idx) => (
                          <div key={idx} className="relative group overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                            <Image
                              src={`data:image/jpeg;base64,${img}`}
                              alt={`Emergency photo ${idx + 1}`}
                              width={500}
                              height={300}
                              className="object-cover w-full h-48 hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Audio Evidence */}
                {report.MediaVoice && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <Mic className="w-5 h-5 text-slate-600" />
                      Audio Evidence
                    </h3>
                    <div className="space-y-3">
                      {report.MediaVoice.split(";")
                        .filter(Boolean)
                        .map((audio, idx) => (
                          <AudioPlayer key={idx} base64String={audio} index={idx} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-3">
                <a
                  href={`tel:${reporter.PhoneNumber}`}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Phone className="w-5 h-5" />
                  Call Reporter Now
                </a>
                <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                  <Mail className="w-5 h-5" />
                  Send Email Update
                </button>
                <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                  <CheckCircle className="w-5 h-5" />
                  Update Status
                </button>
              </div>
            </div>

            {/* Reporter Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">Reporter Information</h2>
              </div>
              
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
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
                      className="w-16 h-16 rounded-full border-2 border-slate-200 object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center border-2 border-slate-200">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-lg">{reporter.FullName}</h3>
                    <p className="text-slate-600">@{reporter.Username}</p>
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mt-2">
                      {reporter.UserType}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-600">Phone</p>
                      <p className="font-medium text-slate-900">{reporter.PhoneNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-medium text-slate-900 truncate">{reporter.Email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-red-100 rounded-full mt-1">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Report Created</p>
                      <p className="text-slate-600 text-xs">
                        {formatDistanceToNowStrict(new Date(createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-amber-100 rounded-full mt-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Authorities Notified</p>
                      <p className="text-slate-600 text-xs">
                        {formatDistanceToNowStrict(new Date(new Date(createdAt).getTime() + 2 * 60 * 1000), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 rounded-full mt-1">
                      <Shield className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Response Team Assigned</p>
                      <p className="text-slate-600 text-xs">Awaiting update</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Status Card */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-red-900">High Priority Alert</h3>
              </div>
              <p className="text-red-800 text-sm mb-4">
                This emergency requires immediate attention from response teams.
              </p>
              <div className="flex items-center gap-2 text-red-700 text-xs">
                <Clock className="w-4 h-4" />
                <span>Response time: &lt; 5 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm">
              <PhoneCall className="w-5 h-5" />
              Emergency Contact
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm">
              <Share2 className="w-5 h-5" />
              Share with Team
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
              Mark as Resolved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="text-slate-600 font-medium">Loading emergency report...</p>
          </div>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}