"use client"

import { useMemo, useState } from "react"
import { StoreTile } from "./store-tile"
import { getAllStores } from "@/lib/demo-data"
import { useFilters } from "@/hooks/use-filters"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const STORES_PER_PAGE = 50

export function StoreGrid() {
  const {
    retailerFilters,
    formatFilters,
    regionFilters,
    missionFilters
  } = useFilters()

  const [currentPage, setCurrentPage] = useState(1)

  // Get all stores
  const allStores = getAllStores()

  // Apply filters
  const filteredStores = useMemo(() => {
    return allStores.filter(store => {
      // Retailer filter
      if (retailerFilters.length > 0 && !retailerFilters.includes(store.retailer)) {
        return false
      }

      // Format filter
      if (formatFilters.length > 0 && !formatFilters.includes(store.format)) {
        return false
      }

      // Region filter
      if (regionFilters.length > 0 && !regionFilters.includes(store.region_group)) {
        return false
      }

      // Mission filter (any mission must match)
      if (missionFilters.length > 0) {
        const hasMission = missionFilters.some(mission => store.missions.includes(mission))
        if (!hasMission) return false
      }

      return true
    })
  }, [allStores, retailerFilters, formatFilters, regionFilters, missionFilters])

  // Pagination
  const totalPages = Math.ceil(filteredStores.length / STORES_PER_PAGE)
  const startIndex = (currentPage - 1) * STORES_PER_PAGE
  const endIndex = startIndex + STORES_PER_PAGE
  const currentStores = filteredStores.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [retailerFilters, formatFilters, regionFilters, missionFilters])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-white font-sans">Store Overview</h1>
            <p className="text-[10px] text-gray-500 font-sans mt-0.5">
              Showing {currentStores.length} of {filteredStores.length} store{filteredStores.length === 1 ? '' : 's'}
              {filteredStores.length !== allStores.length && ` (${allStores.length} total)`}
            </p>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[10px] text-gray-500 font-sans">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {currentStores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {currentStores.map(store => (
              <StoreTile key={store.store_id} storeId={store.store_id} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-gray-400 font-sans">No stores found</p>
              <p className="text-xs text-gray-600 font-sans mt-1">
                Try adjusting your filters
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Pagination */}
      {totalPages > 1 && currentStores.length > 0 && (
        <div className="border-t border-[#1a1a1a] px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-gray-500 font-sans">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredStores.length)} of {filteredStores.length}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2 text-xs font-sans"
              >
                Previous
              </Button>
              <div className="text-[10px] text-gray-500 font-sans">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 text-xs font-sans"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
