#!/usr/bin/env node

/**
 * Generate occasion coverage and gap analysis from store assortments
 *
 * Formula:
 * - Coverage: Σ(sku.occasion_choice_share) normalized to 100%
 * - Gap: demand - coverage (from usage occasions data)
 *
 * Output: data/occasion-gaps.json
 */

const fs = require('fs');
const path = require('path');
const { OCCASIONS, SEGMENTS, calculateDemand } = require('./occasion-utils');

// ============= LOAD DATA =============
const stores = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/stores.json'), 'utf-8'));
const assortmentData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/store-assortments-template-based.json'), 'utf-8'));
const shopperData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/shopper-responses.json'), 'utf-8'));
const categoryPerfData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/category-performance.json'), 'utf-8'));

const assortments = assortmentData.assortments;
const skus = shopperData.skus;

console.log(`Loaded ${stores.length} stores, ${assortments.length} assortments, ${skus.length} SKUs`);

// ============= CONSTANTS =============
const BRANDS = [
  "Premium Craft Co",
  "Traditional Ales Ltd",
  "Heritage Beer Co",
  "Value Lager Brewing",
  "Others"
];

// Segment-to-Occasion baseline (from types/demo-data.ts)
const SEGMENT_OCCASION_BASELINE = {
  "Premium Craft Enthusiasts": {
    "Weeknight unwind": 16,
    "House party": 8,
    "Family meal": 6,
    "Barbecue": 7,
    "Movie night": 11,
    "Watching sport": 8,
    "Picnic": 5,
    "Celebration at home": 18,
    "Weekend stock-up": 7,
    "Having friends over": 14
  },
  "Mainstream Family Buyers": {
    "Weeknight unwind": 7,
    "House party": 5,
    "Family meal": 27,
    "Barbecue": 8,
    "Movie night": 17,
    "Watching sport": 9,
    "Picnic": 4,
    "Celebration at home": 10,
    "Weekend stock-up": 11,
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
    "Weekend stock-up": 26,
    "Having friends over": 16
  },
  "Social Party Hosts": {
    "Weeknight unwind": 9,
    "House party": 26,
    "Family meal": 5,
    "Barbecue": 10,
    "Movie night": 8,
    "Watching sport": 7,
    "Picnic": 5,
    "Celebration at home": 15,
    "Weekend stock-up": 5,
    "Having friends over": 10
  },
  "Traditional Real Ale Fans": {
    "Weeknight unwind": 20,
    "House party": 4,
    "Family meal": 12,
    "Barbecue": 6,
    "Movie night": 7,
    "Watching sport": 19,
    "Picnic": 3,
    "Celebration at home": 8,
    "Weekend stock-up": 13,
    "Having friends over": 8
  },
  "Student Budget Shoppers": {
    "Weeknight unwind": 5,
    "House party": 30,
    "Family meal": 3,
    "Barbecue": 5,
    "Movie night": 13,
    "Watching sport": 14,
    "Picnic": 3,
    "Celebration at home": 4,
    "Weekend stock-up": 16,
    "Having friends over": 7
  },
  "Convenience On-The-Go": {
    "Weeknight unwind": 28,
    "House party": 6,
    "Family meal": 4,
    "Barbecue": 3,
    "Movie night": 7,
    "Watching sport": 13,
    "Picnic": 2,
    "Celebration at home": 5,
    "Weekend stock-up": 6,
    "Having friends over": 26
  },
  "Occasional Special Buyers": {
    "Weeknight unwind": 9,
    "House party": 9,
    "Family meal": 10,
    "Barbecue": 8,
    "Movie night": 11,
    "Watching sport": 6,
    "Picnic": 6,
    "Celebration at home": 25,
    "Weekend stock-up": 4,
    "Having friends over": 12
  },
  "Health-Conscious Moderates": {
    "Weeknight unwind": 17,
    "House party": 5,
    "Family meal": 19,
    "Barbecue": 7,
    "Movie night": 14,
    "Watching sport": 6,
    "Picnic": 10,
    "Celebration at home": 11,
    "Weekend stock-up": 8,
    "Having friends over": 3
  },
  "Sports & Social Drinkers": {
    "Weeknight unwind": 5,
    "House party": 15,
    "Family meal": 5,
    "Barbecue": 9,
    "Movie night": 7,
    "Watching sport": 28,
    "Picnic": 4,
    "Celebration at home": 7,
    "Weekend stock-up": 9,
    "Having friends over": 11
  }
};

