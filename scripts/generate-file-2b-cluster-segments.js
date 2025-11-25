#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// FILE 2B GENERATION: CLUSTER SEGMENTS
// ═══════════════════════════════════════════════════════════════════════════
// Converts universal demographics (File 2) into category-specific segments
// using weighted scoring + softmax/sigmoid

// ═══════════════════════════════════════════════════════════════════════════
// SEGMENT WEIGHT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const BEER_WEIGHTS = {
  mindful_moderators: {
    age_18_24: 0.3, age_25_34: 1.4, age_35_54: 0.6, age_55_64: -0.2, age_65_plus: -0.4,
    income_low: -0.6, income_mid: 0.3, income_high: 1.2,
    single_person: 0.5, couples_no_kids: 0.8, families_with_kids: -0.3, multi_gen_households: -0.2,
    local_residents_share: -0.1, daily_commuters_share: 0.4, office_workers_share: 0.9, students_share: 0.2, tourists_share: 0.1,
    land_use_office: 0.6, land_use_residential: 0.0, land_use_transit: 0.3, land_use_retail: 0.4,
    density_index: 0.7,
    bias: -0.3,
  },
  premium_crafters: {
    age_18_24: 0.4, age_25_34: 1.2, age_35_54: 1.0, age_55_64: 0.2, age_65_plus: -0.3,
    income_low: -1.0, income_mid: 0.2, income_high: 1.6,
    single_person: 0.4, couples_no_kids: 0.9, families_with_kids: 0.1, multi_gen_households: -0.2,
    local_residents_share: 0.2, daily_commuters_share: 0.3, office_workers_share: 0.5, students_share: 0.1, tourists_share: 0.4,
    land_use_office: 0.3, land_use_residential: 0.2, land_use_transit: 0.2, land_use_retail: 0.8,
    density_index: 0.9,
    bias: 0.1,
  },
  social_sessionists: {
    age_18_24: 1.6, age_25_34: 1.0, age_35_54: 0.0, age_55_64: -0.5, age_65_plus: -0.8,
    income_low: 0.2, income_mid: 0.4, income_high: 0.3,
    single_person: 1.0, couples_no_kids: 0.4, families_with_kids: -0.4, multi_gen_households: -0.2,
    local_residents_share: -0.2, daily_commuters_share: 0.5, office_workers_share: 0.3, students_share: 1.4, tourists_share: 1.0,
    land_use_office: 0.2, land_use_residential: -0.3, land_use_transit: 1.0, land_use_retail: 0.6,
    density_index: 0.8,
    bias: 0.2,
  },
  mainstream_loyalists: {
    age_18_24: -0.4, age_25_34: 0.1, age_35_54: 1.0, age_55_64: 0.9, age_65_plus: 0.6,
    income_low: 0.3, income_mid: 0.8, income_high: -0.2,
    single_person: -0.3, couples_no_kids: 0.2, families_with_kids: 1.2, multi_gen_households: 0.5,
    local_residents_share: 1.0, daily_commuters_share: -0.1, office_workers_share: -0.2, students_share: -0.5, tourists_share: -0.4,
    land_use_office: -0.4, land_use_residential: 1.0, land_use_transit: -0.3, land_use_retail: 0.2,
    density_index: -0.5,
    bias: 0.3,
  },
  value_seekers: {
    age_18_24: 0.2, age_25_34: 0.1, age_35_54: 0.4, age_55_64: 0.5, age_65_plus: 0.4,
    income_low: 1.6, income_mid: 0.4, income_high: -1.0,
    single_person: 0.2, couples_no_kids: 0.0, families_with_kids: 0.8, multi_gen_households: 0.9,
    local_residents_share: 0.7, daily_commuters_share: 0.0, office_workers_share: -0.3, students_share: 0.3, tourists_share: -0.3,
    land_use_office: -0.4, land_use_residential: 0.6, land_use_transit: 0.0, land_use_retail: 0.1,
    density_index: -0.3,
    bias: 0.0,
  },
};

