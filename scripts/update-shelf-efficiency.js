#!/usr/bin/env node

/**
 * Update shelf efficiency patterns for realistic variability
 * - Some stores: shelf_share > choice_share (under-performing)
 * - Other stores: choice_share > shelf_share (over-performing)
 * - Vary by retailer tier and format
 */

const fs = require('fs');
const path = require('path');

// Seeded random for determinism
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Retailer tier efficiency modifiers
// Higher tier = better efficiency (smaller gap between choice and shelf)
const RETAILER_EFFICIENCY = {
  "Waitrose": 1.2, // Premium - better efficiency
  "M&S": 1.2,
  "Sainsbury's": 1.0, // Mid-tier
  "Tesco": 1.0,
  "Morrisons": 0.9,
  "ASDA": 0.85,
  "Co-op": 0.9,
  "Aldi": 0.95, // Value retailers can be efficient
  "Lidl": 0.95,
};

// Format efficiency patterns
const FORMAT_PATTERNS = {
  "Hypermarket": { variance: 1.2, tendency: "mixed" }, // High variance, mixed patterns
  "Supermarket": { variance: 1.0, tendency: "balanced" }, // Moderate variance
  "Convenience": { variance: 0.8, tendency: "under" }, // Lower variance, tend to under-perform
  "Forecourt": { variance: 0.7, tendency: "under" }
};

function adjustShelfShare(store, storeData, stores) {
  const seed = store.store_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = seededRandom(seed);

  const retailer = store.retailer;
  const format = store.format;

  const retailerMod = RETAILER_EFFICIENCY[retailer] || 1.0;
  const formatPattern = FORMAT_PATTERNS[format] || { variance: 1.0, tendency: "balanced" };

  // Adjust shelf share for each brand based on retailer and format
  const brands = Object.keys(storeData.choice_share);
  const newShelfShare = {};

  brands.forEach((brand, idx) => {
    const choiceShare = storeData.choice_share[brand];
    const brandSeed = seed + idx * 100;
    const brandRandom = seededRandom(brandSeed);

    // Determine if this brand over or under-performs
    let efficiencyFactor;

    if (formatPattern.tendency === "under") {
      // Tendency to under-perform (shelf > choice)
      efficiencyFactor = 0.85 + brandRandom * 0.2; // 0.85 - 1.05
    } else if (formatPattern.tendency === "over") {
      // Tendency to over-perform (choice > shelf)
      efficiencyFactor = 1.0 + brandRandom * 0.3; // 1.0 - 1.3
    } else {
      // Mixed/balanced
      efficiencyFactor = 0.8 + brandRandom * 0.5; // 0.8 - 1.3
    }

    // Apply retailer modifier (premium retailers have better efficiency)
    efficiencyFactor *= retailerMod;

    // Apply format variance
    const variance = formatPattern.variance;
    efficiencyFactor *= (1 + (seededRandom(brandSeed + 50) * variance - variance/2) * 0.2);

    // Calculate new shelf share
    // efficiencyFactor < 1.0 means shelf_share > choice_share (under-performing)
    // efficiencyFactor > 1.0 means choice_share > shelf_share (over-performing)
    let newShelf = choiceShare / efficiencyFactor;

    // Ensure shelf share stays reasonable (between 5% and 45%)
    newShelf = Math.max(5, Math.min(45, newShelf));

    newShelfShare[brand] = Math.round(newShelf * 10) / 10; // Round to 1 decimal
  });

  // Normalize shelf shares to sum to 100%
  const shelfTotal = Object.values(newShelfShare).reduce((a, b) => a + b, 0);
  Object.keys(newShelfShare).forEach(brand => {
    newShelfShare[brand] = Math.round((newShelfShare[brand] / shelfTotal) * 1000) / 10; // Round to 1 decimal
  });

  // Calculate shelf efficiency (choice/shelf)
  const newShelfEfficiency = {};
  brands.forEach(brand => {
    const efficiency = storeData.choice_share[brand] / newShelfShare[brand];
    newShelfEfficiency[brand] = Math.round(efficiency * 100) / 100; // Round to 2 decimals
  });

  return {
    shelf_share: newShelfShare,
    shelf_efficiency: newShelfEfficiency
  };
}

function main() {
  const categoryPerfPath = path.join(__dirname, '../data/category-performance.json');
  const storesPath = path.join(__dirname, '../data/stores.json');

  console.log('Reading data files...');
  const categoryPerf = JSON.parse(fs.readFileSync(categoryPerfPath, 'utf8'));
  const stores = JSON.parse(fs.readFileSync(storesPath, 'utf8'));

  console.log(`Updating shelf efficiency for ${categoryPerf.stores.length} stores...`);

  const updatedStores = categoryPerf.stores.map((storeData, idx) => {
    if (idx % 100 === 0) {
      console.log(`  Processed ${idx}/${categoryPerf.stores.length} stores...`);
    }

    const store = stores.find(s => s.store_id === storeData.store_id);
    if (!store) {
      console.warn(`Warning: Store ${storeData.store_id} not found in stores.json`);
      return storeData;
    }

    const { shelf_share, shelf_efficiency } = adjustShelfShare(store, storeData, stores);

    return {
      ...storeData,
      shelf_share,
      shelf_efficiency
    };
  });

  console.log('Writing updated category-performance.json...');
  const updatedData = {
    ...categoryPerf,
    stores: updatedStores,
    generated_at: new Date().toISOString()
  };

  fs.writeFileSync(categoryPerfPath, JSON.stringify(updatedData, null, 2));

  console.log('✓ Shelf efficiency update complete!');
  console.log(`✓ Updated ${updatedStores.length} stores`);

  // Show some examples
  console.log('\nExample patterns:');
  const examples = updatedStores.slice(0, 3);
  examples.forEach(store => {
    console.log(`\n${store.store_id}:`);
    Object.keys(store.choice_share).slice(0, 2).forEach(brand => {
      const choice = store.choice_share[brand];
      const shelf = store.shelf_share[brand];
      const eff = store.shelf_efficiency[brand];
      const pattern = shelf > choice ? "under-performing" : "over-performing";
      console.log(`  ${brand}: Choice ${choice}%, Shelf ${shelf}%, Efficiency ${eff}x (${pattern})`);
    });
  });
}

main();
