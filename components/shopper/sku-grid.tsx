"use client"

import { useMemo, useState } from "react"
import { getAllSKUs } from "@/lib/demo-data"
import { useFilters } from "@/hooks/use-filters"
import { SKUCard } from "./sku-card"

export function SKUGrid() {
  const {
    splitBySegment,
    selectedSegment,
    splitByOccasion,
    selectedOccasion,
    brandFilters
  } = useFilters()

  const [currentPage, setCurrentPage] = useState(1)
  const SKUS_PER_PAGE = 20

  const allSKUs = getAllSKUs()

  // Filter SKUs
  const filteredSKUs = useMemo(() => {
    return allSKUs.filter((sku) => {
      // Brand filter
      if (brandFilters.length > 0 && !brandFilters.includes(sku.brand)) {
        return false
      }

      // Segment filter - only show SKUs that have meaningful presence in this segment
      if (splitBySegment && selectedSegment) {
        const segmentShare = sku.segment_choice_share[selectedSegment] || 0
        if (segmentShare < 1) return false // Filter out SKUs with <1% share
      }

      // Occasion filter - only show SKUs that have meaningful presence in this occasion
      if (splitByOccasion && selectedOccasion) {
        const occasionShare = sku.occasion_choice_share[selectedOccasion] || 0
        if (occasionShare < 1) return false // Filter out SKUs with <1% share
      }

      return true
    })
  }, [allSKUs, brandFilters, splitBySegment, selectedSegment, splitByOccasion, selectedOccasion])

  // Sort by availability (descending)
  const sortedSKUs = useMemo(() => {
    return [...filteredSKUs].sort((a, b) => b.total_availability - a.total_availability)
  }, [filteredSKUs])

  // Pagination
  const totalPages = Math.ceil(sortedSKUs.length / SKUS_PER_PAGE)
  const startIndex = (currentPage - 1) * SKUS_PER_PAGE
  const endIndex = startIndex + SKUS_PER_PAGE
  const currentSKUs = sortedSKUs.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [brandFilters, splitBySegment, selectedSegment, splitByOccasion, selectedOccasion])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-2 font-sans">SKU Performance</h1>
          <p className="text-sm text-gray-500 font-sans">
            {sortedSKUs.length} SKU{sortedSKUs.length === 1 ? '' : 's'} found
            {splitBySegment && selectedSegment && ` • Segment: ${selectedSegment}`}
            {splitByOccasion && selectedOccasion && ` • Occasion: ${selectedOccasion}`}
          </p>
        </div>

        {/* Empty state */}
        {currentSKUs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm font-sans">No SKUs found matching your filters.</p>
            <p className="text-gray-600 text-xs mt-2 font-sans">Try adjusting your filter selection.</p>
          </div>
        )}

        {/* SKU Grid */}
        {currentSKUs.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentSKUs.map((sku) => (
                <SKUCard key={sku.sku_id} sku={sku} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors font-sans ${
                          currentPage === pageNum
                            ? "bg-[#498BFF] text-white"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
