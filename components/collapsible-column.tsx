"use client"

import { ChevronLeft, Store, Package, Users, Sparkles, MessageSquare } from "lucide-react"
import type { ReactNode } from "react"

interface CollapsibleColumnProps {
  title: string
  color?: string
  isCollapsed: boolean
  onToggle: () => void
  children: ReactNode
  className?: string
  icon?: "store" | "shelf" | "shopper" | "optimising" | "ai"
}

const iconMap = {
  store: Store,
  shelf: Package,
  shopper: Users,
  optimising: Sparkles,
  ai: MessageSquare,
}

export function CollapsibleColumn({
  title,
  color = "gray-500",
  isCollapsed,
  onToggle,
  children,
  className = "",
  icon,
}: CollapsibleColumnProps) {
  if (isCollapsed) {
    const Icon = icon ? iconMap[icon] : null

    return (
      <button
        onClick={onToggle}
        className={`w-12 flex flex-col items-center justify-center hover:opacity-80 transition-opacity rounded-lg ${className}`}
        style={{ backgroundColor: `${color}15` }}
        title={`Expand ${title}`}
      >
        {Icon && <Icon className="w-4 h-4" style={{ color }} />}
      </button>
    )
  }

  return (
    <div className={`flex flex-col overflow-hidden bg-[#0f0f0f] rounded-lg px-4 py-3 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wide uppercase font-sans" style={{ color }}>
          {title}
        </h2>
        <button onClick={onToggle} className="p-1 hover:bg-white/5 rounded transition-colors" title="Collapse column">
          <ChevronLeft className="w-3 h-3 text-gray-600 hover:text-gray-400" />
        </button>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <div className="h-full overflow-y-auto pr-2 custom-scrollbar">{children}</div>
      </div>
    </div>
  )
}
