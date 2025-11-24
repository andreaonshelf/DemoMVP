#!/usr/bin/env node

/**
 * Generate store assortments using retailer+format templates with variation
 *
 * This script applies retailer+format templates to all 535 stores with 10-15% variation.
 * Variation is achieved by swapping random SKUs from baseline with next-best from template ranking.
 *
 * Key principles:
 * - Templates are applied, NOT per-store demand optimization
 * - Variation is deterministic (seeded by store_id)
 * - Tier 3 retailers get +5% extra variation (15-20% total)
 * - Result: Stores of same retailer+format share ~85% SKUs
 *
 * Output: data/store-assortments-template-based.json
 */

const fs = require('fs');
const path = require('path');

// ============= LOAD DATA =============

const stores = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/stores.json'),
  'utf-8'
));

const templatesData = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/retailer-format-templates.json'),
  'utf-8'
));

const templates = templatesData.templates;

console.log(`Loaded ${stores.length} stores and ${templates.length} templates`);

// ============= CONSTANTS =============

const BRAND_TIERS = {
  "Premium Craft Co": "premium",
  "Heritage Beer Co": "premium",
  "Traditional Ales Ltd": "mainstream",
  "Value Lager Brewing": "value",
  "Others": "value"
};

// ============= HELPER FUNCTIONS =============

/**
 * Seeded random number generator for deterministic results
 */
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}

/**
 * Hash store_id to get seed
 */
function hashStoreId(storeId) {
  return storeId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 12345);
}

/**
 * Find template for a store
 */
function findTemplate(store, templates) {
  const templateId = `${store.retailer.replace(/\s+/g, '')}_${store.format}`;
  return templates.find(t => t.template_id === templateId);
}

/**
 * Apply template variation to generate store-specific assortment
 */
function applyTemplateVariation(store, template) {
  const seed = hashStoreId(store.store_id);
  const random = seededRandom(seed);

  // Base variation: 10-15%
  let variationPct = 0.10 + random() * 0.05;

  // Tier 3 extra variation: +5%
  if (template.is_tier3) {
    variationPct += 0.05;  // 15-20% total
  }

  // Get baseline SKUs
  let baselineSKUs = template.ranked_skus.slice(0, template.baseline_sku_count);

  // STEP 1: Apply 5% aspirational mainstream substitution for discounters (BEFORE variation swaps)
  let aspirationalSubstitutionApplied = false;
  if (template.format === "Discounter" && template.aspirational_sku) {
    const substitutionRoll = random();
    if (substitutionRoll < 0.05) {
      // Find lowest-ranked value-tier SKU in baseline
      let lowestValueIndex = -1;
      let lowestValueRank = 0;

      baselineSKUs.forEach((sku, idx) => {
        const brandTier = BRAND_TIERS[sku.brand] || "mainstream";
        if (brandTier === "value" && sku.rank > lowestValueRank) {
          lowestValueRank = sku.rank;
          lowestValueIndex = idx;
        }
      });

      // Replace with aspirational mainstream SKU
      if (lowestValueIndex >= 0) {
        const aspirationalSkuData = template.ranked_skus.find(
          s => s.sku_id === template.aspirational_sku
        );

        if (aspirationalSkuData) {
          baselineSKUs = [...baselineSKUs];
          baselineSKUs[lowestValueIndex] = aspirationalSkuData;
          aspirationalSubstitutionApplied = true;
        }
      }
    }
  }

  // STEP 2: Apply variation swaps
  const numSwaps = Math.floor(baselineSKUs.length * variationPct);

  // Get next-best SKUs for swapping
  const nextBestSKUs = template.ranked_skus.slice(
    template.baseline_sku_count,
    template.baseline_sku_count + numSwaps + 5  // Extra buffer for randomness
  );

  if (nextBestSKUs.length === 0) {
    // No SKUs to swap with, return baseline
    return {
      skus: baselineSKUs,
      variationPct: 0,
      numSwaps: 0
    };
  }

  // Perform swaps
  const result = [...baselineSKUs];
  for (let i = 0; i < numSwaps; i++) {
    const removeIdx = Math.floor(random() * result.length);
    const addIdx = Math.floor(random() * nextBestSKUs.length);
    result[removeIdx] = nextBestSKUs[addIdx];
  }

  return {
    skus: result,
    variationPct: variationPct,
    numSwaps: numSwaps,
    aspirationalSubstitutionApplied: aspirationalSubstitutionApplied
  };
}

