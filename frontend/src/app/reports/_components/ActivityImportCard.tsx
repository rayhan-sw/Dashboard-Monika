"use client";

import { DragEvent, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  UploadCloud,
} from "lucide-react";
import { reportService } from "@/services/api";
import type { ActivityImportResult } from "@/types/api";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".csv", ".tsv", ".txt"];

export default function ActivityImportCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ActivityImportResult | null>(null);

  const validateAndSelectFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    const extension = selectedFile.name
      .slice(selectedFile.name.lastIndexOf("."))
      .toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError("Pilih file dengan format .csv, .tsv, atau .txt.");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Ukuran file melebihi batas 25 MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    validateAndSelectFile(event.dataTransfer.files?.[0]);
  };

  const handleImport = async () => {
    if (!file || importing) return;

    setImporting(true);
    setError(null);
    try {
      const response = await reportService.importActivities(file);
      setResult(response.data);
    } catch (importError) {
      setResult(null);
      setError(
        importError instanceof Error
          ? importError.message
          : "Import gagal diproses.",
      );
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 bg-orange-100 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Import Data Aktivitas
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Tambahkan log aktivitas ke database dari file CSV atau TSV.
            </p>
          </div>
        </div>
        <span className="self-start text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
          Khusus Administrator
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
        <div>
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              dragActive
                ? "border-orange-400 bg-orange-50"
                : file
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50/70 hover:border-orange-300"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
              className="hidden"
              onChange={(event) =>
                validateAndSelectFile(event.target.files?.[0])
              }
            />

            {file ? (
              <>
                <FileSpreadsheet className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-slate-800 break-all">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024).toLocaleString("id-ID", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  KB
                </p>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                <p className="font-medium text-slate-800">
                  Tarik file ke area ini
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  atau pilih file dari perangkat Anda
                </p>
              </>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={importing}
              className="mt-4 px-4 py-2 rounded-lg border border-orange-300 text-orange-600 text-sm font-medium hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              {file ? "Ganti File" : "Pilih File"}
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || importing}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              {importing ? "Mengimpor..." : "Import ke Database"}
            </button>
            {(file || result) && (
              <button
                type="button"
                onClick={resetImport}
                disabled={importing}
                className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">
            Format yang Didukung
          </h4>
          <div className="space-y-3 text-xs text-slate-600">
            <div>
              <p className="font-medium text-slate-700">CSV dengan header</p>
              <p className="mt-1 leading-relaxed">
                id_trans, nama, satker, aktifitas, scope, lokasi, cluster,
                tanggal, token, status
              </p>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <p className="font-medium text-slate-700">
                Data normalized 12 kolom
              </p>
              <p className="mt-1 leading-relaxed">
                Mendukung CSV/TSV dengan header maupun TSV tanpa header seperti
                hasil ekspor tabel activity_logs_normalized.
              </p>
            </div>
            <p className="border-t border-slate-200 pt-3 text-slate-500">
              Maksimal 25 MB. id_trans yang sudah ada otomatis dilewati.
            </p>
          </div>
        </aside>
      </div>

      {result && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 mb-4 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm font-semibold">File selesai diproses</p>
            <span className="text-xs text-slate-500 font-normal">
              {result.format}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Total Baris", result.total_rows, "text-slate-800"],
              ["Berhasil", result.inserted, "text-emerald-600"],
              ["Duplikat", result.duplicates, "text-blue-600"],
              ["Dilewati", result.skipped, "text-red-600"],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-xl font-bold mt-1 ${color}`}>
                  {Number(value).toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-800 mb-2">
                Baris yang perlu diperiksa
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {result.errors.map((rowError) => (
                  <p
                    key={`${rowError.row}-${rowError.message}`}
                    className="text-xs text-amber-700"
                  >
                    Baris {rowError.row}: {rowError.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
