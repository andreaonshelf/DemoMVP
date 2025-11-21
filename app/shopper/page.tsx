"use client"

import { SKUFilterSidebar } from "@/components/shopper/sku-filter-sidebar"
import { SKUGrid } from "@/components/shopper/sku-grid"

export default function ShopperPage() {
  return (
    <div className="h-full flex bg-black">
      <SKUFilterSidebar />
      <SKUGrid />
    </div>
  )
}
