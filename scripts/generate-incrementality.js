#!/usr/bin/env node

/**
 * Generate incrementality breakdown data for all stores
 * Shows how optimization potential breaks down by:
 * - Brand (which competitors lose share)
 * - Segment (which shopper groups gain/lose)
 * - Occasion (which usage occasions gain/lose)
 */

const fs = require('fs');
const path = require('path');

// Seeded random for determinism
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Pick a random item from array using seed
function pickRandom(array, seed) {
  const index = Math.floor(seededRandom(seed) * array.length);
  return array[index];
}

// Shuffle array deterministically
function shuffleArray(array, seed) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const COMPETITOR_BRANDS = ["Traditional Ales Ltd", "Heritage Beer Co", "Value Lager Brewing"];

const ALL_SEGMENTS = [
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
];

const ALL_OCCASIONS = [
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
];

function generateIncrementality(store, storePerf, skus) {
  const storeSeed = store.store_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const optimizationPotential = Math.round(storePerf.optimization_potential?.["Premium Craft Co"] || 0);

  if (optimizationPotential === 0) {
    return null; // No optimization potential
  }

  // Get Premium Craft Co SKUs
  const premiumCraftSKUs = skus.filter(sku => sku.brand === "Premium Craft Co");
  const availableSKUs = premiumCraftSKUs.filter(sku => sku.available_stores?.includes(store.store_id));
  const unavailableSKUs = premiumCraftSKUs.filter(sku => !sku.available_stores?.includes(store.store_id));

  // Get top 2 SKUs that would be introduced
  const introduceSKUs = unavailableSKUs.slice(0, 2);

  // Extract top segments and occasions from these SKUs
  const segmentScores = {};
  const occasionScores = {};

  introduceSKUs.forEach(sku => {
    const segmentShares = sku.segment_choice_share || {};
    const occasionShares = sku.occasion_choice_share || {};

    Object.entries(segmentShares).forEach(([segment, share]) => {
      segmentScores[segment] = (segmentScores[segment] || 0) + share;
    });

    Object.entries(occasionShares).forEach(([occasion, share]) => {
      occasionScores[occasion] = (occasionScores[occasion] || 0) + share;
    });
  });

  // Sort segments and occasions by score
  const topSegments = Object.entries(segmentScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([segment]) => segment);

  const topOccasions = Object.entries(occasionScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([occasion]) => occasion);

  // === BRAND BREAKDOWN ===
  // Pick 2-3 competitors that lose share (vary across stores)
  const shuffledCompetitors = shuffleArray(COMPETITOR_BRANDS, storeSeed);
  const numLosers = 2 + Math.floor(seededRandom(storeSeed + 100) * 2); // 2 or 3 losers
  const losingCompetitors = shuffledCompetitors.slice(0, numLosers);

  const by_brand = {
    "Premium Craft Co": optimizationPotential
  };

  // Distribute losses among competitors (vary the split)
  let remainingLoss = optimizationPotential;
  losingCompetitors.forEach((comp, idx) => {
    if (idx === losingCompetitors.length - 1) {
      // Last competitor gets remainder
      by_brand[comp] = -remainingLoss;
    } else {
      // Random split between 30-60% of remaining
      const portion = 0.3 + seededRandom(storeSeed + idx + 200) * 0.3;
      const loss = Math.round(remainingLoss * portion);
      by_brand[comp] = -loss;
      remainingLoss -= loss;
    }
  });

  // === SEGMENT BREAKDOWN ===
  // Top 2-3 segments gain, 1 segment might lose
  const by_segment = {};

  if (topSegments.length > 0) {
    // Distribute gains across top segments
    const gainSegments = topSegments.slice(0, 3);
    const totalGain = optimizationPotential * 1.3; // Over-allocate for gains

    let remainingGain = totalGain;
    gainSegments.forEach((segment, idx) => {
      if (idx === gainSegments.length - 1) {
        by_segment[segment] = Math.round(remainingGain);
      } else {
        const portion = 0.25 + seededRandom(storeSeed + idx + 300) * 0.35;
        const gain = Math.round(remainingGain * portion);
        by_segment[segment] = gain;
        remainingGain -= gain;
      }
    });

    // Pick 1 segment that loses (to balance the over-allocation)
    const allOtherSegments = ALL_SEGMENTS.filter(s => !gainSegments.includes(s));
    const loseSegment = pickRandom(allOtherSegments, storeSeed + 400);
    const loss = Math.round(totalGain - optimizationPotential);
    by_segment[loseSegment] = -loss;
  }

  // === OCCASION BREAKDOWN ===
  // Top 2-3 occasions gain, 1 occasion might lose
  const by_occasion = {};

  if (topOccasions.length > 0) {
    // Distribute gains across top occasions
    const gainOccasions = topOccasions.slice(0, 3);
    const totalGain = optimizationPotential * 1.25; // Over-allocate for gains

    let remainingGain = totalGain;
    gainOccasions.forEach((occasion, idx) => {
      if (idx === gainOccasions.length - 1) {
        by_occasion[occasion] = Math.round(remainingGain);
      } else {
        const portion = 0.25 + seededRandom(storeSeed + idx + 500) * 0.35;
        const gain = Math.round(remainingGain * portion);
        by_occasion[occasion] = gain;
        remainingGain -= gain;
      }
    });

    // Pick 1 occasion that loses (to balance the over-allocation)
    const allOtherOccasions = ALL_OCCASIONS.filter(o => !gainOccasions.includes(o));
    const loseOccasion = pickRandom(allOtherOccasions, storeSeed + 600);
    const loss = Math.round(totalGain - optimizationPotential);
    by_occasion[loseOccasion] = -loss;
  }

  return {
    by_brand,
    by_segment,
    by_occasion
  };
}

