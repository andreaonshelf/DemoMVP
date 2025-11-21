// Data loading utilities for OnShelf demo data
// Optimized with lookup maps for O(1) access

import storesData from '@/data/stores.json';
import categoryPerfData from '@/data/category-performance.json';
import shopperRespData from '@/data/shopper-responses.json';
import retailerAnalyticsData from '@/data/retailer-analytics.json';

import type {
  StoresData,
  CategoryPerformance,
  ShopperResponses,
  RetailerAnalytics,
  Store,
  StorePerformance,
  SKU,
  MeasureType,
  Segment,
  Occasion
} from '@/types/demo-data';

// Type assertions (Next.js json imports are typed as 'any')
const stores = storesData as unknown as Store[];
const categoryPerf = categoryPerfData as unknown as CategoryPerformance;
const shopperResp = shopperRespData as unknown as ShopperResponses;
const retailerAnalytics = retailerAnalyticsData as unknown as RetailerAnalytics;

// ============= LOOKUP MAPS FOR O(1) ACCESS =============

// Store lookup by ID
const storeById = new Map<string, Store>(
  stores.map(s => [s.store_id, s])
);

// Performance lookup by store ID
const perfByStoreId = new Map<string, StorePerformance>(
  categoryPerf.stores.map(s => [s.store_id, s])
);

// SKU lookup by ID
const skuById = new Map<string, SKU>(
  shopperResp.skus.map(s => [s.sku_id, s])
);

// Retailer lookup by name
const retailerByName = new Map<string, any>(
  Object.entries(retailerAnalytics.retailers)
);

// ============= STORE DATA ACCESS =============

/**
 * Get store by ID
 */
export function getStore(storeId: string): Store | undefined {
  return storeById.get(storeId);
}

/**
 * Get all stores (for StoreSelector dropdown and Overview grid)
 */
export function getAllStores(): Store[] {
  return stores;
}

/**
 * Get unique retailers from stores
 */
export function getUniqueRetailers(): string[] {
  return Array.from(new Set(stores.map(s => s.retailer))).sort();
}

/**
 * Get unique formats from stores
 */
export function getUniqueFormats(): string[] {
  return Array.from(new Set(stores.map(s => s.format))).sort();
}

/**
 * Get unique regions from stores
 */
export function getUniqueRegions(): string[] {
  return Array.from(new Set(stores.map(s => s.region_group))).sort();
}

/**
 * Get unique missions from stores
 */
export function getUniqueMissions(): string[] {
  const missionsSet = new Set<string>();
  stores.forEach(store => {
    store.missions.forEach(mission => missionsSet.add(mission));
  });
  return Array.from(missionsSet).sort();
}

// ============= PERFORMANCE DATA ACCESS =============

/**
 * Get store performance data
 */
export function getStorePerformance(storeId: string): StorePerformance | undefined {
  return perfByStoreId.get(storeId);
}

/**
 * Get measure value with optional segment/occasion filtering
 *
 * @param storeId - Store ID
 * @param measureType - choice_share, shelf_share, shelf_efficiency, optimization_potential
 * @param segmentFilter - Optional segment filter
 * @param occasionFilter - Optional occasion filter
 * @returns Brand -> value mapping
 */
export function getMeasureValue(
  storeId: string,
  measureType: MeasureType,
  segmentFilter?: Segment | null,
  occasionFilter?: Occasion | null
): Record<string, number> {
  const storePerf = perfByStoreId.get(storeId);
  if (!storePerf) return {};

  // Base case: aggregate (no breakdowns)
  if (!segmentFilter && !occasionFilter) {
    return storePerf[measureType];
  }

  // Segment breakdown only
  if (segmentFilter && !occasionFilter) {
    // Only choice_share has segment breakdowns
    if (measureType === "choice_share") {
      return storePerf.choice_share_by_segment?.[segmentFilter] || storePerf.choice_share;
    }
    // For other measures, return aggregate
    return storePerf[measureType];
  }

  // Occasion breakdown only
  if (!segmentFilter && occasionFilter) {
    // Only choice_share has occasion breakdowns
    if (measureType === "choice_share") {
      return storePerf.choice_share_by_occasion?.[occasionFilter] || storePerf.choice_share;
    }
    // For other measures, return aggregate
    return storePerf[measureType];
  }

  // Both filters active (future enhancement)
  // For MVP: segment takes precedence
  if (segmentFilter && occasionFilter) {
    if (measureType === "choice_share") {
      return storePerf.choice_share_by_segment?.[segmentFilter] || storePerf.choice_share;
    }
    return storePerf[measureType];
  }

  return {};
}

