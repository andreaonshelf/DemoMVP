"use client"

import { Store, TrendingUp } from "lucide-react"
import type { SKU } from "@/types/demo-data"
import { useFilters } from "@/hooks/use-filters"
import { BRAND_COLORS } from "@/types/demo-data"

interface SKUCardProps {
  sku: SKU
}

export function SKUCard({ sku }: SKUCardProps) {
  const {
    splitBySegment,
    selectedSegment,
    splitByOccasion,
    selectedOccasion
  } = useFilters()

  // Get top segments
  const topSegments = Object.entries(sku.segment_choice_share)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  // Get top occasions
  const topOccasions = Object.entries(sku.occasion_choice_share)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  // Get selected segment/occasion value if filtered
  const filteredSegmentShare = splitBySegment && selectedSegment
    ? sku.segment_choice_share[selectedSegment] || 0
    : null

  const filteredOccasionShare = splitByOccasion && selectedOccasion
    ? sku.occasion_choice_share[selectedOccasion] || 0
    : null

  const brandColor = BRAND_COLORS[sku.brand] || "#6b7280"

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-bold text-white font-sans line-clamp-2">{sku.name}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
          <span className="font-medium" style={{ color: brandColor }}>{sku.brand}</span>
          <span>•</span>
          <span>{sku.pack_size}</span>
          {sku.abv && (
            <>
              <span>•</span>
              <span>{sku.abv} ABV</span>
            </>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="mb-3 pb-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Store className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-500 font-sans">Availability</span>
          </div>
          <span className="text-xs font-bold text-gray-400 font-sans">{sku.total_availability}%</span>
        </div>
        <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${sku.total_availability}%`,
              backgroundColor: brandColor
            }}
          />
        </div>
        <p className="text-[9px] text-gray-600 mt-1 font-sans">
          Available in {sku.available_stores.length} store{sku.available_stores.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Filtered Segment/Occasion Display */}
      {(filteredSegmentShare !== null || filteredOccasionShare !== null) && (
        <div className="mb-3 pb-3 border-b border-gray-800">
          {filteredSegmentShare !== null && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 font-sans">{selectedSegment}</span>
                <span className="text-xs font-bold text-[#498BFF] font-sans">{filteredSegmentShare.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#498BFF] h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, filteredSegmentShare)}%` }}
                />
              </div>
            </div>
          )}

          {filteredOccasionShare !== null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 font-sans">{selectedOccasion}</span>
                <span className="text-xs font-bold text-[#498BFF] font-sans">{filteredOccasionShare.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#498BFF] h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, filteredOccasionShare)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Segments (when not filtered) */}
      {!splitBySegment && topSegments.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3 w-3 text-gray-500" />
            <span className="text-[9px] text-gray-500 uppercase tracking-wide font-sans">Top Segments</span>
          </div>
          <div className="space-y-1.5">
            {topSegments.map(([segment, share]) => (
              <div key={segment} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400 font-sans truncate flex-1">{segment}</span>
                <span className="text-gray-500 font-sans ml-2">{share.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Occasions (when not filtered) */}
      {!splitByOccasion && topOccasions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3 w-3 text-gray-500" />
            <span className="text-[9px] text-gray-500 uppercase tracking-wide font-sans">Top Occasions</span>
          </div>
          <div className="space-y-1.5">
            {topOccasions.map(([occasion, share]) => (
              <div key={occasion} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400 font-sans truncate flex-1">{occasion}</span>
                <span className="text-gray-500 font-sans ml-2">{share.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