/**
 * Calculate brand breakdown
 */
function calculateBrandBreakdown(skuList) {
  const breakdown = {};
  skuList.forEach(sku => {
    breakdown[sku.brand] = (breakdown[sku.brand] || 0) + 1;
  });
  return breakdown;
}

/**
 * Calculate tier breakdown
 */
function calculateTierBreakdown(skuList) {
  const breakdown = { premium: 0, mainstream: 0, value: 0 };
  skuList.forEach(sku => {
    const tier = BRAND_TIERS[sku.brand] || "mainstream";
    breakdown[tier]++;
  });
  return breakdown;
}

// ============= ASSORTMENT GENERATION =============

function generateStoreAssortments() {
  console.log('\nGenerating store assortments with template variation...\n');

  const assortments = [];
  let noTemplateCount = 0;

  stores.forEach((store, idx) => {
    // Find template
    const template = findTemplate(store, templates);

    if (!template) {
      console.warn(`⚠️  No template found for ${store.store_id} (${store.retailer} ${store.format})`);
      noTemplateCount++;
      return;
    }

    // Apply variation
    const { skus, variationPct, numSwaps, aspirationalSubstitutionApplied } = applyTemplateVariation(store, template);

    // Create assortment record
    const assortment = {
      store_id: store.store_id,
      retailer: store.retailer,
      format: store.format,
      template_id: template.template_id,
      sku_count: skus.length,
      variation_percentage: Math.round(variationPct * 1000) / 1000,
      num_swaps: numSwaps,
      aspirational_substitution: aspirationalSubstitutionApplied,
      sku_ids: skus.map(s => s.sku_id),
      brand_breakdown: calculateBrandBreakdown(skus),
      tier_breakdown: calculateTierBreakdown(skus)
    };

    assortments.push(assortment);

    // Log progress
    if ((idx + 1) % 50 === 0 || idx === stores.length - 1) {
      console.log(`Processed ${idx + 1}/${stores.length} stores...`);
    }
  });

  if (noTemplateCount > 0) {
    console.warn(`\n⚠️  ${noTemplateCount} stores had no matching template`);
  }

  return assortments;
}

// ============= VALIDATION =============

