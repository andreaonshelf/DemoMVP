/**
 * Generate Customer Profiles for stores.json
 *
 * Applies retailer + format + region + demographic modifiers
 * to create realistic customer profiles that vary by store context.
 *
 * CRITICAL: This generates store.customerProfile (10 beer buyer segments),
 * NOT based on catchmentPopulation.demographics (which contains household types).
 */

const fs = require('fs');
const path = require('path');

// Load stores data
const storesPath = path.join(__dirname, '../data/stores.json');
const stores = JSON.parse(fs.readFileSync(storesPath, 'utf8'));

// Segment names (10 beer buyer personas)
const SEGMENTS = [
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

// National baseline (equal starting point - will be heavily modified)
const NATIONAL_BASELINE = {
  "Premium Craft Enthusiasts": 10,
  "Mainstream Family Buyers": 10,
  "Value-Driven Households": 10,
  "Social Party Hosts": 10,
  "Traditional Real Ale Fans": 10,
  "Student Budget Shoppers": 10,
  "Convenience On-The-Go": 10,
  "Occasional Special Buyers": 10,
  "Health-Conscious Moderates": 10,
  "Sports & Social Drinkers": 10
};

// Retailer base rates (EXTREME for polarization)
const RETAILER_BASE_RATES = {
  "Waitrose": {
    "Premium Craft Enthusiasts": 2.20,
    "Mainstream Family Buyers": 0.50,
    "Value-Driven Households": 0.05,
    "Social Party Hosts": 0.70,
    "Traditional Real Ale Fans": 0.40,
    "Student Budget Shoppers": 0.03,
    "Convenience On-The-Go": 0.15,
    "Occasional Special Buyers": 1.40,
    "Health-Conscious Moderates": 2.00,
    "Sports & Social Drinkers": 0.35
  },
  "M&S Food": {
    "Premium Craft Enthusiasts": 2.00,
    "Mainstream Family Buyers": 0.55,
    "Value-Driven Households": 0.08,
    "Social Party Hosts": 0.65,
    "Traditional Real Ale Fans": 0.38,
    "Student Budget Shoppers": 0.05,
    "Convenience On-The-Go": 0.18,
    "Occasional Special Buyers": 1.50,
    "Health-Conscious Moderates": 1.90,
    "Sports & Social Drinkers": 0.32
  },
  "Sainsbury's": {
    "Premium Craft Enthusiasts": 0.85,
    "Mainstream Family Buyers": 1.20,
    "Value-Driven Households": 0.45,
    "Social Party Hosts": 0.80,
    "Traditional Real Ale Fans": 0.70,
    "Student Budget Shoppers": 0.40,
    "Convenience On-The-Go": 0.50,
    "Occasional Special Buyers": 0.80,
    "Health-Conscious Moderates": 1.00,
    "Sports & Social Drinkers": 0.75
  },
  "Tesco": {
    "Premium Craft Enthusiasts": 0.55,
    "Mainstream Family Buyers": 1.80,
    "Value-Driven Households": 0.90,
    "Social Party Hosts": 0.75,
    "Traditional Real Ale Fans": 0.75,
    "Student Budget Shoppers": 0.70,
    "Convenience On-The-Go": 0.55,
    "Occasional Special Buyers": 0.60,
    "Health-Conscious Moderates": 0.75,
    "Sports & Social Drinkers": 1.10
  },
  "Asda": {
    "Premium Craft Enthusiasts": 0.15,
    "Mainstream Family Buyers": 1.50,
    "Value-Driven Households": 2.00,
    "Social Party Hosts": 0.70,
    "Traditional Real Ale Fans": 0.70,
    "Student Budget Shoppers": 1.60,
    "Convenience On-The-Go": 0.30,
    "Occasional Special Buyers": 0.35,
    "Health-Conscious Moderates": 0.40,
    "Sports & Social Drinkers": 0.80
  },
  "Morrisons": {
    "Premium Craft Enthusiasts": 0.20,
    "Mainstream Family Buyers": 1.40,
    "Value-Driven Households": 1.90,
    "Social Party Hosts": 0.65,
    "Traditional Real Ale Fans": 0.75,
    "Student Budget Shoppers": 1.50,
    "Convenience On-The-Go": 0.35,
    "Occasional Special Buyers": 0.40,
    "Health-Conscious Moderates": 0.45,
    "Sports & Social Drinkers": 0.90
  },
  "Aldi": {
    "Premium Craft Enthusiasts": 0.08,
    "Mainstream Family Buyers": 1.20,
    "Value-Driven Households": 2.50,
    "Social Party Hosts": 0.60,
    "Traditional Real Ale Fans": 0.50,
    "Student Budget Shoppers": 2.00,
    "Convenience On-The-Go": 0.15,
    "Occasional Special Buyers": 0.20,
    "Health-Conscious Moderates": 0.25,
    "Sports & Social Drinkers": 0.70
  },
  "Lidl": {
    "Premium Craft Enthusiasts": 0.08,
    "Mainstream Family Buyers": 1.20,
    "Value-Driven Households": 2.50,
    "Social Party Hosts": 0.60,
    "Traditional Real Ale Fans": 0.50,
    "Student Budget Shoppers": 2.00,
    "Convenience On-The-Go": 0.15,
    "Occasional Special Buyers": 0.20,
    "Health-Conscious Moderates": 0.25,
    "Sports & Social Drinkers": 0.70
  },
  "Iceland": {
    "Premium Craft Enthusiasts": 0.12,
    "Mainstream Family Buyers": 1.30,
    "Value-Driven Households": 2.20,
    "Social Party Hosts": 0.65,
    "Traditional Real Ale Fans": 0.60,
    "Student Budget Shoppers": 1.80,
    "Convenience On-The-Go": 0.22,
    "Occasional Special Buyers": 0.25,
    "Health-Conscious Moderates": 0.30,
    "Sports & Social Drinkers": 0.80
  },
  "Co-op": {
    "Premium Craft Enthusiasts": 0.45,
    "Mainstream Family Buyers": 0.60,
    "Value-Driven Households": 0.50,
    "Social Party Hosts": 0.55,
    "Traditional Real Ale Fans": 0.60,
    "Student Budget Shoppers": 0.65,
    "Convenience On-The-Go": 2.50,
    "Occasional Special Buyers": 0.50,
    "Health-Conscious Moderates": 0.55,
    "Sports & Social Drinkers": 0.70
  }
};

// Default for unknown retailers
const DEFAULT_RETAILER_RATES = RETAILER_BASE_RATES["Co-op"];

// Format modifiers (EXTREME for polarization)
const FORMAT_MODIFIERS = {
  "Hypermarket": {
    "Premium Craft Enthusiasts": 0.70,
    "Mainstream Family Buyers": 2.00,
    "Value-Driven Households": 1.80,
    "Social Party Hosts": 1.50,
    "Traditional Real Ale Fans": 1.00,
    "Student Budget Shoppers": 1.60,
    "Convenience On-The-Go": 0.25,
    "Occasional Special Buyers": 0.80,
    "Health-Conscious Moderates": 0.90,
    "Sports & Social Drinkers": 1.60
  },
  "Supermarket": {
    "Premium Craft Enthusiasts": 1.00,
    "Mainstream Family Buyers": 1.00,
    "Value-Driven Households": 1.00,
    "Social Party Hosts": 1.00,
    "Traditional Real Ale Fans": 1.00,
    "Student Budget Shoppers": 1.00,
    "Convenience On-The-Go": 1.00,
    "Occasional Special Buyers": 1.00,
    "Health-Conscious Moderates": 1.00,
    "Sports & Social Drinkers": 1.00
  },
  "Convenience": {
    "Premium Craft Enthusiasts": 0.40,
    "Mainstream Family Buyers": 0.35,
    "Value-Driven Households": 0.45,
    "Social Party Hosts": 0.60,
    "Traditional Real Ale Fans": 0.50,
    "Student Budget Shoppers": 0.70,
    "Convenience On-The-Go": 3.00,
    "Occasional Special Buyers": 0.50,
    "Health-Conscious Moderates": 0.50,
    "Sports & Social Drinkers": 0.80
  },
  "Forecourt": {
    "Premium Craft Enthusiasts": 0.20,
    "Mainstream Family Buyers": 0.15,
    "Value-Driven Households": 0.25,
    "Social Party Hosts": 0.40,
    "Traditional Real Ale Fans": 0.30,
    "Student Budget Shoppers": 0.50,
    "Convenience On-The-Go": 4.00,
    "Occasional Special Buyers": 0.35,
    "Health-Conscious Moderates": 0.35,
    "Sports & Social Drinkers": 0.70
  }
};

// Region modifiers
const REGION_MODIFIERS = {
  "London": {
    "Premium Craft Enthusiasts": 1.25,
    "Mainstream Family Buyers": 0.95,
    "Value-Driven Households": 0.90,
    "Social Party Hosts": 1.15,
    "Traditional Real Ale Fans": 0.90,
    "Student Budget Shoppers": 1.10,
    "Convenience On-The-Go": 1.30,
    "Occasional Special Buyers": 1.10,
    "Health-Conscious Moderates": 1.20,
    "Sports & Social Drinkers": 1.00
  },
  "South": {
    "Premium Craft Enthusiasts": 1.10,
    "Mainstream Family Buyers": 1.00,
    "Value-Driven Households": 0.95,
    "Social Party Hosts": 1.05,
    "Traditional Real Ale Fans": 0.95,
    "Student Budget Shoppers": 1.00,
    "Convenience On-The-Go": 1.05,
    "Occasional Special Buyers": 1.05,
    "Health-Conscious Moderates": 1.10,
    "Sports & Social Drinkers": 1.00
  },
  "North": {
    "Premium Craft Enthusiasts": 0.90,
    "Mainstream Family Buyers": 1.05,
    "Value-Driven Households": 1.15,
    "Social Party Hosts": 0.95,
    "Traditional Real Ale Fans": 1.15,
    "Student Budget Shoppers": 1.00,
    "Convenience On-The-Go": 0.90,
    "Occasional Special Buyers": 0.95,
    "Health-Conscious Moderates": 0.90,
    "Sports & Social Drinkers": 1.15
  },
  "Midlands": {
    "Premium Craft Enthusiasts": 0.95,
    "Mainstream Family Buyers": 1.05,
    "Value-Driven Households": 1.05,
    "Social Party Hosts": 1.00,
    "Traditional Real Ale Fans": 1.05,
    "Student Budget Shoppers": 1.00,
    "Convenience On-The-Go": 0.95,
    "Occasional Special Buyers": 1.00,
    "Health-Conscious Moderates": 0.95,
    "Sports & Social Drinkers": 1.10
  },
  "Scotland": {
    "Premium Craft Enthusiasts": 0.92,
    "Mainstream Family Buyers": 1.00,
    "Value-Driven Households": 1.08,
    "Social Party Hosts": 0.98,
    "Traditional Real Ale Fans": 1.12,
    "Student Budget Shoppers": 1.05,
    "Convenience On-The-Go": 0.92,
    "Occasional Special Buyers": 0.98,
    "Health-Conscious Moderates": 0.95,
    "Sports & Social Drinkers": 1.12
  },
  "Wales": {
    "Premium Craft Enthusiasts": 0.88,
    "Mainstream Family Buyers": 1.02,
    "Value-Driven Households": 1.12,
    "Social Party Hosts": 0.96,
    "Traditional Real Ale Fans": 1.10,
    "Student Budget Shoppers": 1.02,
    "Convenience On-The-Go": 0.90,
    "Occasional Special Buyers": 0.96,
    "Health-Conscious Moderates": 0.92,
    "Sports & Social Drinkers": 1.08
  }
};

// Demographic environment modifiers (EXTREME for polarization)
const DEMOGRAPHIC_MODIFIERS = {
  "student-heavy": {
    "Student Budget Shoppers": 2.50,
    "Social Party Hosts": 1.80,
    "Convenience On-The-Go": 1.50,
    "Mainstream Family Buyers": 0.50,
    "Value-Driven Households": 0.60,
    "Premium Craft Enthusiasts": 0.60
  },
  "affluent": {
    "Premium Craft Enthusiasts": 2.20,
    "Health-Conscious Moderates": 1.90,
    "Occasional Special Buyers": 1.60,
    "Value-Driven Households": 0.30,
    "Student Budget Shoppers": 0.25
  },
  "low-income": {
    "Value-Driven Households": 2.30,
    "Student Budget Shoppers": 1.90,
    "Premium Craft Enthusiasts": 0.25,
    "Occasional Special Buyers": 0.30,
    "Health-Conscious Moderates": 0.40
  },
  "family-heavy": {
    "Mainstream Family Buyers": 2.00,
    "Value-Driven Households": 1.40,
    "Health-Conscious Moderates": 1.30,
    "Student Budget Shoppers": 0.40,
    "Convenience On-The-Go": 0.50,
    "Social Party Hosts": 0.60
  },
  "older": {
    "Traditional Real Ale Fans": 1.90,
    "Health-Conscious Moderates": 1.50,
    "Student Budget Shoppers": 0.25,
    "Social Party Hosts": 0.40,
    "Convenience On-The-Go": 0.70
  }
};

/**
 * Detect demographic tags
 */
function detectDemographicTags(store) {
  const tags = [];

  // Student-heavy
  const age1824 = store.catchmentPopulation.ageDistribution.find(a => a.range === "18-24");
  if (age1824 && age1824.percentage >= 18) tags.push("student-heavy");

  // Affluent
  const highIncome = store.catchmentPopulation.incomeLevels
    .filter(i => i.level.includes("High"))
    .reduce((sum, i) => sum + i.percentage, 0);
  if (highIncome >= 35) tags.push("affluent");

  // Low-income
  const lowIncome = store.catchmentPopulation.incomeLevels.find(i => i.level.includes("Low"));
  if (lowIncome && lowIncome.percentage >= 35) tags.push("low-income");

  // Family-heavy
  const familyAge = store.catchmentPopulation.ageDistribution
    .filter(a => a.range === "25-34" || a.range === "35-44")
    .reduce((sum, a) => sum + a.percentage, 0);
  if (familyAge >= 28) tags.push("family-heavy");

  // Older
  const olderAge = store.catchmentPopulation.ageDistribution
    .filter(a => a.range === "55-64" || a.range === "65+")
    .reduce((sum, a) => sum + a.percentage, 0);
  if (olderAge >= 25) tags.push("older");

  return tags;
}

/**
 * Seeded random number generator
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate customer profile for a store
 */
function generateCustomerProfile(store, index) {
  const temp = {};
  const retailer = store.retailer;
  const format = store.format;
  const region = store.region_group;
  const demographicTags = detectDemographicTags(store);

  // Get modifiers
  const retailerRates = RETAILER_BASE_RATES[retailer] || DEFAULT_RETAILER_RATES;
  const formatMods = FORMAT_MODIFIERS[format] || FORMAT_MODIFIERS["Supermarket"];
  const regionMods = REGION_MODIFIERS[region] || {};

  // For each segment
  SEGMENTS.forEach((segment, segIdx) => {
    let multiplier = 1.0;

    // Step 1: Retailer base rate
    multiplier *= retailerRates[segment] || 0.50;

    // Step 2: Format modifier
    multiplier *= formatMods[segment] || 1.00;

    // Step 3: Region modifier
    multiplier *= regionMods[segment] || 1.00;

    // Step 4: Demographic environment modifiers
    demographicTags.forEach(tag => {
      if (DEMOGRAPHIC_MODIFIERS[tag] && DEMOGRAPHIC_MODIFIERS[tag][segment]) {
        multiplier *= DEMOGRAPHIC_MODIFIERS[tag][segment];
      }
    });

    // Step 5: Cap multiplier (WIDE RANGE for polarization)
    multiplier = Math.max(0.05, Math.min(15.0, multiplier));

    // Step 6: Apply to national baseline
    temp[segment] = NATIONAL_BASELINE[segment] * multiplier;

    // Step 7: Add local random noise
    const seed = (store.store_id.charCodeAt(0) + store.store_id.charCodeAt(store.store_id.length - 1)) * 1000 + segIdx;
    const noise = seededRandom(seed) * 0.07 - 0.035; // ±3.5%
    temp[segment] += temp[segment] * noise;

    // Ensure non-negative
    temp[segment] = Math.max(0, temp[segment]);
  });

  // Step 8: Normalize to 100%
  const total = Object.values(temp).reduce((sum, val) => sum + val, 0);
  const customerProfile = SEGMENTS.map(segment => ({
    segment,
    percentage: Math.round((temp[segment] / total) * 1000) / 10  // Round to 1 decimal
  }));

  return customerProfile;
}

// Process all stores
console.log(`Processing ${stores.length} stores...`);

let updatedCount = 0;
stores.forEach((store, idx) => {
  const customerProfile = generateCustomerProfile(store, idx);
  store.catchmentPopulation.customerProfile = customerProfile;
  updatedCount++;

  if ((idx + 1) % 100 === 0) {
    console.log(`  Processed ${idx + 1} stores...`);
  }
});

// Save updated stores
fs.writeFileSync(storesPath, JSON.stringify(stores, null, 2), 'utf8');

console.log(`\n✅ Updated ${updatedCount} stores with customerProfile`);
console.log(`📁 Saved to: ${storesPath}`);

// Show sample results
console.log('\n📊 Sample Results:\n');
const samples = [
  stores.find(s => s.retailer === 'Waitrose' && s.format === 'Supermarket' && s.region_group === 'London'),
  stores.find(s => s.retailer === 'Aldi' && s.format === 'Discounter' && s.region_group === 'North'),
  stores.find(s => s.retailer === 'Tesco' && s.format === 'Hypermarket'),
  stores.find(s => s.format === 'Forecourt'),
  stores.find(s => s.retailer === 'Sainsbury\'s' && s.region_group === 'South')
].filter(Boolean);

samples.forEach(store => {
  const tags = detectDemographicTags(store);
  console.log(`${store.retailer} ${store.format} - ${store.region_group} (${store.store_id}):`);
  if (tags.length > 0) {
    console.log(`  Demographic tags: ${tags.join(', ')}`);
  }
  console.log('  Top 3 customer segments:');
  const top3 = [...store.catchmentPopulation.customerProfile]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);
  top3.forEach(seg => console.log(`    ${seg.segment}: ${seg.percentage}%`));
  console.log('');
});
