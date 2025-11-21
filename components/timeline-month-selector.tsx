"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimelineMonthSelectorProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  compact?: boolean
}

const monthsWithData = [
  { year: 2024, month: 8, day: 5 }, // September
  { year: 2024, month: 9, day: 12 }, // October
  { year: 2024, month: 10, day: 8 }, // November
  { year: 2025, month: 0, day: 15 }, // January
  { year: 2025, month: 2, day: 10 }, // March
  { year: 2025, month: 4, day: 20 }, // May
  { year: 2025, month: 6, day: 5 }, // July
  { year: 2025, month: 7, day: 18 }, // August
  { year: 2025, month: 9, day: 30 }, // October
]

export function TimelineMonthSelector({ selectedDate, onDateChange, compact = false }: TimelineMonthSelectorProps) {
  const startDate = new Date(2024, 8, 1) // September 2024
  const endDate = new Date(2025, 9, 31) // October 2025

  const allMonths = []
  let currentMonth = new Date(startDate)
  while (currentMonth <= endDate) {
    allMonths.push({ year: currentMonth.getFullYear(), month: currentMonth.getMonth() })
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
  }

  const latestMonthIndex = allMonths.length - 1
  const defaultScrollOffset = Math.max(0, latestMonthIndex - 11)

  const [scrollOffset, setScrollOffset] = useState(defaultScrollOffset)

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

  const hasData = (year: number, month: number) => {
    return monthsWithData.some((m) => m.year === year && m.month === month)
  }

  const isSelected = (year: number, month: number) => {
    return selectedDate.getFullYear() === year && selectedDate.getMonth() === month
  }

  const handleMonthClick = (year: number, month: number) => {
    if (hasData(year, month)) {
      const dataEntry = monthsWithData.find((m) => m.year === year && m.month === month)
      if (dataEntry) {
        onDateChange(new Date(year, month, dataEntry.day))
      }
    }
  }

  const scroll = (direction: "left" | "right") => {
    const scrollAmount = compact ? 3 : 12
    const newOffset =
      direction === "left"
        ? Math.max(0, scrollOffset - scrollAmount)
        : Math.min(allMonths.length - scrollAmount, scrollOffset + scrollAmount)
    setScrollOffset(newOffset)
  }

  const visibleCount = compact ? 3 : 12
  const visibleMonths = allMonths.slice(scrollOffset, scrollOffset + visibleCount)

  if (compact) {
    return (
      <div className="w-full font-sans">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll("left")}
              disabled={scrollOffset === 0}
              className="h-4 w-4 p-0 bg-transparent hover:bg-[#1a1a1a] text-gray-500 disabled:opacity-30"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>

            <div className="flex gap-0.5 flex-1 justify-center">
              {visibleMonths.map(({ year, month }) => {
                const selected = isSelected(year, month)
                const dataAvailable = hasData(year, month)

                return (
                  <button
                    key={`${year}-${month}`}
                    onClick={() => handleMonthClick(year, month)}
                    disabled={!dataAvailable}
                    className={`
                      relative px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide font-sans
                      ${selected ? "bg-[#2a2a2a] text-gray-300" : "bg-transparent text-gray-600"}
                      ${dataAvailable ? "cursor-pointer hover:bg-[#1a1a1a]" : "cursor-default opacity-40"}
                    `}
                  >
                    {monthNames[month].substring(0, 1)}
                    {dataAvailable && (
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-0.5 rounded-full bg-gray-600" />
                    )}
                  </button>
                )
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll("right")}
              disabled={scrollOffset >= allMonths.length - visibleCount}
              className="h-4 w-4 p-0 bg-transparent hover:bg-[#1a1a1a] text-gray-500 disabled:opacity-30"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full font-sans">
      <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("left")}
          disabled={scrollOffset === 0}
          className="h-6 w-6 flex-shrink-0 bg-transparent hover:bg-[#1a1a1a] text-gray-400 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          {visibleMonths.map(({ year, month }, idx) => {
            const selected = isSelected(year, month)
            const dataAvailable = hasData(year, month)
            const showYear = idx === 0 || (idx > 0 && visibleMonths[idx - 1].year !== year)

            return (
              <div key={`${year}-${month}`} className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => handleMonthClick(year, month)}
                  disabled={!dataAvailable}
                  className={`
                    px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide font-sans text-gray-400
                    ${selected ? "bg-[#3a3a3a]" : "bg-transparent"}
                    ${dataAvailable ? "cursor-pointer" : "cursor-default"}
                  `}
                >
                  {monthNames[month]}
                </button>
                {dataAvailable && <div className="h-1 w-1 rounded-full bg-gray-500" />}
                {showYear && <div className="text-[9px] text-gray-600 mt-0.5 font-sans">{year}</div>}
              </div>
            )
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("right")}
          disabled={scrollOffset >= allMonths.length - 12}
          className="h-6 w-6 flex-shrink-0 bg-transparent hover:bg-[#1a1a1a] text-gray-400 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