function validateAssortments(assortments) {
  console.log('\n=== ASSORTMENT VALIDATION ===\n');

  // 1. SKU count ranges
  const skuCounts = assortments.map(a => a.sku_count);
  console.log(`SKU Count Range: ${Math.min(...skuCounts)} - ${Math.max(...skuCounts)}`);
  console.log(`SKU Count Average: ${(skuCounts.reduce((a, b) => a + b, 0) / skuCounts.length).toFixed(1)}`);

  // 2. Variation percentage ranges
  const variations = assortments.map(a => a.variation_percentage);
  const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
  console.log(`\nVariation Range: ${(Math.min(...variations) * 100).toFixed(1)}% - ${(Math.max(...variations) * 100).toFixed(1)}%`);
  console.log(`Average Variation: ${(avgVariation * 100).toFixed(1)}%`);

  // 3. Sample stores
  console.log(`\n=== SAMPLE STORES ===\n`);
  const samples = [
    assortments.find(a => a.retailer === "Waitrose" && a.format === "Supermarket"),
    assortments.find(a => a.retailer === "Aldi" && a.format === "Discounter"),
    assortments.find(a => a.retailer === "Tesco" && a.format === "Hypermarket"),
    assortments.find(a => a.retailer === "Nisa" && a.format === "Convenience"),
    assortments.find(a => a.retailer === "Sainsbury's" && a.format === "Supermarket")
  ].filter(Boolean);

  samples.forEach(sample => {
    console.log(`${sample.store_id} (${sample.retailer} ${sample.format}):`);
    console.log(`  Template: ${sample.template_id}`);
    console.log(`  SKU Count: ${sample.sku_count}`);
    console.log(`  Variation: ${(sample.variation_percentage * 100).toFixed(1)}% (${sample.num_swaps} swaps)`);
    console.log(`  Brand Breakdown:`, sample.brand_breakdown);
    console.log(`  Tier Breakdown:`, sample.tier_breakdown);
    console.log('');
  });

  // 4. Within-retailer overlap check (sample 2 stores from same retailer+format)
  console.log(`=== WITHIN-RETAILER OVERLAP (Sample Check) ===\n`);

  const tescoConvenience = assortments.filter(a => a.retailer === "Tesco" && a.format === "Convenience");
  if (tescoConvenience.length >= 2) {
    const store1 = tescoConvenience[0];
    const store2 = tescoConvenience[1];
    const set1 = new Set(store1.sku_ids);
    const set2 = new Set(store2.sku_ids);
    const intersection = [...set1].filter(x => set2.has(x));
    const overlapPct = (intersection.length / store1.sku_count) * 100;

    console.log(`${store1.store_id} vs ${store2.store_id}:`);
    console.log(`  Shared SKUs: ${intersection.length}/${store1.sku_count}`);
    console.log(`  Overlap: ${overlapPct.toFixed(1)}%`);
    console.log(`  Status: ${overlapPct >= 80 && overlapPct <= 90 ? '✅ PASS' : '⚠️  WARNING (expected 80-90%)'}\n`);
  }

  // 5. SKU diversity per retailer (sample Aldi)
  const aldiStores = assortments.filter(a => a.retailer === "Aldi");
  const aldiUniqueSKUs = new Set();
  aldiStores.forEach(a => a.sku_ids.forEach(id => aldiUniqueSKUs.add(id)));

  console.log(`=== SKU DIVERSITY (Aldi Discounter) ===\n`);
  console.log(`  Total stores: ${aldiStores.length}`);
  console.log(`  Unique SKUs used: ${aldiUniqueSKUs.size}`);
  console.log(`  Expected: 18-25 unique SKUs`);
  console.log(`  Status: ${aldiUniqueSKUs.size >= 18 && aldiUniqueSKUs.size <= 25 ? '✅ PASS' : '⚠️  WARNING'}\n`);

  // 6. Aspirational substitution stats (Aldi + Lidl)
  const discounterStores = assortments.filter(a => a.format === "Discounter");
  const aspirationalCount = discounterStores.filter(a => a.aspirational_substitution).length;
  const aspirationalPct = (aspirationalCount / discounterStores.length) * 100;

  console.log(`=== ASPIRATIONAL MAINSTREAM SUBSTITUTION (Discounters) ===\n`);
  console.log(`  Total discounter stores: ${discounterStores.length}`);
  console.log(`  Stores with aspirational SKU: ${aspirationalCount}`);
  console.log(`  Substitution rate: ${aspirationalPct.toFixed(1)}%`);
  console.log(`  Expected: ~5%`);
  console.log(`  Status: ${aspirationalPct >= 3 && aspirationalPct <= 7 ? '✅ PASS' : '⚠️  WARNING'}\n`);

  console.log('✅ Assortment generation complete\n');
}

// ============= EXECUTE =============

const assortments = generateStoreAssortments();

console.log(`\nGenerated assortments for ${assortments.length} stores`);

// Validate
validateAssortments(assortments);

// Save output
const output = {
  category: "Beer",
  generated_at: new Date().toISOString(),
  algorithm: "template_based_with_variation_v1",
  variation_range: "10-15% per store (15-20% for Tier 3)",
  total_stores: assortments.length,
  assortments: assortments
};

const outputPath = path.join(__dirname, '../data/store-assortments-template-based.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Saved to: ${outputPath}`);
console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
