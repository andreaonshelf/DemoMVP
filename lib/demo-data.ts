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

import { SEGMENT_OCCASION_BASELINE, OCCASIONS } from '@/types/demo-data';

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
 * Detect demographic environment tags from store data
 */
function detectDemographicTags(store: Store): string[] {
  const tags: string[] = [];

  // Student-heavy: age 18-24 >= 18%
  const age1824 = store.catchmentPopulation.ageDistribution.find(a => a.range === "18-24");
  if (age1824 && age1824.percentage >= 18) {
    tags.push("student-heavy");
  }

  // Affluent: High + Very High income >= 35%
  const highIncome = store.catchmentPopulation.incomeLevels
    .filter(i => i.level.includes("High"))
    .reduce((sum, i) => sum + i.percentage, 0);
  if (highIncome >= 35) {
    tags.push("affluent");
  }

  // Low-income: Low income >= 35%
  const lowIncome = store.catchmentPopulation.incomeLevels.find(i => i.level.includes("Low"));
  if (lowIncome && lowIncome.percentage >= 35) {
    tags.push("low-income");
  }

  // Family-heavy: age 25-34 + 35-44 >= 28%
  const familyAge = store.catchmentPopulation.ageDistribution
    .filter(a => a.range === "25-34" || a.range === "35-44")
    .reduce((sum, a) => sum + a.percentage, 0);
  if (familyAge >= 28) {
    tags.push("family-heavy");
  }

  // Older: age 55-64 + 65+ >= 25%
  const olderAge = store.catchmentPopulation.ageDistribution
    .filter(a => a.range === "55-64" || a.range === "65+")
    .reduce((sum, a) => sum + a.percentage, 0);
  if (olderAge >= 25) {
    tags.push("older");
  }

  return tags;
}

/**
 * Apply demographic tilts to segment-occasion baselines
 */
function applyDemographicTilts(
  store: Store,
  baselines: Record<Segment, Record<Occasion, number>>
): Record<Segment, Record<Occasion, number>> {
  const tags = detectDemographicTags(store);
  const locationType = store.location_type;

  // Create tilted copy (never mutate baselines)
  const tilted: Record<Segment, Record<Occasion, number>> = {} as any;

  // For each segment
  (Object.keys(baselines) as Segment[]).forEach(segment => {
    // Start with baseline
    const temp: Record<Occasion, number> = {} as any;
    OCCASIONS.forEach(occasion => {
      temp[occasion] = baselines[segment][occasion];
    });

    // Apply tilts from all applicable tags
    tags.forEach(tag => {
      if (tag === "student-heavy") {
        if (segment === "Student Budget Shoppers") {
          temp["House party"] = Math.min(40, temp["House party"] + 5);
          temp["Watching sport"] = Math.min(40, temp["Watching sport"] + 3);
          temp["Weekend stock-up"] = Math.min(40, temp["Weekend stock-up"] + 2);
        } else if (segment === "Social Party Hosts") {
          temp["House party"] = Math.min(40, temp["House party"] + 2);
        } else if (segment === "Premium Craft Enthusiasts") {
          temp["House party"] = Math.min(40, temp["House party"] + 1);
        } else if (segment === "Convenience On-The-Go") {
          temp["Having friends over"] = Math.min(40, temp["Having friends over"] + 2);
        }
      }

      if (tag === "affluent") {
        if (segment === "Premium Craft Enthusiasts") {
          temp["Celebration at home"] = Math.min(40, temp["Celebration at home"] + 3);
          temp["Having friends over"] = Math.min(40, temp["Having friends over"] + 2);
        } else if (segment === "Health-Conscious Moderates") {
          temp["Celebration at home"] = Math.min(40, temp["Celebration at home"] + 2);
          temp["Picnic"] = Math.min(40, temp["Picnic"] + 1);
        } else if (segment === "Occasional Special Buyers") {
          temp["Celebration at home"] = Math.min(40, temp["Celebration at home"] + 2);
        }
      }

      if (tag === "low-income") {
        if (segment === "Value-Driven Households") {
          temp["Weekend stock-up"] = Math.min(40, temp["Weekend stock-up"] + 4);
          temp["Having friends over"] = Math.min(40, temp["Having friends over"] + 2);
        } else if (segment === "Student Budget Shoppers") {
          temp["Weekend stock-up"] = Math.min(40, temp["Weekend stock-up"] + 3);
        } else if (segment === "Mainstream Family Buyers") {
          temp["Weekend stock-up"] = Math.min(40, temp["Weekend stock-up"] + 2);
        }
      }

      if (tag === "family-heavy") {
        if (segment === "Mainstream Family Buyers") {
          temp["Family meal"] = Math.min(40, temp["Family meal"] + 4);
          temp["Movie night"] = Math.min(40, temp["Movie night"] + 3);
        } else if (segment === "Health-Conscious Moderates") {
          temp["Family meal"] = Math.min(40, temp["Family meal"] + 2);
        } else if (segment === "Value-Driven Households") {
          temp["Weekend stock-up"] = Math.min(40, temp["Weekend stock-up"] + 2);
        }
      }

      if (tag === "older") {
        if (segment === "Traditional Real Ale Fans") {
          temp["Weeknight unwind"] = Math.min(40, temp["Weeknight unwind"] + 3);
          temp["Family meal"] = Math.min(40, temp["Family meal"] + 2);
        } else if (segment === "Health-Conscious Moderates") {
          temp["Family meal"] = Math.min(40, temp["Family meal"] + 2);
          temp["Weeknight unwind"] = Math.min(40, temp["Weeknight unwind"] + 1);
        }
      }
    });

    // Apply location type tilts
    if (locationType === "Urban") {
      if (segment === "Convenience On-The-Go") {
        temp["Weeknight unwind"] = Math.min(40, temp["Weeknight unwind"] + 3);
        temp["Having friends over"] = Math.min(40, temp["Having friends over"] + 2);
      } else if (segment === "Premium Craft Enthusiasts") {
        temp["Having friends over"] = Math.min(40, temp["Having friends over"] + 1);
      }
    } else if (locationType === "Suburban") {
      if (segment === "Mainstream Family Buyers") {
        temp["Family meal"] = Math.min(40, temp["Family meal"] + 2);
        temp["Weekend stock-up"] = Math.min(40, temp["Weekend stock-up"] + 1);
      } else if (segment === "Health-Conscious Moderates") {
        temp["Family meal"] = Math.min(40, temp["Family meal"] + 1);
      }
    } else if (locationType === "Retail park") {
      if (segment === "Value-Driven Households") {
        temp["Weekend stock-up"] = Math.min(40, temp["Weekend stock-up"] + 3);
      } else if (segment === "Mainstream Family Buyers") {
        temp["Weekend stock-up"] = Math.min(40, temp["Weekend stock-up"] + 2);
      }
    } else if (locationType === "Forecourt") {
      if (segment === "Convenience On-The-Go") {
        temp["Weeknight unwind"] = Math.min(40, temp["Weeknight unwind"] + 4);
        temp["Having friends over"] = Math.min(40, temp["Having friends over"] + 2);
      }
    } else if (locationType === "Travel hub") {
      if (segment === "Convenience On-The-Go") {
        temp["Weeknight unwind"] = Math.min(40, temp["Weeknight unwind"] + 3);
      } else if (segment === "Student Budget Shoppers") {
        temp["Having friends over"] = Math.min(40, temp["Having friends over"] + 1);
      }
    }

    // Renormalize to 100%
    const total = OCCASIONS.reduce((sum, occ) => sum + temp[occ], 0);
    tilted[segment] = {} as any;
    OCCASIONS.forEach(occasion => {
      tilted[segment][occasion] = (temp[occasion] / total) * 100;
    });
  });

  return tilted;
}

