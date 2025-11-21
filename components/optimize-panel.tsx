"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, ArrowUp, ArrowDown, X, PlusCircle, Edit } from "lucide-react"
import { useState } from "react"

export function OptimizePanel() {
  const currentShare = 35
  const potentialShare = 42
  const uplift = potentialShare - currentShare

  const [selectedLever, setSelectedLever] = useState("assortment")
  const [incrementalityView, setIncrementalityView] = useState<"brand" | "shopper" | "usecase">("brand")

  const brandImpacts = [
    { brand: "Brand A", change: 7, color: "#1ED59B" },
    { brand: "Brand B", change: -4, color: "#6B7280" },
    { brand: "Brand C", change: -3, color: "#4B5563" },
  ]

  const shopperImpacts = [
    { label: "Young Families", change: 9, color: "#1ED59B" }, // positive = green
    { label: "Professionals", change: 5, color: "#1ED59B" }, // positive = green
    { label: "Retirees", change: -3, color: "#6B7280" }, // negative = grey
    { label: "Students", change: -4, color: "#4B5563" }, // negative = grey
  ]

  const usecaseImpacts = [
    { label: "Weeknight unwind", change: 8, color: "#1ED59B" }, // positive = green
    { label: "Watching sport", change: 6, color: "#1ED59B" }, // positive = green
    { label: "House party", change: 4, color: "#1ED59B" }, // positive = green
    { label: "Family meal", change: -2, color: "#6B7280" }, // negative = grey
    { label: "Weekend stock-up", change: -5, color: "#4B5563" }, // negative = grey
  ]

  const currentImpacts =
    incrementalityView === "brand" ? brandImpacts : incrementalityView === "shopper" ? shopperImpacts : usecaseImpacts

  const maxValue = Math.max(...currentImpacts.map((item) => Math.abs(item.change)))

  const skuRecommendations = [
    {
      action: "introduce",
      sku: "Premium Craft IPA 6-pack",
      rationale: "Weeknight unwind",
      impact: "+2.5%",
    },
    {
      action: "introduce",
      sku: "Light Session Ale 12-pack",
      rationale: "Watching sport",
      impact: "+1.8%",
    },
    {
      action: "increase",
      sku: "Family Pack Lager 24-pack",
      rationale: "Weekend stock-up",
      impact: "+1.5%",
    },
    {
      action: "increase",
      sku: "Premium Wheat Beer 4-pack",
      rationale: "Having friends over",
      impact: "+1.2%",
    },
    {
      action: "decrease",
      sku: "Standard Lager Single Can",
      rationale: "Low efficiency (0.6x)",
      impact: "-0.5%",
    },
    {
      action: "delist",
      sku: "Seasonal Winter Ale 6-pack",
      rationale: "Out of season, underperforming",
      impact: "0%",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider px-1 font-sans">Lever</label>
        <Select value={selectedLever} onValueChange={setSelectedLever}>
          <SelectTrigger className="w-full bg-black text-white h-9 text-xs hover:bg-[#111] transition-colors border-0 font-sans">
            <SelectValue placeholder="Select lever" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a0a] font-sans">
            <SelectItem value="assortment" className="text-white hover:bg-[#1a1a1a] font-sans">
              Assortment
            </SelectItem>
            <SelectItem value="planogram" className="text-white hover:bg-[#1a1a1a] font-sans">
              <div className="flex items-center justify-between w-full gap-3">
                <span>Planogram</span>
                <span className="text-[9px] text-gray-500">Coming Soon</span>
              </div>
            </SelectItem>
            <SelectItem value="price-promo" className="text-white hover:bg-[#1a1a1a] font-sans">
              <div className="flex items-center justify-between w-full gap-3">
                <span>Price & Promo</span>
                <span className="text-[9px] text-gray-500">Coming Soon</span>
              </div>
            </SelectItem>
            <SelectItem value="in-store" className="text-white hover:bg-[#1a1a1a] font-sans">
              <div className="flex items-center justify-between w-full gap-3">
                <span>In-Store Activation</span>
                <span className="text-[9px] text-gray-500">Coming Soon</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Assortment Optimization</h3>
        </div>

        <div className="flex flex-col items-center justify-center py-2">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 font-sans">Choice Share Uplift</div>
          <div className="text-4xl font-bold text-[#1ED59B] font-sans">{uplift}%</div>

          <div className="mt-2 text-xs font-sans flex items-center gap-2">
            <span className="text-gray-500">Current</span>
            <span className="text-gray-300 font-medium">{currentShare}%</span>
            <ArrowRight className="h-3 w-3 text-gray-600" />
            <span className="text-gray-300 font-medium">{potentialShare}%</span>
            <span className="text-gray-500">Potential</span>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">% Incrementality By</h3>
        </div>

        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center bg-black/40 rounded p-0.5 font-sans">
            <button
              onClick={() => setIncrementalityView("brand")}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                incrementalityView === "brand"
                  ? "bg-[#1ED59B] text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              Brand
            </button>
            <button
              onClick={() => setIncrementalityView("shopper")}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                incrementalityView === "shopper"
                  ? "bg-[#1ED59B] text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              Shopper Group
            </button>
            <button
              onClick={() => setIncrementalityView("usecase")}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                incrementalityView === "usecase"
                  ? "bg-[#1ED59B] text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              Use Case
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          {currentImpacts.map((item, index) => {
            const maxVal = Math.max(...currentImpacts.map((i) => Math.abs(i.change)))
            const leftWidth = item.change < 0 ? (Math.abs(item.change) / maxVal) * 100 : 0
            const rightWidth = item.change > 0 ? (item.change / maxVal) * 100 : 0
            const isOurBrand = (item as any).brand === "Brand A"
            const isPositive = item.change > 0

            // For brand view: Brand A = green, others = grey regardless of value
            // For shopper/usecase: positive = green, negative = grey
            const barColor =
              incrementalityView === "brand" ? (isOurBrand ? "#1ED59B" : "#6B7280") : isPositive ? "#1ED59B" : "#6B7280"

            return (
              <div key={index} className="flex items-center gap-2">
                {/* Label on left */}
                <span className="text-[10px] text-gray-400 font-sans min-w-[90px] text-left">
                  {item.label || (item as any).brand}
                </span>

                {/* Left side for negative values */}
                <div className="flex-1 flex justify-end">
                  {item.change < 0 && (
                    <div
                      className="h-2.5 rounded-sm transition-all duration-500"
                      style={{ width: `${leftWidth}%`, backgroundColor: barColor }}
                    />
                  )}
                </div>

                {/* Center zero line */}
                <div className="w-px h-3 bg-gray-600" />

                {/* Right side for positive values */}
                <div className="flex-1">
                  {item.change > 0 && (
                    <div
                      className="h-2.5 rounded-sm transition-all duration-500"
                      style={{ width: `${rightWidth}%`, backgroundColor: barColor }}
                    />
                  )}
                </div>

                {/* Percentage value on right */}
                <span className="text-[9px] font-bold text-gray-400 font-sans min-w-[32px] text-right">
                  {item.change > 0 ? "+" : ""}
                  {item.change}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">SKU Recommendations</h3>
          <span className="text-[10px] text-gray-500 font-sans">BRAND A</span>
        </div>

        <div className="space-y-2">
          {skuRecommendations.map((rec, idx) => {
            const actionConfig = {
              introduce: { icon: PlusCircle, color: "text-[#1ED59B]", bg: "bg-[#1ED59B]/10", label: "Introduce" },
              increase: { icon: ArrowUp, color: "text-blue-400", bg: "bg-blue-400/10", label: "Increase" },
              decrease: { icon: ArrowDown, color: "text-[#F1CA4B]", bg: "bg-[#F1CA4B]/10", label: "Decrease" },
              delist: { icon: X, color: "text-[#EB5757]", bg: "bg-[#EB5757]/10", label: "Delist" },
            }

            const config = actionConfig[rec.action as keyof typeof actionConfig]
            const Icon = config.icon

            return (
              <div key={idx} className="p-3 bg-[#1a1a1a] rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <div className={`${config.bg} rounded p-1.5 flex-shrink-0`}>
                    <Icon className={`h-3 w-3 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-300 font-medium font-sans leading-snug">{rec.sku}</p>
                      <span className={`text-[10px] font-bold ${config.color} flex-shrink-0`}>{rec.impact}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`text-[9px] font-bold ${config.color} uppercase tracking-wide`}>
                        {config.label}
                      </span>
                      <span className="text-[9px] text-gray-500">•</span>
                      <span className="text-[9px] text-gray-500 italic font-sans">{rec.rationale}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4">
          <Button className="w-full h-9 bg-[#1ED59B] hover:bg-[#1BC786] text-black font-semibold text-xs tracking-wide transition-all rounded-lg flex items-center justify-center gap-2">
            <Edit className="h-3.5 w-3.5" />
            REVIEW RECOMMENDATIONS
          </Button>
        </div>
      </div>
    </div>
  )
}