const BEAUTY_WEIGHTS = {
  clean_conscious: {
    age_18_24: 0.5, age_25_34: 1.3, age_35_54: 0.7, age_55_64: 0.0, age_65_plus: -0.4,
    income_low: -0.3, income_mid: 0.6, income_high: 1.0,
    single_person: 0.5, couples_no_kids: 0.7, families_with_kids: 0.4, multi_gen_households: 0.0,
    local_residents_share: 0.2, daily_commuters_share: 0.4, office_workers_share: 0.8, students_share: 0.3, tourists_share: 0.0,
    land_use_office: 0.5, land_use_residential: 0.3, land_use_transit: 0.1, land_use_retail: 0.5,
    density_index: 0.5,
    bias: 0.1,
  },
  prestige_devotees: {
    age_18_24: 0.0, age_25_34: 0.8, age_35_54: 1.3, age_55_64: 0.6, age_65_plus: 0.2,
    income_low: -1.2, income_mid: 0.0, income_high: 1.8,
    single_person: 0.3, couples_no_kids: 1.0, families_with_kids: 0.2, multi_gen_households: 0.0,
    local_residents_share: 0.3, daily_commuters_share: 0.2, office_workers_share: 0.6, students_share: -0.3, tourists_share: 0.5,
    land_use_office: 0.4, land_use_residential: 0.4, land_use_transit: 0.1, land_use_retail: 0.9,
    density_index: 0.7,
    bias: -0.1,
  },
  skintellectuals: {
    age_18_24: 0.6, age_25_34: 1.5, age_35_54: 0.5, age_55_64: -0.1, age_65_plus: -0.4,
    income_low: -0.2, income_mid: 0.5, income_high: 1.2,
    single_person: 0.9, couples_no_kids: 0.6, families_with_kids: -0.2, multi_gen_households: -0.1,
    local_residents_share: 0.0, daily_commuters_share: 0.3, office_workers_share: 0.7, students_share: 1.0, tourists_share: 0.1,
    land_use_office: 0.6, land_use_residential: 0.1, land_use_transit: 0.3, land_use_retail: 0.4,
    density_index: 0.8,
    bias: 0.0,
  },
  glow_chasers: {
    age_18_24: 1.6, age_25_34: 1.1, age_35_54: -0.1, age_55_64: -0.6, age_65_plus: -0.8,
    income_low: 0.1, income_mid: 0.5, income_high: 0.6,
    single_person: 1.0, couples_no_kids: 0.4, families_with_kids: -0.5, multi_gen_households: -0.3,
    local_residents_share: -0.2, daily_commuters_share: 0.4, office_workers_share: 0.3, students_share: 1.3, tourists_share: 0.9,
    land_use_office: 0.2, land_use_residential: -0.3, land_use_transit: 0.8, land_use_retail: 0.7,
    density_index: 1.0,
    bias: 0.1,
  },
  low_maintenance_minimalists: {
    age_18_24: -0.5, age_25_34: -0.2, age_35_54: 0.3, age_55_64: 1.1, age_65_plus: 1.4,
    income_low: 0.7, income_mid: 0.6, income_high: -0.4,
    single_person: 0.2, couples_no_kids: 0.4, families_with_kids: 0.5, multi_gen_households: 0.4,
    local_residents_share: 1.0, daily_commuters_share: -0.2, office_workers_share: -0.4, students_share: -0.5, tourists_share: -0.3,
    land_use_office: -0.5, land_use_residential: 1.0, land_use_transit: -0.3, land_use_retail: 0.0,
    density_index: -0.6,
    bias: 0.2,
  },
};

