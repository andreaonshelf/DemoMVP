"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Store, Users, Briefcase } from "lucide-react"

const TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/overview",
    icon: LayoutGrid,
    description: "Store grid with filters"
  },
  {
    id: "store-view",
    label: "Store View",
    href: "/store-view",
    icon: Store,
    description: "Detailed store analytics"
  },
  {
    id: "shopper",
    label: "Shopper",
    href: "/shopper",
    icon: Users,
    description: "SKU-level insights (B2C)"
  },
  {
    id: "b2b",
    label: "B2B",
    href: "/b2b",
    icon: Briefcase,
    description: "Retailer comparisons"
  }
]

export function TopNavigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-[#1a1a1a] bg-black">
      <div className="container mx-auto px-6">
        <div className="flex items-center h-14">
          {/* Logo / Brand */}
          <div className="mr-8">
            <span className="text-sm font-bold text-white tracking-tight font-sans">
              OnShelf Demo
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = pathname?.startsWith(tab.href)

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium font-sans transition-all
                    ${isActive
                      ? "bg-[#1a1a1a] text-white"
                      : "text-gray-500 hover:text-gray-300 hover:bg-[#0f0f0f]"
                    }
                  `}
                  title={tab.description}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side - could add user menu, settings, etc. */}
          <div className="ml-auto">
            <div className="text-[9px] text-gray-600 uppercase tracking-wide font-sans">
              Demo Mode
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
