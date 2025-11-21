"use client"

import { useMemo } from "react"
import { BarChart3 } from "lucide-react"
import { useFilters } from "@/hooks/use-filters"
import { getCrossRetailerComparisons } from "@/lib/demo-data"

export function CrossRetailerInsights() {
  const { selectedRetailersForComparison } = useFilters()

  const allComparisons = getCrossRetailerComparisons()

  // Filter comparisons that include selected retailers
  const relevantComparisons = useMemo(() => {
    if (selectedRetailersForComparison.length === 0) {
      return allComparisons
    }

    return allComparisons.filter((comp) =>
      comp.retailers.some((retailer) => selectedRetailersForComparison.includes(retailer))
    )
  }, [allComparisons, selectedRetailersForComparison])

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-1 font-sans">
          Cross-Retailer Insights
        </h2>
        <p className="text-xs text-gray-500 font-sans">Key metrics across retailer landscape</p>
      </div>

      <div className="space-y-6">
        {relevantComparisons.map((comparison, idx) => {
          // Find max value for scaling
          const maxValue = Math.max(...comparison.values)
          const minValue = Math.min(...comparison.values)

          // Highlight selected retailers
          const highlightedIndices = comparison.retailers
            .map((retailer, i) => (selectedRetailersForComparison.includes(retailer) ? i : -1))
            .filter((i) => i !== -1)

          return (
            <div key={idx}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-300 font-sans">{comparison.metric}</h3>
              </div>

              <div className="space-y-2">
                {comparison.retailers.map((retailer, i) => {
                  const value = comparison.values[i]
                  const percentage = (value / maxValue) * 100
                  const isHighlighted = highlightedIndices.includes(i)
                  const isMax = value === maxValue
                  const isMin = value === minValue

                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-sans ${
                            isHighlighted ? "font-bold text-white" : "text-gray-400"
                          }`}
                        >
                          {retailer}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold font-sans ${
                              isHighlighted
                                ? "text-[#498BFF]"
                                : isMax
                                ? "text-green-400"
                                : isMin
                                ? "text-red-400"
                                : "text-gray-400"
                            }`}
                          >
                            {value.toFixed(1)}%
                          </span>
                          {isMax && value > minValue && (
                            <span className="text-[9px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded font-sans">
                              Highest
                            </span>
                          )}
                          {isMin && value < maxValue && (
                            <span className="text-[9px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded font-sans">
                              Lowest
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHighlighted ? "bg-[#498BFF]" : "bg-gray-700"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
