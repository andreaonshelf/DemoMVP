"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthGridSelectorProps {
  selectedDate?: Date
  onDateChange?: (date: Date) => void
  // Days when pictures were captured (mock data for now)
  captureDates?: Date[]
}

export function MonthGridSelector({
  selectedDate = new Date(2025, 9, 30), // Oct 30, 2025
  onDateChange,
  captureDates = [
    new Date(2025, 9, 2), // Oct 2
    new Date(2025, 9, 9), // Oct 9
    new Date(2025, 9, 16), // Oct 16
    new Date(2025, 9, 23), // Oct 23
    new Date(2025, 9, 30), // Oct 30
    new Date(2025, 10, 6), // Nov 6
    new Date(2025, 10, 13), // Nov 13
    new Date(2025, 10, 20), // Nov 20
  ],
}: MonthGridSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth())
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear())
  const [open, setOpen] = useState(false)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  // Check if a date has captured data
  const hasCapture = (day: number) => {
    return captureDates.some(
      (date) => date.getDate() === day && date.getMonth() === currentMonth && date.getFullYear() === currentYear,
    )
  }

  // Check if a date is selected
  const isSelected = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    )
  }

  const handleDateClick = (day: number) => {
    if (hasCapture(day)) {
      const newDate = new Date(currentYear, currentMonth, day)
      onDateChange?.(newDate)
      setOpen(false)
    }
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Format the selected date for display
  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Create calendar grid
  const calendarDays = []
  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} />)
  }
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const hasCaptureData = hasCapture(day)
    const isSelectedDay = isSelected(day)

    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        disabled={!hasCaptureData}
        className={cn(
          "aspect-square rounded-md text-sm font-sans transition-all relative",
          hasCaptureData ? "cursor-pointer hover:bg-[#2a2a2a]" : "cursor-not-allowed text-gray-700",
          isSelectedDay && hasCaptureData
            ? "bg-white text-black font-semibold hover:bg-white"
            : hasCaptureData
              ? "text-gray-300"
              : "",
        )}
      >
        {day}
        {hasCaptureData && !isSelectedDay && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
        )}
      </button>,
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 px-3 font-sans text-sm text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors gap-2 bg-transparent"
        >
          <Calendar className="h-4 w-4" />
          {formatSelectedDate()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-black border-[#2a2a2a]" align="center">
        <div className="p-4 space-y-4">
          {/* Month/Year navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium text-white font-sans">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 font-sans text-center">
            <div>S</div>
            <div>M</div>
            <div>T</div>
            <div>W</div>
            <div>T</div>
            <div>F</div>
            <div>S</div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">{calendarDays}</div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-[#1a1a1a]">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-sans">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Data available</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
