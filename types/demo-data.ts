// TypeScript type definitions for OnShelf demo data files
// Generated: 2025-11-21

// ============= FILE 1: stores.json =============
export interface Store {
  store_id: string;
  retailer: string;
  banner: string;
  format: "Hypermarket" | "Supermarket" | "Convenience" | "Forecourt";
  address: string;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
  region: string;
  region_group: "London" | "South" | "North" | "Scotland" | "Wales" | "Midlands";
  location_type: "Urban" | "Suburban" | "Rural";
  store_size: "Small" | "Medium" | "Large" | "XL";
  store_size_sqft: number;
  sku_range: "Expanded (25–70k)" | "Full (8–25k)" | "Mid (3–8k)" | "Compact (<3k)";
  missions: string[];
  weekly_footfall: number;
  cluster_assignment: string;
  cluster_profile: string;
  catchmentPopulation: {
    current: number;
    demographics: Array<{
      segment: string;
      percentage: number;
    }>;
    customerProfile?: Array<{
      segment: string;
      percentage: number;
    }>;
    incomeLevels: Array<{
      level: string;
      percentage: number;
    }>;
    ageDistribution: Array<{
      range: string;
      percentage: number;
    }>;
    gender: Array<{
      gender: string;
      percentage: number;
    }>;
    crimeIndex: number;
  };
}

export interface StoresData {
  category: string;
  sub_category: string;
  generated_at: string;
  stores: Store[];
}

// ============= FILE 2: category-performance.json =============
export interface StorePerformance {
  store_id: string;
  choice_share: Record<string, number>; // brand -> percentage
  shelf_share: Record<string, number>;
  shelf_efficiency: Record<string, number>;
  optimization_potential: Record<string, number>;
  competitive_context: {
    nearby_competitors: Array<{
      store_id: string;
      retailer: string;
      banner: string;
      distance_meters: number;
    }>;
  };
  choice_share_by_segment: Record<string, Record<string, number>>; // segment -> brand -> percentage
  choice_share_by_occasion: Record<string, Record<string, number>>; // occasion -> brand -> percentage
  incrementality_breakdown?: {
    by_brand: Record<string, number>; // brand -> percentage change
    by_segment: Record<string, number>; // segment -> percentage change
    by_occasion: Record<string, number>; // occasion -> percentage change
  };
}

export interface CategoryPerformance {
  category: string;
  sub_category: string;
  generated_at: string;
  stores: StorePerformance[];
}

// ============= FILE 3: shopper-responses.json =============
export interface SKU {
  sku_id: string;
  brand: string;
  name: string;
  pack_size: string;
  abv?: string;
  segment_choice_share: Record<string, number>; // segment -> percentage
  occasion_choice_share: Record<string, number>; // occasion -> percentage
  total_availability: number;
  available_in_stores: string[]; // store_id[]
}

export interface ShopperResponses {
  category: string;
  sub_category: string;
  generated_at: string;
  total_skus: number;
  skus: SKU[];
}

// ============= FILE 4: retailer-analytics.json =============
export interface RetailerData {
  total_stores: number;
  total_choice_share: Record<string, number>;
  choice_share_by_segment: Record<string, Record<string, number>>;
  listing_gap_vs_optimal: Record<string, number>;
}

export interface ListingOpportunity {
  retailer: string;
  recommended_sku: string;
  estimated_uplift_pct: number;
  priority: "High" | "Medium" | "Low";
  rationale: string;
}

export interface CrossRetailerComparison {
  retailers: string[];
  metric: string;
  values: number[];
}

export interface RetailerAnalytics {
  category: string;
  sub_category: string;
  generated_at: string;
  retailers: Record<string, RetailerData>;
  listing_opportunities: ListingOpportunity[];
  cross_retailer_comparisons: CrossRetailerComparison[];
}

// ============= Constants =============
export const SEGMENTS = [
  "Premium Craft Enthusiasts",
  "Mainstream Family Buyers",
  "Value-Driven Households",
  "Social Party Hosts",
  "Traditional Real Ale Fans",
  "Student Budget Shoppers",
  "Convenience On-The-Go",
  "Occasional Special Buyers",
  "Health-Conscious Moderates",
  "Sports & Social Drinkers"
] as const;

export const OCCASIONS = [
  "Weeknight unwind",
  "House party",
  "Family meal",
  "Barbecue",
  "Movie night",
  "Watching sport",
  "Picnic",
  "Celebration at home",
  "Weekend stock-up",
  "Having friends over"
] as const;

export const BRANDS = [
  "Premium Craft Co",
  "Traditional Ales Ltd",
  "Heritage Beer Co",
  "Value Lager Brewing",
  "Others"
] as const;

// Brand color mapping for visual consistency
export const BRAND_COLORS: Record<string, string> = {
  "Premium Craft Co": "#498BFF",
  "Traditional Ales Ltd": "#6b7280",
  "Heritage Beer Co": "#9ca3af",
  "Value Lager Brewing": "#d1d5db",
  "Others": "#e5e7eb"
};

// Type aliases for convenience
export type Segment = typeof SEGMENTS[number];
export type Occasion = typeof OCCASIONS[number];
export type Brand = typeof BRANDS[number];
export type MeasureType = "choice_share" | "shelf_share" | "shelf_efficiency" | "optimization_potential" | "usage_occasions";

