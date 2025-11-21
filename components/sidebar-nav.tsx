"use client"

import { Store, Package, Users, Sparkles, MessageSquare } from "lucide-react"
import { useState } from "react"

interface SidebarNavProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onAIInsightsClick: () => void
}

export function SidebarNav({ activeSection, onSectionChange, onAIInsightsClick }: SidebarNavProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const navItems = [
    { id: "store-profile", label: "Store Profile", icon: Store, color: "text-gray-500" },
    { id: "shelf-state", label: "Shelf State", icon: Package, color: "text-[#F2994A]" },
    { id: "shopper-analytics", label: "Shopper Analytics", icon: Users, color: "text-[#498BFF]" },
    { id: "optimising", label: "Optimising", icon: Sparkles, color: "text-[#1ED59B]" },
  ]

  return (
    <div
      className={`bg-[#0a0a0a] border-r border-[#1a1a1a] transition-all duration-200 flex flex-col ${
        isExpanded ? "w-44" : "w-14"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Navigation Items */}
      <nav className="flex-1 py-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all relative group ${
                isActive ? "bg-[#1a1a1a]/80" : "hover:bg-[#1a1a1a]/40"
              }`}
            >
              {isActive && (
                <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${item.color.replace("text-", "bg-")}`} />
              )}

              <Icon className={`w-4 h-4 ${isActive ? item.color : "text-gray-600"} flex-shrink-0`} strokeWidth={1.5} />
              <span
                className={`text-[11px] font-medium transition-opacity whitespace-nowrap font-sans ${
                  isExpanded ? "opacity-100" : "opacity-0 w-0"
                } ${isActive ? item.color : "text-gray-600"}`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-[#1a1a1a] p-3">
        <button
          onClick={onAIInsightsClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#1a1a1a]/50 rounded hover:bg-[#1a1a1a] transition-all"
        >
          <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={1.5} />
          <span
            className={`text-[11px] font-medium text-gray-500 transition-opacity whitespace-nowrap font-sans ${
              isExpanded ? "opacity-100" : "opacity-0 w-0"
            }`}
          >
            AI Insights
          </span>
        </button>
      </div>
    </div>
  )
}