function main() {
  const categoryPerfPath = path.join(__dirname, '../data/category-performance.json');
  const storesPath = path.join(__dirname, '../data/stores.json');
  const skusPath = path.join(__dirname, '../data/shopper-responses.json');

  console.log('Reading data files...');
  const categoryPerf = JSON.parse(fs.readFileSync(categoryPerfPath, 'utf8'));
  const stores = JSON.parse(fs.readFileSync(storesPath, 'utf8'));
  const skusData = JSON.parse(fs.readFileSync(skusPath, 'utf8'));
  const skus = skusData.skus || [];

  console.log(`Generating incrementality for ${categoryPerf.stores.length} stores...`);

  const updatedStores = categoryPerf.stores.map((storeData, idx) => {
    if (idx % 100 === 0) {
      console.log(`  Processed ${idx}/${categoryPerf.stores.length} stores...`);
    }

    const store = stores.find(s => s.store_id === storeData.store_id);
    if (!store) {
      console.warn(`Warning: Store ${storeData.store_id} not found in stores.json`);
      return storeData;
    }

    const incrementality = generateIncrementality(store, storeData, skus);

    if (!incrementality) {
      return storeData; // No optimization potential
    }

    return {
      ...storeData,
      incrementality_breakdown: incrementality
    };
  });

  console.log('Writing updated category-performance.json...');
  const updatedData = {
    ...categoryPerf,
    stores: updatedStores,
    generated_at: new Date().toISOString()
  };

  fs.writeFileSync(categoryPerfPath, JSON.stringify(updatedData, null, 2));

  console.log('✓ Incrementality generation complete!');
  console.log(`✓ Updated ${updatedStores.length} stores`);

  // Show some examples
  console.log('\nExample incrementality patterns:');
  const examples = updatedStores.filter(s => s.incrementality_breakdown).slice(0, 3);
  examples.forEach(store => {
    console.log(`\n${store.store_id}:`);
    console.log('  Brand breakdown:', JSON.stringify(store.incrementality_breakdown.by_brand, null, 2));
    console.log('  Top segment:', Object.entries(store.incrementality_breakdown.by_segment).sort(([,a], [,b]) => b - a)[0]);
    console.log('  Top occasion:', Object.entries(store.incrementality_breakdown.by_occasion).sort(([,a], [,b]) => b - a)[0]);
  });
}

main();
