"use client"

import { MessageSquare, Copy, TrendingUp } from "lucide-react"
import { useEffect, useRef } from "react"

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onAskAI: () => void
  metric?: string
  value?: string
}

export function ContextMenu({ x, y, onClose, onAskAI, metric, value }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={onAskAI}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] transition-all text-left"
      >
        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs text-white font-sans">Ask AI about this</span>
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] transition-all text-left">
        <Copy className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-300 font-sans">Copy value</span>
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] transition-all text-left">
        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-300 font-sans">View trend</span>
      </button>
    </div>
  )
}
