#!/usr/bin/env node

/**
 * Generate correlated demographics data for all stores
 * Correlates demographics with segment mix:
 * - Premium segments → higher income
 * - Value segments → moderate income
 */

const fs = require('fs');
const path = require('path');

// Seeded random for determinism
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Segment to income correlation weights
const SEGMENT_INCOME_WEIGHTS = {
  "Premium Craft Enthusiasts": { low: 0.05, medium: 0.25, high: 0.45, veryHigh: 0.25 },
  "Mainstream Family Buyers": { low: 0.15, medium: 0.50, high: 0.30, veryHigh: 0.05 },
  "Value-Driven Households": { low: 0.40, medium: 0.45, high: 0.13, veryHigh: 0.02 },
  "Social Party Hosts": { low: 0.20, medium: 0.45, high: 0.30, veryHigh: 0.05 },
  "Traditional Real Ale Fans": { low: 0.10, medium: 0.35, high: 0.40, veryHigh: 0.15 },
  "Student Budget Shoppers": { low: 0.60, medium: 0.35, high: 0.04, veryHigh: 0.01 },
  "Convenience On-The-Go": { low: 0.25, medium: 0.45, high: 0.25, veryHigh: 0.05 },
  "Occasional Special Buyers": { low: 0.20, medium: 0.50, high: 0.25, veryHigh: 0.05 },
  "Health-Conscious Moderates": { low: 0.10, medium: 0.30, high: 0.45, veryHigh: 0.15 },
  "Sports & Social Drinkers": { low: 0.25, medium: 0.45, high: 0.25, veryHigh: 0.05 }
};

// Segment to age correlation weights
const SEGMENT_AGE_WEIGHTS = {
  "Premium Craft Enthusiasts": { "18-24": 0.10, "25-34": 0.30, "35-44": 0.30, "45-54": 0.20, "55-64": 0.08, "65+": 0.02 },
  "Mainstream Family Buyers": { "18-24": 0.05, "25-34": 0.25, "35-44": 0.35, "45-54": 0.25, "55-64": 0.08, "65+": 0.02 },
  "Value-Driven Households": { "18-24": 0.15, "25-34": 0.25, "35-44": 0.30, "45-54": 0.20, "55-64": 0.08, "65+": 0.02 },
  "Social Party Hosts": { "18-24": 0.25, "25-34": 0.35, "35-44": 0.25, "45-54": 0.10, "55-64": 0.04, "65+": 0.01 },
  "Traditional Real Ale Fans": { "18-24": 0.03, "25-34": 0.10, "35-44": 0.20, "45-54": 0.30, "55-64": 0.25, "65+": 0.12 },
  "Student Budget Shoppers": { "18-24": 0.70, "25-34": 0.20, "35-44": 0.05, "45-54": 0.03, "55-64": 0.01, "65+": 0.01 },
  "Convenience On-The-Go": { "18-24": 0.20, "25-34": 0.35, "35-44": 0.25, "45-54": 0.15, "55-64": 0.04, "65+": 0.01 },
  "Occasional Special Buyers": { "18-24": 0.08, "25-34": 0.20, "35-44": 0.30, "45-54": 0.25, "55-64": 0.12, "65+": 0.05 },
  "Health-Conscious Moderates": { "18-24": 0.05, "25-34": 0.25, "35-44": 0.35, "45-54": 0.25, "55-64": 0.08, "65+": 0.02 },
  "Sports & Social Drinkers": { "18-24": 0.20, "25-34": 0.35, "35-44": 0.25, "45-54": 0.15, "55-64": 0.04, "65+": 0.01 }
};

