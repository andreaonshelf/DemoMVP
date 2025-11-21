"use client"

import { useFilters } from "@/hooks/use-filters"
import { RetailerComparisonChart } from "./retailer-comparison-chart"
import { ListingOpportunitiesTable } from "./listing-opportunities-table"
import { CrossRetailerInsights } from "./cross-retailer-insights"

export function RetailerAnalyticsDashboard() {
  const { selectedRetailersForComparison } = useFilters()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-2 font-sans">Retailer Analytics</h1>
          <p className="text-sm text-gray-500 font-sans">
            Compare brand positioning and identify listing opportunities across retailers
          </p>
        </div>

        {selectedRetailersForComparison.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm font-sans">Select retailers from the sidebar to view comparison</p>
            <p className="text-gray-600 text-xs mt-2 font-sans">Choose 2 or more retailers for best insights</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Retailer Comparison Chart */}
            <RetailerComparisonChart />

            {/* Listing Opportunities */}
            <ListingOpportunitiesTable />

            {/* Cross-Retailer Insights */}
            <CrossRetailerInsights />
          </div>
        )}
      </div>
    </div>
  )
}
