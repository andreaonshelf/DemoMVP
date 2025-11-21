"use client"
import { useState } from "react"
import { Filter, Layers, BarChart3, TrendingUp, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MeasureFilterControl } from "@/components/measure-filter-control"
import { getMeasureValue, getUsageOccasionData } from "@/lib/demo-data"
import { useFilters } from "@/hooks/use-filters"
import { BRANDS } from "@/types/demo-data"

export function AnalyticsPanel() {
  const {
    selectedStoreId,
    measureType,
    splitBySegment,
    selectedSegment,
    splitByOccasion,
    selectedOccasion
  } = useFilters()

  // Get brand data based on filters
  const brandData = getMeasureValue(
    selectedStoreId,
    measureType,
    splitBySegment ? selectedSegment : null,
    splitByOccasion ? selectedOccasion : null
  )

  return (
    <div className="space-y-4">
      {/* Measure Filter Control */}
      <MeasureFilterControl />

      {/* Share by Brand */}
      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">
            {measureType === "choice_share" && "Choice Share"}
            {measureType === "shelf_share" && "Shelf Share"}
            {measureType === "shelf_efficiency" && "Shelf Efficiency"}
            {measureType === "optimization_potential" && "Optimization Potential"}
          </h3>
        </div>
        <div className="mt-3">
          <StackedBarChart brandData={brandData} measureType={measureType} />
        </div>
      </div>

      {/* Usage Occasions - Demand vs Coverage */}
      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">
            Usage Occasion Demand vs Coverage
          </h3>
        </div>
        <UsageOccasionChart />
      </div>
    </div>
  )
}

function StackedBarChart({
  brandData,
  measureType
}: {
  brandData: Record<string, number>
  measureType: string
}) {
  // Convert to array and sort by value
  const brands = BRANDS.map(brand => ({
    label: brand,
    value: brandData[brand] || 0,
    color: getBrandColor(brand),
    isCustomer: brand === "Premium Craft Co"
  })).sort((a, b) => b.value - a.value)

  // For shelf_efficiency, show as index (not percentage)
  const isEfficiency = measureType === "shelf_efficiency"

  return (
    <div className="space-y-2">
      <div className="relative h-12 bg-[#1a1a1a] rounded overflow-hidden flex">
        {brands.map((brand, index) => {
          if (brand.value === 0) return null

          const isLightBar = brand.color === "#d1d5db" || brand.color === "#9ca3af"
          const textColor = isLightBar ? "text-gray-900" : "text-white"

          // For efficiency, scale to percentage of max for visual display
          const maxValue = Math.max(...brands.map(b => Math.abs(b.value)))
          const displayWidth = isEfficiency
            ? (Math.abs(brand.value) / maxValue) * 100
            : brand.value

          return (
            <div
              key={index}
              className="h-full transition-all duration-500 flex flex-col items-center justify-center px-1"
              style={{
                width: `${displayWidth}%`,
                backgroundColor: brand.color,
              }}
            >
              {displayWidth >= 15 && (
                <>
                  <div className={`text-[9px] font-medium ${textColor}/90 font-sans`}>{brand.label}</div>
                  <div className={`text-xs font-bold ${textColor} font-sans`}>
                    {isEfficiency ? `${brand.value.toFixed(1)}x` : `${brand.value.toFixed(1)}%`}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Brand legend for small segments */}
      <div className="flex flex-wrap gap-2 text-[9px] text-gray-500 font-sans">
        {brands.filter(b => b.value > 0 && b.value < 15).map((brand, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: brand.color }} />
            <span>{brand.label}: {isEfficiency ? `${brand.value.toFixed(1)}x` : `${brand.value.toFixed(1)}%`}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsageOccasionChart() {
  const { selectedStoreId } = useFilters()
  const [sortBy, setSortBy] = useState<"demand" | "gap">("demand")
  const [showAll, setShowAll] = useState(false)

  const allOccasions = getUsageOccasionData(selectedStoreId)

  const sortedOccasions = [...allOccasions].sort((a, b) => {
    if (sortBy === "demand") {
      return b.demand - a.demand
    } else {
      const gapA = Math.abs(a.coverage - a.demand)
      const gapB = Math.abs(b.coverage - b.demand)
      return gapB - gapA
    }
  })

  const displayedOccasions = showAll ? sortedOccasions : sortedOccasions.slice(0, 5)

  const relevanceScore = Math.round(
    (allOccasions.reduce((sum, occ) => sum + (1 - Math.abs(occ.demand - occ.coverage) / 100), 0) /
      allOccasions.length) *
      100,
  )

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => setSortBy(sortBy === "demand" ? "gap" : "demand")}
          className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
          title={sortBy === "demand" ? "Sort by gap" : "Sort by demand"}
        >
          <ArrowUpDown style={{ width: "12px", height: "12px" }} className="text-gray-500" />
        </button>
        <button
          onClick={() => setShowAll(!showAll)}
          className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
          title={showAll ? "Show top 5" : "Show all"}
        >
          <Layers style={{ width: "12px", height: "12px" }} className="text-gray-500" />
        </button>
      </div>

      <div className="space-y-2">
        {displayedOccasions.map((occasion, index) => {
          const gap = occasion.coverage - occasion.demand
          const maxValue = Math.max(occasion.demand, occasion.coverage, 50)

          return (
            <div key={index} className="space-y-0.5">
              <div className="text-[10px] text-gray-300 font-medium font-sans">{occasion.label}</div>

              <div className="flex items-center gap-2">
                <div className="flex-1 relative h-3 bg-[#1a1a1a] rounded-full">
                  <div
                    className="absolute h-full rounded-full transition-all duration-500 bg-[#498BFF]"
                    style={{ width: `${(occasion.coverage / maxValue) * 100}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 transition-all duration-500 z-10"
                    style={{ left: `${(occasion.demand / maxValue) * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[9px] font-sans min-w-[80px]">
                  <span className="text-gray-400 w-7 text-right">{occasion.demand}%</span>
                  <span className="text-gray-600">/</span>
                  <span className="text-[#498BFF] w-7">{occasion.coverage}%</span>
                </div>

                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium font-sans min-w-[50px] text-center"
                  style={
                    gap > 0
                      ? {
                          backgroundColor: "rgba(241, 202, 75, 0.15)",
                          color: "#F1CA4B",
                        }
                      : {
                          backgroundColor: "rgba(235, 87, 87, 0.15)",
                          color: "#EB5757",
                        }
                  }
                >
                  {gap > 0 ? "+" : ""}
                  {gap}pts
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[9px] text-gray-500 font-sans">
          <div className="flex items-center gap-1">
            <div className="w-0.5 h-2 bg-gray-400" />
            <span>Demand</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-[#498BFF]" />
            <span>Coverage</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 font-sans">
          Overall: <span className="font-bold text-gray-400">{relevanceScore}%</span>
        </span>
      </div>
    </div>
  )
}

// Helper function for brand colors
function getBrandColor(brand: string): string {
  const colors: Record<string, string> = {
    "Premium Craft Co": "#498BFF",
    "Traditional Ales Ltd": "#6b7280",
    "Heritage Beer Co": "#9ca3af",
    "Value Lager Brewing": "#d1d5db",
    "Others": "#e5e7eb"
  }
  return colors[brand] || "#6b7280"
}
