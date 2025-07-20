"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
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

function ReportContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");

  const [report, setReport] = useState<Report | null>(null);
  const [reporter, setReporter] = useState<Reporter | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setError("Missing report ID.");
      return;
    }

    async function fetchData() {
      try {
        const res = await fetch(`https://myappapi-yo3p.onrender.com/getReportWithReporter?id=${reportId}`);
        const data = await res.json();

        if (data.success) {
          setReport(data.data.Report);
          setReporter(data.data.Reporter);
        } else {
          setError(data.message || "Failed to load report.");
        }
      } catch {
        setError("An error occurred while fetching the report.");
      }
    }

    fetchData();
  }, [reportId]);

  if (error) {
    return <div className="p-6 text-red-600 font-semibold">{error}</div>;
  }

  if (!report || !reporter) {
    return <div className="p-6 text-gray-600 animate-pulse">Loading report details...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 via-white to-green-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-800 mb-8 border-b pb-2">
          Community Emergency Report
        </h1>

        {/* Report Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Emergency Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <p><span className="font-medium text-gray-600">Type:</span> {report.EmergencyType}</p>
            <p><span className="font-medium text-gray-600">Status:</span> {report.Report_Status}</p>
            <p className="sm:col-span-2">
              <span className="font-medium text-gray-600">Description:</span> {report.EmerDescription}
            </p>
            <p><span className="font-medium text-gray-600">Location:</span> {report.Report_Location}</p>
            <p><span className="font-medium text-gray-600">Shared With:</span> {report.SharedWith}</p>
          </div>

          {/* Media Section */}
          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            {report.MediaPhoto && (
              <div>
                <p className="font-semibold mb-2">Attached Photo</p>
                <Image
                  src={report.MediaPhoto}
                  alt="Report Media"
                  className="rounded-lg shadow border"
                  width={500}
                  height={300}
                />
              </div>
            )}
            {report.MediaVoice && (
              <div>
                <p className="font-semibold mb-2">Voice Note</p>
                <audio controls src={report.MediaVoice} className="w-full" />
              </div>
            )}
          </div>
        </div>

        {/* Reporter Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">Reporter Information</h2>
          <div className="flex items-center gap-5">
            {reporter.ProfilePhoto ? (
              <Image
                src={reporter.ProfilePhoto}
                alt="Profile"
                className="rounded-full shadow border object-cover"
                width={96}
                height={96}
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-xl text-gray-600 shadow">
                ?
              </div>
            )}
            <div className="text-gray-800 space-y-1">
              <p><span className="font-semibold text-gray-600">Name:</span> {reporter.FullName}</p>
              <p><span className="font-semibold text-gray-600">Username:</span> {reporter.Username}</p>
              <p><span className="font-semibold text-gray-600">Email:</span> {reporter.Email}</p>
              <p><span className="font-semibold text-gray-600">Phone:</span> {reporter.PhoneNumber}</p>
              <p><span className="font-semibold text-gray-600">User Type:</span> {reporter.UserType}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading report...</div>}>
      <ReportContent />
    </Suspense>
  );
}
