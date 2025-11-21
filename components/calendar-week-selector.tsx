"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

interface CalendarWeekSelectorProps {
  selectedWeek?: number
  selectedYear?: number
  onWeekChange?: (week: number, year: number, startDate: string, endDate: string) => void
}

export function CalendarWeekSelector({
  selectedWeek = 44,
  selectedYear = 2025,
  onWeekChange,
}: CalendarWeekSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 9)) // October 2025
  const [isOpen, setIsOpen] = useState(false)

  // Get the date range for the selected week
  const getWeekRange = (week: number, year: number) => {
    const jan1 = new Date(year, 0, 1)
    const days = (week - 1) * 7
    const startOfWeek = new Date(jan1.getTime() + days * 24 * 60 * 60 * 1000)

    // Adjust to Monday
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(startOfWeek.setDate(diff))

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const formatDate = (date: Date) => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${months[date.getMonth()]} ${date.getDate()}`
    }

    return `${formatDate(monday)} - ${formatDate(sunday)}`
  }

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleWeekClick = (week: number, startDate: string, endDate: string) => {
    onWeekChange?.(week, currentMonth.getFullYear(), startDate, endDate)
    setIsOpen(false)
  }

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
    const days = []
    const weeks = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const weekNum = getWeekNumber(date)
      const isSelected = weekNum === selectedWeek

      days.push(
        <div
          key={day}
          className={`h-8 flex items-center justify-center text-xs font-sans cursor-pointer rounded transition-colors
            ${isSelected ? "bg-white text-black font-medium" : "text-gray-400 hover:bg-[#1a1a1a]"}
          `}
          onClick={() => {
            const monday = new Date(date)
            const day = monday.getDay()
            const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
            monday.setDate(diff)

            const sunday = new Date(monday)
            sunday.setDate(monday.getDate() + 6)

            handleWeekClick(weekNum, monday.toISOString(), sunday.toISOString())
          }}
        >
          {day}
        </div>,
      )
    }

    // Group into weeks
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(
        <div key={`week-${i}`} className="grid grid-cols-7 gap-1">
          {days.slice(i, i + 7)}
        </div>,
      )
    }

    return weeks
  }

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="bg-black text-gray-400 h-9 px-4 text-xs hover:bg-[#111] transition-colors border-0 font-sans gap-2"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>{getWeekRange(selectedWeek, selectedYear)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-[#0a0a0a] border border-[#1a1a1a] p-4 font-sans" align="center">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 font-sans">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">{renderCalendar()}</div>

        {/* Selected week display */}
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
          <div className="text-xs text-gray-500 font-sans">Selected Week</div>
          <div className="text-sm text-white font-medium font-sans mt-1">
            Week {selectedWeek}: {getWeekRange(selectedWeek, selectedYear)}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
