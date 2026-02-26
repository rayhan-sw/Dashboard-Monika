/**
 * index.ts – Barrel export komponen halaman Pencarian
 *
 * Semua komponen search diekspor dari sini agar pemakaian di page cukup satu import.
 * Setiap komponen bersifat self-contained (data/state sendiri).
 */

/** Bar pencarian (input + trigger). */
export { default as SearchBar } from "./SearchBar";
/** Panel filter (tanggal, status, cluster, dll.). */
export { default as SearchFilters } from "./SearchFilters";
/** Daftar hasil pencarian. */
export { default as SearchResults } from "./SearchResults";
/** Tree view satuan kerja (struktur organisasi BPK) dengan cekbox pilihan. */
export { default as BPKTreeView } from "./BPKTreeView";
/** Helper simpan pencarian terakhir. */
export { saveRecentSearch } from "./RecentSearches";