const HOME_WEIGHTS = {
  germ_defenders: {
    age_18_24: -0.2, age_25_34: 0.4, age_35_54: 1.1, age_55_64: 0.6, age_65_plus: 0.4,
    income_low: 0.2, income_mid: 0.6, income_high: 0.4,
    single_person: -0.2, couples_no_kids: 0.1, families_with_kids: 1.4, multi_gen_households: 1.0,
    local_residents_share: 0.8, daily_commuters_share: 0.0, office_workers_share: 0.1, students_share: -0.3, tourists_share: -0.2,
    land_use_office: -0.2, land_use_residential: 0.9, land_use_transit: -0.2, land_use_retail: 0.1,
    density_index: 0.1,
    bias: 0.2,
  },
  clean_living_advocates: {
    age_18_24: 0.3, age_25_34: 1.3, age_35_54: 0.9, age_55_64: 0.1, age_65_plus: -0.3,
    income_low: -0.8, income_mid: 0.3, income_high: 1.4,
    single_person: 0.4, couples_no_kids: 1.0, families_with_kids: 0.5, multi_gen_households: 0.0,
    local_residents_share: 0.3, daily_commuters_share: 0.3, office_workers_share: 0.7, students_share: 0.2, tourists_share: 0.0,
    land_use_office: 0.4, land_use_residential: 0.5, land_use_transit: 0.0, land_use_retail: 0.5,
    density_index: 0.6,
    bias: 0.0,
  },
  sensory_homemakers: {
    age_18_24: 0.1, age_25_34: 0.7, age_35_54: 1.1, age_55_64: 0.5, age_65_plus: 0.2,
    income_low: -0.5, income_mid: 0.4, income_high: 1.2,
    single_person: 0.3, couples_no_kids: 1.1, families_with_kids: 0.3, multi_gen_households: 0.1,
    local_residents_share: 0.5, daily_commuters_share: 0.1, office_workers_share: 0.3, students_share: -0.2, tourists_share: 0.2,
    land_use_office: 0.1, land_use_residential: 0.8, land_use_transit: -0.1, land_use_retail: 0.5,
    density_index: 0.4,
    bias: 0.0,
  },
  family_protectors: {
    age_18_24: -0.4, age_25_34: 0.6, age_35_54: 1.2, age_55_64: 0.3, age_65_plus: 0.0,
    income_low: 0.3, income_mid: 0.8, income_high: 0.2,
    single_person: -0.6, couples_no_kids: -0.1, families_with_kids: 1.6, multi_gen_households: 1.0,
    local_residents_share: 1.0, daily_commuters_share: -0.1, office_workers_share: -0.2, students_share: -0.4, tourists_share: -0.3,
    land_use_office: -0.4, land_use_residential: 1.1, land_use_transit: -0.3, land_use_retail: 0.1,
    density_index: -0.3,
    bias: 0.1,
  },
  functional_pragmatists: {
    age_18_24: 0.0, age_25_34: -0.1, age_35_54: 0.3, age_55_64: 0.9, age_65_plus: 1.2,
    income_low: 1.2, income_mid: 0.6, income_high: -0.8,
    single_person: 0.4, couples_no_kids: 0.3, families_with_kids: 0.2, multi_gen_households: 0.5,
    local_residents_share: 0.9, daily_commuters_share: -0.1, office_workers_share: -0.4, students_share: 0.1, tourists_share: -0.2,
    land_use_office: -0.5, land_use_residential: 0.8, land_use_transit: -0.2, land_use_retail: 0.0,
    density_index: -0.5,
    bias: 0.1,
  },
};

const EXTENSION_FUNCTIONAL_BEVERAGES = {
  age_18_24: 0.6, age_25_34: 1.2, age_35_54: 0.4, age_55_64: -0.2, age_65_plus: -0.5,
  income_low: -0.4, income_mid: 0.3, income_high: 1.0,
  single_person: 0.5, couples_no_kids: 0.6, families_with_kids: 0.2, multi_gen_households: -0.1,
  local_residents_share: 0.0, daily_commuters_share: 0.5, office_workers_share: 0.8, students_share: 0.6, tourists_share: 0.3,
  land_use_office: 0.5, land_use_residential: 0.1, land_use_transit: 0.6, land_use_retail: 0.4,
  density_index: 0.7,
  bias: -0.5,
};

const EXTENSION_NUTRACEUTICALS = {
  age_18_24: 0.3, age_25_34: 1.1, age_35_54: 0.9, age_55_64: 0.4, age_65_plus: 0.1,
  income_low: -0.6, income_mid: 0.3, income_high: 1.3,
  single_person: 0.4, couples_no_kids: 0.7, families_with_kids: 0.3, multi_gen_households: 0.1,
  local_residents_share: 0.2, daily_commuters_share: 0.3, office_workers_share: 0.7, students_share: 0.4, tourists_share: 0.1,
  land_use_office: 0.5, land_use_residential: 0.3, land_use_transit: 0.2, land_use_retail: 0.5,
  density_index: 0.6,
  bias: -0.6,
};

