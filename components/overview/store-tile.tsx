"use client"

import { useRouter } from "next/navigation"
import { Store } from "lucide-react"
import { getMeasureValue, getStore } from "@/lib/demo-data"
import { useFilters } from "@/hooks/use-filters"
import { BRAND_COLORS } from "@/types/demo-data"

interface StoreTileProps {
  storeId: string
}

export function StoreTile({ storeId }: StoreTileProps) {
  const router = useRouter()
  const {
    measureType,
    splitBySegment,
    selectedSegment,
    splitByOccasion,
    selectedOccasion,
    setSelectedStoreId
  } = useFilters()

  // Get store details
  const store = getStore(storeId)
  if (!store) return null

  // Get measure values (brand -> percentage)
  const brandData = getMeasureValue(
    storeId,
    measureType,
    splitBySegment ? selectedSegment : null,
    splitByOccasion ? selectedOccasion : null
  )

  // Convert to sorted array
  const brands = Object.entries(brandData)
    .map(([brand, value]) => ({
      brand,
      value: Number(value) || 0,
      color: BRAND_COLORS[brand] || "#6b7280"
    }))
    .sort((a, b) => b.value - a.value)

  const handleClick = () => {
    setSelectedStoreId(storeId)
    router.push('/store-view')
  }

  // For shelf_efficiency, we show as index (not percentage bar)
  const isEfficiency = measureType === "shelf_efficiency"

  return (
    <button
      onClick={handleClick}
      className="bg-[#0a0a0a] rounded-lg p-3 hover:bg-[#111] transition-all border border-[#1a1a1a] hover:border-[#2a2a2a] text-left w-full group"
    >
      {/* Store Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-white truncate font-sans group-hover:text-[#498BFF] transition-colors">
            {store.banner}
          </h3>
          <p className="text-[9px] text-gray-500 truncate font-sans mt-0.5">
            {store.city} · {store.format}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2">
          <div className="w-6 h-6 rounded bg-[#1a1a1a] flex items-center justify-center group-hover:bg-[#2a2a2a] transition-colors">
            <Store className="w-3 h-3 text-gray-500" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Brand Stacked Bar */}
      {!isEfficiency ? (
        <div className="relative h-8 bg-[#1a1a1a] rounded overflow-hidden flex mb-2">
          {brands.map((brand, index) => {
            if (brand.value === 0) return null

            const isLightBar = brand.color === "#d1d5db" || brand.color === "#9ca3af" || brand.color === "#e5e7eb"
            const textColor = isLightBar ? "text-gray-900" : "text-white"

            return (
              <div
                key={index}
                className="h-full transition-all duration-300 flex flex-col items-center justify-center px-0.5"
                style={{
                  width: `${brand.value}%`,
                  backgroundColor: brand.color,
                }}
                title={`${brand.brand}: ${brand.value.toFixed(1)}%`}
              >
                {brand.value >= 12 && (
                  <div className={`text-[8px] font-bold ${textColor} font-sans`}>
                    {brand.value.toFixed(0)}%
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // For efficiency, show top 3 brands with their efficiency index
        <div className="space-y-1 mb-2">
          {brands.slice(0, 3).map((brand, index) => (
            <div key={index} className="flex items-center justify-between text-[9px] font-sans">
              <span className="text-gray-400 truncate flex-1">{brand.brand}</span>
              <span className={`font-bold ${brand.value >= 0 ? 'text-[#1ED59B]' : 'text-[#EB5757]'}`}>
                {brand.value > 0 ? '+' : ''}{brand.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Brand Legend (for small segments) */}
      {!isEfficiency && (
        <div className="flex flex-wrap gap-1 text-[8px] text-gray-500 font-sans">
          {brands.filter(b => b.value > 0 && b.value < 12).map((brand, idx) => (
            <div key={idx} className="flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: brand.color }} />
              <span className="truncate max-w-[60px]" title={brand.brand}>
                {brand.brand.split(' ')[0]} {brand.value.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Store Meta */}
      <div className="mt-2 pt-2 border-t border-[#1a1a1a] flex items-center justify-between text-[8px] text-gray-600 font-sans">
        <span>{store.retailer}</span>
        <span>{store.region_group}</span>
      </div>
    </button>
  )
}
