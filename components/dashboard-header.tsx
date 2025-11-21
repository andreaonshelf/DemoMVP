"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import Image from "next/image"
import { PrimaryNav } from "./primary-nav"

interface DashboardHeaderProps {
  categorySelector?: React.ReactNode
  viewMode?: "detailed" | "summary"
  onViewModeChange?: (mode: "detailed" | "summary") => void
  activeDashboard?: string
  onDashboardChange?: (dashboard: string) => void
}

export function DashboardHeader({
  categorySelector,
  viewMode = "detailed",
  onViewModeChange,
  activeDashboard = "store-view",
  onDashboardChange,
}: DashboardHeaderProps) {
  const isDetailed = viewMode === "detailed"

  return (
    <header className="border-b border-[#1a1a1a] bg-black">
      <div className="container mx-auto px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0">
              <Image
                src="/onshelf-logo-new.png"
                alt="OnShelf"
                width={100}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>

            <PrimaryNav
              activeDashboard={activeDashboard}
              onDashboardChange={(dashboard) => onDashboardChange?.(dashboard)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-gray-500 font-sans">Detail</span>
              <button
                onClick={() => onViewModeChange?.(isDetailed ? "summary" : "detailed")}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  isDetailed ? "bg-[#2a2a2a]" : "bg-[#1a1a1a]"
                }`}
                aria-label={isDetailed ? "Switch to summary view" : "Switch to detailed view"}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
                    isDetailed ? "translate-x-4 bg-gray-400" : "translate-x-0 bg-gray-600"
                  }`}
                />
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="bg-transparent text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-300 transition-colors w-8 h-8"
              aria-label="Close view"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
