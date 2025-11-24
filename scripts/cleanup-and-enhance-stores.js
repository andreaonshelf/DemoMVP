#!/usr/bin/env node

/**
 * FILE 1 CLEANUP & ENHANCEMENT
 *
 * 1. REMOVE all demographic fields
 * 2. KEEP only physical retail fields
 * 3. ENHANCE with realistic UK retail rules
 * 4. Add SKU capacity fields
 */

const fs = require('fs');
const path = require('path');

const stores = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/stores.json'),
  'utf-8'
));

console.log(`Loaded ${stores.length} stores\n`);

// ============= HELPER FUNCTIONS =============

function calculateDistance(store1, store2) {
  if (!store1.latitude || !store2.latitude) return 999999;
  const R = 6371e3;
  const φ1 = store1.latitude * Math.PI / 180;
  const φ2 = store2.latitude * Math.PI / 180;
  const Δφ = (store2.latitude - store1.latitude) * Math.PI / 180;
  const Δλ = (store2.longitude - store1.longitude) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isLondonCentral(lat, lng) {
  // Approximate central London coordinates (Zone 1-2)
  const centralLat = 51.5074;
  const centralLng = -0.1278;
  const distance = Math.sqrt(
    Math.pow((lat - centralLat) * 111, 2) +
    Math.pow((lng - centralLng) * 111 * Math.cos(centralLat * Math.PI / 180), 2)
  );
  return distance < 5; // Within ~5km of central London
}

// ============= 1. CLEANUP - REMOVE DEMOGRAPHICS =============

console.log('STEP 1: Removing demographic fields...\n');

let removedFields = {
  micro_catchment_population: 0,
  catchmentPopulation: 0,
  demand: 0,
  missions: 0,
  internal_subtype: 0,
  other: 0
};

stores.forEach(store => {
  // Remove demographic fields
  if (store.micro_catchment_population) {
    delete store.micro_catchment_population;
    removedFields.micro_catchment_population++;
  }
  if (store.catchmentPopulation) {
    delete store.catchmentPopulation;
    removedFields.catchmentPopulation++;
  }
  if (store.demand) {
    delete store.demand;
    removedFields.demand++;
  }
  if (store.missions) {
    delete store.missions;
    removedFields.missions++;
  }
  if (store.internal_subtype) {
    delete store.internal_subtype;
    removedFields.internal_subtype++;
  }

  // Remove any other population/demographic related fields
  const demographicKeys = Object.keys(store).filter(k =>
    k.includes('population') ||
    k.includes('segment') ||
    k.includes('customer') ||
    k.includes('shopper')
  );
  demographicKeys.forEach(key => {
    delete store[key];
    removedFields.other++;
  });
});

console.log('✅ Removed demographic fields:');
Object.entries(removedFields).forEach(([field, count]) => {
  if (count > 0) {
    console.log(`   ${field}: ${count} occurrences`);
  }
});
console.log('');

// ============= 2. ASSIGN CLUSTER_ID =============

console.log('STEP 2: Assigning cluster_id (geographic proximity)...\n');

const clusters = [];
const assigned = new Set();

stores.forEach(store => {
  if (assigned.has(store.store_id)) return;

  const cluster = {
    cluster_id: `CLUSTER-${clusters.length + 1}`,
    stores: [store]
  };

  assigned.add(store.store_id);

  stores.forEach(other => {
    if (assigned.has(other.store_id)) return;
    const distance = calculateDistance(store, other);
    if (distance < 1500) {
      cluster.stores.push(other);
      assigned.add(other.store_id);
    }
  });

  clusters.push(cluster);
});

// Assign cluster_id to stores
clusters.forEach(cluster => {
  cluster.stores.forEach(store => {
    store.cluster_id = cluster.cluster_id;
  });
});

console.log(`✅ Created ${clusters.length} geographic clusters\n`);

// ============= 3. ADD SKU CAPACITY FIELDS =============

console.log('STEP 3: Adding SKU capacity fields...\n');

function getStoreTotalSKUCapacity(format) {
  const ranges = {
    'Hypermarket': [35000, 70000],
    'Supermarket': [10000, 30000],
    'Convenience': [1500, 5000],
    'Discounter': [2500, 4500],
    'Forecourt': [300, 1200]
  };

  const range = ranges[format] || [2000, 8000];
  return Math.floor(range[0] + Math.random() * (range[1] - range[0]));
}

function getCategorySKUCapacity(format) {
  const ranges = {
    'Hypermarket': [35, 40],
    'Supermarket': [20, 30],
    'Convenience': [8, 15],
    'Discounter': [10, 20],
    'Forecourt': [3, 8]
  };

  const range = ranges[format] || [10, 20];
  return Math.floor(range[0] + Math.random() * (range[1] - range[0] + 1));
}

stores.forEach(store => {
  store.store_total_sku_capacity = getStoreTotalSKUCapacity(store.format);
  store.category_sku_capacity = getCategorySKUCapacity(store.format);
});

console.log('✅ Added SKU capacity fields\n');

// ============= 4. FIX HYPERMARKET LOCATIONS =============

console.log('STEP 4: Fixing hypermarket locations (remove from central London)...\n');

let hypermarketsFixed = 0;
stores.forEach(store => {
  if (store.format === 'Hypermarket' && isLondonCentral(store.latitude, store.longitude)) {
    // Move hypermarket to outer London (add ~0.15 degrees ≈ 15km)
    const angle = Math.random() * 2 * Math.PI;
    store.latitude += Math.cos(angle) * 0.15;
    store.longitude += Math.sin(angle) * 0.15;
    hypermarketsFixed++;
  }
});

console.log(`✅ Fixed ${hypermarketsFixed} hypermarkets in central London\n`);

// ============= 5. CLEAN UP NEARBY_COMPETITION =============

console.log('STEP 5: Simplifying nearby_competition structure...\n');

stores.forEach(store => {
  if (store.nearby_competition) {
    // Keep only essential fields
    store.nearby_competition = store.nearby_competition.map(comp => ({
      store_id: comp.store_id,
      retailer: comp.retailer,
      format: comp.format,
      distance: comp.distance
    }));
  }
});

console.log('✅ Simplified competition structure\n');

// ============= 6. VALIDATE REQUIRED FIELDS =============

console.log('STEP 6: Validating required fields...\n');

const requiredFields = [
  'store_id',
  'retailer',
  'format',
  'region',
  'latitude',
  'longitude',
  'cluster_id',
  'store_context',
  'nearby_competition',
  'store_total_sku_capacity',
  'category_sku_capacity'
];

let missingFields = {};
stores.forEach(store => {
  requiredFields.forEach(field => {
    if (store[field] === undefined || store[field] === null) {
      missingFields[field] = (missingFields[field] || 0) + 1;
    }
  });
});

if (Object.keys(missingFields).length > 0) {
  console.log('⚠️  Missing fields detected:');
  Object.entries(missingFields).forEach(([field, count]) => {
    console.log(`   ${field}: ${count} stores`);
  });
} else {
  console.log('✅ All required fields present\n');
}

// ============= 7. SAVE CLEANED FILE =============

const outputPath = path.join(__dirname, '../data/STORES-FINAL.json');
fs.writeFileSync(outputPath, JSON.stringify(stores, null, 2));

console.log(`\n✅ SAVED: ${outputPath}`);
console.log(`   File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`   ${stores.length} stores`);
console.log(`   ${clusters.length} clusters`);

// ============= 8. GENERATE SUMMARY =============

let summary = '';
summary += '═══════════════════════════════════════════════\n';
summary += 'FILE 1 CLEANUP & ENHANCEMENT SUMMARY\n';
summary += `Generated: ${new Date().toISOString()}\n`;
summary += '═══════════════════════════════════════════════\n\n';

summary += 'REMOVED (Demographics & Invented Fields):\n';
summary += '─────────────────────────────────────────────────\n';
Object.entries(removedFields).forEach(([field, count]) => {
  if (count > 0) {
    summary += `  ✓ ${field}: ${count} occurrences\n`;
  }
});
summary += '\n';

summary += 'KEPT (Physical Retail Fields Only):\n';
summary += '─────────────────────────────────────────────────\n';
requiredFields.forEach(field => {
  summary += `  ✓ ${field}\n`;
});
summary += '\n';

summary += 'ENHANCED:\n';
summary += '─────────────────────────────────────────────────\n';
summary += `  ✓ Created ${clusters.length} geographic clusters\n`;
summary += `  ✓ Added store_total_sku_capacity (300-70k range)\n`;
summary += `  ✓ Added category_sku_capacity (3-40 range)\n`;
summary += `  ✓ Fixed ${hypermarketsFixed} hypermarkets in central London\n`;
summary += `  ✓ Simplified nearby_competition structure\n`;
summary += '\n';

summary += 'FILE 1 NOW CONTAINS:\n';
summary += '─────────────────────────────────────────────────\n';
summary += '  ✓ Physical store locations (lat/lng)\n';
summary += '  ✓ Store formats and retailers\n';
summary += '  ✓ Geographic clusters\n';
summary += '  ✓ Store context (residential/mixed/transit/office_core)\n';
summary += '  ✓ Nearby competition mapping\n';
summary += '  ✓ SKU capacity constraints\n';
summary += '\n';
summary += '  ✗ NO demographics\n';
summary += '  ✗ NO population data\n';
summary += '  ✗ NO segment mixes\n';
summary += '  ✗ NO demand/missions\n';
summary += '\n';

summary += '➡️  NEXT: All demographics move to File 2 (cluster-population.json)\n';

const summaryPath = path.join(__dirname, '../SUMMARY-OF-FIXES.md');
fs.writeFileSync(summaryPath, summary);

console.log(`\n✅ SAVED: ${summaryPath}\n`);
