"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useFilters } from "@/hooks/use-filters"
import { getUniqueRetailers, getUniqueFormats, getUniqueRegions, getUniqueMissions, getAllStores } from "@/lib/demo-data"
import { SEGMENTS, OCCASIONS, type MeasureType } from "@/types/demo-data"

export function FilterSidebar() {
  const {
    measureType,
    setMeasureType,
    splitBySegment,
    setSplitBySegment,
    selectedSegment,
    setSelectedSegment,
    splitByOccasion,
    setSplitByOccasion,
    selectedOccasion,
    setSelectedOccasion,
    retailerFilters,
    toggleRetailer,
    formatFilters,
    toggleFormat,
    regionFilters,
    toggleRegion,
    missionFilters,
    toggleMission,
    resetGridFilters
  } = useFilters()

  // Get unique values from data
  const retailers = getUniqueRetailers()
  const formats = getUniqueFormats()
  const regions = getUniqueRegions()
  const missions = getUniqueMissions()

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    measure: true,
    retailers: true,
    formats: true,
    regions: true,
    missions: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Count active filters
  const activeFilterCount =
    retailerFilters.length +
    formatFilters.length +
    regionFilters.length +
    missionFilters.length +
    (splitBySegment && selectedSegment ? 1 : 0) +
    (splitByOccasion && selectedOccasion ? 1 : 0)

  const totalStores = getAllStores().length

  return (
    <div className="w-80 border-r border-[#1a1a1a] bg-black overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide font-sans">Filters</h2>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetGridFilters}
              className="h-6 px-2 text-[10px] text-gray-500 hover:text-gray-300"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Active filter count */}
        <div className="text-[10px] text-gray-500 font-sans">
          {totalStores} stores
          {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active`}
        </div>

        {/* Measure Selector */}
        <FilterSection
          title="Measure"
          isExpanded={expandedSections.measure}
          onToggle={() => toggleSection("measure")}
        >
          <Select value={measureType} onValueChange={(val) => setMeasureType(val as MeasureType)}>
            <SelectTrigger className="w-full bg-[#0a0a0a] text-white h-9 text-xs hover:bg-[#111] transition-colors border-[#2a2a2a] font-sans">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0a] border-[#2a2a2a] font-sans">
              <SelectItem value="choice_share" className="text-white hover:bg-[#1a1a1a] font-sans text-xs">
                Choice Share
              </SelectItem>
              <SelectItem value="shelf_share" className="text-white hover:bg-[#1a1a1a] font-sans text-xs">
                Shelf Share
              </SelectItem>
              <SelectItem value="shelf_efficiency" className="text-white hover:bg-[#1a1a1a] font-sans text-xs">
                Shelf Efficiency
              </SelectItem>
              <SelectItem value="optimization_potential" className="text-white hover:bg-[#1a1a1a] font-sans text-xs">
                Optimization Potential
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Split by Segment */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="split-segment"
                checked={splitBySegment}
                onCheckedChange={(checked) => setSplitBySegment(!!checked)}
                className="border-gray-600"
              />
              <label htmlFor="split-segment" className="text-xs text-gray-400 font-medium cursor-pointer font-sans">
                Split by Segment
              </label>
            </div>

            {splitBySegment && (
              <Select
                value={selectedSegment || ""}
                onValueChange={(val) => setSelectedSegment(val as any)}
              >
                <SelectTrigger className="w-full bg-[#0a0a0a] text-white h-8 text-xs hover:bg-[#111] transition-colors border-[#2a2a2a] font-sans">
                  <SelectValue placeholder="Select segment..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#2a2a2a] font-sans max-h-64">
                  {SEGMENTS.map((segment) => (
                    <SelectItem key={segment} value={segment} className="text-white hover:bg-[#1a1a1a] font-sans text-xs">
                      {segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Split by Occasion */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="split-occasion"
                checked={splitByOccasion}
                onCheckedChange={(checked) => setSplitByOccasion(!!checked)}
                className="border-gray-600"
              />
              <label htmlFor="split-occasion" className="text-xs text-gray-400 font-medium cursor-pointer font-sans">
                Split by Occasion
              </label>
            </div>

            {splitByOccasion && (
              <Select
                value={selectedOccasion || ""}
                onValueChange={(val) => setSelectedOccasion(val as any)}
              >
                <SelectTrigger className="w-full bg-[#0a0a0a] text-white h-8 text-xs hover:bg-[#111] transition-colors border-[#2a2a2a] font-sans">
                  <SelectValue placeholder="Select occasion..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#2a2a2a] font-sans max-h-64">
                  {OCCASIONS.map((occasion) => (
                    <SelectItem key={occasion} value={occasion} className="text-white hover:bg-[#1a1a1a] font-sans text-xs">
                      {occasion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </FilterSection>

        {/* Retailer Filters */}
        <FilterSection
          title="Retailers"
          isExpanded={expandedSections.retailers}
          onToggle={() => toggleSection("retailers")}
          count={retailerFilters.length}
        >
          <div className="space-y-2">
            {retailers.map((retailer) => (
              <div key={retailer} className="flex items-center gap-2">
                <Checkbox
                  id={`retailer-${retailer}`}
                  checked={retailerFilters.includes(retailer)}
                  onCheckedChange={() => toggleRetailer(retailer)}
                  className="border-gray-600"
                />
                <label
                  htmlFor={`retailer-${retailer}`}
                  className="text-xs text-gray-400 cursor-pointer font-sans flex-1"
                >
                  {retailer}
                </label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Format Filters */}
        <FilterSection
          title="Formats"
          isExpanded={expandedSections.formats}
          onToggle={() => toggleSection("formats")}
          count={formatFilters.length}
        >
          <div className="space-y-2">
            {formats.map((format) => (
              <div key={format} className="flex items-center gap-2">
                <Checkbox
                  id={`format-${format}`}
                  checked={formatFilters.includes(format)}
                  onCheckedChange={() => toggleFormat(format)}
                  className="border-gray-600"
                />
                <label
                  htmlFor={`format-${format}`}
                  className="text-xs text-gray-400 cursor-pointer font-sans flex-1"
                >
                  {format}
                </label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Region Filters */}
        <FilterSection
          title="Regions"
          isExpanded={expandedSections.regions}
          onToggle={() => toggleSection("regions")}
          count={regionFilters.length}
        >
          <div className="space-y-2">
            {regions.map((region) => (
              <div key={region} className="flex items-center gap-2">
                <Checkbox
                  id={`region-${region}`}
                  checked={regionFilters.includes(region)}
                  onCheckedChange={() => toggleRegion(region)}
                  className="border-gray-600"
                />
                <label
                  htmlFor={`region-${region}`}
                  className="text-xs text-gray-400 cursor-pointer font-sans flex-1"
                >
                  {region}
                </label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Mission Filters */}
        <FilterSection
          title="Missions"
          isExpanded={expandedSections.missions}
          onToggle={() => toggleSection("missions")}
          count={missionFilters.length}
        >
          <div className="space-y-2">
            {missions.map((mission) => (
              <div key={mission} className="flex items-center gap-2">
                <Checkbox
                  id={`mission-${mission}`}
                  checked={missionFilters.includes(mission)}
                  onCheckedChange={() => toggleMission(mission)}
                  className="border-gray-600"
                />
                <label
                  htmlFor={`mission-${mission}`}
                  className="text-xs text-gray-400 cursor-pointer font-sans flex-1"
                >
                  {mission}
                </label>
              </div>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  )
}

// Filter Section Component
function FilterSection({
  title,
  isExpanded,
  onToggle,
  count,
  children
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[#1a1a1a] pb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">{title}</h3>
          {count !== undefined && count > 0 && (
            <span className="text-[9px] bg-[#498BFF] text-white px-1.5 py-0.5 rounded font-sans">
              {count}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>

      {isExpanded && <div>{children}</div>}
    </div>
  )
}
