/**
 * Shared utilities for occasion-based calculations
 * Used by both generate-store-assortments.js and generate-occasion-gaps.js
 */

const OCCASIONS = [
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

// Segment-Occasion Baseline Matrix - REBALANCED (v2)
// Fixes: Reduce social occasions, boost stock-up/family occasions
const SEGMENT_OCCASION_BASELINE = {
  "Premium Craft Enthusiasts": {
    "Weeknight unwind": 18, "House party": 6, "Family meal": 12,
    "Barbecue": 6, "Movie night": 10, "Watching sport": 12,
    "Picnic": 5, "Celebration at home": 10, "Weekend stock-up": 13, "Having friends over": 8
  },
  "Mainstream Family Buyers": {
    "Weeknight unwind": 8, "House party": 4, "Family meal": 28,
    "Barbecue": 12, "Movie night": 15, "Watching sport": 4,
    "Picnic": 8, "Celebration at home": 8, "Weekend stock-up": 9, "Having friends over": 4
  },
  "Value-Driven Households": {
    "Weeknight unwind": 10, "House party": 3, "Family meal": 22,
    "Barbecue": 5, "Movie night": 12, "Watching sport": 5,
    "Picnic": 4, "Celebration at home": 6, "Weekend stock-up": 30, "Having friends over": 3
  },
  "Social Party Hosts": {
    "Weeknight unwind": 5, "House party": 22, "Family meal": 10,
    "Barbecue": 15, "Movie night": 8, "Watching sport": 8,
    "Picnic": 10, "Celebration at home": 12, "Weekend stock-up": 6, "Having friends over": 4
  },
  "Traditional Real Ale Fans": {
    "Weeknight unwind": 25, "House party": 3, "Family meal": 16,
    "Barbecue": 8, "Movie night": 9, "Watching sport": 16,
    "Picnic": 6, "Celebration at home": 6, "Weekend stock-up": 8, "Having friends over": 3
  },
  "Student Budget Shoppers": {
    "Weeknight unwind": 10, "House party": 18, "Family meal": 8,
    "Barbecue": 6, "Movie night": 16, "Watching sport": 15,
    "Picnic": 5, "Celebration at home": 5, "Weekend stock-up": 12, "Having friends over": 5
  },
  "Convenience On-The-Go": {
    "Weeknight unwind": 15, "House party": 4, "Family meal": 10,
    "Barbecue": 8, "Movie night": 12, "Watching sport": 12,
    "Picnic": 8, "Celebration at home": 7, "Weekend stock-up": 15, "Having friends over": 9
  },
  "Occasional Special Buyers": {
    "Weeknight unwind": 6, "House party": 8, "Family meal": 16,
    "Barbecue": 10, "Movie night": 9, "Watching sport": 7,
    "Picnic": 10, "Celebration at home": 20, "Weekend stock-up": 9, "Having friends over": 5
  },
  "Health-Conscious Moderates": {
    "Weeknight unwind": 20, "House party": 4, "Family meal": 20,
    "Barbecue": 10, "Movie night": 12, "Watching sport": 6,
    "Picnic": 10, "Celebration at home": 7, "Weekend stock-up": 8, "Having friends over": 3
  },
  "Sports & Social Drinkers": {
    "Weeknight unwind": 12, "House party": 10, "Family meal": 10,
    "Barbecue": 10, "Movie night": 11, "Watching sport": 20,
    "Picnic": 8, "Celebration at home": 7, "Weekend stock-up": 8, "Having friends over": 4
  }
};

/**
 * Detect demographic tags for a store
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
 * Apply demographic tilts to segment-occasion baselines
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
 * Apply format-specific modulation to occasion demand
 * Discounter → boost stock-up, Hypermarket → boost family/stock-up, Convenience → boost quick occasions
 */
function applyFormatModulation(demand, store) {
  const modulated = { ...demand };
  const format = store.format;

  if (format === "Discounter") {
    // Discounter: boost stock-up occasions by +30%
    modulated["Weekend stock-up"] *= 1.30;
    modulated["Family meal"] *= 1.15;
  } else if (format === "Hypermarket") {
    // Hypermarket: boost family meal & stock-up by +20%
    modulated["Family meal"] *= 1.20;
    modulated["Weekend stock-up"] *= 1.20;
    modulated["Barbecue"] *= 1.10;
  } else if (format === "Convenience" || format === "Forecourt") {
    // Convenience/Forecourt: boost quick occasions by +30%
    modulated["Weeknight unwind"] *= 1.30;
    modulated["Movie night"] *= 1.15;
  }

  // Renormalize to 100%
  const total = OCCASIONS.reduce((sum, occ) => sum + modulated[occ], 0);
  OCCASIONS.forEach(occasion => {
    modulated[occasion] = (modulated[occasion] / total) * 100;
  });

  return modulated;
}

/**
 * Calculate store-level demand from customer profile
 */
function calculateDemand(store) {
  const customerProfile = store.catchmentPopulation.customerProfile || [];
  const tiltedBaselines = applyDemographicTilts(store, SEGMENT_OCCASION_BASELINE);

  const demand = {};
  OCCASIONS.forEach(occasion => {
    let sum = 0;
    customerProfile.forEach(item => {
      const segment = item.segment;
      const percentage = item.percentage;
      const occasionPct = tiltedBaselines[segment][occasion];
      sum += (percentage / 100) * (occasionPct / 100);
    });
    demand[occasion] = sum * 100;
  });

  // Normalize to 100%
  const total = OCCASIONS.reduce((sum, occ) => sum + demand[occ], 0);
  OCCASIONS.forEach(occasion => {
    demand[occasion] = (demand[occasion] / total) * 100;
  });

  // Apply format modulation
  const modulatedDemand = applyFormatModulation(demand, store);

  return modulatedDemand;
}

module.exports = {
  OCCASIONS,
  SEGMENTS,
  SEGMENT_OCCASION_BASELINE,
  detectDemographicTags,
  applyDemographicTilts,
  calculateDemand
};
