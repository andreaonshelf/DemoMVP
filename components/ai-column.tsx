"use client"

import type React from "react"

import { Sparkles, Send } from "lucide-react"
import { useState } from "react"

interface AIColumnProps {
  onAskQuestion: (question: string) => void
}

export function AIColumn({ onAskQuestion }: AIColumnProps) {
  const [question, setQuestion] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim()) {
      onAskQuestion(question)
      setQuestion("")
    }
  }

  const insights = [
    { icon: "📊", text: "Brand A shelf share down 16pts in weeknight unwind" },
    { icon: "📈", text: "7% choice share uplift available via assortment optimization" },
    { icon: "👥", text: "Young Families segment shows +9% incrementality" },
  ]

  return (
    <div className="space-y-4">
      {/* AI Summary */}
      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3 h-3 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">Key Insights</h3>
        </div>
        <div className="space-y-2">
          {insights.map((insight, idx) => (
            <button
              key={idx}
              onClick={() => onAskQuestion(`Tell me more about: ${insight.text}`)}
              className="w-full text-left p-2 bg-[#1a1a1a] rounded hover:bg-[#1a1a1a]/80 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-sm">{insight.icon}</span>
                <span className="text-[10px] text-gray-400 leading-relaxed font-sans">{insight.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ask AI */}
      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 rounded-lg p-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 font-sans">Ask AI</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your data..."
            className="w-full bg-black text-white text-xs p-2 rounded resize-none focus:outline-none focus:ring-1 focus:ring-gray-700 font-sans"
            rows={3}
          />
          <button
            type="submit"
            disabled={!question.trim()}
            className="w-full bg-[#498BFF] text-white text-xs py-2 px-3 rounded hover:bg-[#498BFF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-sans"
          >
            <span>Send</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Chat History (placeholder) */}
      <div className="bg-[#0a0a0a] shadow-sm shadow-black/30 rounded-lg p-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 font-sans">Recent</h3>
        <div className="text-[10px] text-gray-600 font-sans">No recent conversations</div>
      </div>
    </div>
  )
}
