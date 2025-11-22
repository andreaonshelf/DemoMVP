/**
 * Generate Customer Profiles for stores.json
 *
 * Applies retailer + format capture rates to geographic catchment demographics
 * to create realistic customer profiles that vary by retailer brand and format.
 */

const fs = require('fs');
const path = require('path');

// Load stores data
const storesPath = path.join(__dirname, '../data/stores.json');
const stores = JSON.parse(fs.readFileSync(storesPath, 'utf8'));

// Segment names (must match order in data)
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

// Base Retailer Capture Rates
const RETAILER_BASE_RATES = {
  "Waitrose": {
    "Premium Craft Enthusiasts": 0.65,
    "Mainstream Family Buyers": 0.35,
    "Value-Driven Households": 0.08,
    "Social Party Hosts": 0.40,
    "Traditional Real Ale Fans": 0.30,
    "Student Budget Shoppers": 0.05,
    "Convenience On-The-Go": 0.25,
    "Occasional Special Buyers": 0.50,
    "Health-Conscious Moderates": 0.60,
    "Sports & Social Drinkers": 0.30
  },
  "M&S Food": {
    "Premium Craft Enthusiasts": 0.60,
    "Mainstream Family Buyers": 0.40,
    "Value-Driven Households": 0.10,
    "Social Party Hosts": 0.35,
    "Traditional Real Ale Fans": 0.25,
    "Student Budget Shoppers": 0.08,
    "Convenience On-The-Go": 0.30,
    "Occasional Special Buyers": 0.55,
    "Health-Conscious Moderates": 0.65,
    "Sports & Social Drinkers": 0.28
  },
  "Sainsbury's": {
    "Premium Craft Enthusiasts": 0.50,
    "Mainstream Family Buyers": 0.50,
    "Value-Driven Households": 0.30,
    "Social Party Hosts": 0.45,
    "Traditional Real Ale Fans": 0.40,
    "Student Budget Shoppers": 0.25,
    "Convenience On-The-Go": 0.30,
    "Occasional Special Buyers": 0.45,
    "Health-Conscious Moderates": 0.55,
    "Sports & Social Drinkers": 0.45
  },
  "Tesco": {
    "Premium Craft Enthusiasts": 0.40,
    "Mainstream Family Buyers": 0.55,
    "Value-Driven Households": 0.45,
    "Social Party Hosts": 0.45,
    "Traditional Real Ale Fans": 0.45,
    "Student Budget Shoppers": 0.40,
    "Convenience On-The-Go": 0.35,
    "Occasional Special Buyers": 0.40,
    "Health-Conscious Moderates": 0.45,
    "Sports & Social Drinkers": 0.50
  },
  "Asda": {
    "Premium Craft Enthusiasts": 0.20,
    "Mainstream Family Buyers": 0.50,
    "Value-Driven Households": 0.60,
    "Social Party Hosts": 0.40,
    "Traditional Real Ale Fans": 0.40,
    "Student Budget Shoppers": 0.55,
    "Convenience On-The-Go": 0.25,
    "Occasional Special Buyers": 0.30,
    "Health-Conscious Moderates": 0.35,
    "Sports & Social Drinkers": 0.45
  },
  "Morrisons": {
    "Premium Craft Enthusiasts": 0.20,
    "Mainstream Family Buyers": 0.50,
    "Value-Driven Households": 0.60,
    "Social Party Hosts": 0.40,
    "Traditional Real Ale Fans": 0.40,
    "Student Budget Shoppers": 0.55,
    "Convenience On-The-Go": 0.25,
    "Occasional Special Buyers": 0.30,
    "Health-Conscious Moderates": 0.35,
    "Sports & Social Drinkers": 0.45
  },
  "Aldi": {
    "Premium Craft Enthusiasts": 0.10,
    "Mainstream Family Buyers": 0.45,
    "Value-Driven Households": 0.70,
    "Social Party Hosts": 0.35,
    "Traditional Real Ale Fans": 0.25,
    "Student Budget Shoppers": 0.75,
    "Convenience On-The-Go": 0.15,
    "Occasional Special Buyers": 0.20,
    "Health-Conscious Moderates": 0.25,
    "Sports & Social Drinkers": 0.40
  },
  "Lidl": {
    "Premium Craft Enthusiasts": 0.10,
    "Mainstream Family Buyers": 0.45,
    "Value-Driven Households": 0.70,
    "Social Party Hosts": 0.35,
    "Traditional Real Ale Fans": 0.25,
    "Student Budget Shoppers": 0.75,
    "Convenience On-The-Go": 0.15,
    "Occasional Special Buyers": 0.20,
    "Health-Conscious Moderates": 0.25,
    "Sports & Social Drinkers": 0.40
  },
  "Iceland": {
    "Premium Craft Enthusiasts": 0.15,
    "Mainstream Family Buyers": 0.50,
    "Value-Driven Households": 0.65,
    "Social Party Hosts": 0.40,
    "Traditional Real Ale Fans": 0.35,
    "Student Budget Shoppers": 0.60,
    "Convenience On-The-Go": 0.20,
    "Occasional Special Buyers": 0.25,
    "Health-Conscious Moderates": 0.30,
    "Sports & Social Drinkers": 0.45
  },
  // Default for all convenience stores
  "Convenience": {
    "Premium Craft Enthusiasts": 0.25,
    "Mainstream Family Buyers": 0.30,
    "Value-Driven Households": 0.25,
    "Social Party Hosts": 0.30,
    "Traditional Real Ale Fans": 0.30,
    "Student Budget Shoppers": 0.35,
    "Convenience On-The-Go": 0.75,
    "Occasional Special Buyers": 0.25,
    "Health-Conscious Moderates": 0.30,
    "Sports & Social Drinkers": 0.40
  }
};