/**
 * Get usage occasion demand vs coverage
 * (Used in UsageOccasionChart)
 */
export function getUsageOccasionData(
  storeId: string
): Array<{ label: string; demand: number; coverage: number }> {
  const storePerf = perfByStoreId.get(storeId);
  if (!storePerf) return [];

  // Calculate demand from occasion breakdown
  const occasions = storePerf.choice_share_by_occasion || {};

  return Object.keys(occasions).map(occasion => {
    const brandShares = occasions[occasion];

    // "Demand" = total choice share for occasion (sum of all brands)
    const demand = Object.values(brandShares).reduce((sum, val) => sum + val, 0);

    // "Coverage" = how well we're covering this occasion with current SKUs
    // For demo purposes, add some variance to make it interesting
    // In reality, this would come from SKU availability data
    const variance = 0.7 + (Math.random() * 0.5); // 0.7 to 1.2
    const coverage = demand * variance;

    return {
      label: occasion,
      demand: Math.round(demand),
      coverage: Math.round(coverage)
    };
  });
}

/**
 * Get catchment segment data for a store
 */
export function getCatchmentSegments(storeId: string): Array<{ segment: string; percentage: number }> {
  const store = storeById.get(storeId);
  if (!store) return [];
  return store.catchmentPopulation.demographics;
}

/**
 * Get nearby competitors for a store
 */
export function getNearbyCompetitors(storeId: string): Array<{
  store_id: string;
  retailer: string;
  banner: string;
  distance_meters: number;
}> {
  const storePerf = perfByStoreId.get(storeId);
  if (!storePerf) return [];
  return storePerf.competitive_context.nearby_competitors;
}

// ============= SKU DATA ACCESS =============

/**
 * Get all SKUs
 */
export function getAllSKUs(): SKU[] {
  return shopperResp.skus;
}

/**
 * Get SKU by ID
 */
export function getSKU(skuId: string): SKU | undefined {
  return skuById.get(skuId);
}

/**
 * Get SKUs filtered by brand
 */
export function getSKUsByBrand(brand: string): SKU[] {
  return shopperResp.skus.filter(sku => sku.brand === brand);
}

/**
 * Get SKUs available in a specific store
 */
export function getSKUsAvailableInStore(storeId: string): SKU[] {
  return shopperResp.skus.filter(sku => sku.available_stores.includes(storeId));
}

/**
 * Get unique brands from SKUs
 */
export function getUniqueSKUBrands(): string[] {
  return Array.from(new Set(shopperResp.skus.map(s => s.brand))).sort();
}

// ============= RETAILER ANALYTICS ACCESS =============

/**
 * Get retailer analytics
 */
export function getRetailerAnalytics() {
  return retailerAnalytics;
}

/**
 * Get all retailers
 */
export function getAllRetailers(): string[] {
  return Object.keys(retailerAnalytics.retailers).sort();
}

/**
 * Get retailer data by name
 */
export function getRetailerData(retailerName: string) {
  return retailerByName.get(retailerName);
}

/**
 * Get listing opportunities (sorted by priority)
 */
export function getListingOpportunities(priorityFilter?: "High" | "Medium" | "Low") {
  let opportunities = retailerAnalytics.listing_opportunities;

  if (priorityFilter) {
    opportunities = opportunities.filter(opp => opp.priority === priorityFilter);
  }

  // Sort by priority (High > Medium > Low) then by uplift
  const priorityOrder = { "High": 1, "Medium": 2, "Low": 3 };
  return opportunities.sort((a, b) => {
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.estimated_uplift_pct - a.estimated_uplift_pct;
  });
}

/**
 * Get cross-retailer comparisons for specific metric
 */
export function getCrossRetailerComparisons(metric?: string) {
  if (!metric) {
    return retailerAnalytics.cross_retailer_comparisons;
  }
  return retailerAnalytics.cross_retailer_comparisons.filter(comp =>
    comp.metric.toLowerCase().includes(metric.toLowerCase())
  );
}

// ============= EXPORT RAW DATA (for advanced use) =============

export const rawData = {
  stores,
  categoryPerf,
  shopperResp,
  retailerAnalytics
};