const EXTENSION_HOME_WELLNESS = {
  age_18_24: 0.1, age_25_34: 0.9, age_35_54: 1.0, age_55_64: 0.4, age_65_plus: 0.1,
  income_low: -0.5, income_mid: 0.4, income_high: 1.1,
  single_person: 0.2, couples_no_kids: 0.6, families_with_kids: 0.9, multi_gen_households: 0.4,
  local_residents_share: 0.6, daily_commuters_share: 0.1, office_workers_share: 0.3, students_share: 0.0, tourists_share: -0.1,
  land_use_office: 0.1, land_use_residential: 0.8, land_use_transit: -0.1, land_use_retail: 0.3,
  density_index: 0.3,
  bias: -0.4,
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function computeScore(demographics, weights) {
  let score = weights.bias;

  const fields = [
    'age_18_24', 'age_25_34', 'age_35_54', 'age_55_64', 'age_65_plus',
    'income_low', 'income_mid', 'income_high',
    'single_person', 'couples_no_kids', 'families_with_kids', 'multi_gen_households',
    'local_residents_share', 'daily_commuters_share', 'office_workers_share', 'students_share', 'tourists_share',
    'land_use_office', 'land_use_residential', 'land_use_transit', 'land_use_retail',
    'density_index'
  ];

  for (const field of fields) {
    score += demographics[field] * weights[field];
  }

  return score;
}

function softmax(scores) {
  const entries = Object.entries(scores);
  const maxScore = Math.max(...entries.map(([_, s]) => s));

  let sumExp = 0;
  for (const [_, score] of entries) {
    sumExp += Math.exp(score - maxScore);
  }

  const probs = {};
  for (const [name, score] of entries) {
    probs[name] = Math.exp(score - maxScore) / sumExp;
  }

  return probs;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function seededNoise(clusterId, key, scale = 0.05) {
  const seed = hashCode(clusterId + key);
  const random = seededRandom(seed);
  return (random - 0.5) * 2 * scale;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateFile2B() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('FILE 2B GENERATION: CLUSTER SEGMENTS');
  console.log('═══════════════════════════════════════════════════\n');

  // Load File 2
  const file2Path = path.join(__dirname, '../data/cluster-population.json');
  const clusters = JSON.parse(fs.readFileSync(file2Path, 'utf-8'));

  console.log(`Loaded ${clusters.length} clusters from File 2\n`);

  const file2bRecords = [];

  clusters.forEach((cluster, idx) => {
    const demographics = cluster.demographic_mix;

    // Generate Beer segments
    const beerScores = {};
    for (const [segment, weights] of Object.entries(BEER_WEIGHTS)) {
      let score = computeScore(demographics, weights);
      // Add small noise for variation
      score += seededNoise(cluster.cluster_id, `beer_${segment}`, 0.03);
      beerScores[segment] = score;
    }
    const beerProbs = softmax(beerScores);

    // Generate Beauty segments
    const beautyScores = {};
    for (const [segment, weights] of Object.entries(BEAUTY_WEIGHTS)) {
      let score = computeScore(demographics, weights);
      score += seededNoise(cluster.cluster_id, `beauty_${segment}`, 0.03);
      beautyScores[segment] = score;
    }
    const beautyProbs = softmax(beautyScores);

    // Generate Home segments
    const homeScores = {};
    for (const [segment, weights] of Object.entries(HOME_WEIGHTS)) {
      let score = computeScore(demographics, weights);
      score += seededNoise(cluster.cluster_id, `home_${segment}`, 0.03);
      homeScores[segment] = score;
    }
    const homeProbs = softmax(homeScores);

    // Generate extension propensities (using sigmoid)
    const funcBevScore = computeScore(demographics, EXTENSION_FUNCTIONAL_BEVERAGES) + seededNoise(cluster.cluster_id, 'ext_funcbev', 0.03);
    const nutraScore = computeScore(demographics, EXTENSION_NUTRACEUTICALS) + seededNoise(cluster.cluster_id, 'ext_nutra', 0.03);
    const homeWellnessScore = computeScore(demographics, EXTENSION_HOME_WELLNESS) + seededNoise(cluster.cluster_id, 'ext_homewellness', 0.03);

    const extensionPropensity = {
      functional_beverages: parseFloat(sigmoid(funcBevScore).toFixed(4)),
      nutraceuticals: parseFloat(sigmoid(nutraScore).toFixed(4)),
      home_wellness: parseFloat(sigmoid(homeWellnessScore).toFixed(4)),
    };

    // Round probabilities to 4 decimals
    const roundProbs = (obj) => {
      const rounded = {};
      for (const [k, v] of Object.entries(obj)) {
        rounded[k] = parseFloat(v.toFixed(4));
      }
      return rounded;
    };

    file2bRecords.push({
      cluster_id: cluster.cluster_id,
      segments: {
        beer: roundProbs(beerProbs),
        beauty: roundProbs(beautyProbs),
        home: roundProbs(homeProbs),
      },
      extension_propensity: extensionPropensity,
    });

    if ((idx + 1) % 10 === 0) {
      console.log(`Generated segments for ${idx + 1}/${clusters.length} clusters...`);
    }
  });

  console.log(`\n✅ Generated segments for all ${file2bRecords.length} clusters\n`);

  // Write to file
  const outputPath = path.join(__dirname, '../data/2b-cluster-segments.json');
  fs.writeFileSync(outputPath, JSON.stringify(file2bRecords, null, 2));

  const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`📁 Wrote: data/2b-cluster-segments.json (${fileSizeMB} MB)`);
  console.log(`📊 Total clusters: ${file2bRecords.length}\n`);

  return file2bRecords;
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

generateFile2B().then(() => {
  console.log('✅ File 2B generation complete\n');
}).catch(err => {
  console.error('❌ Error generating File 2B:', err);
  process.exit(1);
});
