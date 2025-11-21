"use client"

import type React from "react"

import { DashboardHeader } from "@/components/dashboard-header"
import { StoreProfilePanel, StoreSelector } from "@/components/store-profile-panel"
import { RetailContextPanel } from "@/components/retail-context-panel"
import { AnalyticsPanel } from "@/components/analytics-panel"
import { OptimizePanel } from "@/components/optimize-panel"
import { ShopperSegmentControl } from "@/components/shopper-segment-control"
import { ChevronRight } from "lucide-react"
import { useState } from "react"
import { ChatMode } from "@/components/chat-mode"
import { ContextMenu } from "@/components/context-menu"
import { CollapsibleColumn } from "@/components/collapsible-column"
import { AIColumn } from "@/components/ai-column"

export default function Page() {
  const [viewMode, setViewMode] = useState<"detailed" | "summary">("detailed")
  const [activeSection, setActiveSection] = useState<string>("all")
  const [activeDashboard, setActiveDashboard] = useState<string>("store-view")
  const [showChatMode, setShowChatMode] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2025, 9, 30))

  const [collapsedColumns, setCollapsedColumns] = useState({
    storeProfile: false,
    shelfState: false,
    shopperAnalytics: false,
    optimising: false,
    ai: false,
  })

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    metric: string
    value: string
    source: string
  } | null>(null)

  const handleContextMenu = (e: React.MouseEvent, metric: string, value: string, source: string) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      metric,
      value,
      source,
    })
  }

  const handleAskAI = () => {
    if (contextMenu) {
      setShowChatMode(true)
      setContextMenu(null)
    }
  }

  const handleAskQuestion = (question: string) => {
    console.log("[v0] User asked:", question)
    if (!collapsedColumns.storeProfile) {
      setCollapsedColumns((prev) => ({ ...prev, storeProfile: true }))
    }
    setShowChatMode(true)
  }

  const toggleColumn = (column: keyof typeof collapsedColumns) => {
    setCollapsedColumns((prev) => ({ ...prev, [column]: !prev[column] }))
  }

  if (showChatMode) {
    return (
      <ChatMode
        onClose={() => setShowChatMode(false)}
        initialContext={
          contextMenu
            ? {
                source: contextMenu.source,
                metric: contextMenu.metric,
                value: contextMenu.value,
              }
            : undefined
        }
      />
    )
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
      <DashboardHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeDashboard={activeDashboard}
        onDashboardChange={setActiveDashboard}
      />

      <main className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="container mx-auto px-6 flex-1 py-3 overflow-hidden">
            {viewMode === "detailed" ? (
              <div
                className="h-full grid gap-3 items-stretch overflow-hidden"
                style={{
                  gridTemplateColumns: `
                    ${collapsedColumns.storeProfile ? "60px" : "1fr"}
                    auto
                    ${collapsedColumns.shelfState ? "60px" : "1fr"}
                    auto
                    ${collapsedColumns.shopperAnalytics ? "60px" : "1fr"}
                    auto
                    ${collapsedColumns.optimising ? "60px" : "1fr"}
                    auto
                    ${collapsedColumns.ai ? "60px" : "1fr"}
                  `,
                }}
                onContextMenu={(e) => {
                  const target = e.target as HTMLElement
                  if (target.dataset.metric && target.dataset.value) {
                    handleContextMenu(
                      e,
                      target.dataset.metric,
                      target.dataset.value,
                      target.dataset.source || "Dashboard",
                    )
                  }
                }}
              >
                <CollapsibleColumn
                  title="Store Profile"
                  color="#9ca3af"
                  isCollapsed={collapsedColumns.storeProfile}
                  onToggle={() => toggleColumn("storeProfile")}
                  icon="store"
                >
                  <StoreSelector />
                  <StoreProfilePanel selectedDate={selectedDate} onDateChange={setSelectedDate} />
                </CollapsibleColumn>

                <div className="flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                </div>

                <CollapsibleColumn
                  title="Shelf State"
                  color="#F2994A"
                  isCollapsed={collapsedColumns.shelfState}
                  onToggle={() => toggleColumn("shelfState")}
                  icon="shelf"
                >
                  <RetailContextPanel />
                </CollapsibleColumn>

                <div className="flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                </div>

                <CollapsibleColumn
                  title="Shopper Analytics"
                  color="#498BFF"
                  isCollapsed={collapsedColumns.shopperAnalytics}
                  onToggle={() => toggleColumn("shopperAnalytics")}
                  icon="shopper"
                >
                  <ShopperSegmentControl />
                  <AnalyticsPanel />
                </CollapsibleColumn>

                <div className="flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                </div>

                <CollapsibleColumn
                  title="Optimising"
                  color="#1ED59B"
                  isCollapsed={collapsedColumns.optimising}
                  onToggle={() => toggleColumn("optimising")}
                  icon="optimising"
                >
                  <OptimizePanel />
                </CollapsibleColumn>

                <div className="flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                </div>

                <CollapsibleColumn
                  title="AI Insights"
                  color="#d1d5db"
                  isCollapsed={collapsedColumns.ai}
                  onToggle={() => toggleColumn("ai")}
                  icon="ai"
                >
                  <AIColumn onAskQuestion={handleAskQuestion} />
                </CollapsibleColumn>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-600 text-xs font-sans">Summary view coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          metric={contextMenu.metric}
          value={contextMenu.value}
          onClose={() => setContextMenu(null)}
          onAskAI={handleAskAI}
        />
      )}
    </div>
  )
}
