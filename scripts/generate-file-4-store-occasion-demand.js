#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE FILE 4: 4-store-occasion-demand.json
// ═══════════════════════════════════════════════════════════════════════════
// Derives what shoppers at each store need in terms of usage occasions

// ═════════════════════════════════════════════════════════════════════════
// SEGMENT → OCCASION PROFILES (CONSTANTS)
// ═════════════════════════════════════════════════════════════════════════

const BEER_SEGMENT_OCCASION_PROFILES = {
  mindful_moderators: {
    everyday_drink: 0.15,
    social_occasion: 0.10,
    special_celebration: 0.10,
    quiet_night_in: 0.15,
    health_conscious_choice: 0.50,
  },
  premium_crafters: {
    everyday_drink: 0.10,
    social_occasion: 0.15,
    special_celebration: 0.35,
    quiet_night_in: 0.35,
    health_conscious_choice: 0.05,
  },
  social_sessionists: {
    everyday_drink: 0.15,
    social_occasion: 0.45,
    special_celebration: 0.25,
    quiet_night_in: 0.10,
    health_conscious_choice: 0.05,
  },
  mainstream_loyalists: {
    everyday_drink: 0.35,
    social_occasion: 0.25,
    special_celebration: 0.10,
    quiet_night_in: 0.25,
    health_conscious_choice: 0.05,
  },
  value_seekers: {
    everyday_drink: 0.50,
    social_occasion: 0.20,
    special_celebration: 0.05,
    quiet_night_in: 0.20,
    health_conscious_choice: 0.05,
  },
};

const BEAUTY_SEGMENT_OCCASION_PROFILES = {
  clean_conscious: {
    daily_routine: 0.30,
    treatment_ritual: 0.15,
    quick_fix: 0.10,
    self_care_moment: 0.30,
    preventative_care: 0.15,
  },
  prestige_devotees: {
    daily_routine: 0.15,
    treatment_ritual: 0.30,
    quick_fix: 0.05,
    self_care_moment: 0.35,
    preventative_care: 0.15,
  },
  skintellectuals: {
    daily_routine: 0.20,
    treatment_ritual: 0.35,
    quick_fix: 0.05,
    self_care_moment: 0.10,
    preventative_care: 0.30,
  },
  glow_chasers: {
    daily_routine: 0.20,
    treatment_ritual: 0.10,
    quick_fix: 0.35,
    self_care_moment: 0.25,
    preventative_care: 0.10,
  },
  low_maintenance_minimalists: {
    daily_routine: 0.50,
    treatment_ritual: 0.05,
    quick_fix: 0.30,
    self_care_moment: 0.05,
    preventative_care: 0.10,
  },
};

const HOME_SEGMENT_OCCASION_PROFILES = {
  germ_defenders: {
    routine_clean: 0.20,
    deep_clean: 0.25,
    quick_freshen: 0.10,
    germ_protection: 0.40,
    ambience_creation: 0.05,
  },
  clean_living_advocates: {
    routine_clean: 0.35,
    deep_clean: 0.20,
    quick_freshen: 0.15,
    germ_protection: 0.10,
    ambience_creation: 0.20,
  },
  sensory_homemakers: {
    routine_clean: 0.15,
    deep_clean: 0.10,
    quick_freshen: 0.25,
    germ_protection: 0.05,
    ambience_creation: 0.45,
  },
  family_protectors: {
    routine_clean: 0.25,
    deep_clean: 0.20,
    quick_freshen: 0.15,
    germ_protection: 0.30,
    ambience_creation: 0.10,
  },
  functional_pragmatists: {
    routine_clean: 0.40,
    deep_clean: 0.30,
    quick_freshen: 0.15,
    germ_protection: 0.10,
    ambience_creation: 0.05,
  },
};

// ═════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════

function normalise(obj) {
  const sum = Object.values(obj).reduce((a, b) => a + b, 0);
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = sum > 0 ? parseFloat((value / sum).toFixed(4)) : 0;
  }
  return result;
}

