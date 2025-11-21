"use client"

import { X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useFilters } from "@/hooks/use-filters"
import { getAllRetailers, getRetailerData } from "@/lib/demo-data"

export function RetailerSidebar() {
  const {
    selectedRetailersForComparison,
    toggleRetailerForComparison,
    setSelectedRetailersForComparison
  } = useFilters()

  const allRetailers = getAllRetailers()

  const clearAllRetailers = () => {
    setSelectedRetailersForComparison([])
  }

  return (
    <div className="w-80 border-r border-gray-800 bg-black overflow-y-auto">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide font-sans">Retailers</h2>
          {selectedRetailersForComparison.length > 0 && (
            <button
              onClick={clearAllRetailers}
              className="text-xs text-[#498BFF] hover:text-[#3a7ae0] transition-colors font-sans flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 font-sans">
          {selectedRetailersForComparison.length > 0
            ? `${selectedRetailersForComparison.length} selected for comparison`
            : "Select retailers to compare"}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {allRetailers.map((retailer) => {
          const retailerData = getRetailerData(retailer)
          const isSelected = selectedRetailersForComparison.includes(retailer)

          return (
            <div
              key={retailer}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#498BFF]/10 border-[#498BFF]"
                  : "bg-[#0a0a0a] border-gray-800 hover:border-gray-700"
              }`}
              onClick={() => toggleRetailerForComparison(retailer)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleRetailerForComparison(retailer)}
                  className="mt-0.5 border-gray-600"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-1 font-sans">{retailer}</h3>
                  {retailerData && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-500 font-sans">
                        {retailerData.total_stores} store{retailerData.total_stores === 1 ? '' : 's'}
                      </p>
                      {Object.entries(retailerData.total_choice_share)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 2)
                        .map(([brand, share]) => (
                          <p key={brand} className="text-[9px] text-gray-600 font-sans truncate">
                            {brand}: {share.toFixed(1)}%
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
