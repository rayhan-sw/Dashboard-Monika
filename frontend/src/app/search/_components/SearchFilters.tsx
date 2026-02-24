"use client";

import { Icon } from "@iconify/react";
import { Calendar, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";
import { dashboardService } from "@/services/api";
import BPKTreeView from "./BPKTreeView";

export interface SearchFiltersState {
  dateRange: string;
  customStart?: string;
  customEnd?: string;
  satker: string;
  satkerIds: number[];
  cluster: string;
  status: "all" | "success" | "failed";
  activityTypes: string[];
  location: string;
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
  onApply: () => void;
  onClear: () => void;
}

// Static satker data grouped by eselon
const SATKER_BY_ESELON: Record<string, string[]> = {
  "Eselon 1": [
    "Auditorat I.B",
    "Auditorat III.A",
    "Auditorat IV.A",
    "Auditorat Utama Investigasi",
    "Auditorat Utama Keuangan Negara I",
    "Direktorat Jenderal Pemeriksaan Investigasi",
    "Direktorat Jenderal Pemeriksaan Keuangan Negara III",
    "Direktorat Jenderal Pemeriksaan Keuangan Negara VII",
    "Inspektorat Utama",
    "Staf Ahli Bidang Keuangan Pemerintah Pusat",
    "Wakil Ketua",
  ],
  "Eselon 2": [
    "Biro Sekretariat Pimpinan",
    "Biro Teknologi Informasi",
    "BPK Perwakilan Provinsi Banten",
    "BPK Perwakilan Provinsi Bengkulu",
    "BPK Perwakilan Provinsi DKI Jakarta",
    "BPK Perwakilan Provinsi Gorontalo",
    "BPK Perwakilan Provinsi Jawa Barat",
    "BPK Perwakilan Provinsi Jawa Tengah",
    "BPK Perwakilan Provinsi Jawa Timur",
    "BPK Perwakilan Provinsi Kalimantan Utara",
    "BPK Perwakilan Provinsi Sulawesi Utara",
    "Direktorat Evaluasi dan Pelaporan Pemeriksaan",
    "Direktorat Pemeriksaan III.A",
    "Direktorat Pemeriksaan III.B",
    "Subauditorat Aceh I",
    "Subauditorat Aceh II",
    "Subauditorat Aceh III",
    "Subauditorat NTT I",
    "Subauditorat NTT II",
    "Subauditorat NTT III",
  ],
  "Eselon 3": [
    "Bagian Hubungan Antar Lembaga",
    "Bagian Kerja Sama Internasional",
    "Bagian Operasional Teknologi Informasi",
    "Bagian Pengelolaan Informasi",
    "Bagian Tata Kelola dan Sains Data",
    "Bidang Evaluasi dan Pengembangan Pendidikan dan Pelatihan",
    "Bidang Pemeriksaan Aceh I",
    "Bidang Pemeriksaan Aceh II",
    "Bidang Pemeriksaan Daerah Khusus Jakarta I",
    "Bidang Pemeriksaan Daerah Khusus Jakarta II",
    "Bidang Pemeriksaan Daerah Khusus Jakarta III",
    "Bidang Pemeriksaan Gorontalo",
    "Bidang Pemeriksaan Jambi I",
    "Bidang Pemeriksaan Jambi II",
    "Bidang Pemeriksaan Jawa Barat II",
    "Bidang Pemeriksaan Jawa Tengah I",
    "Bidang Pemeriksaan Jawa Tengah II",
    "Bidang Pemeriksaan Jawa Tengah IV",
    "Bidang Pemeriksaan Jawa Timur III",
    "Bidang Pemeriksaan Kalimantan Tengah I",
    "Bidang Pemeriksaan Kalimantan Tengah II",
    "Bidang Pemeriksaan Kalimantan Timur I",
    "Bidang Pemeriksaan Kalimantan Timur II",
    "Bidang Pemeriksaan Kepulauan Riau",
    "Bidang Pemeriksaan Lampung II",
    "Bidang Pemeriksaan Maluku I",
    "Bidang Pemeriksaan Maluku Utara I",
    "Bidang Pemeriksaan Maluku Utara II",
    "Bidang Pemeriksaan Nusa Tenggara Barat I",
    "Bidang Pemeriksaan Nusa Tenggara Barat II",
    "Bidang Pemeriksaan Nusa Tenggara Timur I",
    "Bidang Pemeriksaan Nusa Tenggara Timur II",
    "Bidang Pemeriksaan Nusa Tenggara Timur III",
    "Bidang Pemeriksaan Papua Barat",
    "Bidang Pemeriksaan Papua I",
    "Bidang Pemeriksaan Papua II",
    "Bidang Pemeriksaan Riau II",
    "Bidang Pemeriksaan Sulawesi Selatan II",
    "Bidang Pemeriksaan Sulawesi Tengah I",
    "Bidang Pemeriksaan Sulawesi Tenggara I",
    "Bidang Pemeriksaan Sumatera Barat II",
    "Bidang Pemeriksaan Sumatera Selatan I",
    "Bidang Pemeriksaan Sumatera Utara II",
    "Bidang Pemeriksaan Sumatera Utara III",
    "Bidang Pemerolehan Keyakinan Mutu Pemeriksaan I",
    "Bidang Pemerolehan Keyakinan Mutu Pemeriksaan III",
    "Bidang Penegakan Integritas II",
    "Museum BPK RI",
    "Sekretariat Perwakilan",
    "Subbidang Konsultasi Hukum Keuangan Negara II.B",
    "Subbidang Manajemen Risiko I",
    "Subbidang Pemeriksaan Internal dan Mutu Kelembagaan I.B",
    "Subbidang Pemeriksaan Internal dan Mutu Kelembagaan II.B",
    "Subbidang Pemeriksaan Internal dan Mutu Kelembagaan II.C",
    "Subbidang Pemerolehan Keyakinan Mutu Pemeriksaan I.A",
    "Subbidang Pemerolehan Keyakinan Mutu Pemeriksaan I.B",
    "Subbidang Pemerolehan Keyakinan Mutu Pemeriksaan II.A",
    "Subbidang Pemerolehan Keyakinan Mutu Pemeriksaan II.B",
    "Subbidang Pemerolehan Keyakinan Mutu Pemeriksaan III.A",
    "Subbidang Pemerolehan Keyakinan Mutu Pemeriksaan III.C",
    "Subdirektorat Investigasi BUMN I",
    "Subdirektorat Investigasi BUMN II",
    "Subdirektorat Pemeriksaan I.A.1",
    "Subdirektorat Pemeriksaan I.A.3",
    "Subdirektorat Pemeriksaan I.B.1",
    "Subdirektorat Pemeriksaan I.D.2",
    "Subdirektorat Pemeriksaan II.A.1",
    "Subdirektorat Pemeriksaan II.A.3",
    "Subdirektorat Pemeriksaan II.B.2",
    "Subdirektorat Pemeriksaan II.C.1",
    "Subdirektorat Pemeriksaan II.D.2",
    "Subdirektorat Pemeriksaan II.E.1",
    "Subdirektorat Pemeriksaan II.E.2",
    "Subdirektorat Pemeriksaan III.A.1",
    "Subdirektorat Pemeriksaan III.A.3",
    "Subdirektorat Pemeriksaan III.B.3",
    "Subdirektorat Pemeriksaan III.C.2",
    "Subdirektorat Pemeriksaan III.D.1",
    "Subdirektorat Pemeriksaan IV.B.2",
    "Subdirektorat Pemeriksaan Pemeriksaan Organisasi Internasional II",
    "Subdirektorat Pemeriksaan V.A.1",
    "Subdirektorat Pemeriksaan V.B.2",
    "Subdirektorat Pemeriksaan VII.A.1",
    "Subdirektorat Pemeriksaan VII.B.1",
    "Subdirektorat Pemeriksaan VII.B.2",
    "Subdirektorat Pemeriksaan VII.B.3",
    "Subdirektorat Pemeriksaan VII.C.1",
    "Subdirektorat Pemeriksaan VII.C.2",
    "Subdirektorat Pemeriksaan VII.C.3",
    "Subdirektorat Pemeriksaan VII.D.1",
    "Subdirektorat Pemeriksaan VII.D.3",
    "Subdirektorat Pemeriksaan VII.E.1",
    "Subdirektorat Pemeriksaan VII.E.2",
    "Subdirektorat Pemeriksaan VII.E.3",
    "Subdirektorat Pemeriksaan VIII.A.3",
    "Subdirektorat Pemeriksaan VIII.A.4",
    "Subdirektorat Penelitian dan Pengembangan Pemeriksaan Dengan Tujuan Tertentu",
    "Subdirektorat Pengelolaan Pemeriksaan I",
    "Subdirektorat Pengelolaan Pemeriksaan II",
  ],
  "Eselon 4": [
    "Seksi Evaluasi dan Pelaporan Pemeriksaan Dengan Tujuan Tertentu II",
    "Seksi Informasi Hukum",
    "Seksi Kepaniteraan Kerugian Negara",
    "Seksi Konsultasi Hukum Keuangan Negara Yang Dipisahkan",
    "Seksi Litbang Pemeriksaan Dengan Tujuan Tertentu II",
    "Seksi Manajemen Risiko",
    "Seksi Perencanaan Strategis I",
    "Subauditorat Bali I",
    "Subauditorat Bali II",
    "Subauditorat Bali III",
    "Subauditorat Banten",
    "Subauditorat Banten I",
    "Subauditorat Banten II",
    "Subauditorat Banten III",
    "Subauditorat Bengkulu I",
    "Subauditorat Bengkulu II",
    "Subauditorat Bengkulu III",
    "Subauditorat D.I. Yogyakarta",
    "Subauditorat DI Yogyakarta I",
    "Subauditorat DI Yogyakarta II",
    "Subauditorat DI Yogyakarta III",
    "Subauditorat DKI Jakarta I",
    "Subauditorat DKI Jakarta II",
    "Subauditorat DKI Jakarta III",
    "Subauditorat DKI Jakarta IV",
    "Subauditorat Gorontalo",
    "Subauditorat Gorontalo I",
    "Subauditorat Gorontalo II",
    "Subauditorat Gorontalo III",
    "Subauditorat I.A.1",
    "Subauditorat I.A.2",
    "Subauditorat I.A.3",
    "Subauditorat I.A.4",
    "Subauditorat I.B.1",
    "Subauditorat I.B.2",
    "Subauditorat I.B.3",
    "Subauditorat I.C.1",
    "Subauditorat I.C.2",
    "Subauditorat I.C.3",
    "Subauditorat I.D.1",
    "Subauditorat I.D.2",
    "Subauditorat I.D.3",
    "Subauditorat II.A.1",
    "Subauditorat II.A.2",
    "Subauditorat II.B.1",
    "Subauditorat II.B.2",
    "Subauditorat II.C.1",
    "Subauditorat II.C.2",
    "Subauditorat II.D.2",
    "Subauditorat III.A.1",
    "Subauditorat III.A.2",
    "Subauditorat III.B.1",
    "Subauditorat III.B.2",
    "Subauditorat III.C.1",
    "Subauditorat III.C.2",
    "Subauditorat III.D.1",
    "Subauditorat III.D.2",
    "Subauditorat Investigasi Kekayaan Negara/Daerah yang Dipisahkan I",
    "Subauditorat Investigasi Kekayaan Negara/Daerah yang Dipisahkan II",
    "Subauditorat Investigasi Keuangan Daerah I",
    "Subauditorat Investigasi Keuangan Negara Pusat II",
    "Subauditorat IV.A.1",
    "Subauditorat IV.A.2",
    "Subauditorat IV.B.1",
    "Subauditorat IV.B.2",
    "Subauditorat IV.C.1",
    "Subauditorat IV.C.2",
    "Subauditorat Jambi I",
    "Subauditorat Jambi II",
    "Subauditorat Jambi III",
    "Subauditorat Jawa Barat I",
    "Subauditorat Jawa Barat II",
    "Subauditorat Jawa Barat III",
    "Subauditorat Jawa Tengah I",
    "Subauditorat Jawa Tengah II",
    "Subauditorat Jawa Tengah III",
    "Subauditorat Jawa Tengah IV",
    "Subauditorat Jawa Timur I",
    "Subauditorat Jawa Timur II",
    "Subauditorat Jawa Timur III",
    "Subauditorat Jawa Timur IV",
    "Subauditorat Kalimantan Barat I",
    "Subauditorat Kalimantan Barat II",
    "Subauditorat Kalimantan Barat III",
    "Subauditorat Kalimantan Selatan I",
    "Subauditorat Kalimantan Selatan II",
    "Subauditorat Kalimantan Selatan III",
    "Subauditorat Kalimantan Tengah I",
    "Subauditorat Kalimantan Tengah II",
    "Subauditorat Kalimantan Tengah III",
    "Subauditorat Kalimantan Timur I",
    "Subauditorat Kalimantan Timur II",
    "Subauditorat Kalimantan Timur III",
    "Subauditorat Kalimantan Utara",
    "Subauditorat Kalimantan Utara I",
    "Subauditorat Kalimantan Utara II",
    "Subauditorat Kalimantan Utara III",
    "Subauditorat Kepulauan Bangka Belitung",
    "Subauditorat Kepulauan Bangka Belitung I",
    "Subauditorat Kepulauan Bangka Belitung II",
    "Subauditorat Kepulauan Bangka Belitung III",
    "Subauditorat Kepulauan Riau",
    "Subauditorat Kepulauan Riau I",
    "Subauditorat Kepulauan Riau II",
    "Subauditorat Kepulauan Riau III",
    "Subauditorat Lampung I",
    "Subauditorat Lampung II",
    "Subauditorat Lampung III",
    "Subauditorat Maluku I",
    "Subauditorat Maluku II",
    "Subauditorat Maluku III",
    "Subauditorat Maluku Utara I",
    "Subauditorat Maluku Utara II",
    "Subauditorat Maluku Utara III",
    "Subauditorat NTB I",
    "Subauditorat NTB II",
    "Subauditorat Nusa Tenggara Barat I",
    "Subauditorat Nusa Tenggara Barat II",
    "Subauditorat Nusa Tenggara Barat III",
    "Subauditorat Nusa Tenggara Timur I",
    "Subauditorat Nusa Tenggara Timur II",
    "Subauditorat Nusa Tenggara Timur III",
    "Subauditorat Papua Barat Daya I",
    "Subauditorat Papua Barat Daya II",
    "Subauditorat Papua Barat Daya III",
    "Subauditorat Papua Barat I",
    "Subauditorat Papua Barat II",
    "Subauditorat Papua Barat III",
    "Subauditorat Papua I",
    "Subauditorat Papua II",
    "Subauditorat Papua III",
    "Subauditorat Papua Pegunungan I",
    "Subauditorat Papua Pegunungan II",
    "Subauditorat Papua Pegunungan III",
    "Subauditorat Papua Selatan I",
    "Subauditorat Papua Selatan II",
    "Subauditorat Papua Selatan III",
    "Subauditorat Papua Tengah I",
    "Subauditorat Papua Tengah II",
    "Subauditorat Papua Tengah III",
    "Subauditorat Pengelolaan Pemeriksaan I",
    "Subauditorat Pengelolaan Pemeriksaan II",
    "Subauditorat Riau I",
    "Subauditorat Riau II",
    "Subauditorat Riau III",
    "Subauditorat Sulawesi Barat",
    "Subauditorat Sulawesi Barat I",
    "Subauditorat Sulawesi Barat II",
    "Subauditorat Sulawesi Barat III",
    "Subauditorat Sulawesi Selatan I",
    "Subauditorat Sulawesi Selatan II",
    "Subauditorat Sulawesi Selatan III",
    "Subauditorat Sulawesi Tengah I",
    "Subauditorat Sulawesi Tengah II",
    "Subauditorat Sulawesi Tengah III",
    "Subauditorat Sulawesi Tenggara I",
    "Subauditorat Sulawesi Tenggara II",
    "Subauditorat Sulawesi Tenggara III",
    "Subauditorat Sulawesi Utara I",
    "Subauditorat Sulawesi Utara II",
    "Subauditorat Sulawesi Utara III",
    "Subauditorat Sumatera Barat I",
    "Subauditorat Sumatera Barat II",
    "Subauditorat Sumatera Barat III",
    "Subauditorat Sumatera Selatan I",
    "Subauditorat Sumatera Selatan II",
    "Subauditorat Sumatera Selatan III",
    "Subauditorat Sumatera Utara I",
    "Subauditorat Sumatera Utara II",
    "Subauditorat Sumatera Utara III",
    "Subauditorat V.A.1",
    "Subauditorat V.A.2",
    "Subauditorat VI.A.1",
    "Subauditorat VI.A.2",
    "Subauditorat VI.B.1",
    "Subauditorat VI.B.2",
    "Subauditorat VII.A.1",
    "Subauditorat VII.A.2",
    "Subauditorat VII.A.3",
    "Subauditorat VII.B.1",
    "Subauditorat VII.B.2",
    "Subauditorat VII.B.3",
    "Subauditorat VII.C.1",
    "Subauditorat VII.C.2",
    "Subauditorat VII.C.3",
    "Subauditorat VII.D.1",
    "Subauditorat VII.D.2",
    "Subauditorat VII.D.3",
    "Subbagian Administrasi Keuangan AKN II",
    "Subbagian Administrasi Sumber Daya Manusia",
    "Subbagian Administrasi Sumber Daya Manusia AKN I",
    "Subbagian Administrasi Sumber Daya Manusia AKN II",
    "Subbagian Administrasi Sumber Daya Manusia AKN IV",
    "Subbagian Administrasi Sumber Daya Manusia AKN VII",
    "Subbagian Akuntansi dan Pelaporan I",
    "Subbagian Akuntansi dan Pelaporan II",
    "Subbagian Akuntansi dan Pelaporan III",
    "Subbagian Analisis Kebutuhan Sumber Daya Manusia",
    "Subbagian Analisis Kebutuhan, Penggunaan, dan Penghapusan",
    "Subbagian Budaya Kerja",
    "Subbagian Dukungan Pemeriksaan",
    "Subbagian Hubungan Lembaga Negara/Pemerintah",
    "Subbagian Hubungan Lembaga Nonpemerintah",
    "Subbagian Hubungan Masyarakat",
    "Subbagian Hubungan Masyarakat dan Tata Usaha Kepala Perwakilan",
    "Subbagian Hukum",
    "Subbagian International Organization of Supreme Audit Institutions (INTOSAI), Asia Organization of Supreme Audit Institutions (ASOSAI), dan Association of Southeast Asian Nations Supreme Audit Institutions (ASEANSAI)",
    "Subbagian Keamanan Informasi",
    "Subbagian Kerja Sama Bilateral",
    "Subbagian Kerja Sama Multilateral",
    "Subbagian Kesehatan",
    "Subbagian Ketatausahaan AKN I",
    "Subbagian Ketatausahaan AKN V",
    "Subbagian Ketatausahaan Auditorat Utama Investigasi",
    "Subbagian Keuangan",
    "Subbagian Konsultasi",
    "Subbagian Layanan Informasi",
    "Subbagian Manajemen Informasi Sumber Daya Manusia",
    "Subbagian Manajemen Kinerja Teknologi Informasi",
    "Subbagian Manajemen Kinerja, Penghargaan, dan Disiplin Pegawai",
    "Subbagian Manajemen Talenta",
    "Subbagian Mutasi, Pemberhentian, dan Kepangkatan",
    "Subbagian Pelayanan Teknologi Informasi dan Komunikasi",
    "Subbagian Pemeliharaan Kendaraan dan Barang Inventaris",
    "Subbagian Pemeliharaan Rumah Negara dan Kantor",
    "Subbagian Penataan Jabatan Fungsional Pemeriksa",
    "Subbagian Penataan Jabatan Fungsional Selain Pemeriksa",
    "Subbagian Penataan Organisasi I",
    "Subbagian Penataan Organisasi II",
    "Subbagian Penataan Perangkat Lunak",
    "Subbagian Penataan Proses Bisnis",
    "Subbagian Penatausahaan Barang Milik Negara",
    "Subbagian Penganggaran dan Pemantauan I",
    "Subbagian Penganggaran dan Pemantauan II",
    "Subbagian Penganggaran dan Pemantauan III",
    "Subbagian Pengelolaan Arsip",
    "Subbagian Pengelolaan Data dan Pelayanan Teknologi Informasi dan Komunikasi",
    "Subbagian Pengelolaan Infrastruktur dan Jaringan",
    "Subbagian Pengelolaan Jabatan Fungsional Pemeriksa",
    "Subbagian Pengelolaan Jabatan Fungsional Selain Pemeriksa",
    "Subbagian Pengembangan Kompetensi",
    "Subbagian Pengembangan Sistem Informasi Kelembagaan",
    "Subbagian Pengembangan Sistem Informasi Pemeriksaan",
    "Subbagian Penggandaan",
    "Subbagian Pengurusan Surat dan Perjalanan Dinas",
    "Subbagian Penilaian Kompetensi",
    "Subbagian Penyiapan Prasarana dan Sarana",
    "Subbagian Penyimpanan dan Distribusi",
    "Subbagian Perbendaharaan I",
    "Subbagian Perbendaharaan II",
    "Subbagian Perbendaharaan III",
    "Subbagian Perpustakaan",
    "Subbagian Persidangan",
    "Subbagian Protokol",
    "Subbagian Publikasi dan Media",
    "Subbagian Reformasi Birokrasi",
    "Subbagian Rekrutmen Sumber Daya Manusia",
    "Subbagian Remunerasi",
    "Subbagian Sains Data",
    "Subbagian Sekretariat Anggota I",
    "Subbagian Sekretariat Anggota II",
    "Subbagian Sekretariat Anggota III",
    "Subbagian Sekretariat Anggota IV",
    "Subbagian Sekretariat Anggota V",
    "Subbagian Sekretariat Anggota VI",
    "Subbagian Sekretariat Anggota VII",
    "Subbagian Sekretariat Sekretaris Jenderal",
    "Subbagian Sekretariat Staf Ahli",
    "Subbagian Sekretariat Wakil Ketua",
    "Subbagian Sumber Daya Manusia",
    "Subbagian Tata Kelola Data",
    "Subbagian Tata Usaha Kepala Perwakilan",
    "Subbagian Transportasi dan Pengamanan",
    "Subbagian Umum dan Teknologi Informasi",
  ],
};

const ACTIVITY_TYPES = [
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "View", label: "View" },
  { value: "Download", label: "Download" },
];

