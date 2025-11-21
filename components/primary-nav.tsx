"use client"

interface PrimaryNavProps {
  activeDashboard: string
  onDashboardChange: (dashboard: string) => void
}

export function PrimaryNav({ activeDashboard, onDashboardChange }: PrimaryNavProps) {
  const dashboards = [
    { id: "overview", label: "Overview" },
    { id: "store-view", label: "Store View" },
    { id: "shopper", label: "Shopper" },
    { id: "b2b", label: "B2B" },
  ]

  return (
    <nav className="flex items-center gap-1">
      {dashboards.map((dashboard) => {
        const isActive = activeDashboard === dashboard.id
        return (
          <button
            key={dashboard.id}
            onClick={() => onDashboardChange(dashboard.id)}
            className={`px-4 py-2 text-xs font-medium transition-colors relative font-sans ${
              isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {dashboard.label}
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white" />}
          </button>
        )
      })}
    </nav>
  )
}
