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
  sku_range: "Limited (500-2k)" | "Full (8k+)" | "Expanded (25-70k)";
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
  available_stores: string[]; // store_id[]
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
export type MeasureType = "choice_share" | "shelf_share" | "shelf_efficiency" | "optimization_potential";
