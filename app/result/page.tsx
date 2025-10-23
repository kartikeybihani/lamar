"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Download,
  Save,
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Stethoscope,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { GeneratedCarePlan } from "@/types";
import { saveCarePlan } from "@/lib/mockServices";
import { downloadTextFile, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ResultPage() {
  const router = useRouter();
  const [carePlan, setCarePlan] = useState<GeneratedCarePlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("generatedCarePlan");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCarePlan(parsed);
      } catch (error) {
        console.error("Error parsing care plan:", error);
        toast.error("Error loading care plan");
        router.push("/new");
      }
    } else {
      toast.error("No care plan found");
      router.push("/new");
    }
  }, [router]);

  const handleDownload = async () => {
    if (!carePlan) return;

    setIsDownloading(true);
    try {
      const filename = `${carePlan.patientName.replace(/\s+/g, "_")}_careplan_${
        new Date().toISOString().split("T")[0]
      }.txt`;
      downloadTextFile(carePlan.carePlanText, filename);
      toast.success("Care plan downloaded successfully");
    } catch (error) {
      console.error("Error downloading care plan:", error);
      toast.error("Failed to download care plan");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!carePlan) return;

    setIsSaving(true);
    try {
      await saveCarePlan(carePlan);
      toast.success("Care plan saved to database successfully");
    } catch (error) {
      console.error("Error saving care plan:", error);
      toast.error("Failed to save care plan");
    } finally {
      setIsSaving(false);
    }
  };

  if (!carePlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading care plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Care Plan Generated
                </h1>
                <p className="text-gray-600">
                  Your care plan has been successfully created
                </p>
              </div>
            </div>
            <Link href="/new" className="btn-ghost flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Generate Another
            </Link>
          </div>

          {/* Patient Summary */}
          <div className="grid md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Patient:
                </span>
                <span className="text-sm text-gray-900">
                  {carePlan.patientName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">MRN:</span>
                <span className="text-sm text-gray-900">{carePlan.mrn}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Provider:
                </span>
                <span className="text-sm text-gray-900">
                  {carePlan.providerName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Generated:
                </span>
                <span className="text-sm text-gray-900">
                  {formatDateTime(carePlan.generatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Care Plan Content */}
        <div className="glass-card p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Generated Care Plan
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={cn(
                  "btn-secondary flex items-center gap-2",
                  isDownloading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloading ? "Downloading..." : "Download"}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "btn-primary flex items-center gap-2",
                  isSaving && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Saving..." : "Save to Database"}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
              {carePlan.carePlanText}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/new"
            className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Generate Another Care Plan
          </Link>
          <Link
            href="/reports"
            className="btn-secondary text-lg px-8 py-3 flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            View All Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
