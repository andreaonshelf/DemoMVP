"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFilters } from "@/hooks/use-filters"
import { getUniqueSKUBrands } from "@/lib/demo-data"
import { SEGMENTS, OCCASIONS } from "@/types/demo-data"

export function SKUFilterSidebar() {
  const {
    splitBySegment,
    setSplitBySegment,
    selectedSegment,
    setSelectedSegment,
    splitByOccasion,
    setSplitByOccasion,
    selectedOccasion,
    setSelectedOccasion,
    brandFilters,
    setBrandFilters
  } = useFilters()

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    segment: true,
    occasion: true,
    brand: true
  })

  const brands = getUniqueSKUBrands()

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleBrand = (brand: string) => {
    setBrandFilters(
      brandFilters.includes(brand)
        ? brandFilters.filter(b => b !== brand)
        : [...brandFilters, brand]
    )
  }

  const clearAllFilters = () => {
    setSplitBySegment(false)
    setSelectedSegment(null)
    setSplitByOccasion(false)
    setSelectedOccasion(null)
    setBrandFilters([])
  }

  const activeFilterCount =
    (splitBySegment && selectedSegment ? 1 : 0) +
    (splitByOccasion && selectedOccasion ? 1 : 0) +
    brandFilters.length

  return (
    <div className="w-80 border-r border-gray-800 bg-black overflow-y-auto">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide font-sans">Filters</h2>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#498BFF] hover:text-[#3a7ae0] transition-colors font-sans flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
        {activeFilterCount > 0 && (
          <p className="text-xs text-gray-500 font-sans">{activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}</p>
        )}
      </div>

      {/* Segment Filter */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => toggleSection("segment")}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Shopper Segment</span>
          {expandedSections.segment ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.segment && (
          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="filter-segment"
                checked={splitBySegment}
                onCheckedChange={(checked) => setSplitBySegment(!!checked)}
                className="border-gray-600"
              />
              <label
                htmlFor="filter-segment"
                className="text-xs text-gray-400 font-medium cursor-pointer font-sans"
              >
                Filter by Segment
              </label>
            </div>

            {splitBySegment && (
              <Select
                value={selectedSegment || undefined}
                onValueChange={(val) => setSelectedSegment(val as any)}
              >
                <SelectTrigger className="w-full bg-[#1a1a1a] text-white h-8 text-xs hover:bg-[#222] transition-colors border-0 font-sans">
                  <SelectValue placeholder="Select segment..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] font-sans max-h-64">
                  {SEGMENTS.map((segment) => (
                    <SelectItem key={segment} value={segment} className="text-white hover:bg-[#1a1a1a] font-sans text-xs">
                      {segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Occasion Filter */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => toggleSection("occasion")}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Usage Occasion</span>
          {expandedSections.occasion ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.occasion && (
          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="filter-occasion"
                checked={splitByOccasion}
                onCheckedChange={(checked) => setSplitByOccasion(!!checked)}
                className="border-gray-600"
              />
              <label
                htmlFor="filter-occasion"
                className="text-xs text-gray-400 font-medium cursor-pointer font-sans"
              >
                Filter by Occasion
              </label>
            </div>

            {splitByOccasion && (
              <Select
                value={selectedOccasion || undefined}
                onValueChange={(val) => setSelectedOccasion(val as any)}
              >
                <SelectTrigger className="w-full bg-[#1a1a1a] text-white h-8 text-xs hover:bg-[#222] transition-colors border-0 font-sans">
                  <SelectValue placeholder="Select occasion..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] font-sans max-h-64">
                  {OCCASIONS.map((occasion) => (
                    <SelectItem key={occasion} value={occasion} className="text-white hover:bg-[#1a1a1a] font-sans text-xs">
                      {occasion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Brand Filter */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => toggleSection("brand")}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Brand</span>
          {expandedSections.brand ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.brand && (
          <div className="px-4 pb-4 space-y-2">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center gap-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={brandFilters.includes(brand)}
                  onCheckedChange={() => toggleBrand(brand)}
                  className="border-gray-600"
                />
                <label
                  htmlFor={`brand-${brand}`}
                  className="text-xs text-gray-400 cursor-pointer font-sans flex-1"
                >
                  {brand}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