function calculateOccasionDemand(segmentMix, occasionProfiles) {
  // Get occasion keys from first profile
  const occasions = Object.keys(Object.values(occasionProfiles)[0]);

  const result = {};
  for (const occasion of occasions) {
    result[occasion] = 0;
    for (const [segment, segmentShare] of Object.entries(segmentMix)) {
      if (occasionProfiles[segment]) {
        result[occasion] += segmentShare * occasionProfiles[segment][occasion];
      }
    }
  }

  // Normalise to ensure sum = 1
  return normalise(result);
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN GENERATION
// ═════════════════════════════════════════════════════════════════════════

function generateFile4() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('GENERATING FILE 4: 4-store-occasion-demand.json');
  console.log('═══════════════════════════════════════════════════\n');

  // Load inputs
  const file1Path = path.join(__dirname, '../data/1-stores.json');
  const file3Path = path.join(__dirname, '../data/3-store-attraction.json');

  const stores = JSON.parse(fs.readFileSync(file1Path, 'utf-8'));
  const storeAttractions = JSON.parse(fs.readFileSync(file3Path, 'utf-8'));

  console.log(`✅ Loaded ${stores.length} stores from File 1`);
  console.log(`✅ Loaded ${storeAttractions.length} store attractions from File 3\n`);

  // Create lookup map for store metadata
  const storeMap = {};
  stores.forEach(s => { storeMap[s.store_id] = s; });

  // Generate occasion demand for each store
  const output = [];
  let processed = 0;

  storeAttractions.forEach(attraction => {
    const store = storeMap[attraction.store_id];
    if (!store) {
      console.warn(`Store ${attraction.store_id} not found in File 1`);
      return;
    }

    // 1. Normalise segment mix (within-store proportions)
    const segment_mix = {
      beer: normalise(attraction.attracted_segments.beer),
      beauty: normalise(attraction.attracted_segments.beauty),
      home: normalise(attraction.attracted_segments.home),
    };

    // 2. Normalise mission mix (within-store proportions)
    const mission_mix = normalise(attraction.attracted_missions);

    // 3. Calculate occasion demand (weighted sum of segment occasion profiles)
    const occasion_demand = {
      beer: calculateOccasionDemand(segment_mix.beer, BEER_SEGMENT_OCCASION_PROFILES),
      beauty: calculateOccasionDemand(segment_mix.beauty, BEAUTY_SEGMENT_OCCASION_PROFILES),
      home: calculateOccasionDemand(segment_mix.home, HOME_SEGMENT_OCCASION_PROFILES),
    };

    // 4. Build segment_occasion_detail for granular dashboard queries
    const segment_occasion_detail = {
      beer: Object.entries(segment_mix.beer).map(([segment, share]) => ({
        segment,
        segment_share: share,
        occasion_profile: BEER_SEGMENT_OCCASION_PROFILES[segment] || {},
      })),
      beauty: Object.entries(segment_mix.beauty).map(([segment, share]) => ({
        segment,
        segment_share: share,
        occasion_profile: BEAUTY_SEGMENT_OCCASION_PROFILES[segment] || {},
      })),
      home: Object.entries(segment_mix.home).map(([segment, share]) => ({
        segment,
        segment_share: share,
        occasion_profile: HOME_SEGMENT_OCCASION_PROFILES[segment] || {},
      })),
    };

    output.push({
      store_id: attraction.store_id,
      cluster_id: attraction.cluster_id,
      retailer: store.retailer,
      format: store.format,
      segment_mix,
      mission_mix,
      occasion_demand,
      segment_occasion_detail,
    });

    processed++;
    if (processed % 50 === 0) {
      console.log(`Processed ${processed}/${storeAttractions.length} stores...`);
    }
  });

  console.log(`\n✅ Generated occasion demand for ${output.length} stores\n`);

  // Write output
  const outputPath = path.join(__dirname, '../data/4-store-occasion-demand.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`📁 Wrote: data/4-store-occasion-demand.json (${fileSizeMB} MB)`);
  console.log(`📊 Total stores: ${output.length}\n`);

  return output;
}

// ═════════════════════════════════════════════════════════════════════════
// SUMMARY STATISTICS
// ═════════════════════════════════════════════════════════════════════════

function printSummary(stores) {
  console.log('═══════════════════════════════════════════════════');
  console.log('FILE 4 SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`Total stores: ${stores.length}\n`);

  // Occasion demand ranges by retailer
  const retailers = ['Waitrose', 'Tesco', 'Aldi', 'Sainsbury\'s'];

  for (const retailer of retailers) {
    const retailerStores = stores.filter(s => s.retailer === retailer);
    if (retailerStores.length === 0) continue;

    console.log(`${retailer} (${retailerStores.length} stores):`);

    console.log('  Beer occasion demand (avg):');
    const beerOccasions = Object.keys(retailerStores[0].occasion_demand.beer);
    for (const occasion of beerOccasions) {
      const avg = retailerStores.reduce((sum, s) => sum + s.occasion_demand.beer[occasion], 0) / retailerStores.length;
      console.log(`    ${occasion}: ${(avg * 100).toFixed(1)}%`);
    }
    console.log('');
  }

  // Show sample stores
  console.log('═══════════════════════════════════════════════════');
  console.log('SAMPLE STORES');
  console.log('═══════════════════════════════════════════════════\n');

  const waitrose = stores.find(s => s.retailer === 'Waitrose');
  if (waitrose) {
    console.log(`WAITROSE EXAMPLE (${waitrose.store_id}):`);
    console.log('  Segment mix (beer):');
    for (const [segment, share] of Object.entries(waitrose.segment_mix.beer)) {
      console.log(`    ${segment}: ${(share * 100).toFixed(1)}%`);
    }
    console.log('  Occasion demand (beer):');
    for (const [occasion, demand] of Object.entries(waitrose.occasion_demand.beer)) {
      console.log(`    ${occasion}: ${(demand * 100).toFixed(1)}%`);
    }
    console.log('');
  }

  const aldi = stores.find(s => s.retailer === 'Aldi');
  if (aldi) {
    console.log(`ALDI EXAMPLE (${aldi.store_id}):`);
    console.log('  Segment mix (beer):');
    for (const [segment, share] of Object.entries(aldi.segment_mix.beer)) {
      console.log(`    ${segment}: ${(share * 100).toFixed(1)}%`);
    }
    console.log('  Occasion demand (beer):');
    for (const [occasion, demand] of Object.entries(aldi.occasion_demand.beer)) {
      console.log(`    ${occasion}: ${(demand * 100).toFixed(1)}%`);
    }
    console.log('');
  }
}

// ═════════════════════════════════════════════════════════════════════════
// RUN
// ═════════════════════════════════════════════════════════════════════════

const stores = generateFile4();
printSummary(stores);