/**
 * Get usage occasion demand vs coverage
 * (Used in UsageOccasionChart)
 *
 * DEMAND: What usage occasions does the catchment population need?
 * - Based on store's customerProfile (retailer-adjusted segments) × tilted occasion baselines
 *
 * COVERAGE: What usage occasions does the current assortment serve?
 * - Based on SKU availability per occasion
 */
export function getUsageOccasionData(
  storeId: string
): Array<{ label: string; demand: number; coverage: number }> {
  const store = storeById.get(storeId);
  const storePerf = perfByStoreId.get(storeId);
  if (!store || !storePerf) return [];

  // STEP 1: Apply demographic tilts to global baselines for this store
  const tiltedBaselines = applyDemographicTilts(store, SEGMENT_OCCASION_BASELINE);

  // STEP 2: Calculate DEMAND based on customerProfile (beer buyer segments)
  // CRITICAL: Use customerProfile, NOT catchmentPopulation.demographics (household types)
  const demandByOccasion: Record<string, number> = {};
  OCCASIONS.forEach(occasion => {
    demandByOccasion[occasion] = 0;
  });

  // Use customerProfile (the 10 beer buyer segments)
  const customerProfile = store.catchmentPopulation.customerProfile;
  if (!customerProfile) {
    console.warn(`Store ${storeId} missing customerProfile - using demographics fallback`);
    return [];
  }

  // For each segment in the customer profile
  customerProfile.forEach(demo => {
    const segmentName = demo.segment as Segment;
    const segmentPercentage = demo.percentage;

    // Get this segment's tilted occasion distribution
    const occasionDist = tiltedBaselines[segmentName];
    if (!occasionDist) return;

    // Contribute to each occasion based on segment % × tilted occasion %
    Object.entries(occasionDist).forEach(([occasion, percentage]) => {
      demandByOccasion[occasion] += (segmentPercentage * percentage) / 100;
    });
  });

  // STEP 2: Calculate COVERAGE from SKU availability
  // Coverage = how well the store's assortment serves each occasion
  const coverageByOccasion: Record<string, number> = {};

  // Get all SKUs and filter for this store
  const allSKUs = shopperResp.skus;
  const storeAvailableSKUs = allSKUs.filter(sku =>
    sku.available_in_stores?.includes(storeId)
  );

  // For each occasion, calculate total potential (all SKUs) and store coverage (available SKUs)
  OCCASIONS.forEach(occasion => {
    // Total potential = sum of all SKUs' occasion_choice_share for this occasion
    const totalPotential = allSKUs.reduce((sum, sku) => {
      return sum + (sku.occasion_choice_share[occasion] || 0);
    }, 0);

    // Store coverage = sum of available SKUs' occasion_choice_share for this occasion
    const storeCoverage = storeAvailableSKUs.reduce((sum, sku) => {
      return sum + (sku.occasion_choice_share[occasion] || 0);
    }, 0);

    // Coverage percentage = (store coverage / total potential) × 100
    coverageByOccasion[occasion] = totalPotential > 0
      ? (storeCoverage / totalPotential) * 100
      : 0;
  });

  // STEP 3: Combine demand and coverage
  return OCCASIONS.map(occasion => {
    return {
      label: occasion,
      demand: Math.round(demandByOccasion[occasion] || 0),
      coverage: Math.round(coverageByOccasion[occasion] || 0)
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
  return shopperResp.skus.filter(sku => sku.available_in_stores.includes(storeId));
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
