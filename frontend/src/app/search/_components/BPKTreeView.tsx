/**
 * BPKTreeView.tsx
 *
 * Tree view satuan kerja BPK: data dari getSatkerList, dibangun jadi pohon (root = tanpa parent).
 * Fitur: cari nama, expand/collapse, pilih node (cekbox) + pilih semua/hapus, urutan Eselon I
 * sesuai organogram (Inspektorat → Sekretariat → Ditjen PKN I–VIII → Investigasi → Badan → Perwakilan).
 * Saat cari: hanya tampil node yang cocok + semua ancestor; otomatis expand.
 */

"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { metadataService } from "@/services/api";

/** Satu unit dari API: id, nama, level eselon, parent_id. */
interface SatkerUnit {
  id: number;
  satker_name: string;
  eselon_level: string;
  parent_id: number | null;
}

/** Node pohon: SatkerUnit + children (rekursif). */
interface TreeNode extends SatkerUnit {
  children: TreeNode[];
}

interface BPKTreeViewProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  maxHeight?: string;
}

/**
 * Render: loading → spinner; data kosong → pesan + Coba lagi; else search + tombol aksi + tree + footer.
 */
export default function BPKTreeView({
  selectedIds,
  onSelectionChange,
  maxHeight = "500px",
}: BPKTreeViewProps) {
  const [allData, setAllData] = useState<SatkerUnit[]>([]);
  const [rootNodes, setRootNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  /** Setiap allData/expandedNodes/searchQuery berubah, bangun ulang pohon (rootNodes). */
  useEffect(() => {
    if (allData.length > 0) {
      buildTree();
    }
  }, [allData, expandedNodes, searchQuery]);

  /** Ambil daftar satker dari API, simpan ke allData. */
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await metadataService.getSatkerList();

      if (data.satker && Array.isArray(data.satker)) {
        console.log("✅ Loaded", data.satker.length, "satker units");

        const withParent = data.satker.filter((s) => s.parent_id != null && s.parent_id !== 0);
        const withoutParent = data.satker.filter((s) => s.parent_id == null || s.parent_id === 0);
        console.log("Root nodes (no parent):", withoutParent.length);
        console.log("Child nodes (has parent):", withParent.length);

        setAllData(data.satker);
      } else {
        console.error("❌ Invalid data format:", data);
      }
    } catch (error) {
      console.error("❌ Failed to load:", error);
    } finally {
      setLoading(false);
    }
  };

  /** Kumpulkan id semua ancestor node (parent, grandparent, ...) sampai root. */
  const getAncestorIds = (nodeId: number): Set<number> => {
    const ids = new Set<number>();
    const item = allData.find((d) => d.id === nodeId);
    if (!item || !item.parent_id) return ids;
    ids.add(item.parent_id);
    const parentAncestors = getAncestorIds(item.parent_id);
    parentAncestors.forEach((id) => ids.add(id));
    return ids;
  };

  /** Bangun pohon: tanpa search pakai allData; dengan search pakai node cocok + ancestor, auto-expand. */
  const buildTree = () => {
    const query = searchQuery.trim().toLowerCase();

    let dataToShow: SatkerUnit[];
    let expandWhenSearch = false;

    if (query) {
      const matchingItems = allData.filter((item) =>
        item.satker_name.toLowerCase().includes(query)
      );

      if (matchingItems.length === 0) {
        setRootNodes([]);
        return;
      }

      /** Gabung node yang cocok + semua ancestor agar path ke root terlihat. */
      const visibleIds = new Set<number>();
      matchingItems.forEach((item) => {
        visibleIds.add(item.id);
        getAncestorIds(item.id).forEach((id) => visibleIds.add(id));
      });

      dataToShow = allData.filter((item) => visibleIds.has(item.id));
      expandWhenSearch = true;
      /** Saat search, expand semua node yang tampil. */
    } else {
      dataToShow = allData;
    }

    const getEselonIRootOrder = (name: string): number => {
      const n = (name || "").trim();
      if (/^Inspektorat/i.test(n)) return 1;
      if (/^Sekretariat Jenderal/i.test(n)) return 2;
      if (/^Ditjen PKN VIII/i.test(n)) return 10;
      if (/^Ditjen PKN VII\b/i.test(n)) return 9;
      if (/^Ditjen PKN VI\b/i.test(n)) return 8;
      if (/^Ditjen PKN V\b/i.test(n)) return 7;
      if (/^Ditjen PKN IV\b/i.test(n)) return 6;
      if (/^Ditjen PKN III\b/i.test(n)) return 5;
      if (/^Ditjen PKN II\b/i.test(n)) return 4;
      if (/^Ditjen PKN I\b/i.test(n)) return 3;
      if (/^Ditjen Pemeriksaan Investigasi/i.test(n)) return 11;
      if (/^Badan/i.test(n)) return 20;
      if (/^BPK Perwakilan/i.test(n)) return 30;
      return 15;
    };
    /** Urutan root Eselon I: Inspektorat → Sekretariat → Ditjen PKN I..VIII → Investigasi → Badan → Perwakilan. */

    const eselonOrder = (a: SatkerUnit, b: SatkerUnit) => {
      const depthA = a.eselon_level?.toLowerCase().includes("iv") ? 4 : a.eselon_level?.toLowerCase().includes("iii") ? 3 : a.eselon_level?.toLowerCase().includes("ii") ? 2 : 1;
      const depthB = b.eselon_level?.toLowerCase().includes("iv") ? 4 : b.eselon_level?.toLowerCase().includes("iii") ? 3 : b.eselon_level?.toLowerCase().includes("ii") ? 2 : 1;
      if (depthA !== depthB) return depthA - depthB;
      return a.satker_name.localeCompare(b.satker_name);
    };
    /** Urutan anak: eselon I→II→III→IV lalu nama. */

    const rootOrder = (a: SatkerUnit, b: SatkerUnit) => {
      const orderA = getEselonIRootOrder(a.satker_name);
      const orderB = getEselonIRootOrder(b.satker_name);
      if (orderA !== orderB) return orderA - orderB;
      return a.satker_name.localeCompare(b.satker_name);
    };
    /** Urutan root: getEselonIRootOrder lalu nama. */

    /** Anak dari parentId: filter dataToShow, rekursif buildChildren jika expand/search, urut eselonOrder. */
    const buildChildren = (parentId: number): TreeNode[] => {
      const children = dataToShow
        .filter((item) => item.parent_id === parentId)
        .map((item) => ({
          ...item,
          children: (expandWhenSearch || expandedNodes.has(item.id)) ? buildChildren(item.id) : [],
        }))
        .sort(eselonOrder);

      return children;
    };

    const roots = dataToShow
      .filter((item) => !item.parent_id || item.parent_id === 0)
      .map((item) => ({
        ...item,
        children: (expandWhenSearch || expandedNodes.has(item.id)) ? buildChildren(item.id) : [],
      }))
      .sort(rootOrder);

    setRootNodes(roots);
  };

  /** Apakah node punya anak (ada item di allData yang parent_id = nodeId). */
  const hasChildren = (nodeId: number): boolean => {
    return allData.some((item) => item.parent_id === nodeId);
  };

  const toggleExpand = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };
  /** Toggle expand/collapse: tambah atau hapus nodeId dari expandedNodes. */

  const getAllDescendantIds = (parentId: number): number[] => {
    const ids: number[] = [];
    const children = allData.filter((item) => item.parent_id === parentId);
    
    children.forEach((child) => {
      ids.push(child.id);
      ids.push(...getAllDescendantIds(child.id));
    });
    
    return ids;
  };
  /** Daftar id semua keturunan (anak, cucu, ...) dari parentId. */

  const handleSelect = (nodeId: number, checked: boolean) => {
    const descendantIds = [nodeId, ...getAllDescendantIds(nodeId)];
    let newSelection = [...selectedIds];

    if (checked) {
      descendantIds.forEach((id) => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
    } else {
      newSelection = newSelection.filter((id) => !descendantIds.includes(id));
    }

    onSelectionChange(newSelection);
  };
  /** Cekbox: checked = tambah node + semua keturunan ke selection; unchecked = hapus dari selection. */

  const expandAll = () => {
    const allIds = new Set(allData.filter(item => hasChildren(item.id)).map((item) => item.id));
    setExpandedNodes(allIds);
  };
  /** Expand semua node yang punya anak. */

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const selectAll = () => {
    onSelectionChange(allData.map((item) => item.id));
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  /** Ikon per level eselon: I = gedung, II = sitemap, III = group, IV = person. */
  const getEselonIcon = (eselon: string, hasChild: boolean) => {
    const level = eselon.toLowerCase();
    
    if (level.includes("i") && !level.includes("ii") && !level.includes("iii") && !level.includes("iv")) {
      return "mdi:office-building"; // Eselon 1 - Building
    } else if (level.includes("ii")) {
      return "mdi:sitemap"; // Eselon 2 - Sitemap
    } else if (level.includes("iii")) {
      return "mdi:account-group"; // Eselon 3 - Group
    } else if (level.includes("iv")) {
      return "mdi:account-circle"; // Eselon 4 - Person
    }
    return "mdi:circle-small";
  };

  /** Warna badge per eselon: I ungu, II biru, III hijau, IV abu. */
  const getEselonColor = (eselon: string) => {
    const level = eselon.toLowerCase();
    if (level.includes("i") && !level.includes("ii") && !level.includes("iii") && !level.includes("iv")) {
      return "text-[#5E4077] bg-[#F3E8FF]";
    } else if (level.includes("ii")) {
      return "text-[#3B83F1] bg-[#DBEAFE]";
    } else if (level.includes("iii")) {
      return "text-[#007A55] bg-[#CAEBDC]";
    } else if (level.includes("iv")) {
      return "text-[#6B7280] bg-[#F3F4F6]";
    }
    return "text-[#6B7280] bg-[#F3F4F6]";
  };

  /** Kedalaman indent tambahan: I=0, II=1, III=2, IV=3 (Eselon IV lebih menjorok). */
  const getEselonDepth = (eselon: string): number => {
    const level = (eselon || "").toLowerCase();
    if (level.includes("iv")) return 3;
    if (level.includes("iii")) return 2;
    if (level.includes("ii")) return 1;
    if (level.includes("i")) return 0;
    return 0;
  };

  /** Satu baris node: tombol expand, cekbox, ikon eselon, nama, badge eselon; anak di-render jika expanded. */
  const renderNode = (node: TreeNode, level: number = 0) => {
    const nodeHasChildren = hasChildren(node.id);
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedIds.includes(node.id);

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center gap-2 px-3 py-2 min-w-0
            rounded-lg transition-all duration-150
            ${isSelected 
              ? "bg-gradient-to-r from-[#FFF5E6] to-transparent border-l-3 border-[#E67E22]" 
              : "hover:bg-gray-50"
            }
          `}
          style={{
            paddingLeft: `${level * 28 + getEselonDepth(node.eselon_level) * 14 + 12}px`,
          }}
        >
          {nodeHasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="
                w-6 h-6 flex items-center justify-center rounded-md
                hover:bg-[#E67E22]/10 transition-colors flex-shrink-0
              "
            >
              <Icon
                icon={isExpanded ? "mdi:minus" : "mdi:plus"}
                className={`w-4 h-4 ${isSelected ? "text-[#E67E22]" : "text-gray-500"}`}
              />
            </button>
          ) : (
            <div className="w-6" />
          )}

          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleSelect(node.id, e.target.checked)}
            className="
              w-4 h-4 rounded border-2 border-gray-300
              text-[#E67E22] focus:ring-2 focus:ring-[#E67E22]/20
              transition-all cursor-pointer flex-shrink-0
            "
          />

          <Icon
            icon={getEselonIcon(node.eselon_level, nodeHasChildren)}
            className={`w-5 h-5 flex-shrink-0 ${
              isSelected ? "text-[#E67E22]" : "text-gray-400"
            }`}
          />

          <span
            className={`
              text-sm flex-1 min-w-[120px] break-words whitespace-normal
              ${isSelected ? "text-[#E67E22] font-semibold" : "text-gray-700"}
            `}
            title={node.satker_name}
          >
            {node.satker_name}
          </span>

          <span
            className={`
              text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0
              ${getEselonColor(node.eselon_level)}
            `}
          >
            {node.eselon_level}
          </span>
        </div>

        {nodeHasChildren && isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        {/* Spinner + teks "Memuat struktur organisasi..." */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-orange-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#E67E22] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Memuat struktur organisasi...</p>
        </div>
      </div>
    );
  }

  if (allData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        {/* Gagal memuat: ikon alert + tombol Coba lagi */}
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-3">
          <Icon icon="mdi:alert-circle-outline" className="w-8 h-8 text-[#E67E22]" />
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">Gagal memuat data</p>
        <button
          onClick={loadData}
          className="mt-2 text-sm text-[#E67E22] hover:text-[#D35400] font-medium hover:underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Icon icon="mdi:magnify" className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Cari satuan kerja..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="
            w-full pl-10 pr-10 py-2.5 text-sm
            bg-white border-2 border-gray-200 rounded-lg
            focus:border-[#E67E22] focus:ring-2 focus:ring-[#E67E22]/10
            focus:outline-none transition-all
            placeholder:text-gray-400
          "
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Icon icon="mdi:close-circle" className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={expandAll}
          className="text-xs text-gray-600 hover:text-[#E67E22] hover:bg-orange-50 px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1"
        >
          <Icon icon="mdi:unfold-more-horizontal" className="w-4 h-4" />
          Tampilkan semua
        </button>
        <button
          onClick={collapseAll}
          className="text-xs text-gray-600 hover:text-[#E67E22] hover:bg-orange-50 px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1"
        >
          <Icon icon="mdi:unfold-less-horizontal" className="w-4 h-4" />
          Tutup semua
        </button>
        <div className="flex-1"></div>
        <button
          onClick={selectAll}
          className="text-xs text-gray-600 hover:text-[#E67E22] hover:bg-orange-50 px-3 py-1.5 rounded-md transition-all font-medium"
        >
          Pilih Semua
        </button>
        <button
          onClick={clearSelection}
          className="text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-all font-medium"
        >
          Hapus
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-[#FFF5E6] border-l-4 border-[#E67E22] rounded-lg px-3 py-2 flex items-center gap-2">
          <Icon icon="mdi:check-circle" className="w-4 h-4 text-[#E67E22]" />
          <span className="text-xs text-[#E67E22] font-semibold">
            {selectedIds.length} dipilih
          </span>
        </div>
      )}

      <div
        className="border-2 border-[#E67E22] rounded-xl overflow-hidden bg-white min-w-[280px]"
        style={{ maxHeight }}
      >
        <div className="overflow-auto p-3 min-w-0" style={{ maxHeight }}>
          {rootNodes.length > 0 ? (
            <div className="space-y-0.5 min-w-[260px]">
              {rootNodes.map((node) => renderNode(node, 0))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Icon icon="mdi:file-tree-outline" className="w-16 h-16 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                {searchQuery
                  ? `Tidak ditemukan "${searchQuery}"`
                  : "Tidak ada data"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer: jumlah unit (atau hasil search) + jumlah root Eselon I */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <div className="flex items-center gap-1">
          <Icon icon="mdi:database" className="w-3.5 h-3.5" />
          <span>
            {searchQuery.trim()
              ? `${allData.filter((d) =>
                  d.satker_name.toLowerCase().includes(searchQuery.trim().toLowerCase())
                ).length} hasil untuk "${searchQuery.trim()}"`
              : `${allData.length} unit`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Icon icon="mdi:office-building" className="w-3.5 h-3.5" />
          <span>{rootNodes.length} Eselon I</span>
        </div>
      </div>
    </div>
  );
}
