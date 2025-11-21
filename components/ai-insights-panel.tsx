"use client"

import { X, ChevronRight, Sparkles, MessageSquare } from "lucide-react"

interface AIInsightsPanelProps {
  onClose: () => void
}

export function AIInsightsPanel({ onClose }: AIInsightsPanelProps) {
  return (
    <div className="w-[400px] bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold text-white">AI Insights</h2>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded hover:bg-[#2a2a2a] flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* AI Summary Section */}
      <div className="p-4 border-b border-[#2a2a2a]">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Key Insights</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1ED59B] mt-1.5 flex-shrink-0" />
            <p className="text-xs text-gray-300 leading-relaxed">
              <span className="text-[#1ED59B] font-medium">7% choice share uplift</span> available through assortment
              optimization
            </p>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#EB5757] mt-1.5 flex-shrink-0" />
            <p className="text-xs text-gray-300 leading-relaxed">
              Brand A underperforming in <span className="text-[#498BFF] font-medium">weeknight unwind</span> (-16pts
              gap)
            </p>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F2994A] mt-1.5 flex-shrink-0" />
            <p className="text-xs text-gray-300 leading-relaxed">
              Shelf efficiency ratio of <span className="text-[#F2994A] font-medium">0.88x</span> suggests space
              reallocation needed
            </p>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F1CA4B] mt-1.5 flex-shrink-0" />
            <p className="text-xs text-gray-300 leading-relaxed">
              Young Families segment shows <span className="text-[#F1CA4B] font-medium">+9% incrementality</span>{" "}
              opportunity
            </p>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 mx-auto mb-3 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-xs text-gray-500">Ask questions about your data</p>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="bg-[#0f0f0f] rounded-lg px-3 py-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask a question..."
              className="flex-1 bg-transparent text-gray-200 placeholder:text-gray-600 text-xs outline-none"
            />
            <button className="w-7 h-7 rounded bg-white hover:bg-gray-200 flex items-center justify-center transition-all">
              <ChevronRight className="h-3.5 w-3.5 text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
