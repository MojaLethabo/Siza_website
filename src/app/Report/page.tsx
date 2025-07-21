"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!base64String) {
      setError("No audio data available");
      setIsLoading(false);
      return;
    }

    const processAudio = async () => {
      try {
        // Clean the base64 string
        const cleanBase64 = base64String.replace(/^data:audio\/\w+;base64,/, "");
        
        // Decode base64 to ArrayBuffer
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        setAudioUrl(url);
        setError(null);
        
        // Preload the audio
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
      } catch (err) {
        setError("Failed to process audio");
        console.error("Audio processing error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    processAudio();

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [base64String]);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          setError("Playback failed. Please try again.");
          console.error("Playback error:", err);
        });
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
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        <p className="text-gray-600">Preparing audio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-medium">Recording {index + 1}</p>
        </div>
        
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Play
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pause
          </button>
        )}
      </div>
      
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="w-full mt-2"
      />
      
      {audioUrl && (
        <div className="flex justify-end">
          <a
            href={audioUrl}
            download={`emergency-recording-${index + 1}.mp3`}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
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
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

  useEffect(() => {
    if (!reportId) {
      setError("Missing report ID");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE}/getReportWithReporter?id=${reportId}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
          setReport(data.data.Report);
          setReporter(data.data.Reporter);
        } else {
          throw new Error(data.message || "Failed to load report data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch report");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [reportId, BASE]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-lg text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Report</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!report || !reporter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">No report data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 via-white to-green-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-800 mb-6 pb-2 border-b">
              Emergency Report Details
            </h1>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Emergency Details */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-red-600">Emergency Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-600">Emergency Type</h3>
                    <p className="text-lg">{report.EmergencyType}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-600">Status</h3>
                    <p className="text-lg">{report.Report_Status}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-600">Description</h3>
                    <p className="text-lg whitespace-pre-wrap">
                      {report.EmerDescription || "No description provided"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-600">Location</h3>
                    <p className="text-lg">{report.Report_Location}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-600">Shared With</h3>
                    <p className="text-lg">{report.SharedWith}</p>
                  </div>
                </div>
              </div>

              {/* Media Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-blue-600">Media Evidence</h2>
                
                {/* Photos */}
                {report.MediaPhoto && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-600">Photos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {report.MediaPhoto
                        .split(";")
                        .filter(Boolean)
                        .map((img64, index) => (
                          <div key={index} className="overflow-hidden rounded-lg shadow border">
                            <Image
                              src={`data:image/jpeg;base64,${img64}`}
                              alt={`Emergency photo ${index + 1}`}
                              width={500}
                              height={300}
                              className="w-full h-auto"
                              unoptimized
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Audio Recordings */}
                {report.MediaVoice && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-600">Audio Recordings</h3>
                    <div className="space-y-3">
                      {report.MediaVoice
                        .split(";")
                        .filter(Boolean)
                        .map((audio64, index) => (
                          <AudioPlayer 
                            key={index} 
                            base64String={audio64} 
                            index={index} 
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reporter Information */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-green-700 mb-6">Reporter Details</h2>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                {reporter.ProfilePhoto ? (
                  <Image
                    src={reporter.ProfilePhoto}
                    alt="Reporter profile"
                    width={120}
                    height={120}
                    className="rounded-full shadow border object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-600 shadow">
                    <span className="sr-only">No profile image</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <h3 className="font-medium text-gray-600">Full Name</h3>
                  <p className="text-lg">{reporter.FullName}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-600">Username</h3>
                  <p className="text-lg">{reporter.Username}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-600">Email</h3>
                  <p className="text-lg break-all">{reporter.Email}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-600">Phone</h3>
                  <p className="text-lg">{reporter.PhoneNumber}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-600">User Type</h3>
                  <p className="text-lg capitalize">{reporter.UserType.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-lg text-gray-600">Loading report viewer...</p>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}