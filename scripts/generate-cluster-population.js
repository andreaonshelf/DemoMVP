#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// REGION-BASED DEMOGRAPHIC RANGE TABLE
// ═══════════════════════════════════════════════════════════════════════════

const REGION_DEMOGRAPHIC_RANGES = {
  'London': {
    age_mix: {
      'age_18_24': [0.18, 0.26],
      'age_25_34': [0.30, 0.42],
      'age_35_54': [0.24, 0.32],
      'age_55_64': [0.08, 0.14],
      'age_65_plus': [0.05, 0.12]
    },
    income_mix: {
      'income_low': [0.18, 0.28],
      'income_mid': [0.42, 0.52],
      'income_high': [0.25, 0.38]
    },
    household_mix: {
      'single_person': [0.35, 0.48],
      'couples_no_kids': [0.22, 0.32],
      'families_with_kids': [0.20, 0.30],
      'multi_gen_households': [0.08, 0.15]
    }
  },
  'North West': {
    age_mix: {
      'age_18_24': [0.14, 0.20],
      'age_25_34': [0.22, 0.30],
      'age_35_54': [0.28, 0.36],
      'age_55_64': [0.14, 0.20],
      'age_65_plus': [0.14, 0.22]
    },
    income_mix: {
      'income_low': [0.28, 0.38],
      'income_mid': [0.46, 0.56],
      'income_high': [0.12, 0.22]
    },
    household_mix: {
      'single_person': [0.28, 0.38],
      'couples_no_kids': [0.22, 0.30],
      'families_with_kids': [0.30, 0.42],
      'multi_gen_households': [0.08, 0.14]
    }
  },
  'Yorkshire and the Humber': {
    age_mix: {
      'age_18_24': [0.14, 0.20],
      'age_25_34': [0.20, 0.28],
      'age_35_54': [0.28, 0.36],
      'age_55_64': [0.16, 0.22],
      'age_65_plus': [0.16, 0.24]
    },
    income_mix: {
      'income_low': [0.30, 0.40],
      'income_mid': [0.48, 0.58],
      'income_high': [0.10, 0.18]
    },
    household_mix: {
      'single_person': [0.26, 0.36],
      'couples_no_kids': [0.24, 0.32],
      'families_with_kids': [0.32, 0.42],
      'multi_gen_households': [0.08, 0.14]
    }
  },
  'Wales': {
    age_mix: {
      'age_18_24': [0.10, 0.16],
      'age_25_34': [0.16, 0.24],
      'age_35_54': [0.28, 0.36],
      'age_55_64': [0.18, 0.26],
      'age_65_plus': [0.20, 0.30]
    },
    income_mix: {
      'income_low': [0.32, 0.42],
      'income_mid': [0.48, 0.58],
      'income_high': [0.08, 0.16]
    },
    household_mix: {
      'single_person': [0.24, 0.32],
      'couples_no_kids': [0.26, 0.36],
      'families_with_kids': [0.32, 0.42],
      'multi_gen_households': [0.08, 0.12]
    }
  },
  'South West': {
    age_mix: {
      'age_18_24': [0.10, 0.16],
      'age_25_34': [0.16, 0.24],
      'age_35_54': [0.26, 0.34],
      'age_55_64': [0.18, 0.26],
      'age_65_plus': [0.22, 0.32]
    },
    income_mix: {
      'income_low': [0.26, 0.36],
      'income_mid': [0.48, 0.58],
      'income_high': [0.12, 0.22]
    },
    household_mix: {
      'single_person': [0.26, 0.34],
      'couples_no_kids': [0.28, 0.38],
      'families_with_kids': [0.28, 0.38],
      'multi_gen_households': [0.06, 0.12]
    }
  },
  'West Midlands': {
    age_mix: {
      'age_18_24': [0.14, 0.20],
      'age_25_34': [0.22, 0.30],
      'age_35_54': [0.28, 0.36],
      'age_55_64': [0.14, 0.20],
      'age_65_plus': [0.14, 0.22]
    },
    income_mix: {
      'income_low': [0.28, 0.38],
      'income_mid': [0.48, 0.58],
      'income_high': [0.12, 0.20]
    },
    household_mix: {
      'single_person': [0.28, 0.36],
      'couples_no_kids': [0.24, 0.32],
      'families_with_kids': [0.32, 0.42],
      'multi_gen_households': [0.08, 0.14]
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function normalize(obj) {
  const sum = Object.values(obj).reduce((a, b) => a + b, 0);
  const normalized = {};
  Object.keys(obj).forEach(key => {
    normalized[key] = parseFloat((obj[key] / sum).toFixed(4));
  });
  return normalized;
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function classifyCluster(cluster) {
  const contexts = { transit: 0, office_core: 0, residential: 0, mixed: 0 };
  cluster.stores.forEach(s => {
    contexts[s.store_context] = (contexts[s.store_context] || 0) + 1;
  });

  const total = cluster.stores.length;
  const transitPct = contexts.transit / total;
  const officePct = contexts.office_core / total;
  const residentialPct = contexts.residential / total;

  if (transitPct > 0.6) return 'TRANSIT_HUB';
  if (officePct > 0.5) return 'OFFICE_DISTRICT';
  if (residentialPct > 0.7) return 'RESIDENTIAL';
  return 'MIXED';
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMOGRAPHIC GENERATION LOGIC
// ═══════════════════════════════════════════════════════════════════════════

function generateAgeMix(clusterType, region) {
  const ranges = REGION_DEMOGRAPHIC_RANGES[region].age_mix;
  const ageMix = {};

  // Start with region baseline
  Object.keys(ranges).forEach(ageGroup => {
    const [min, max] = ranges[ageGroup];
    ageMix[ageGroup] = randomInRange(min, max);
  });

  // Adjust based on cluster type
  if (clusterType === 'TRANSIT_HUB') {
    ageMix.age_18_24 *= 1.25;
    ageMix.age_25_34 *= 1.30;
    ageMix.age_55_64 *= 0.60;
    ageMix.age_65_plus *= 0.40;
  } else if (clusterType === 'OFFICE_DISTRICT') {
    ageMix.age_25_34 *= 1.35;
    ageMix.age_35_54 *= 1.15;
    ageMix.age_18_24 *= 0.80;
    ageMix.age_65_plus *= 0.50;
  } else if (clusterType === 'RESIDENTIAL') {
    ageMix.age_35_54 *= 1.15;
    ageMix.age_55_64 *= 1.20;
    ageMix.age_65_plus *= 1.25;
    ageMix.age_18_24 *= 0.75;
  }

  return normalize(ageMix);
}

function generateIncomeMix(clusterType, region, hasPremiumRetailers, discounterPct) {
  const ranges = REGION_DEMOGRAPHIC_RANGES[region].income_mix;
  const incomeMix = {};

  // Start with region baseline
  Object.keys(ranges).forEach(incomeLevel => {
    const [min, max] = ranges[incomeLevel];
    incomeMix[incomeLevel] = randomInRange(min, max);
  });

  // Adjust based on retailer mix
  if (hasPremiumRetailers) {
    incomeMix.income_high *= 1.40;
    incomeMix.income_low *= 0.70;
  }

  if (discounterPct > 0.4) {
    incomeMix.income_low *= 1.30;
    incomeMix.income_high *= 0.75;
  }

  // Transit hubs tend to be more affluent (commuters)
  if (clusterType === 'TRANSIT_HUB' || clusterType === 'OFFICE_DISTRICT') {
    incomeMix.income_mid *= 1.15;
    incomeMix.income_high *= 1.10;
  }

  return normalize(incomeMix);
}

function generateHouseholdMix(clusterType, region, ageMix) {
  const ranges = REGION_DEMOGRAPHIC_RANGES[region].household_mix;
  const householdMix = {};

  // Start with region baseline
  Object.keys(ranges).forEach(householdType => {
    const [min, max] = ranges[householdType];
    householdMix[householdType] = randomInRange(min, max);
  });

  // Adjust based on cluster type
  if (clusterType === 'TRANSIT_HUB') {
    householdMix.single_person *= 1.40;
    householdMix.families_with_kids *= 0.60;
  } else if (clusterType === 'OFFICE_DISTRICT') {
    householdMix.single_person *= 1.30;
    householdMix.couples_no_kids *= 1.20;
    householdMix.families_with_kids *= 0.70;
  } else if (clusterType === 'RESIDENTIAL') {
    householdMix.families_with_kids *= 1.30;
    householdMix.single_person *= 0.80;
  }

  // Age-based adjustments
  if (ageMix.age_65_plus > 0.20) {
    householdMix.couples_no_kids *= 1.25;
    householdMix.families_with_kids *= 0.80;
  }

  return normalize(householdMix);
}

function generateDaytimeMix(clusterType, region) {
  let daytimeMix = {
    'local_residents_share': 0.60,
    'daily_commuters_share': 0.20,
    'office_workers_share': 0.15,
    'students_share': 0.05,
    'tourists_share': 0.05
  };

  // TRANSIT_HUB: extremely high commuters + tourists
  if (clusterType === 'TRANSIT_HUB') {
    daytimeMix.local_residents_share = randomInRange(0.10, 0.20);
    daytimeMix.daily_commuters_share = randomInRange(0.45, 0.60);
    daytimeMix.office_workers_share = randomInRange(0.15, 0.25);
    daytimeMix.students_share = randomInRange(0.08, 0.15);
    daytimeMix.tourists_share = randomInRange(0.15, 0.30);
  }
  // OFFICE_DISTRICT: high office workers + commuters
  else if (clusterType === 'OFFICE_DISTRICT') {
    daytimeMix.local_residents_share = randomInRange(0.15, 0.25);
    daytimeMix.daily_commuters_share = randomInRange(0.30, 0.45);
    daytimeMix.office_workers_share = randomInRange(0.45, 0.60);
    daytimeMix.students_share = randomInRange(0.03, 0.08);
    daytimeMix.tourists_share = randomInRange(0.03, 0.10);
  }
  // RESIDENTIAL: mostly local residents
  else if (clusterType === 'RESIDENTIAL') {
    daytimeMix.local_residents_share = randomInRange(0.75, 0.90);
    daytimeMix.daily_commuters_share = randomInRange(0.05, 0.12);
    daytimeMix.office_workers_share = randomInRange(0.03, 0.08);
    daytimeMix.students_share = randomInRange(0.02, 0.06);
    daytimeMix.tourists_share = randomInRange(0.01, 0.05);
  }
  // MIXED: balanced
  else {
    daytimeMix.local_residents_share = randomInRange(0.45, 0.60);
    daytimeMix.daily_commuters_share = randomInRange(0.25, 0.38);
    daytimeMix.office_workers_share = randomInRange(0.15, 0.28);
    daytimeMix.students_share = randomInRange(0.05, 0.12);
    daytimeMix.tourists_share = randomInRange(0.03, 0.10);
  }

  // London boost for commuters/tourists
  if (region === 'London') {
    daytimeMix.daily_commuters_share *= 1.25;
    daytimeMix.tourists_share *= 1.80;
    daytimeMix.local_residents_share *= 0.80;
  }

  // Normalize to ~1.0-1.2 (overlap allowed)
  const sum = Object.values(daytimeMix).reduce((a, b) => a + b, 0);
  Object.keys(daytimeMix).forEach(key => {
    daytimeMix[key] = parseFloat((daytimeMix[key] / sum).toFixed(4));
  });

  return daytimeMix;
}

function generateDensityLandUse(clusterType, region, conveniencePct) {
  let densityLandUse = {
    'density_index': 0.50,
    'land_use_office': 0.20,
    'land_use_residential': 0.50,
    'land_use_transit': 0.10,
    'land_use_retail': 0.20
  };

  // TRANSIT_HUB: high density, high transit
  if (clusterType === 'TRANSIT_HUB') {
    densityLandUse.density_index = randomInRange(0.85, 0.95);
    densityLandUse.land_use_transit = randomInRange(0.35, 0.45);
    densityLandUse.land_use_office = randomInRange(0.25, 0.35);
    densityLandUse.land_use_residential = randomInRange(0.15, 0.25);
    densityLandUse.land_use_retail = randomInRange(0.08, 0.15);
  }
  // OFFICE_DISTRICT: high density, high office
  else if (clusterType === 'OFFICE_DISTRICT') {
    densityLandUse.density_index = randomInRange(0.80, 0.92);
    densityLandUse.land_use_office = randomInRange(0.45, 0.58);
    densityLandUse.land_use_residential = randomInRange(0.15, 0.25);
    densityLandUse.land_use_transit = randomInRange(0.12, 0.20);
    densityLandUse.land_use_retail = randomInRange(0.12, 0.18);
  }
  // RESIDENTIAL: lower density, high residential
  else if (clusterType === 'RESIDENTIAL') {
    densityLandUse.density_index = region === 'London' ? randomInRange(0.55, 0.70) : randomInRange(0.30, 0.45);
    densityLandUse.land_use_residential = randomInRange(0.65, 0.78);
    densityLandUse.land_use_office = randomInRange(0.05, 0.12);
    densityLandUse.land_use_transit = randomInRange(0.03, 0.08);
    densityLandUse.land_use_retail = randomInRange(0.12, 0.20);
  }
  // MIXED
  else {
    densityLandUse.density_index = randomInRange(0.50, 0.68);
    densityLandUse.land_use_residential = randomInRange(0.40, 0.52);
    densityLandUse.land_use_office = randomInRange(0.18, 0.28);
    densityLandUse.land_use_transit = randomInRange(0.10, 0.18);
    densityLandUse.land_use_retail = randomInRange(0.15, 0.25);
  }

  // High convenience count → more retail
  if (conveniencePct > 0.6) {
    densityLandUse.land_use_retail = Math.min(0.35, densityLandUse.land_use_retail * 1.25);
  }

  // Normalize land_use (not density_index)
  const landUseSum = densityLandUse.land_use_office +
                     densityLandUse.land_use_residential +
                     densityLandUse.land_use_transit +
                     densityLandUse.land_use_retail;

  densityLandUse.land_use_office = parseFloat((densityLandUse.land_use_office / landUseSum).toFixed(4));
  densityLandUse.land_use_residential = parseFloat((densityLandUse.land_use_residential / landUseSum).toFixed(4));
  densityLandUse.land_use_transit = parseFloat((densityLandUse.land_use_transit / landUseSum).toFixed(4));
  densityLandUse.land_use_retail = parseFloat((densityLandUse.land_use_retail / landUseSum).toFixed(4));
  densityLandUse.density_index = parseFloat(densityLandUse.density_index.toFixed(4));

  return densityLandUse;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateClusterPopulation() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('FILE 2 — CLUSTER POPULATION GENERATION');
  console.log('═══════════════════════════════════════════════════\n');

  // Load stores from File 1
  const storesPath = path.join(__dirname, '../data/1-stores.json');
  const stores = JSON.parse(fs.readFileSync(storesPath, 'utf-8'));

  console.log(`Loaded ${stores.length} stores from File 1`);

  // Group stores by cluster_id
  const clusterMap = {};
  stores.forEach(store => {
    if (!clusterMap[store.cluster_id]) {
      clusterMap[store.cluster_id] = {
        cluster_id: store.cluster_id,
        stores: [],
        region: store.region
      };
    }
    clusterMap[store.cluster_id].stores.push(store);
  });

  const clusters = Object.values(clusterMap);
  console.log(`Grouped into ${clusters.length} clusters\n`);

  // Generate demographics for each cluster
  const clusterPopulations = [];

  clusters.forEach((cluster, idx) => {
    const clusterType = classifyCluster(cluster);
    const region = cluster.region;
    const storeCount = cluster.stores.length;

    // Calculate retailer metrics
    const premiumRetailers = ['Waitrose', 'M&S Food'];
    const discounterRetailers = ['Aldi', 'Lidl'];
    const hasPremiumRetailers = cluster.stores.some(s => premiumRetailers.includes(s.retailer));
    const discounterCount = cluster.stores.filter(s => discounterRetailers.includes(s.retailer)).length;
    const discounterPct = discounterCount / storeCount;
    const convenienceCount = cluster.stores.filter(s => s.format === 'Convenience').length;
    const conveniencePct = convenienceCount / storeCount;

    // Generate all demographic components
    const ageMix = generateAgeMix(clusterType, region);
    const incomeMix = generateIncomeMix(clusterType, region, hasPremiumRetailers, discounterPct);
    const householdMix = generateHouseholdMix(clusterType, region, ageMix);
    const daytimeMix = generateDaytimeMix(clusterType, region);
    const densityLandUse = generateDensityLandUse(clusterType, region, conveniencePct);

    // Combine into demographic_mix
    const demographic_mix = {
      ...ageMix,
      ...incomeMix,
      ...householdMix,
      ...daytimeMix,
      ...densityLandUse
    };

    clusterPopulations.push({
      cluster_id: cluster.cluster_id,
      store_count: storeCount,
      cluster_type: clusterType,
      demographic_mix
    });

    if ((idx + 1) % 10 === 0) {
      console.log(`Generated demographics for ${idx + 1}/${clusters.length} clusters...`);
    }
  });

  console.log(`\n✅ Generated demographics for all ${clusterPopulations.length} clusters\n`);

  // Write to file
  const outputPath = path.join(__dirname, '../data/cluster-population.json');
  fs.writeFileSync(outputPath, JSON.stringify(clusterPopulations, null, 2));

  const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`📁 Wrote: data/cluster-population.json (${fileSizeMB} MB)`);
  console.log(`📊 Total clusters: ${clusterPopulations.length}\n`);

  return clusterPopulations;
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

generateClusterPopulation().then(() => {
  console.log('✅ File 2 generation complete\n');
}).catch(err => {
  console.error('❌ Error generating File 2:', err);
  process.exit(1);
});
