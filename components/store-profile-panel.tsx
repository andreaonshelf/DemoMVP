"use client"

import {
  MapPin,
  Users,
  TrendingUpIcon,
  ChevronDown,
  Search,
  X,
  Filter,
  Layers,
  BarChart3,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getAllStores, getUniqueRetailers, getUniqueFormats, getCatchmentSegments } from "@/lib/demo-data"
import { useFilters } from "@/hooks/use-filters"

export function StoreSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRetailer, setSelectedRetailer] = useState("all")
  const [selectedStoreType, setSelectedStoreType] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("")

  const { selectedStoreId, setSelectedStoreId } = useFilters()

  // Load real stores
  const allStores = getAllStores()
  const retailers = ["All Retailers", ...getUniqueRetailers()]
  const storeTypes = ["All Types", ...getUniqueFormats()]

  // Get currently selected store
  const currentStore = allStores.find(s => s.store_id === selectedStoreId)
  const displayName = currentStore ? `${currentStore.banner} - ${currentStore.city}` : "Select store"

  const filteredStores = allStores.filter((store) => {
    const matchesSearch =
      searchQuery === "" ||
      store.banner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.city.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRetailer = selectedRetailer === "all" || store.retailer === selectedRetailer
    const matchesType = selectedStoreType === "all" || store.format === selectedStoreType
    const matchesLocation =
      selectedLocation === "" ||
      store.city.toLowerCase().includes(selectedLocation.toLowerCase()) ||
      store.postcode.toLowerCase().includes(selectedLocation.toLowerCase())

    return matchesSearch && matchesRetailer && matchesType && matchesLocation
  })

  return (
    <div className="relative mb-4">
      <label className="text-[9px] text-gray-500 uppercase tracking-wider px-1 block mb-1 font-sans">Store</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black text-white h-9 text-xs hover:bg-[#111] transition-colors rounded-md px-3 flex items-center justify-between font-sans"
      >
        <span className="truncate">{displayName}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Store selector dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0a] rounded-lg shadow-2xl z-50 p-3 font-sans">
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] rounded pl-8 pr-8 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-gray-500 hover:text-gray-300" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="space-y-2 mb-3 pb-3 border-b border-[#2a2a2a]">
            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wide mb-1 block font-sans">Retailer</label>
              <select
                value={selectedRetailer}
                onChange={(e) => setSelectedRetailer(e.target.value)}
                className="w-full bg-[#1a1a1a] rounded px-2 py-1.5 text-xs text-white focus:outline-none font-sans"
              >
                {retailers.map((retailer, idx) => (
                  <option key={idx} value={idx === 0 ? "all" : retailer}>
                    {retailer}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wide mb-1 block font-sans">
                Store Type
              </label>
              <select
                value={selectedStoreType}
                onChange={(e) => setSelectedStoreType(e.target.value)}
                className="w-full bg-[#1a1a1a] rounded px-2 py-1.5 text-xs text-white focus:outline-none font-sans"
              >
                {storeTypes.map((type, idx) => (
                  <option key={idx} value={idx === 0 ? "all" : type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wide mb-1 block font-sans">Location</label>
              <input
                type="text"
                placeholder="Enter area or postcode..."
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-[#1a1a1a] rounded px-2 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none font-sans"
              />
            </div>
          </div>

          {/* Results */}
          <div className="relative">
            <div className="text-[9px] text-gray-500 mb-2 font-sans">
              {filteredStores.length} store{filteredStores.length === 1 ? '' : 's'} found
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredStores.length > 0 ? (
                filteredStores.map((store) => (
                  <button
                    key={store.store_id}
                    onClick={() => {
                      setSelectedStoreId(store.store_id)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left p-2 rounded transition-colors font-sans ${
                      store.store_id === selectedStoreId
                        ? "bg-[#498BFF]/20 border border-[#498BFF]"
                        : "bg-[#1a1a1a] hover:bg-[#1a1a1a]/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-white font-medium">{store.banner}</span>
                      <span className="text-[9px] text-gray-500 uppercase">{store.format}</span>
                    </div>
                    <div className="text-[9px] text-gray-500">{store.address}, {store.city}</div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500 font-sans">No stores found</p>
                </div>
              )}
            </div>
            {/* Fade gradient at bottom */}
            {filteredStores.length > 3 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function StoreProfilePanel({
  selectedDate,
  onDateChange,
}: { selectedDate: Date; onDateChange: (date: Date) => void }) {
  return (
    <div className="space-y-4">
      <TimelineDropdown selectedDate={selectedDate} onDateChange={onDateChange} />
      <StoreIdentityCard />
      <ShopperMixCard />
      <CompetitiveCatchmentCard />
      <StoreTrafficCard />
    </div>
  )
}

function TimelineDropdown({ selectedDate, onDateChange }: { selectedDate: Date; onDateChange: (date: Date) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  const monthsWithData = [
    { year: 2024, month: 8, label: "September" },
    { year: 2024, month: 9, label: "October" },
    { year: 2024, month: 10, label: "November" },
    { year: 2025, month: 0, label: "January" },
    { year: 2025, month: 2, label: "March" },
    { year: 2025, month: 4, label: "May" },
    { year: 2025, month: 6, label: "July" },
    { year: 2025, month: 7, label: "August" },
    { year: 2025, month: 9, label: "October" },
  ]

  const currentMonth = monthsWithData.find(
    (m) => m.year === selectedDate.getFullYear() && m.month === selectedDate.getMonth(),
  )

  return (
    <div className="relative">
      <label className="text-[9px] text-gray-500 uppercase tracking-wider px-1 block mb-1 font-sans">Period</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black text-white h-9 text-xs hover:bg-[#111] transition-colors rounded-md px-3 flex items-center justify-between font-sans"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span>{currentMonth ? `${currentMonth.label} ${currentMonth.year}` : "Select month"}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0a] rounded-lg shadow-2xl z-50 p-2 font-sans">
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {monthsWithData.map(({ year, month, label }) => {
              const isSelected = selectedDate.getFullYear() === year && selectedDate.getMonth() === month
              return (
                <button
                  key={`${year}-${month}`}
                  onClick={() => {
                    onDateChange(new Date(year, month, 1))
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-sans transition-colors ${
                    isSelected
                      ? "bg-[#1a1a1a] text-gray-300"
                      : "text-gray-500 hover:bg-[#1a1a1a]/50 hover:text-gray-400"
                  }`}
                >
                  {label} {year}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StoreIdentityCard() {
  const { selectedStoreId } = useFilters()
  const store = getAllStores().find(s => s.store_id === selectedStoreId)

  if (!store) return null

  return (
    <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">{store.banner}</h2>
          <p className="text-gray-500 text-[11px] font-sans">{store.address}, {store.city} {store.postcode}</p>
          <p className="text-gray-500 text-[9px] font-sans">{store.format} • {store.retailer}</p>
        </div>
      </div>
    </div>
  )
}

function ShopperMixCard() {
  const [view, setView] = useState<"demographics" | "segmentation">("segmentation")
  const [showAll, setShowAll] = useState(false)
  const { selectedStoreId } = useFilters()

  // Get real segment data from selected store
  const rawSegments = getCatchmentSegments(selectedStoreId)

  // Sort by percentage descending
  const sortedSegments = [...rawSegments].sort((a, b) => b.percentage - a.percentage)

  // Show top 5 by default, expand to show all 10
  const displayedSegments = showAll ? sortedSegments : sortedSegments.slice(0, 5)

  return (
    <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 rounded-lg p-3">
      {/* Header with title and control icons */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Catchment Population</h3>
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

      {/* Segmented control */}
      <div className="flex items-center justify-center mb-3">
        <div className="inline-flex bg-[#1a1a1a] rounded p-0.5 font-sans">
          <button
            onClick={() => setView("demographics")}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              view === "demographics" ? "bg-[#3a3a3a] text-gray-300" : "text-gray-500 hover:text-gray-400"
            }`}
          >
            Demographics
          </button>
          <button
            onClick={() => setView("segmentation")}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              view === "segmentation" ? "bg-[#3a3a3a] text-gray-300" : "text-gray-500 hover:text-gray-400"
            }`}
          >
            Segmentation
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {displayedSegments.map((segment, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 font-medium font-sans">{segment.segment}</span>
              <span className="text-xs font-bold text-gray-400 font-sans">{segment.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#4a4a4a] to-[#5a5a5a] h-full rounded-full transition-all"
                style={{ width: `${segment.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Show all/Show less toggle */}
      {sortedSegments.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full text-[10px] text-[#498BFF] hover:text-[#3a7ae0] transition-colors font-sans"
        >
          {showAll ? "Show less" : `Show all ${sortedSegments.length} segments`}
        </button>
      )}
    </div>
  )
}

function StoreTrafficCard() {
  return (
    <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 rounded-lg p-3">
      {/* Header with title */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Store Traffic</h3>
      </div>

      {/* Store traffic content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-gray-500" />
            <span className="text-[11px] text-gray-500 font-sans">Estimated Visitors</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-gray-400 font-sans">342</span>
            <div className="flex items-center gap-0.5 text-gray-500">
              <TrendingUpIcon className="h-2 w-2" />
              <span className="text-[11px] font-sans">15%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompetitiveCatchmentCard() {
  const [view, setView] = useState<"list" | "map">("list")

  const competitors = [
    { name: "Tesco Express", distance: "0.5 km" },
    { name: "Waitrose", distance: "0.8 km" },
    { name: "Co-op", distance: "1.1 km" },
    { name: "M&S Simply Food", distance: "1.9 km" },
  ]

  return (
    <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 rounded-lg p-3">
      {/* Header with title */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Competitive Catchment</h3>
      </div>

      {/* List/Map toggle */}
      <div className="flex items-center justify-center mb-3">
        <div className="inline-flex bg-[#1a1a1a] rounded p-0.5 font-sans">
          <button
            onClick={() => setView("list")}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              view === "list" ? "bg-[#3a3a3a] text-gray-300" : "text-gray-500 hover:text-gray-400"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView("map")}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              view === "map" ? "bg-[#3a3a3a] text-gray-300" : "text-gray-500 hover:text-gray-400"
            }`}
          >
            Map View
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-2">
          {competitors.map((competitor, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-[#1a1a1a] shadow-sm shadow-black/20 rounded px-3 py-2 hover:bg-[#1a1a1a]/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-2 w-2 text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-400 font-medium font-sans">{competitor.name}</span>
              </div>
              <span className="text-xs text-gray-400 font-bold font-sans">{competitor.distance}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1a1a1a] shadow-sm shadow-black/30 rounded-lg p-4 h-48 flex items-center justify-center relative overflow-hidden">
          {/* Simple map visualization with center store and competitor markers */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(#2a2a2a 1px, transparent 1px), linear-gradient(90deg, #2a2a2a 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          </div>

          {/* Center store (Sainsbury's) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#4a4a4a] to-[#3a3a3a] border-2 border-[#5a5a5a] flex items-center justify-center shadow-lg">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[9px] text-gray-300 font-bold font-sans">Sainsbury's</span>
              </div>
            </div>
          </div>

          {/* Competitor markers */}
          {[
            { top: "20%", left: "30%", name: "Tesco" },
            { top: "35%", left: "70%", name: "Waitrose" },
            { top: "70%", left: "25%", name: "Co-op" },
            { top: "65%", left: "75%", name: "M&S" },
          ].map((marker, idx) => (
            <div key={idx} className="absolute z-10" style={{ top: marker.top, left: marker.left }}>
              <div className="relative">
                <MapPin className="h-2 w-2 text-[#5a5a5a] fill-[#3a3a3a]" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[8px] text-gray-500 font-sans">{marker.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
