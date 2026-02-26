import React from "react";

/**
 * FilterBadge
 *
 * Reusable header badge that shows active filters (date range, cluster, eselon).
 * - Only renders when at least one filter is non-default.
 * - Normalizes `cluster` to UPPERCASE before rendering.
 * - Does not render any emoji; fields are joined with a centered dot separator.
 */
type FilterBadgeProps = {
  dateRange?: string;
  cluster?: string;
  eselon?: string;
};

const DEFAULTS = {
  dateRange: "Semua",
  cluster: "Semua Cluster",
  eselon: "Semua Eselon",
};

export default function FilterBadge({
  dateRange = DEFAULTS.dateRange,
  cluster = DEFAULTS.cluster,
  eselon = DEFAULTS.eselon,
}: FilterBadgeProps) {
  const parts: string[] = [];

  // If dateRange is provided and not the default label, include it (no emoji)
  if (dateRange && dateRange !== DEFAULTS.dateRange) {
    parts.push(dateRange);
  }

  // Normalize cluster to uppercase for consistent display (e.g. "fsva" → "FSVA").
  // Only include if it's not the default cluster label.
  if (cluster && cluster !== DEFAULTS.cluster) {
    parts.push(cluster.toUpperCase());
  }

  // Include eselon if provided and not default.
  if (eselon && eselon !== DEFAULTS.eselon) {
    parts.push(eselon);
  }

  // If nothing to show (all defaults), don't render anything to avoid empty headers.
  if (parts.length === 0) return null;

  return <div className="text-xs text-gray-500">{parts.join(" · ")}</div>;
}
