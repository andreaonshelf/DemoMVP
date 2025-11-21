"use client"

import { RetailerSidebar } from "@/components/b2b/retailer-sidebar"
import { RetailerAnalyticsDashboard } from "@/components/b2b/retailer-analytics-dashboard"

export default function B2BPage() {
  return (
    <div className="h-full flex bg-black">
      <RetailerSidebar />
      <RetailerAnalyticsDashboard />
    </div>
  )
}