// ============= HELPER FUNCTIONS =============

/**
 * Hash a string to a number for seeded randomness
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator
 */
function seededRandom(seed) {
  let state = seed;
  return function() {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Detect demographic tags for a store (same as assortment script)
 */
function detectDemographicTags(store) {
  const tags = [];

  const highIncome = store.catchmentPopulation.incomeLevels
    .filter(i => i.level.includes("High"))
    .reduce((sum, i) => sum + i.percentage, 0);
  if (highIncome >= 35) {
    tags.push("affluent");
  }

  const age1824 = store.catchmentPopulation.ageDistribution.find(a => a.range === "18-24");
  if (age1824 && age1824.percentage >= 20) {
    tags.push("student-heavy");
  }

  const age2544 = store.catchmentPopulation.ageDistribution.find(a => a.range === "25-44");
  if (age2544 && age2544.percentage >= 28) {
    tags.push("family-heavy");
  }

  if (store.location_type === "Suburban") {
    tags.push("suburban");
  }
  if (store.location_type === "Rural") {
    tags.push("rural");
  }

  return tags;
}

/**
 * Apply demographic tilts to segment-occasion baselines (from lib/demo-data.ts)
 */
function applyDemographicTilts(store, baselines) {
  const tags = detectDemographicTags(store);
  const tilted = {};

  SEGMENTS.forEach(segment => {
    const temp = {};
    OCCASIONS.forEach(occasion => {
      temp[occasion] = baselines[segment][occasion];
    });

    // Apply tilts
    tags.forEach(tag => {
      if (tag === "student-heavy" && segment === "Student Budget Shoppers") {
        temp["House party"] = Math.min(40, temp["House party"] + 5);
        temp["Watching sport"] = Math.min(40, temp["Watching sport"] + 3);
      }
      if (tag === "affluent" && segment === "Premium Craft Enthusiasts") {
        temp["Celebration at home"] = Math.min(40, temp["Celebration at home"] + 4);
        temp["Having friends over"] = Math.min(40, temp["Having friends over"] + 3);
      }
      if (tag === "family-heavy" && segment === "Mainstream Family Buyers") {
        temp["Family meal"] = Math.min(40, temp["Family meal"] + 5);
        temp["Movie night"] = Math.min(40, temp["Movie night"] + 2);
      }
      if ((tag === "suburban" || tag === "rural") && segment === "Value-Driven Households") {
        temp["Weekend stock-up"] = Math.min(40, temp["Weekend stock-up"] + 3);
      }
    });

    // Renormalize
    const total = OCCASIONS.reduce((sum, occ) => sum + temp[occ], 0);
    tilted[segment] = {};
    OCCASIONS.forEach(occasion => {
      tilted[segment][occasion] = (temp[occasion] / total) * 100;
    });
  });

  return tilted;
}

/**
 * Get number of occasions a store format is expected to serve well
 * Smaller formats focus on fewer core occasions
 */
function getExpectedOccasionFocus(store) {
  const format = store.format;
  const size = store.store_size;

  // Define how many occasions each format should focus on
  if (format === "Convenience" || format === "Forecourt") {
    return 4; // Focus on top 4 occasions only
  } else if (format === "Supermarket" && size === "Small") {
    return 6; // Mid-range focus
  } else if (format === "Supermarket" && (size === "Medium" || size === "Large")) {
    return 8; // Broader coverage
  } else if (format === "Hypermarket" || size === "XL") {
    return 10; // Full coverage expected
  }

  return 6; // Default mid-range
}

/**
 * Generate assortment quality profile for a store
 * Quality multiplier per occasion (0.7-1.3) reflecting how well SKUs match demand
 *
 * Logic:
 * - Base quality varies by retailer/format (some bias but small)
 * - Random variation creates diversity within same retailer
 * - No systematic penalty for small formats
 */
function generateAssortmentQuality(store, demand) {
  const quality = {};

  // Seeded random for consistency
  const storeHash = hashCode(store.store_id);
  const random = seededRandom(storeHash);

  // Sort occasions by demand (descending)
  const demandRanked = OCCASIONS.map(occ => ({ occasion: occ, demand: demand[occ] }))
    .sort((a, b) => b.demand - a.demand);

  const expectedFocus = getExpectedOccasionFocus(store);

  OCCASIONS.forEach((occasion, idx) => {
    const demandRank = demandRanked.findIndex(d => d.occasion === occasion) + 1;

    // Base quality mean (no retailer bias - all stores start equal)
    let qualityMean = 1.0;

    // Slight boost for core occasions, slight penalty for non-core
    if (demandRank <= expectedFocus) {
      qualityMean = 1.0; // Core occasions
    } else {
      qualityMean = 0.95; // Non-core occasions (minor penalty)
    }

    // VERY large random variation (0.5-1.5) - completely dominates any underlying bias
    // This is necessary because the assortment data itself has retailer bias baked in
    const randomNoise = 0.5 + random() * 1.0; // 0.5 to 1.5

    // Quality is ENTIRELY driven by random variation
    quality[occasion] = randomNoise;

    // Clamp to extreme range (0.5 - 1.5) to override assortment generation bias
    quality[occasion] = Math.max(0.5, Math.min(1.5, quality[occasion]));
  });

  return quality;
}

// calculateDemand is now imported from occasion-utils.js
// It includes format modulation (Discounter +30% stock-up, Hypermarket +20% family, Convenience +30% quick)
// and uses the fixed v2 segment-occasion baselines

/**
 * Calculate coverage (assortment-weighted sum of SKU occasion choice shares)
 * NO quality multipliers - coverage shape now comes directly from assortment SKU selection
 */
function calculateCoverage(store, assortment, demand) {
  const rawCoverage = {};

  OCCASIONS.forEach(occasion => {
    let sum = 0;
    assortment.sku_ids.forEach(skuId => {
      const sku = skus.find(s => s.sku_id === skuId);
      if (sku && sku.occasion_choice_share) {
        sum += sku.occasion_choice_share[occasion] || 0;
      }
    });
    rawCoverage[occasion] = sum;
  });

  // Normalize to 100%
  const total = OCCASIONS.reduce((sum, occ) => sum + rawCoverage[occ], 0);
  const coverage = {};
  OCCASIONS.forEach(occasion => {
    coverage[occasion] = total > 0 ? (rawCoverage[occasion] / total) * 100 : 0;
  });

  return coverage;
}

/**
 * Calculate gap (demand - coverage) with format-appropriate weighting
 * Smaller formats are only evaluated on their core occasions
 */
function calculateGap(demand, coverage, store) {
  const gap = {};

  // Get expected occasion focus for this store
  const expectedFocus = getExpectedOccasionFocus(store);

  // Rank occasions by demand
  const demandRanked = OCCASIONS.map(occ => ({ occasion: occ, demand: demand[occ] }))
    .sort((a, b) => b.demand - a.demand);

  OCCASIONS.forEach(occasion => {
    const demandRank = demandRanked.findIndex(d => d.occasion === occasion) + 1;
    const rawGap = demand[occasion] - coverage[occasion];

    // For occasions outside store's expected focus, down-weight the gap
    // (we don't expect small stores to cover all occasions)
    if (demandRank > expectedFocus) {
      // Non-core occasions: gaps count for less (30% weight)
      gap[occasion] = rawGap * 0.3;
    } else {
      // Core occasions: gaps count fully
      gap[occasion] = rawGap;
    }
  });

  return gap;
}

/**
 * Calculate brand-specific coverage (Layer 2)
 * For each brand, calculate coverage from only that brand's SKUs
 */
function calculateBrandCoverage(store, assortment) {
  const brandCoverage = {};

  BRANDS.forEach(brand => {
    const rawCoverage = {};

    OCCASIONS.forEach(occasion => {
      let sum = 0;
      assortment.sku_ids.forEach(skuId => {
        const sku = skus.find(s => s.sku_id === skuId);
        // Only include SKUs from this specific brand
        if (sku && sku.brand === brand && sku.occasion_choice_share) {
          sum += sku.occasion_choice_share[occasion] || 0;
        }
      });
      rawCoverage[occasion] = sum;
    });

    // Normalize to 100%
    const total = OCCASIONS.reduce((sum, occ) => sum + rawCoverage[occ], 0);
    brandCoverage[brand] = {};
    OCCASIONS.forEach(occasion => {
      brandCoverage[brand][occasion] = total > 0 ? (rawCoverage[occasion] / total) * 100 : 0;
    });
  });

  return brandCoverage;
}

/**
 * Calculate competitor coverage for each brand (Layer 2)
 * competitor_coverage[brand] = total_coverage - brand_coverage[brand]
 */
function calculateCompetitorCoverage(totalCoverage, brandCoverage) {
  const competitorCoverage = {};

  BRANDS.forEach(brand => {
    competitorCoverage[brand] = {};
    OCCASIONS.forEach(occasion => {
      competitorCoverage[brand][occasion] = totalCoverage[occasion] - brandCoverage[brand][occasion];
    });
  });

  return competitorCoverage;
}

// ============= LAYER 3: BRAND GROWTH ENGINE =============

/**
 * Calculate absolute brand coverage share (Layer 3)
 * Returns the % of total store coverage that each brand owns
 */
function calculateBrandCoverageShare(store, assortment) {
  const brandCoverageShare = {};

  // Calculate raw coverage totals
  let totalRawCoverage = 0;
  const brandRawCoverage = {};

  BRANDS.forEach(brand => {
    brandRawCoverage[brand] = 0;
  });

  assortment.sku_ids.forEach(skuId => {
    const sku = skus.find(s => s.sku_id === skuId);
    if (sku && sku.occasion_choice_share) {
      const skuTotal = OCCASIONS.reduce((sum, occ) => sum + (sku.occasion_choice_share[occ] || 0), 0);
      totalRawCoverage += skuTotal;
      brandRawCoverage[sku.brand] += skuTotal;
    }
  });

  // Calculate share as percentage
  BRANDS.forEach(brand => {
    brandCoverageShare[brand] = totalRawCoverage > 0
      ? (brandRawCoverage[brand] / totalRawCoverage) * 100
      : 0;
  });

  return brandCoverageShare;
}

/**
 * Calculate occasion opportunity scores per brand (Layer 3)
 * Higher score = better opportunity to gain choice share by filling this gap
 *
 * Formula: opportunity = gap * demand_size * (1 - brand_coverage_normalized)
 * - gap: how under-covered is this occasion
 * - demand_size: how important is this occasion to shoppers
 * - brand_coverage_normalized: how much does our brand already own (lower = more room to grow)
 */
function calculateOccasionOpportunities(demand, gap, brandCoverage, brandCoverageShare) {
  const opportunities = {};

  BRANDS.forEach(brand => {
    opportunities[brand] = {};

    OCCASIONS.forEach(occasion => {
      const gapValue = gap[occasion];
      const demandValue = demand[occasion];
      const brandCoverageNorm = brandCoverage[brand][occasion] / 100; // 0-1 scale

      // Only positive gaps are opportunities (under-coverage)
      // Negative gaps mean over-coverage (no opportunity)
      if (gapValue > 0) {
        // Opportunity increases with:
        // 1. Larger gap (more unmet demand)
        // 2. Larger demand (more shoppers care about this occasion)
        // 3. Lower brand coverage (more room for brand to grow)
        const opportunity = gapValue * demandValue * (1 - brandCoverageNorm);
        opportunities[brand][occasion] = Math.round(opportunity * 100) / 100;
      } else {
        opportunities[brand][occasion] = 0;
      }
    });
  });

  return opportunities;
}

/**
 * Calculate top opportunity occasions per brand (Layer 3)
 * Returns top 3 occasions ranked by opportunity score
 */
function getTopOpportunities(opportunities, brand) {
  const occasionScores = OCCASIONS.map(occ => ({
    occasion: occ,
    score: opportunities[brand][occ]
  }));

  return occasionScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(item => item.score > 0);
}

/**
 * Generate SKU recommendations per brand (Layer 3)
 * Recommends top 3 SKUs not in current assortment that would fill gaps
 */
function generateSKURecommendations(store, assortment, opportunities, brand) {
  const currentSKUs = new Set(assortment.sku_ids);
  const topOccasions = getTopOpportunities(opportunities, brand);

  if (topOccasions.length === 0) {
    return [];
  }

  // Find SKUs from this brand not in assortment
  const availableSKUs = skus.filter(sku =>
    sku.brand === brand && !currentSKUs.has(sku.sku_id)
  );

  // Score each SKU by how well it fills top opportunity occasions
  const skuScores = availableSKUs.map(sku => {
    let score = 0;
    topOccasions.forEach((oppOcc, idx) => {
      const occasionStrength = sku.occasion_choice_share?.[oppOcc.occasion] || 0;
      // Weight by opportunity rank (1st = 3x, 2nd = 2x, 3rd = 1x)
      const weight = 3 - idx;
      score += occasionStrength * oppOcc.score * weight;
    });

    return {
      sku_id: sku.sku_id,
      name: sku.name,
      score: Math.round(score * 100) / 100,
      top_occasions: topOccasions.map(o => o.occasion)
    };
  });

  // Return top 3 SKUs
  return skuScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(item => item.score > 0);
}

/**
 * Calculate expected choice share uplift (Layer 3)
 * Estimates choice share gain from optimal occasion alignment
 *
 * Uses existing optimization_potential from category-performance.json
 * Modifies it based on occasion misalignment score
 */
function calculateChoiceShareUplift(store, misalignmentScore, categoryPerfData) {
  const storePerfData = categoryPerfData.stores.find(s => s.store_id === store.store_id);
  if (!storePerfData) {
    return {};
  }

  const uplift = {};

  BRANDS.forEach(brand => {
    const baseOptimization = storePerfData.optimization_potential[brand] || 0;

    // Adjust based on misalignment:
    // High misalignment = lower achievable uplift (need to fix assortment first)
    // Low misalignment = higher achievable uplift (just need better SKUs)
    const misalignmentPenalty = Math.min(misalignmentScore / 50, 1); // 0-1 scale
    const adjustedUplift = baseOptimization * (1 - misalignmentPenalty * 0.3); // Max 30% penalty

    uplift[brand] = Math.round(adjustedUplift * 10) / 10;
  });

  return uplift;
}

// ============= MAIN GENERATION LOGIC =============

function generateOccasionGaps() {
  const results = [];

  stores.forEach((store, idx) => {
    const assortment = assortments.find(a => a.store_id === store.store_id);
    if (!assortment) {
      console.warn(`No assortment found for ${store.store_id}`);
      return;
    }

    const demand = calculateDemand(store);
    const coverage = calculateCoverage(store, assortment, demand);
    const gap = calculateGap(demand, coverage, store);

    // Layer 2: Brand-specific coverage
    const brandCoverage = calculateBrandCoverage(store, assortment);
    const competitorCoverage = calculateCompetitorCoverage(coverage, brandCoverage);

    // Calculate misalignment score
    const misalignment = OCCASIONS.reduce((sum, occ) => sum + Math.abs(gap[occ]), 0);

    // Layer 3: Brand growth engine
    const brandCoverageShare = calculateBrandCoverageShare(store, assortment);
    const opportunities = calculateOccasionOpportunities(demand, gap, brandCoverage, brandCoverageShare);
    const choiceShareUplift = calculateChoiceShareUplift(store, misalignment, categoryPerfData);

    // Generate SKU recommendations per brand
    const skuRecommendations = {};
    BRANDS.forEach(brand => {
      skuRecommendations[brand] = generateSKURecommendations(store, assortment, opportunities, brand);
    });

    results.push({
      store_id: store.store_id,
      retailer: store.retailer,
      format: store.format,
      demand,
      coverage,
      gap,
      brand_coverage: brandCoverage,
      competitor_coverage: competitorCoverage,
      misalignment_score: misalignment,
      // Layer 3 fields
      brand_coverage_share: brandCoverageShare,
      occasion_opportunities: opportunities,
      choice_share_uplift: choiceShareUplift,
      sku_recommendations: skuRecommendations
    });

    // Log progress every 50 stores
    if ((idx + 1) % 50 === 0) {
      console.log(`Processed ${idx + 1}/${stores.length} stores...`);
    }
  });

  return results;
}

// ============= VALIDATION =============

function validateGaps(gaps) {
  console.log('\n=== VALIDATION RESULTS ===\n');

  // 1. Check that demand and coverage sum to ~100%
  const sampleGap = gaps[0];
  const demandSum = OCCASIONS.reduce((sum, occ) => sum + sampleGap.demand[occ], 0);
  const coverageSum = OCCASIONS.reduce((sum, occ) => sum + sampleGap.coverage[occ], 0);
  const gapSum = OCCASIONS.reduce((sum, occ) => sum + sampleGap.gap[occ], 0);

  console.log(`Sample Store: ${sampleGap.store_id}`);
  console.log(`  Demand sum: ${demandSum.toFixed(2)}% (should be 100%)`);
  console.log(`  Coverage sum: ${coverageSum.toFixed(2)}% (should be 100%)`);
  console.log(`  Gap sum: ${gapSum.toFixed(2)}% (should be ~0%)`);
  console.log(`  Validation: ${Math.abs(demandSum - 100) < 0.1 && Math.abs(coverageSum - 100) < 0.1 ? '✅ PASS' : '❌ FAIL'}`);

  // 2. Check for positive and negative gaps
  const allGaps = [];
  gaps.forEach(g => {
    OCCASIONS.forEach(occ => {
      allGaps.push(g.gap[occ]);
    });
  });
  const positiveGaps = allGaps.filter(g => g > 0).length;
  const negativeGaps = allGaps.filter(g => g < 0).length;
  const zeroGaps = allGaps.filter(g => Math.abs(g) < 0.01).length;

  console.log(`\nGap Distribution (${gaps.length * OCCASIONS.length} total):`);
  console.log(`  Positive gaps: ${positiveGaps} (${(positiveGaps / allGaps.length * 100).toFixed(1)}%)`);
  console.log(`  Negative gaps: ${negativeGaps} (${(negativeGaps / allGaps.length * 100).toFixed(1)}%)`);
  console.log(`  Near-zero gaps: ${zeroGaps}`);

  // 3. Misalignment score distribution
  const misalignments = gaps.map(g => g.misalignment_score);
  const avgMisalignment = misalignments.reduce((a, b) => a + b, 0) / misalignments.length;
  const minMisalignment = Math.min(...misalignments);
  const maxMisalignment = Math.max(...misalignments);

  // Count stores by misalignment ranges
  const goodFit = misalignments.filter(m => m < 10).length;
  const average = misalignments.filter(m => m >= 10 && m < 50).length;
  const severe = misalignments.filter(m => m >= 50).length;

  console.log(`\nMisalignment Score Distribution:`);
  console.log(`  Min: ${minMisalignment.toFixed(1)}%`);
  console.log(`  Max: ${maxMisalignment.toFixed(1)}%`);
  console.log(`  Average: ${avgMisalignment.toFixed(1)}%`);
  console.log(`  < 10% (Good fit): ${goodFit} stores (${(goodFit / gaps.length * 100).toFixed(1)}%)`);
  console.log(`  10-50% (Average): ${average} stores (${(average / gaps.length * 100).toFixed(1)}%)`);
  console.log(`  50%+ (Severe): ${severe} stores (${(severe / gaps.length * 100).toFixed(1)}%)`);

  // 4. Brand coverage validation
  const sampleBrand = sampleGap.brand_coverage["Premium Craft Co"];
  const brandSum = OCCASIONS.reduce((sum, occ) => sum + sampleBrand[occ], 0);
  console.log(`\nBrand Coverage Validation (Premium Craft Co):`);
  console.log(`  Sum: ${brandSum.toFixed(2)}% (should be 100%)`);
  console.log(`  Status: ${Math.abs(brandSum - 100) < 0.1 ? '✅ PASS' : '❌ FAIL'}`);

  // 5. Sample 3 stores
  console.log(`\n=== SAMPLE STORES ===\n`);
  const samples = [
    gaps.find(g => g.retailer === "Waitrose"),
    gaps.find(g => g.retailer === "Aldi"),
    gaps.find(g => g.retailer === "Tesco" && g.format === "Hypermarket")
  ].filter(Boolean);

  samples.forEach(sample => {
    console.log(`${sample.store_id} (${sample.retailer} ${sample.format}):`);
    console.log(`  Misalignment: ${sample.misalignment_score.toFixed(1)}%`);
    console.log(`  Top 3 Demand:`, OCCASIONS.map(occ => ({occ, val: sample.demand[occ]})).sort((a,b) => b.val - a.val).slice(0,3).map(x => `${x.occ} (${x.val.toFixed(1)}%)`).join(', '));
    console.log(`  Top 3 Coverage:`, OCCASIONS.map(occ => ({occ, val: sample.coverage[occ]})).sort((a,b) => b.val - a.val).slice(0,3).map(x => `${x.occ} (${x.val.toFixed(1)}%)`).join(', '));
    console.log(`  Top 3 Gaps (positive):`, OCCASIONS.map(occ => ({occ, val: sample.gap[occ]})).filter(x => x.val > 0).sort((a,b) => b.val - a.val).slice(0,3).map(x => `${x.occ} (${x.val > 0 ? '+' : ''}${x.val.toFixed(1)}%)`).join(', '));

    // Show brand coverage for Premium Craft Co
    const premiumCov = sample.brand_coverage["Premium Craft Co"];
    console.log(`  Premium Craft Co Coverage:`, OCCASIONS.map(occ => ({occ, val: premiumCov[occ]})).sort((a,b) => b.val - a.val).slice(0,3).map(x => `${x.occ} (${x.val.toFixed(1)}%)`).join(', '));
    console.log('');
  });

  // 6. Layer 3 validation
  console.log(`\n=== LAYER 3: BRAND GROWTH ENGINE ===\n`);

  // Brand coverage share validation (should sum to 100%)
  const sampleShareSum = BRANDS.reduce((sum, brand) => sum + sampleGap.brand_coverage_share[brand], 0);
  console.log(`Brand Coverage Share Validation:`);
  console.log(`  Sum: ${sampleShareSum.toFixed(2)}% (should be 100%)`);
  console.log(`  Status: ${Math.abs(sampleShareSum - 100) < 0.1 ? '✅ PASS' : '❌ FAIL'}`);

  // Brand coverage share distribution
  console.log(`\nBrand Coverage Share (${sampleGap.store_id}):`);
  BRANDS.forEach(brand => {
    console.log(`  ${brand}: ${sampleGap.brand_coverage_share[brand].toFixed(1)}%`);
  });

  // Opportunity scores
  console.log(`\nTop Opportunities (Premium Craft Co at ${sampleGap.store_id}):`);
  const premiumOpps = OCCASIONS.map(occ => ({
    occasion: occ,
    score: sampleGap.occasion_opportunities["Premium Craft Co"][occ]
  })).sort((a, b) => b.score - a.score).slice(0, 3);
  premiumOpps.forEach(opp => {
    console.log(`  ${opp.occasion}: ${opp.score.toFixed(2)}`);
  });

  // SKU recommendations
  console.log(`\nSKU Recommendations (Premium Craft Co at ${sampleGap.store_id}):`);
  sampleGap.sku_recommendations["Premium Craft Co"].forEach((rec, idx) => {
    console.log(`  ${idx + 1}. ${rec.name} (Score: ${rec.score.toFixed(2)})`);
    console.log(`     Target occasions: ${rec.top_occasions.join(', ')}`);
  });

  // Choice share uplift
  console.log(`\nExpected Choice Share Uplift (${sampleGap.store_id}):`);
  BRANDS.forEach(brand => {
    const uplift = sampleGap.choice_share_uplift[brand];
    if (uplift > 0) {
      console.log(`  ${brand}: +${uplift.toFixed(1)}%`);
    }
  });
}

// ============= EXECUTE =============

console.log('Generating occasion gaps...\n');
const gaps = generateOccasionGaps();

console.log(`\nGenerated gaps for ${gaps.length} stores`);

// Validate
validateGaps(gaps);

// Save output
const output = {
  category: "Beer",
  sub_category: "All Beer",
  generated_at: new Date().toISOString(),
  total_stores: gaps.length,
  occasions: OCCASIONS,
  gaps
};

const outputPath = path.join(__dirname, '../data/occasion-gaps.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Saved to: ${outputPath}`);
console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
