"use client"

import { X, MessageSquare, Plus, ChevronLeft } from "lucide-react"
import { useState } from "react"

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  context?: {
    source: string
    metric: string
    value: string
    relatedData?: Record<string, string>
  }
}

interface ChatModeProps {
  onClose: () => void
  initialContext?: {
    source: string
    metric: string
    value: string
    relatedData?: Record<string, string>
  }
}

export function ChatMode({ onClose, initialContext }: ChatModeProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([
    {
      id: "1",
      title: "Brand A performance",
      messages: [],
      context: initialContext,
    },
  ])
  const [activeConversationId, setActiveConversationId] = useState("1")
  const [inputValue, setInputValue] = useState("")
  const [contextView, setContextView] = useState<"chart" | "data" | "empty">("empty")

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    // Simulate AI response
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: "Based on the data, I can see that Brand A shows...",
      timestamp: new Date(),
    }

    setConversations(
      conversations.map((conv) =>
        conv.id === activeConversationId ? { ...conv, messages: [...conv.messages, userMessage, aiMessage] } : conv,
      ),
    )

    setInputValue("")
    setContextView("chart")
  }

  const handleNewChat = () => {
    const newConversation: ChatConversation = {
      id: Date.now().toString(),
      title: "New conversation",
      messages: [],
    }
    setConversations([...conversations, newConversation])
    setActiveConversationId(newConversation.id)
    setContextView("empty")
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex">
      {/* Chat History Sidebar */}
      <div className="w-56 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
        <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-sans">Dashboard</span>
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded text-gray-300 text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-sans">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2 px-1 font-sans">History</div>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`w-full text-left px-3 py-2 rounded text-xs mb-1 transition-all font-sans ${
                conv.id === activeConversationId
                  ? "bg-[#1a1a1a] text-white"
                  : "text-gray-500 hover:bg-[#1a1a1a]/50 hover:text-gray-300"
              }`}
            >
              <div className="truncate">{conv.title}</div>
              {conv.context && (
                <div className="text-[10px] text-gray-600 mt-0.5 truncate">From: {conv.context.source}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex">
        {/* Conversation Panel */}
        <div className="flex-1 flex flex-col bg-black">
          {/* Context Chip */}
          {activeConversation?.context && (
            <div className="px-6 pt-4 pb-2 border-b border-[#1a1a1a]">
              <div className="inline-flex items-center gap-2 bg-[#1a1a1a] rounded-full px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <div className="text-[10px] text-gray-400 font-sans">Context: {activeConversation.context.source}</div>
                <div className="text-[10px] text-white font-sans">
                  {activeConversation.context.metric}: {activeConversation.context.value}
                </div>
                <button className="ml-1 text-gray-600 hover:text-gray-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {activeConversation?.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2 font-sans">Ask about your data</h3>
                <p className="text-xs text-gray-500 text-center max-w-sm font-sans">
                  {activeConversation?.context
                    ? "I have context from your dashboard. What would you like to know?"
                    : "Start a conversation or right-click any metric in the dashboard to ask about it."}
                </p>
                {activeConversation?.context && (
                  <div className="mt-6 space-y-2 w-full max-w-md">
                    <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2 font-sans">
                      Suggested Questions
                    </div>
                    <button className="w-full text-left px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded text-xs text-gray-300 transition-all font-sans">
                      Why is {activeConversation.context.metric} at {activeConversation.context.value}?
                    </button>
                    <button className="w-full text-left px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded text-xs text-gray-300 transition-all font-sans">
                      How does this compare to last month?
                    </button>
                    <button className="w-full text-left px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded text-xs text-gray-300 transition-all font-sans">
                      What should I do to improve this?
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl">
                {activeConversation?.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                        message.type === "user"
                          ? "bg-white text-black"
                          : "bg-[#1a1a1a] text-gray-200 border border-[#2a2a2a]"
                      }`}
                    >
                      <p className="text-xs leading-relaxed font-sans">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-[#1a1a1a]">
            <div className="bg-[#1a1a1a] rounded-lg px-4 py-3 flex items-center gap-3 border border-[#2a2a2a]">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask a question..."
                className="flex-1 bg-transparent text-white placeholder:text-gray-600 text-xs outline-none font-sans"
              />
              <button
                onClick={handleSendMessage}
                className="w-8 h-8 rounded bg-white hover:bg-gray-200 flex items-center justify-center transition-all"
              >
                <MessageSquare className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        </div>

        {/* Context/Visualization Panel */}
        <div className="w-[500px] bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col">
          <div className="p-4 border-b border-[#1a1a1a]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">
              Context & Visualizations
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {contextView === "empty" ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] mx-auto mb-3 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-sans">Visualizations will appear here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Example visualization */}
                <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#1a1a1a]">
                  <h4 className="text-xs font-semibold text-white mb-3 font-sans">Brand A Performance Over Time</h4>
                  <div className="h-48 bg-[#1a1a1a] rounded flex items-center justify-center">
                    <p className="text-[10px] text-gray-600 font-sans">Chart placeholder</p>
                  </div>
                </div>

                <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#1a1a1a]">
                  <h4 className="text-xs font-semibold text-white mb-3 font-sans">Related Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-sans">Brand B</span>
                      <span className="text-white font-sans">30%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-sans">Brand C</span>
                      <span className="text-white font-sans">18%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
