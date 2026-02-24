"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Building2,
  Users,
  BarChart3,
  FileText,
  FileSpreadsheet,
  File,
  AlertCircle,
} from "lucide-react";
import { reportService, API_BASE_URL } from "@/services/api";
import type { ReportTemplate } from "@/types/api";

// Template icons mapping
const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  "org-performance": <Building2 className="w-6 h-6 text-orange-500" />,
  "user-activity": <Users className="w-6 h-6 text-orange-500" />,
  "feature-usage": <BarChart3 className="w-6 h-6 text-orange-500" />,
};

// Template display names
const TEMPLATE_DISPLAY_NAMES: Record<string, { title: string; desc: string }> = {
  "org-performance": {
    title: "Laporan Kinerja Organisasi",
    desc: "Analisis aktivitas berdasarkan Unit Kerja (Satker) dan sebaran geografis",
  },
  "user-activity": {
    title: "Laporan Aktivitas Pengguna",
    desc: "Tren login harian, waktu akses puncak, dan daftar pengguna teraktif",
  },
  "feature-usage": {
    title: "Laporan Pemanfaatan Fitur",
    desc: "Statistik penggunaan menu, kata kunci pencarian, dan unduhan file",
  },
};

interface ReportTemplateCardsProps {
  onReportGenerated?: () => void;
}

export default function ReportTemplateCards({
  onReportGenerated,
}: ReportTemplateCardsProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await reportService.getTemplates();
      setTemplates(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading templates:", err);
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (templateId: string, format: string) => {
    const key = `${templateId}-${format}`;
    setGeneratingKey(key);
    
    try {
      const result = await reportService.generateReport(templateId, format);
      
      if (result.success && result.download_url) {
        // Trigger file download (pakai base URL terpusat dari api)
        const fullUrl = `${API_BASE_URL}${result.download_url}`;
        
        // Create a temporary link and click it to trigger download
        const link = document.createElement("a");
        link.href = fullUrl;
        link.download = result.filename || "laporan";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        console.log(`Laporan berhasil dibuat: ${result.filename} (${result.file_size})`);
        
        // Refresh download history
        onReportGenerated?.();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal membuat laporan. Silakan coba lagi.",
        confirmButtonColor: "#E27200",
      });
    } finally {
      setGeneratingKey(null);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "csv":
        return <FileText className="w-4 h-4" />;
      case "excel":
        return <FileSpreadsheet className="w-4 h-4" />;
      case "pdf":
        return <File className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatButtonStyle = (format: string) => {
    switch (format.toLowerCase()) {
      case "csv":
        return "bg-slate-100 text-slate-700 hover:bg-slate-200";
      case "excel":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
      case "pdf":
        return "bg-red-100 text-red-700 hover:bg-red-200";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-200";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse"
          >
            <div className="w-10 h-10 bg-slate-200 rounded-lg mb-4" />
            <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-200 rounded w-full mb-4" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-8 bg-slate-200 rounded-lg w-16" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {templates.map((template) => {
        const displayInfo = TEMPLATE_DISPLAY_NAMES[template.id] || {
          title: template.title,
          desc: template.description,
        };
        return (
          <div
            key={template.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              {TEMPLATE_ICONS[template.id] || (
                <FileText className="w-5 h-5 text-orange-500" />
              )}
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">
              {displayInfo.title}
            </h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">
              {displayInfo.desc}
            </p>
            <div className="flex gap-2 mt-2.5">
              {template.formats.map((format) => {
                const key = `${template.id}-${format}`;
                const isGenerating = generatingKey === key;
                
                return (
                  <button
                    key={format}
                    onClick={() => handleGenerateReport(template.id, format)}
                    disabled={isGenerating || generatingKey !== null}
                    className={`${getFormatButtonStyle(format)} px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative`}
                  >
                    {isGenerating ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>...</span>
                      </>
                    ) : (
                      <>
                        {getFormatIcon(format)}
                        {format.toUpperCase()}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