// Format Modifiers (multiplied by base rates)
const FORMAT_MODIFIERS = {
  "Hypermarket": {
    "Premium Craft Enthusiasts": 0.90,
    "Mainstream Family Buyers": 1.40,
    "Value-Driven Households": 1.30,
    "Social Party Hosts": 1.10,
    "Traditional Real Ale Fans": 1.05,
    "Student Budget Shoppers": 1.20,
    "Convenience On-The-Go": 0.30,
    "Occasional Special Buyers": 0.95,
    "Health-Conscious Moderates": 1.00,
    "Sports & Social Drinkers": 1.15
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
    "Premium Craft Enthusiasts": 0.60,
    "Mainstream Family Buyers": 0.40,
    "Value-Driven Households": 0.50,
    "Social Party Hosts": 0.70,
    "Traditional Real Ale Fans": 0.65,
    "Student Budget Shoppers": 0.70,
    "Convenience On-The-Go": 2.50,
    "Occasional Special Buyers": 0.60,
    "Health-Conscious Moderates": 0.60,
    "Sports & Social Drinkers": 0.80
  },
  "Discounter": {
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
  }
};

// Convenience store retailers
const CONVENIENCE_RETAILERS = [
  "Co-op", "SPAR", "Nisa", "Premier", "Costcutter",
  "BP", "EG Group", "Shell", "Esso Nisa", "Esso Tesco", "MFG"
];

/**
 * Get base capture rates for a retailer
 */
function getBaseRates(retailer) {
  if (RETAILER_BASE_RATES[retailer]) {
    return RETAILER_BASE_RATES[retailer];
  }
  // Default to convenience for unknown retailers
  return RETAILER_BASE_RATES["Convenience"];
}

/**
 * Generate customer profile for a store
 */
function generateCustomerProfile(store) {
  const catchment = store.catchmentPopulation.demographics;
  const baseRates = getBaseRates(store.retailer);
  const formatModifiers = FORMAT_MODIFIERS[store.format] || FORMAT_MODIFIERS["Supermarket"];

  // Step 1: Calculate absolute numbers captured
  const captured = {};
  let totalCaptured = 0;

  catchment.forEach(demo => {
    const segment = demo.segment;
    const catchmentPercentage = demo.percentage;
    const catchmentPopulation = store.catchmentPopulation.current || 50000;
    const absolutePopulation = (catchmentPopulation * catchmentPercentage) / 100;

    // Apply base rate × format modifier
    const baseRate = baseRates[segment] || 0.35;
    const formatMod = formatModifiers[segment] || 1.00;
    const finalRate = baseRate * formatMod;

    const capturedPop = absolutePopulation * finalRate;
    captured[segment] = capturedPop;
    totalCaptured += capturedPop;
  });

  // Step 2: Convert to percentages
  const customerProfile = SEGMENTS.map(segment => ({
    segment,
    percentage: totalCaptured > 0
      ? Math.round((captured[segment] / totalCaptured) * 1000) / 10  // Round to 1 decimal
      : 0
  }));

  return customerProfile;
}

// Process all stores
console.log(`Processing ${stores.length} stores...`);

let updatedCount = 0;
stores.forEach((store, idx) => {
  const customerProfile = generateCustomerProfile(store);
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
  stores.find(s => s.retailer === 'Waitrose' && s.format === 'Supermarket'),
  stores.find(s => s.retailer === 'Aldi' && s.format === 'Discounter'),
  stores.find(s => s.retailer === 'Tesco' && s.format === 'Hypermarket'),
  stores.find(s => s.retailer === 'Tesco' && s.format === 'Convenience')
].filter(Boolean);

samples.forEach(store => {
  console.log(`${store.retailer} ${store.format} (${store.store_id}):`);
  console.log('  Top 3 customer segments:');
  const top3 = [...store.catchmentPopulation.customerProfile]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);
  top3.forEach(seg => console.log(`    ${seg.segment}: ${seg.percentage}%`));
  console.log('');
});
