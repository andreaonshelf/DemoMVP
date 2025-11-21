"use client"

import type React from "react"

import { Sparkles, MessageSquare, ChevronRight, Plus } from "lucide-react"
import { useState } from "react"

interface AISidebarProps {
  onAskQuestion?: (question: string) => void
  isExpanded?: boolean
}

export function AISidebar({ onAskQuestion, isExpanded: controlledExpanded }: AISidebarProps) {
  const [isExpanded, setIsExpanded] = useState(controlledExpanded ?? false)
  const [question, setQuestion] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim() && onAskQuestion) {
      onAskQuestion(question)
      setQuestion("")
    }
  }

  return (
    <div
      className={`bg-[#0a0a0a] border-r border-[#1a1a1a] transition-all duration-200 flex flex-col ${
        isExpanded ? "w-64" : "w-14"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header */}
      <div className="p-3 border-b border-[#1a1a1a] flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" strokeWidth={1.5} />
        <span
          className={`text-xs font-bold text-white transition-opacity whitespace-nowrap font-sans ${
            isExpanded ? "opacity-100" : "opacity-0 w-0"
          }`}
        >
          AI Insights
        </span>
      </div>

      {/* AI Summary Section */}
      <div className={`flex-1 overflow-y-auto ${isExpanded ? "px-3 py-4" : "px-2 py-3"}`}>
        {isExpanded ? (
          <>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase mb-3 tracking-wide">Key Insights</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-[#1ED59B] mt-1.5 flex-shrink-0" />
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  <span className="text-[#1ED59B] font-medium">7% choice share uplift</span> available through
                  assortment optimization
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-[#EB5757] mt-1.5 flex-shrink-0" />
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  Brand A underperforming in <span className="text-[#498BFF] font-medium">weeknight unwind</span>{" "}
                  (-16pts gap)
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-[#F2994A] mt-1.5 flex-shrink-0" />
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  Shelf efficiency ratio of <span className="text-[#F2994A] font-medium">0.88x</span> suggests space
                  reallocation
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-[#F1CA4B] mt-1.5 flex-shrink-0" />
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  Young Families shows <span className="text-[#F1CA4B] font-medium">+9% incrementality</span>{" "}
                  opportunity
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase mb-3 tracking-wide">Chat History</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-2 py-1.5 rounded hover:bg-[#1a1a1a] transition-all group">
                  <p className="text-[10px] text-gray-400 line-clamp-2 group-hover:text-gray-300">
                    Brand A performance analysis
                  </p>
                </button>
                <button className="w-full text-left px-2 py-1.5 rounded hover:bg-[#1a1a1a] transition-all group">
                  <p className="text-[10px] text-gray-400 line-clamp-2 group-hover:text-gray-300">
                    Shopper segment insights
                  </p>
                </button>
              </div>
              <button className="w-full mt-3 px-2 py-1.5 rounded border border-[#1a1a1a] hover:bg-[#1a1a1a] transition-all flex items-center gap-2 text-gray-500 hover:text-gray-300">
                <Plus className="w-3 h-3" strokeWidth={2} />
                <span className="text-[10px] font-medium">New Chat</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1ED59B]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#EB5757]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F2994A]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F1CA4B]" />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className={`border-t border-[#1a1a1a] ${isExpanded ? "p-3" : "p-2"}`}>
        {isExpanded ? (
          <form onSubmit={handleSubmit}>
            <div className="bg-[#0f0f0f] rounded px-2 py-1.5 flex items-center gap-2 border border-transparent hover:border-[#1a1a1a] transition-all">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask AI..."
                className="flex-1 bg-transparent text-gray-200 placeholder:text-gray-600 text-xs outline-none"
              />
              <button
                type="submit"
                className="w-6 h-6 rounded bg-white hover:bg-gray-200 flex items-center justify-center transition-all flex-shrink-0"
              >
                <ChevronRight className="h-3 w-3 text-black" strokeWidth={2} />
              </button>
            </div>
          </form>
        ) : (
          <button className="w-full h-8 rounded bg-[#1a1a1a] hover:bg-[#2a2a2a] flex items-center justify-center transition-all">
            <MessageSquare className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}