function generateDemographics(store) {
  const segments = store.catchmentPopulation.demographics;
  const seed = store.store_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Calculate weighted income distribution
  const incomeWeights = { low: 0, medium: 0, high: 0, veryHigh: 0 };
  segments.forEach(seg => {
    const weight = SEGMENT_INCOME_WEIGHTS[seg.segment] || { low: 0.25, medium: 0.50, high: 0.20, veryHigh: 0.05 };
    const contribution = seg.percentage / 100;
    incomeWeights.low += weight.low * contribution;
    incomeWeights.medium += weight.medium * contribution;
    incomeWeights.high += weight.high * contribution;
    incomeWeights.veryHigh += weight.veryHigh * contribution;
  });

  // Normalize to 100%
  const incomeTotal = Object.values(incomeWeights).reduce((a, b) => a + b, 0);
  const incomeLevels = [
    { level: "Low (<£25k)", percentage: Math.round((incomeWeights.low / incomeTotal) * 100) },
    { level: "Medium (£25k-£45k)", percentage: Math.round((incomeWeights.medium / incomeTotal) * 100) },
    { level: "High (£45k-£75k)", percentage: Math.round((incomeWeights.high / incomeTotal) * 100) },
    { level: "Very High (£75k+)", percentage: Math.round((incomeWeights.veryHigh / incomeTotal) * 100) }
  ];

  // Calculate weighted age distribution
  const ageWeights = { "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55-64": 0, "65+": 0 };
  segments.forEach(seg => {
    const weight = SEGMENT_AGE_WEIGHTS[seg.segment] || { "18-24": 0.15, "25-34": 0.25, "35-44": 0.25, "45-54": 0.20, "55-64": 0.10, "65+": 0.05 };
    const contribution = seg.percentage / 100;
    Object.keys(ageWeights).forEach(age => {
      ageWeights[age] += weight[age] * contribution;
    });
  });

  // Normalize to 100%
  const ageTotal = Object.values(ageWeights).reduce((a, b) => a + b, 0);
  const ageDistribution = Object.keys(ageWeights).map(age => ({
    range: age,
    percentage: Math.round((ageWeights[age] / ageTotal) * 100)
  }));

  // Gender distribution (slight correlation with segments, but mostly balanced)
  const maleBase = 48 + (seededRandom(seed) * 8 - 4); // 44-52%
  const femaleBase = 100 - maleBase - 2; // Remainder minus other
  const gender = [
    { gender: "Male", percentage: Math.round(maleBase) },
    { gender: "Female", percentage: Math.round(femaleBase) },
    { gender: "Other/Prefer not to say", percentage: 2 }
  ];

  // Crime index (1-100, lower is better)
  // Correlate with premium segments (premium areas have lower crime)
  const premiumPct = segments.find(s => s.segment === "Premium Craft Enthusiasts")?.percentage || 0;
  const studentPct = segments.find(s => s.segment === "Student Budget Shoppers")?.percentage || 0;
  const valuePct = segments.find(s => s.segment === "Value-Driven Households")?.percentage || 0;

  const crimeBase = 50;
  const crimeModifier = (premiumPct * -0.8) + (studentPct * 0.6) + (valuePct * 0.3);
  const crimeIndex = Math.max(1, Math.min(100, Math.round(crimeBase + crimeModifier + seededRandom(seed + 100) * 20 - 10)));

  return {
    incomeLevels,
    ageDistribution,
    gender,
    crimeIndex
  };
}

function main() {
  const storesPath = path.join(__dirname, '../data/stores.json');

  console.log('Reading stores.json...');
  const stores = JSON.parse(fs.readFileSync(storesPath, 'utf8'));

  console.log(`Generating demographics for ${stores.length} stores...`);

  const updatedStores = stores.map((store, idx) => {
    if (idx % 100 === 0) {
      console.log(`  Processed ${idx}/${stores.length} stores...`);
    }

    const demographics = generateDemographics(store);

    return {
      ...store,
      catchmentPopulation: {
        ...store.catchmentPopulation,
        incomeLevels: demographics.incomeLevels,
        ageDistribution: demographics.ageDistribution,
        gender: demographics.gender,
        crimeIndex: demographics.crimeIndex
      }
    };
  });

  console.log('Writing updated stores.json...');
  fs.writeFileSync(storesPath, JSON.stringify(updatedStores, null, 2));

  console.log('✓ Demographics generation complete!');
  console.log(`✓ Updated ${updatedStores.length} stores`);
}

main();
