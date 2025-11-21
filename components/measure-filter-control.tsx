// components/measure-filter-control.tsx

"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFilters } from "@/hooks/use-filters"
import { SEGMENTS, OCCASIONS, type MeasureType } from "@/types/demo-data"

export function MeasureFilterControl() {
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
    setSelectedOccasion
  } = useFilters()

  return (
    <div className="space-y-3 mb-4">
      {/* Measure Type Selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider px-1 font-sans">Measure</label>
        <Select value={measureType} onValueChange={(val) => setMeasureType(val as MeasureType)}>
          <SelectTrigger className="w-full bg-black text-white h-9 text-xs hover:bg-[#111] transition-colors border-0 font-sans">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a0a] font-sans">
            <SelectItem value="choice_share" className="text-white hover:bg-[#1a1a1a] font-sans">
              Choice Share
            </SelectItem>
            <SelectItem value="shelf_share" className="text-white hover:bg-[#1a1a1a] font-sans">
              Shelf Share
            </SelectItem>
            <SelectItem value="shelf_efficiency" className="text-white hover:bg-[#1a1a1a] font-sans">
              Shelf Efficiency
            </SelectItem>
            <SelectItem value="optimization_potential" className="text-white hover:bg-[#1a1a1a] font-sans">
              Optimization Potential
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Split by Segment Checkbox + Dropdown */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="split-segment"
            checked={splitBySegment}
            onCheckedChange={(checked) => setSplitBySegment(!!checked)}
            className="border-gray-600"
          />
          <label
            htmlFor="split-segment"
            className="text-xs text-gray-400 font-medium cursor-pointer font-sans"
          >
            Split by Segment
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

      {/* Split by Occasion Checkbox + Dropdown */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="split-occasion"
            checked={splitByOccasion}
            onCheckedChange={(checked) => setSplitByOccasion(!!checked)}
            className="border-gray-600"
          />
          <label
            htmlFor="split-occasion"
            className="text-xs text-gray-400 font-medium cursor-pointer font-sans"
          >
            Split by Occasion
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
    </div>
  )
}
