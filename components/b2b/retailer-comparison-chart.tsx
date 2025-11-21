"use client"

import { useMemo } from "react"
import { useFilters } from "@/hooks/use-filters"
import { getRetailerData } from "@/lib/demo-data"
import { BRAND_COLORS, BRANDS } from "@/types/demo-data"

export function RetailerComparisonChart() {
  const { selectedRetailersForComparison } = useFilters()

  // Get data for selected retailers
  const retailerComparisons = useMemo(() => {
    return selectedRetailersForComparison
      .map((retailer) => {
        const data = getRetailerData(retailer)
        if (!data) return null

        // Convert to array and get all brands
        const brandShares = BRANDS.map(brand => ({
          brand,
          share: data.total_choice_share[brand] || 0,
          color: BRAND_COLORS[brand] || "#6b7280"
        })).sort((a, b) => b.share - a.share)

        return {
          retailer,
          totalStores: data.total_stores,
          brandShares
        }
      })
      .filter(Boolean) as Array<{
        retailer: string
        totalStores: number
        brandShares: Array<{ brand: string; share: number; color: string }>
      }>
  }, [selectedRetailersForComparison])

  if (retailerComparisons.length === 0) return null

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-1 font-sans">
          Brand Positioning Comparison
        </h2>
        <p className="text-xs text-gray-500 font-sans">Choice share across selected retailers</p>
      </div>

      <div className="space-y-6">
        {retailerComparisons.map(({ retailer, totalStores, brandShares }) => (
          <div key={retailer}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-300 font-sans">{retailer}</h3>
              <span className="text-xs text-gray-500 font-sans">{totalStores} stores</span>
            </div>

            {/* Stacked horizontal bar */}
            <div className="relative h-10 bg-[#1a1a1a] rounded overflow-hidden flex">
              {brandShares.map((brand) => {
                if (brand.share === 0) return null

                const isLightBar = brand.color === "#d1d5db" || brand.color === "#9ca3af" || brand.color === "#e5e7eb"
                const textColor = isLightBar ? "text-gray-900" : "text-white"

                return (
                  <div
                    key={brand.brand}
                    className="h-full transition-all duration-500 flex items-center justify-center px-2"
                    style={{
                      width: `${brand.share}%`,
                      backgroundColor: brand.color,
                    }}
                    title={`${brand.brand}: ${brand.share.toFixed(1)}%`}
                  >
                    {brand.share >= 12 && (
                      <div className="flex flex-col items-center">
                        <div className={`text-[9px] font-medium ${textColor}/90 font-sans truncate max-w-full`}>
                          {brand.brand}
                        </div>
                        <div className={`text-xs font-bold ${textColor} font-sans`}>{brand.share.toFixed(1)}%</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Brand legend for small segments */}
            <div className="flex flex-wrap gap-3 mt-2 text-[9px] text-gray-500 font-sans">
              {brandShares.filter(b => b.share > 0 && b.share < 12).map((brand) => (
                <div key={brand.brand} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: brand.color }} />
                  <span>{brand.brand}: {brand.share.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