// Color map for usage occasions (exact colors from codebase)
export const OCCASION_COLORS: Record<string, string> = {
  "Weeknight unwind": "#498BFF",       // Bright blue
  "House party": "#F2994A",            // Orange
  "Family meal": "#6B7280",            // Medium gray
  "Barbecue": "#FB923C",               // Light orange
  "Movie night": "#1E40AF",            // Dark blue
  "Watching sport": "#4B5563",         // Dark gray
  "Picnic": "#1ED59B",                 // Bright teal/green
  "Celebration at home": "#D1D5DB",    // Light gray
  "Weekend stock-up": "#6B7280",       // Medium gray
  "Having friends over": "#10B981"     // Emerald green
};

// Segment-to-Occasion baseline mapping (GLOBAL and STABLE)
// Each segment has realistic preferences across ALL occasions, totaling 100%
// Reflects winter/fall seasonality (Oct-Nov): lower barbecue/picnic, higher indoor occasions
// These are GLOBAL baselines - they do NOT vary by store
// Variation comes from WHICH segments are in each store's customerProfile
export const SEGMENT_OCCASION_BASELINE: Record<Segment, Record<Occasion, number>> = {
  "Premium Craft Enthusiasts": {
    "Weeknight unwind": 16,          // Moderate - more social/special drinking
    "House party": 8,
    "Family meal": 6,
    "Barbecue": 7,
    "Movie night": 11,               // Social entertainment
    "Watching sport": 8,
    "Picnic": 5,
    "Celebration at home": 18,       // Special occasions with craft beer
    "Weekend stock-up": 7,
    "Having friends over": 14        // Entertaining guests
  },
  "Mainstream Family Buyers": {
    "Weeknight unwind": 7,
    "House party": 5,
    "Family meal": 27,               // Dominant - family dinners
    "Barbecue": 8,
    "Movie night": 17,               // Family entertainment
    "Watching sport": 9,
    "Picnic": 4,
    "Celebration at home": 10,
    "Weekend stock-up": 11,          // Practical bulk buying
    "Having friends over": 2
  },
  "Value-Driven Households": {
    "Weeknight unwind": 10,
    "House party": 4,
    "Family meal": 11,
    "Barbecue": 5,
    "Movie night": 9,
    "Watching sport": 10,
    "Picnic": 3,
    "Celebration at home": 6,
    "Weekend stock-up": 26,          // Dominant - bulk buying for value
    "Having friends over": 16        // Affordable entertaining
  },
  "Social Party Hosts": {
    "Weeknight unwind": 9,
    "House party": 26,               // Dominant - hosting parties
    "Family meal": 5,
    "Barbecue": 10,
    "Movie night": 8,
    "Watching sport": 7,
    "Picnic": 5,
    "Celebration at home": 15,       // Celebrating at home
    "Weekend stock-up": 5,
    "Having friends over": 10
  },
  "Traditional Real Ale Fans": {
    "Weeknight unwind": 20,          // Habitual but not dominant
    "House party": 4,
    "Family meal": 12,               // Weekend/mealtime patterns
    "Barbecue": 6,
    "Movie night": 7,
    "Watching sport": 19,            // Sports at the pub
    "Picnic": 3,
    "Celebration at home": 8,
    "Weekend stock-up": 13,          // Habitual weekend buying
    "Having friends over": 8
  },
  "Student Budget Shoppers": {
    "Weeknight unwind": 5,
    "House party": 30,               // Dominant - student parties
    "Family meal": 3,
    "Barbecue": 5,
    "Movie night": 13,
    "Watching sport": 14,            // Social sports events
    "Picnic": 3,
    "Celebration at home": 4,
    "Weekend stock-up": 16,          // Budget buying
    "Having friends over": 7
  },
  "Convenience On-The-Go": {
    "Weeknight unwind": 28,          // Dominant - grab and go after work
    "House party": 6,
    "Family meal": 4,
    "Barbecue": 3,
    "Movie night": 7,
    "Watching sport": 13,
    "Picnic": 2,
    "Celebration at home": 5,
    "Weekend stock-up": 6,
    "Having friends over": 26        // Last-minute social
  },
  "Occasional Special Buyers": {
    "Weeknight unwind": 9,
    "House party": 9,
    "Family meal": 10,
    "Barbecue": 8,
    "Movie night": 11,
    "Watching sport": 6,
    "Picnic": 6,
    "Celebration at home": 25,       // Dominant - special occasions only
    "Weekend stock-up": 4,
    "Having friends over": 12
  },
  "Health-Conscious Moderates": {
    "Weeknight unwind": 17,
    "House party": 5,
    "Family meal": 19,               // Healthy family eating
    "Barbecue": 7,
    "Movie night": 14,
    "Watching sport": 6,
    "Picnic": 10,                    // Outdoor activities
    "Celebration at home": 11,
    "Weekend stock-up": 8,
    "Having friends over": 3
  },
  "Sports & Social Drinkers": {
    "Weeknight unwind": 5,
    "House party": 15,               // Social events
    "Family meal": 5,
    "Barbecue": 9,
    "Movie night": 7,
    "Watching sport": 28,            // Dominant - watching sports
    "Picnic": 4,
    "Celebration at home": 7,
    "Weekend stock-up": 9,
    "Having friends over": 11
  }
};