function getDaysInMonth(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
  return days;
}

export default function SearchFilters({
  filters,
  onChange,
  onApply,
  onClear,
}: SearchFiltersProps) {
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [clusters, setClusters] = useState<string[]>([]);
  const [clusterDropdownOpen, setClusterDropdownOpen] = useState(false);
  const [showTreeView, setShowTreeView] = useState(true);
  const customDatePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadClusters();
  }, []);

  // Sync temp dates and month when opening custom picker from filters
  useEffect(() => {
    if (showCustomDatePicker && showCustomDate) {
      if (filters.customStart && filters.customEnd) {
        try {
          const start = parse(filters.customStart, "yyyy-MM-dd", new Date());
          const end = parse(filters.customEnd, "yyyy-MM-dd", new Date());
          setTempStartDate(start);
          setTempEndDate(end);
          setSelectedMonth(start);
        } catch {
          setTempStartDate(null);
          setTempEndDate(null);
        }
      } else {
        setTempStartDate(null);
        setTempEndDate(null);
      }
    }
  }, [showCustomDatePicker, showCustomDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customDatePickerRef.current &&
        !customDatePickerRef.current.contains(event.target as Node)
      ) {
        setShowCustomDatePicker(false);
      }
    };
    if (showCustomDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCustomDatePicker]);

  const formatCustomDateDisplay = () => {
    if (!filters.customStart || !filters.customEnd) return "Pilih Tanggal";
    try {
      const start = parse(filters.customStart, "yyyy-MM-dd", new Date());
      const end = parse(filters.customEnd, "yyyy-MM-dd", new Date());
      return `${format(start, "d MMM", { locale: id })} - ${format(end, "d MMM yyyy", { locale: id })}`;
    } catch {
      return "Pilih Tanggal";
    }
  };

  const handleCustomDateClick = (date: Date) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(date);
      setTempEndDate(null);
    } else {
      if (date < tempStartDate) {
        setTempStartDate(date);
        setTempEndDate(tempStartDate);
      } else {
        setTempEndDate(date);
      }
    }
  };

  const isDateInRange = (date: Date) => {
    if (!tempStartDate) return false;
    if (!tempEndDate) return date.getTime() === tempStartDate.getTime();
    return date >= tempStartDate && date <= tempEndDate;
  };

  const isDateRangeEdge = (date: Date) => {
    if (!tempStartDate) return false;
    return (
      date.getTime() === tempStartDate.getTime() ||
      (tempEndDate && date.getTime() === tempEndDate.getTime())
    );
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      onChange({
        ...filters,
        customStart: format(tempStartDate, "yyyy-MM-dd"),
        customEnd: format(tempEndDate, "yyyy-MM-dd"),
      });
      setShowCustomDatePicker(false);
      setTempStartDate(null);
      setTempEndDate(null);
    }
  };

  const handleQuickSelectInCustom = (value: string) => {
    onChange({
      ...filters,
      dateRange: value,
      customStart: "",
      customEnd: "",
    });
    setShowCustomDate(false);
    setShowCustomDatePicker(false);
  };

  const loadClusters = async () => {
    try {
      const response = await dashboardService.getClusters();
      setClusters(response.data || []);
    } catch (error) {
      console.error("Failed to load clusters:", error);
    }
  };

  const handleActivityTypeToggle = (type: string) => {
    const updated = filters.activityTypes.includes(type)
      ? filters.activityTypes.filter((t) => t !== type)
      : [...filters.activityTypes, type];

    onChange({ ...filters, activityTypes: updated });
  };

  return (
    <div className="bg-white rounded-lg-bpk shadow-sm border border-gray-200 p-5 sticky top-24">
      {/* Header with Apply Button */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:filter-outline" className="w-5 h-5 text-bpk-orange" />
          <h2 className="font-semibold text-gray-800">Filter</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md-bpk transition-colors"
          >
            Atur Ulang
          </button>
          <button
            onClick={onApply}
            className="px-4 py-1.5 bg-bpk-orange text-white text-sm rounded-md-bpk hover:bg-orange-600 transition-colors font-medium"
          >
            Terapkan
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Date Range - Header Style */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
            Rentang Waktu
          </label>
          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { value: "7", label: "7 Hari" },
              { value: "30", label: "30 Hari" },
              { value: "90", label: "90 Hari" },
              { value: "all", label: "Semua" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setShowCustomDate(false);
                  onChange({
                    ...filters,
                    dateRange: option.value,
                    customStart: "",
                    customEnd: "",
                  });
                }}
                className={`px-3 py-1.5 text-xs rounded-md-bpk border transition-colors ${
                  filters.dateRange === option.value && !showCustomDate
                    ? "border-bpk-orange bg-orange-50 text-bpk-orange font-semibold"
                    : "border-gray-200 hover:border-bpk-orange hover:bg-orange-50"
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={() => {
                setShowCustomDate(true);
                onChange({ ...filters, dateRange: "custom" });
              }}
              className={`px-3 py-1.5 text-xs rounded-md-bpk border transition-colors ${
                showCustomDate
                  ? "border-bpk-orange bg-orange-50 text-bpk-orange font-semibold"
                  : "border-gray-200 hover:border-bpk-orange hover:bg-orange-50"
              }`}
            >
              Custom
            </button>
          </div>
          {showCustomDate && (
            <div className="relative mt-2" ref={customDatePickerRef}>
              <button
                type="button"
                onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border-2 border-bpk-orange rounded-lg-bpk hover:bg-orange-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-bpk-orange flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {formatCustomDateDisplay()}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-bpk-orange flex-shrink-0 transition-transform ${showCustomDatePicker ? "rotate-180" : ""}`}
                />
              </button>

              {showCustomDatePicker && (
                <div className="absolute left-0 top-full mt-2 bg-white rounded-lg-bpk shadow-lg border border-gray-200 p-4 z-[200] min-w-[320px]">
                  <div className="flex gap-2 mb-4 pb-4 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleQuickSelectInCustom("7")}
                      className="px-3 py-1.5 text-xs rounded-md-bpk border border-gray-200 hover:border-bpk-orange hover:bg-orange-50 transition-colors"
                    >
                      7 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSelectInCustom("30")}
                      className="px-3 py-1.5 text-xs rounded-md-bpk border border-gray-200 hover:border-bpk-orange hover:bg-orange-50 transition-colors"
                    >
                      30 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSelectInCustom("90")}
                      className="px-3 py-1.5 text-xs rounded-md-bpk border border-gray-200 hover:border-bpk-orange hover:bg-orange-50 transition-colors"
                    >
                      90 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSelectInCustom("all")}
                      className="px-3 py-1.5 text-xs rounded-md-bpk border border-gray-200 hover:border-bpk-orange hover:bg-orange-50 transition-colors"
                    >
                      Semua
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMonth(
                          new Date(
                            selectedMonth.getFullYear(),
                            selectedMonth.getMonth() - 1,
                          ),
                        )
                      }
                      className="p-1 hover:bg-gray-100 rounded text-gray-600"
                    >
                      ←
                    </button>
                    <span className="text-sm font-semibold text-gray-800">
                      {format(selectedMonth, "MMMM yyyy", { locale: id })}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMonth(
                          new Date(
                            selectedMonth.getFullYear(),
                            selectedMonth.getMonth() + 1,
                          ),
                        )
                      }
                      className="p-1 hover:bg-gray-100 rounded text-gray-600"
                    >
                      →
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                      (day) => (
                        <div
                          key={day}
                          className="text-center text-xs text-gray-500 font-semibold py-1"
                        >
                          {day}
                        </div>
                      ),
                    )}
                    {getDaysInMonth(selectedMonth).map((date, index) => {
                      if (!date) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="aspect-square"
                          />
                        );
                      }
                      const isInRange = isDateInRange(date);
                      const isEdge = isDateRangeEdge(date);
                      const isToday =
                        format(date, "yyyy-MM-dd") ===
                        format(new Date(), "yyyy-MM-dd");
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleCustomDateClick(date)}
                          className={`aspect-square text-xs rounded-md flex items-center justify-center transition-colors
                            ${isEdge ? "bg-bpk-orange text-white font-semibold" : ""}
                            ${isInRange && !isEdge ? "bg-orange-100 text-bpk-orange" : ""}
                            ${!isInRange && !isEdge ? "hover:bg-gray-100 text-gray-700" : ""}
                            ${isToday && !isInRange ? "border border-bpk-orange" : ""}
                          `}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  {tempStartDate && tempEndDate && (
                    <button
                      type="button"
                      onClick={handleApplyCustomRange}
                      className="w-full py-2 bg-bpk-orange text-white rounded-md-bpk hover:bg-orange-600 transition-colors text-sm font-semibold"
                    >
                      Terapkan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cluster - Custom Dropdown */}
        <div className="relative">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
            Cluster
          </label>
          <button
            onClick={() => {
              setClusterDropdownOpen(!clusterDropdownOpen);
            }}
            className="w-full px-3 py-2.5 text-sm bg-white border-2 border-bpk-orange rounded-lg-bpk focus:ring-2 focus:ring-bpk-orange/20 focus:outline-none flex items-center justify-between font-medium cursor-pointer"
          >
            <span
              className={`uppercase ${filters.cluster ? "text-gray-800" : "text-gray-500"}`}
            >
              {filters.cluster || "Semua Cluster"}
            </span>
            <Icon
              icon={clusterDropdownOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
              className="w-4 h-4 text-bpk-orange"
            />
          </button>

          {/* Dropdown List */}
          {clusterDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-bpk-orange rounded-lg-bpk shadow-lg overflow-hidden">
              <div className="max-h-[200px] overflow-auto">
                <button
                  onClick={() => {
                    onChange({ ...filters, cluster: "" });
                    setClusterDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm uppercase border-b border-gray-100 transition-colors ${
                    !filters.cluster
                      ? "bg-orange-50 text-bpk-orange font-semibold"
                      : "hover:bg-gray-50"
                  }`}
                >
                  Semua Cluster
                </button>
                {clusters.map((cluster) => (
                  <button
                    key={cluster}
                    onClick={() => {
                      onChange({ ...filters, cluster: cluster });
                      setClusterDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-sm uppercase border-b border-gray-100 last:border-0 transition-colors ${
                      filters.cluster === cluster
                        ? "bg-orange-50 text-bpk-orange font-semibold"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {cluster}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Satker - BPK Tree View */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Satuan Kerja
            </label>
            <button
              onClick={() => setShowTreeView(!showTreeView)}
              className="text-xs text-bpk-orange hover:underline font-medium flex items-center gap-1"
            >
              <Icon
                icon={showTreeView ? "mdi:eye-off" : "mdi:file-tree"}
                className="w-3.5 h-3.5"
              />
              {showTreeView ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>

          {showTreeView && (
            <BPKTreeView
              selectedIds={filters.satkerIds || []}
              onSelectionChange={(ids) =>
                onChange({ ...filters, satkerIds: ids, satker: "" })
              }
              maxHeight="400px"
            />
          )}
        </div>

        {/* Activity Types - Chips */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
            Jenis Aktivitas
          </label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleActivityTypeToggle(type.value)}
                className={`px-3 py-1.5 text-xs rounded-md-bpk border-2 transition-colors font-medium ${
                  filters.activityTypes.includes(type.value)
                    ? "border-bpk-orange bg-orange-50 text-bpk-orange"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status - Toggle Buttons (Only show when activity type is selected) */}
        {filters.activityTypes.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Status
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ ...filters, status: "all" })}
                className={`flex-1 px-3 py-2 text-xs rounded-md-bpk border-2 transition-colors font-medium ${
                  filters.status === "all"
                    ? "border-bpk-orange bg-orange-50 text-bpk-orange"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => onChange({ ...filters, status: "success" })}
                className={`flex-1 px-3 py-2 text-xs rounded-md-bpk border-2 transition-colors font-medium flex items-center justify-center gap-1 ${
                  filters.status === "success"
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Icon icon="mdi:check-circle" className="w-3.5 h-3.5" />
                Berhasil
              </button>
              <button
                onClick={() => onChange({ ...filters, status: "failed" })}
                className={`flex-1 px-3 py-2 text-xs rounded-md-bpk border-2 transition-colors font-medium flex items-center justify-center gap-1 ${
                  filters.status === "failed"
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Icon icon="mdi:close-circle" className="w-3.5 h-3.5" />
                Gagal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
