"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Video,
  Maximize2,
  Filter,
  Layers,
  BarChart3,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function CategorySelector() {
  return (
    <Select defaultValue="alcoholic-beverages">
      <SelectTrigger className="w-48 bg-[#0a0a0a] border-[#2a2a2a] text-white h-10 hover:bg-[#111] transition-colors font-sans">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#0a0a0a] border-[#2a2a2a] font-sans">
        <SelectItem value="alcoholic-beverages" className="text-white hover:bg-[#1a1a1a] font-sans">
          Alcoholic Beverages
        </SelectItem>
        <SelectItem value="soft-drinks" className="text-white hover:bg-[#1a1a1a] font-sans">
          Soft Drinks
        </SelectItem>
        <SelectItem value="snacks" className="text-white hover:bg-[#1a1a1a] font-sans">
          Snacks
        </SelectItem>
        <SelectItem value="dairy" className="text-white hover:bg-[#1a1a1a] font-sans">
          Dairy
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

export function RetailContextPanel() {
  const [selectedCategory, setSelectedCategory] = useState("alcoholic")
  const [selectedSubCategory, setSelectedSubCategory] = useState("beer")

  const subCategories = {
    alcoholic: [
      { value: "beer", label: "Beer" },
      { value: "wine", label: "Wine" },
      { value: "spirits", label: "Spirits" },
    ],
    soft: [
      { value: "cola", label: "Cola" },
      { value: "lemonade", label: "Lemonade" },
      { value: "energy", label: "Energy Drinks" },
    ],
    water: [
      { value: "still", label: "Still Water" },
      { value: "sparkling", label: "Sparkling Water" },
      { value: "juice", label: "Fruit Juice" },
    ],
  }

  return (
    <div className="space-y-4">
      {/* Category Filter - contextual to Shelf State */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider px-1 font-sans">Category</label>
        <Select defaultValue="alcoholic" onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full bg-black text-white h-9 text-xs hover:bg-[#111] transition-colors border-0 font-sans">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a0a] font-sans">
            <SelectItem value="alcoholic" className="text-white hover:bg-[#1a1a1a] font-sans">
              Alcoholic Beverages
            </SelectItem>
            <SelectItem value="soft" className="text-white hover:bg-[#1a1a1a] font-sans">
              Soft Drinks
            </SelectItem>
            <SelectItem value="water" className="text-white hover:bg-[#1a1a1a] font-sans">
              Water & Juices
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sub-category dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider px-1 font-sans">Sub-category</label>
        <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
          <SelectTrigger className="w-full bg-black text-white h-9 text-xs hover:bg-[#111] transition-colors border-0 font-sans">
            <SelectValue placeholder="Sub-category" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a0a] font-sans">
            {subCategories[selectedCategory as keyof typeof subCategories].map((sub) => (
              <SelectItem key={sub.value} value={sub.value} className="text-white hover:bg-[#1a1a1a] font-sans">
                {sub.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Store Map Card */}
      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Store Map</h3>
        </div>
        <div className="relative aspect-[2.5/1] bg-[#1a1a1a] rounded-lg overflow-hidden">
          <svg viewBox="0 0 700 280" className="w-full h-full">
            {/* Store perimeter border with entrance gap at bottom center */}
            <path
              d="M 30 20 L 670 20 L 670 260 L 420 260 L 420 270 L 280 270 L 280 260 L 30 260 Z"
              fill="#0a0a0a"
              stroke="#4a4a4a"
              strokeWidth="3"
            />

            {/* Glow filter for highlighted alcoholic beverages section */}
            <defs>
              <filter id="orangeGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Left side perimeter sections */}
            {/* Bakery section at top left */}
            <rect x="40" y="30" width="70" height="45" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1.5" rx="2" />

            {/* Produce section */}
            <rect x="40" y="85" width="70" height="50" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1.5" rx="2" />

            {/* Alcoholic Beverages section - highlighted in orange */}
            <rect
              x="40"
              y="145"
              width="70"
              height="50"
              fill="#F2994A"
              fillOpacity="0.25"
              stroke="#F2994A"
              strokeWidth="2"
              filter="url(#orangeGlow)"
              rx="2"
            />

            {/* Dairy section at bottom left */}
            <rect x="40" y="205" width="70" height="45" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1.5" rx="2" />

            {/* Left column of aisles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect
                key={`aisle-left-${i}`}
                x="135"
                y={35 + i * 28}
                width="180"
                height="6"
                fill="#1a1a1a"
                stroke="#3a3a3a"
                strokeWidth="1.5"
                rx="1.5"
              />
            ))}

            {/* Right column of aisles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect
                key={`aisle-right-${i}`}
                x="335"
                y={35 + i * 28}
                width="180"
                height="6"
                fill="#1a1a1a"
                stroke="#3a3a3a"
                strokeWidth="1.5"
                rx="1.5"
              />
            ))}

            {/* Right side sections */}
            {/* Frozen Foods at top right */}
            <rect x="540" y="30" width="120" height="35" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1.5" rx="2" />

            {/* Deli/Prepared Foods */}
            <rect x="540" y="75" width="120" height="35" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1.5" rx="2" />

            {/* Meat section */}
            <rect x="540" y="120" width="120" height="35" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1.5" rx="2" />

            {/* Checkout counters at bottom right - now white and visually distinct */}
            {Array.from({ length: 6 }).map((_, i) => (
              <g key={`checkout-${i}`}>
                <rect
                  x={540 + i * 24}
                  y="180"
                  width="16"
                  height="60"
                  fill="white"
                  stroke="#6a6a6a"
                  strokeWidth="1.5"
                  rx="2"
                />
                {/* Register terminal - darker for contrast */}
                <rect
                  x={542 + i * 24}
                  y="185"
                  width="12"
                  height="8"
                  fill="#4a4a4a"
                  stroke="#2a2a2a"
                  strokeWidth="0.5"
                  rx="1"
                />
              </g>
            ))}
          </svg>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-lg bg-black/60 hover:bg-black/80"
          >
            <Maximize2 className="h-2.5 w-2.5 text-gray-300" />
          </Button>
        </div>
      </div>

      {/* Retail Image Card */}
      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Category Media</h3>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-4 w-4 rounded hover:bg-white/5">
              <ImageIcon className="h-2 w-2 text-[#F2994A]" />
            </Button>
            <Button variant="ghost" size="icon" className="h-4 w-4 rounded hover:bg-white/5">
              <Video className="h-2 w-2 text-gray-400 hover:text-gray-300" />
            </Button>
          </div>
        </div>

        {/* Image container - now full width and taller */}
        <div className="w-full aspect-[16/10] bg-[#1a1a1a] rounded-lg overflow-hidden relative">
          <Image src="/retail-shelf.png" alt="Retail shelf with beverages" fill className="object-cover" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-lg bg-black/60 hover:bg-black/80"
          >
            <Maximize2 className="h-2.5 w-2.5 text-gray-300" />
          </Button>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center justify-between px-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60">
            <ChevronLeft className="h-3 w-3 text-gray-400" />
          </Button>

          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#F2994A]" />
            <div className="h-1.5 w-1.5 rounded-full bg-gray-600" />
            <div className="h-1.5 w-1.5 rounded-full bg-gray-600" />
            <div className="h-1.5 w-1.5 rounded-full bg-gray-600" />
            <div className="h-1.5 w-1.5 rounded-full bg-gray-600" />
          </div>

          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60">
            <ChevronRight className="h-3 w-3 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Shelf Share Card */}
      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Shelf Share</h3>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-3 w-3 p-0 rounded hover:bg-white/5">
              <Filter style={{ width: "10px", height: "10px" }} className="text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-3 w-3 p-0 rounded hover:bg-white/5">
              <Layers style={{ width: "10px", height: "10px" }} className="text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-3 w-3 p-0 rounded hover:bg-white/5">
              <BarChart3 style={{ width: "10px", height: "10px" }} className="text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-3 w-3 p-0 rounded hover:bg-white/5">
              <TrendingUp style={{ width: "10px", height: "10px" }} className="text-gray-500" />
            </Button>
          </div>
        </div>
        <SegmentedControl type="default" />
        <div className="mt-3">
          <ShelfShareStackedChart />
        </div>
      </div>

      {/* Shelf Efficiency Card */}
      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Shelf Efficiency</h3>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-3 w-3 p-0 rounded hover:bg-white/5">
              <Filter style={{ width: "10px", height: "10px" }} className="text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-3 w-3 p-0 rounded hover:bg-white/5">
              <Layers style={{ width: "10px", height: "10px" }} className="text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-3 w-3 p-0 rounded hover:bg-white/5">
              <BarChart3 style={{ width: "10px", height: "10px" }} className="text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-3 w-3 p-0 rounded hover:bg-white/5">
              <TrendingUp style={{ width: "10px", height: "10px" }} className="text-gray-500" />
            </Button>
          </div>
        </div>
        <ShelfEfficiencyChart />
      </div>
    </div>
  )
}

function SegmentedControl({ type = "default" }: { type?: "default" | "shopper" }) {
  const [selected, setSelected] = useState<string>(type === "shopper" ? "segmentation" : "brand")

  if (type === "shopper") {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center bg-black/40 rounded p-0.5 font-sans">
          <button
            onClick={() => setSelected("demographics")}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
              selected === "demographics" ? "bg-[#F2994A] text-black shadow-sm" : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Demographics
          </button>
          <button
            onClick={() => setSelected("segmentation")}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
              selected === "segmentation" ? "bg-[#F2994A] text-black shadow-sm" : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Segmentation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center bg-black/40 rounded p-0.5 font-sans">
        <button
          onClick={() => setSelected("sku")}
          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
            selected === "sku" ? "bg-[#F2994A] text-black shadow-sm" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          SKU
        </button>
        <button
          onClick={() => setSelected("brand")}
          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
            selected === "brand" ? "bg-[#F2994A] text-black shadow-sm" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Brand
        </button>
      </div>
    </div>
  )
}

function DataBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = (value / total) * 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-xs text-gray-400 font-medium font-sans">{label}</span>
        <span className="text-xs font-bold text-gray-400 font-sans">{value}%</span>
      </div>
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function ShelfShareStackedChart() {
  const brands = [
    { label: "Brand A", value: 40, color: "#F2994A", isCustomer: true },
    { label: "Brand B", value: 30, color: "#6b7280", isCustomer: false },
    { label: "Brand C", value: 18, color: "#9ca3af", isCustomer: false },
    { label: "Others", value: 12, color: "#d1d5db", isCustomer: false },
  ]

  return (
    <div className="space-y-2">
      <div className="relative h-12 bg-[#1a1a1a] rounded overflow-hidden flex">
        {brands.map((brand, index) => {
          const isLightBar = brand.color === "#d1d5db" || brand.color === "#9ca3af"
          const textColor = isLightBar ? "text-gray-900" : "text-white"

          return (
            <div
              key={index}
              className="h-full transition-all duration-500 flex flex-col items-center justify-center px-1"
              style={{
                width: `${brand.value}%`,
                backgroundColor: brand.color,
              }}
            >
              {brand.value >= 15 && (
                <>
                  <div className={`text-[9px] font-medium ${textColor}/90 font-sans`}>{brand.label}</div>
                  <div className={`text-xs font-bold ${textColor} font-sans`}>{brand.value}%</div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ShelfEfficiencyChart() {
  const [sortBy, setSortBy] = useState<"efficiency" | "gap">("efficiency")
  const [showAll, setShowAll] = useState(false)

  const allBrands = [
    { label: "Brand A", shelfShare: 40, choiceShare: 35, isClient: true },
    { label: "Brand B", shelfShare: 30, choiceShare: 28, isClient: false },
    { label: "Brand C", shelfShare: 18, choiceShare: 22, isClient: false },
    { label: "Others", shelfShare: 12, choiceShare: 15, isClient: false },
  ]

  const brandA = allBrands.find((b) => b.isClient)!
  const otherBrands = allBrands.filter((b) => !b.isClient)

  const sortedOtherBrands = [...otherBrands].sort((a, b) => {
    if (sortBy === "efficiency") {
      const efficiencyA = a.choiceShare / a.shelfShare
      const efficiencyB = b.choiceShare / b.shelfShare
      return efficiencyB - efficiencyA
    } else {
      const gapA = Math.abs(a.choiceShare - a.shelfShare)
      const gapB = Math.abs(b.choiceShare - b.shelfShare)
      return gapB - gapA
    }
  })

  const sortedBrands = [brandA, ...sortedOtherBrands]
  const displayedBrands = showAll ? sortedBrands : sortedBrands.slice(0, 5)

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => setSortBy(sortBy === "efficiency" ? "gap" : "efficiency")}
          className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
          title={sortBy === "efficiency" ? "Sort by gap" : "Sort by efficiency"}
        >
          <ArrowUpDown style={{ width: "12px", height: "12px" }} className="text-gray-500" />
        </button>
        <button
          onClick={() => setShowAll(!showAll)}
          className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
          title={showAll ? "Show top 5" : "Show all"}
        >
          <Layers style={{ width: "12px", height: "12px" }} className="text-gray-500" />
        </button>
      </div>

      <div className="space-y-2">
        {displayedBrands.map((brand, index) => {
          const efficiency = brand.choiceShare / brand.shelfShare
          const gap = brand.choiceShare - brand.shelfShare
          const maxValue = Math.max(brand.shelfShare, brand.choiceShare, 50)
          const barColor = brand.isClient ? "#F2994A" : "#6b7280"

          return (
            <div key={index} className="space-y-0.5">
              <div className="text-[10px] text-gray-300 font-medium font-sans">{brand.label}</div>

              <div className="flex items-center gap-2">
                <div className="flex-1 relative h-3 bg-[#1a1a1a] rounded-full">
                  <div
                    className="absolute h-full rounded-full transition-all duration-500"
                    style={{ width: `${(brand.choiceShare / maxValue) * 100}%`, backgroundColor: barColor }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 transition-all duration-500 z-10"
                    style={{ left: `${(brand.shelfShare / maxValue) * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[9px] font-sans min-w-[80px]">
                  <span className="text-gray-400 w-7 text-right">{brand.shelfShare}%</span>
                  <span className="text-gray-600">/</span>
                  <span className={brand.isClient ? "text-[#F2994A]" : "text-gray-400"} style={{ width: "28px" }}>
                    {brand.choiceShare}%
                  </span>
                </div>

                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium font-sans min-w-[50px] text-center"
                  style={
                    gap >= 0
                      ? {
                          backgroundColor: "rgba(30, 213, 155, 0.15)",
                          color: "#1ED59B",
                        }
                      : {
                          backgroundColor: "rgba(235, 87, 87, 0.15)",
                          color: "#EB5757",
                        }
                  }
                >
                  {efficiency.toFixed(2)}x
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-2 border-t border-gray-800 flex items-center gap-3 text-[9px] text-gray-500 font-sans">
        <div className="flex items-center gap-1">
          <div className="w-0.5 h-2 bg-gray-400" />
          <span>Shelf Share</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-[#F2994A]" />
          <span>Choice Share</span>
        </div>
      </div>
    </div>
  )
}
