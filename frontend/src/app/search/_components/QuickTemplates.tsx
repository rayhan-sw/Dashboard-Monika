"use client";

import { Icon } from "@iconify/react";

interface QuickTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  query: string;
  filters: {
    dateRange?: string;
    status?: string;
    cluster?: string;
    activityTypes?: string[];
  };
}

interface QuickTemplatesProps {
  onTemplateClick: (template: QuickTemplate) => void;
}

const templates: QuickTemplate[] = [
  {
    id: "failed-logins-today",
    title: "Login Gagal Hari Ini",
    description: "Temukan semua percobaan login yang gagal pada hari ini",
    icon: <Icon icon="lucide:alert-triangle" className="w-5 h-5" />,
    color: "red",
    query: "",
    filters: {
      dateRange: "today",
      status: "FAILED",
      activityTypes: ["LOGIN"],
    },
  },
  {
    id: "top-active-users",
    title: "User Paling Aktif",
    description: "10 user dengan aktivitas terbanyak minggu ini",
    icon: <Icon icon="lucide:trending-up" className="w-5 h-5" />,
    color: "blue",
    query: "",
    filters: {
      dateRange: "7days",
    },
  },
  {
    id: "recent-logins",
    title: "Login Terbaru",
    description: "Aktivitas login dalam 24 jam terakhir",
    icon: <Icon icon="lucide:log-in" className="w-5 h-5" />,
    color: "green",
    query: "",
    filters: {
      dateRange: "today",
      status: "SUCCESS",
      activityTypes: ["LOGIN"],
    },
  },
  {
    id: "pencarian-activity",
    title: "Aktivitas Pencarian",
    description: "Semua aktivitas pada cluster Pencarian",
    icon: <Icon icon="lucide:users" className="w-5 h-5" />,
    color: "purple",
    query: "",
    filters: {
      cluster: "pencarian",
      dateRange: "7days",
    },
  },
  {
    id: "download-activity",
    title: "Aktivitas Download",
    description: "Semua aktivitas download dalam 30 hari",
    icon: <Icon icon="lucide:zap" className="w-5 h-5" />,
    color: "orange",
    query: "",
    filters: {
      dateRange: "30days",
      activityTypes: ["Download"],
    },
  },
];

export default function QuickTemplates({
  onTemplateClick,
}: QuickTemplatesProps) {
  const getColorClasses = (color: string) => {
    const colors = {
      red: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
      blue: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
      green: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
      purple:
        "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
      orange:
        "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="lucide:zap" className="w-5 h-5 text-bpk-orange" />
        <h3 className="text-base font-semibold text-gray-800">
          Template Pencarian Cepat
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateClick(template)}
            className={`p-4 rounded-lg border transition-all text-left ${getColorClasses(
              template.color,
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{template.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">{template.title}</h4>
                <p className="text-xs opacity-80 line-clamp-2">
                  {template.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
          <Icon icon="lucide:lightbulb" className="w-3.5 h-3.5" />
          Klik template untuk langsung menerapkan filter yang sesuai
        </p>
      </div>
    </div>
  );
}
