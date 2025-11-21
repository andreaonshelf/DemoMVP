"use client"

import { FilterSidebar } from "@/components/overview/filter-sidebar"
import { StoreGrid } from "@/components/overview/store-grid"

export default function OverviewPage() {
  return (
    <div className="h-full flex bg-black">
      {/* Filter Sidebar */}
      <FilterSidebar />

      {/* Store Grid */}
      <StoreGrid />
    </div>
  )
}
