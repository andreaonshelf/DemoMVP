"use client"

import { useState, useMemo } from "react"
import { TrendingUp, AlertCircle } from "lucide-react"
import { useFilters } from "@/hooks/use-filters"
import { getListingOpportunities } from "@/lib/demo-data"

export function ListingOpportunitiesTable() {
  const { selectedRetailersForComparison } = useFilters()
  const [priorityFilter, setPriorityFilter] = useState<"All" | "High" | "Medium" | "Low">("All")

  const allOpportunities = getListingOpportunities()

  // Filter by selected retailers and priority
  const filteredOpportunities = useMemo(() => {
    let filtered = allOpportunities

    // Filter by selected retailers if any are selected
    if (selectedRetailersForComparison.length > 0) {
      filtered = filtered.filter((opp) => selectedRetailersForComparison.includes(opp.retailer))
    }

    // Filter by priority
    if (priorityFilter !== "All") {
      filtered = filtered.filter((opp) => opp.priority === priorityFilter)
    }

    return filtered
  }, [allOpportunities, selectedRetailersForComparison, priorityFilter])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-400 bg-red-400/10"
      case "Medium":
        return "text-yellow-400 bg-yellow-400/10"
      case "Low":
        return "text-green-400 bg-green-400/10"
      default:
        return "text-gray-400 bg-gray-400/10"
    }
  }

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-1 font-sans">
            Listing Opportunities
          </h2>
          <p className="text-xs text-gray-500 font-sans">{filteredOpportunities.length} opportunities found</p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          {["All", "High", "Medium", "Low"].map((priority) => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all font-sans ${
                priorityFilter === priority
                  ? "bg-[#498BFF] text-white"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#222]"
              }`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm font-sans">No opportunities found for selected filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-sans">
                  Retailer
                </th>
                <th className="text-left py-3 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-sans">
                  Recommended SKU
                </th>
                <th className="text-right py-3 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-sans">
                  Est. Uplift
                </th>
                <th className="text-center py-3 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-sans">
                  Priority
                </th>
                <th className="text-left py-3 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-sans">
                  Rationale
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOpportunities.map((opp, idx) => (
                <tr key={idx} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-2">
                    <span className="text-xs font-medium text-gray-300 font-sans">{opp.retailer}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-gray-400 font-sans">{opp.recommended_sku}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-green-400 font-sans">
                      <TrendingUp className="h-3 w-3" />
                      +{opp.estimated_uplift_pct.toFixed(1)}%
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-block px-2 py-1 text-[10px] font-bold rounded ${getPriorityColor(
                        opp.priority
                      )} font-sans`}
                    >
                      {opp.priority}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-500 font-sans">{opp.rationale}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
