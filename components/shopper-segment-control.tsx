"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sliders } from "lucide-react"

export function ShopperSegmentControl() {
  const [selected, setSelected] = useState<"all" | "catchment" | "custom">("all")
  const [isCustomOpen, setIsCustomOpen] = useState(false)

  const handleSegmentClick = (segment: "all" | "catchment" | "custom") => {
    setSelected(segment)
    if (segment === "custom") {
      setIsCustomOpen(true)
    }
  }

  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-[9px] text-gray-500 uppercase tracking-wider px-1">Shopper Segment</label>

      <div className="flex items-center gap-2">
        {/* Segmented Control */}
        <div className="flex-1 inline-flex items-center bg-black rounded p-0.5">
          <button
            onClick={() => handleSegmentClick("all")}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-all ${
              selected === "all"
                ? "bg-[#498BFF] text-white shadow-sm"
                : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleSegmentClick("catchment")}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-all ${
              selected === "catchment"
                ? "bg-[#498BFF] text-white shadow-sm"
                : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            Catchment
          </button>
          <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => handleSegmentClick("custom")}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-all flex items-center justify-center gap-1 ${
                  selected === "custom"
                    ? "bg-[#498BFF] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                Custom
                <Sliders className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-[#0a0a0a] border-[#2a2a2a] p-4" align="start" side="bottom">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-3">Custom Segment Filters</h4>
                </div>

                {/* Age Group */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Age Group</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full bg-black border-[#2a2a2a] text-white h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-[#2a2a2a]">
                      <SelectItem value="all" className="text-white text-xs">
                        All Ages
                      </SelectItem>
                      <SelectItem value="18-25" className="text-white text-xs">
                        18-25
                      </SelectItem>
                      <SelectItem value="26-35" className="text-white text-xs">
                        26-35
                      </SelectItem>
                      <SelectItem value="36-50" className="text-white text-xs">
                        36-50
                      </SelectItem>
                      <SelectItem value="51+" className="text-white text-xs">
                        51+
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Income Level */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Income Level</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full bg-black border-[#2a2a2a] text-white h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-[#2a2a2a]">
                      <SelectItem value="all" className="text-white text-xs">
                        All Income Levels
                      </SelectItem>
                      <SelectItem value="low" className="text-white text-xs">
                        Low Income
                      </SelectItem>
                      <SelectItem value="medium" className="text-white text-xs">
                        Medium Income
                      </SelectItem>
                      <SelectItem value="high" className="text-white text-xs">
                        High Income
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Shopping Frequency */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Shopping Frequency</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full bg-black border-[#2a2a2a] text-white h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-[#2a2a2a]">
                      <SelectItem value="all" className="text-white text-xs">
                        All Frequencies
                      </SelectItem>
                      <SelectItem value="daily" className="text-white text-xs">
                        Daily
                      </SelectItem>
                      <SelectItem value="weekly" className="text-white text-xs">
                        Weekly
                      </SelectItem>
                      <SelectItem value="monthly" className="text-white text-xs">
                        Monthly
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Household Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Household Type</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full bg-black border-[#2a2a2a] text-white h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-[#2a2a2a]">
                      <SelectItem value="all" className="text-white text-xs">
                        All Households
                      </SelectItem>
                      <SelectItem value="single" className="text-white text-xs">
                        Single Person
                      </SelectItem>
                      <SelectItem value="couple" className="text-white text-xs">
                        Couple
                      </SelectItem>
                      <SelectItem value="family" className="text-white text-xs">
                        Family with Children
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomOpen(false)}
                    className="flex-1 h-8 text-xs border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsCustomOpen(false)}
                    className="flex-1 h-8 text-xs bg-[#498BFF] hover:bg-[#3a7aef] text-white"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
