#!/usr/bin/env node

/**
 * Generate retailer+format templates for assortment generation
 *
 * This script creates 27 retailer+format templates (e.g., Tesco_Convenience, Aldi_Discounter)
 * where each template ranks all 40 SKUs based on:
 * - Brand tier fit (70%): How well brand positioning matches retailer positioning
 * - Pack-size suitability (30%): How well pack size fits format constraints
 *
 * Templates are INDEPENDENT of store-specific demand.
 * They represent how a retailer would rank SKUs for a format based purely on positioning.
 *
 * Output: data/retailer-format-templates.json
 */

const fs = require('fs');
const path = require('path');

// ============= LOAD DATA =============

const stores = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/stores.json'),
  'utf-8'
));

const shopperData = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/shopper-responses.json'),
  'utf-8'
));

const skus = shopperData.skus;

console.log(`Loaded ${stores.length} stores and ${skus.length} SKUs`);

// ============= CONSTANTS =============

const BRAND_TIERS = {
  "Premium Craft Co": "premium",
  "Heritage Beer Co": "premium",
  "Traditional Ales Ltd": "mainstream",
  "Value Lager Brewing": "value",
  "Others": "value"
};

const RETAILER_POSITIONING = {
  "Waitrose": "premium",
  "M&S Food": "premium",
  "Sainsbury's": "mainstream",
  "Tesco": "mainstream",
  "Morrisons": "mainstream",
  "ASDA": "mainstream",
  "Co-op": "mainstream",
  "Iceland": "mainstream",
  "Aldi": "value",
  "Lidl": "value",
  "Nisa": "budget",
  "Premier": "budget",
  "SPAR": "budget",
  "Costcutter": "budget",
  "EG Group": "budget",
  "BP": "budget",
  "Shell": "budget",
  "Esso Tesco": "budget",
  "Esso Nisa": "budget",
  "MFG": "budget"
};

// Format-based SKU count ranges
const FORMAT_BASELINE_COUNTS = {
  "Discounter": 12,
  "Convenience": 18,
  "Supermarket": 29,
  "Hypermarket": 34
};

// Retailer-specific baseline overrides
const RETAILER_BASELINE_OVERRIDES = {
  "Nisa": 16,
  "Tesco": { "Convenience": 19, "Supermarket": 29, "Hypermarket": 34 },
  "Premier": 15,
  "Aldi": 12,
  "Costcutter": 16,
  "Sainsbury's": { "Convenience": 19, "Supermarket": 30 },
  "Co-op": 17,
  "M&S Food": { "Convenience": 20, "Supermarket": 30 },
  "Iceland": 26,
  "Morrisons": { "Supermarket": 29, "Convenience": 18 },
  "SPAR": 16,
  "Waitrose": { "Convenience": 21, "Supermarket": 32 },
  "Lidl": 12,
  "ASDA": { "Hypermarket": 33, "Convenience": 19 },
  "EG Group": 15,
  "BP": 14
};

// Tier 3 parent mapping (retailers with < 5 stores)
const TIER3_PARENT_MAPPING = {
  "MFG": "EG Group",
  "Esso Tesco": "BP",
  "Esso Nisa": "BP",
  "Shell": "BP"
};

// ============= HELPER FUNCTIONS =============

/**
 * Get baseline SKU count for a retailer+format template
 */
function getBaselineSKUCount(retailer, format) {
  // Check retailer-specific overrides
  const override = RETAILER_BASELINE_OVERRIDES[retailer];
  if (override) {
    if (typeof override === 'number') {
      return override;
    }
    if (override[format]) {
      return override[format];
    }
  }

  // Fall back to format default
  return FORMAT_BASELINE_COUNTS[format] || 20;
}

/**
 * Calculate brand tier fit score (70% weight)
 */
function getBrandTierFitScore(skuBrand, retailerPositioning) {
  const brandTier = BRAND_TIERS[skuBrand] || "mainstream";

  // Premium retailers (Waitrose, M&S)
  if (retailerPositioning === "premium") {
    if (brandTier === "premium") return 100;
    if (brandTier === "mainstream") return 50;
    if (brandTier === "value") return 15;
  }

  // Mainstream retailers (Tesco, Sainsbury's, Morrisons, Co-op, Iceland, ASDA)
  if (retailerPositioning === "mainstream") {
    if (brandTier === "premium") return 70;
    if (brandTier === "mainstream") return 100;
    if (brandTier === "value") return 75;
  }

  // Value retailers (Aldi, Lidl)
  if (retailerPositioning === "value") {
    if (brandTier === "premium") return 10;
    if (brandTier === "mainstream") return 60;
    if (brandTier === "value") return 100;
  }

  // Budget convenience (Nisa, Premier, SPAR, Costcutter, EG Group, BP, etc.)
  if (retailerPositioning === "budget") {
    if (brandTier === "premium") return 25;
    if (brandTier === "mainstream") return 80;
    if (brandTier === "value") return 100;
  }

  return 50; // fallback
}

/**
 * Calculate pack-size suitability score (30% weight)
 */
function getPackSizeSuitability(sku, format) {
  const packSizeStr = sku.pack_size;
  const match = packSizeStr.match(/(\d+)\s*x\s*(\d+)ml/);

  if (!match) return 75; // fallback for unparseable formats

  const packCount = parseInt(match[1]);
  const unitVolume = parseInt(match[2]);
  const totalVolume = packCount * unitVolume;

  // Convenience format: prefer smaller total volumes
  if (format === "Convenience") {
    if (totalVolume <= 500) return 100;        // Single small can
    if (totalVolume <= 1760) return 90;        // 4x440ml
    if (totalVolume <= 2400) return 75;        // Smaller 6-packs
    return 60;                                  // Large multipacks
  }

  // Discounter format: prefer value multipacks
  if (format === "Discounter") {
    if (packCount >= 6 || totalVolume >= 2400) return 100;  // Value multipacks
    if (packCount === 4 && totalVolume >= 1760) return 85;
    return 70;
  }

  // Supermarket/Hypermarket: all pack sizes suitable
  if (format === "Supermarket" || format === "Hypermarket") {
    return 100;
  }

  return 80; // fallback
}

/**
 * Rank all SKUs for a specific template
 */
function rankSKUsForTemplate(retailer, format, skus) {
  const positioning = RETAILER_POSITIONING[retailer] || "mainstream";

  const rankedSkus = skus.map(sku => {
    const brandTierFit = getBrandTierFitScore(sku.brand, positioning);
    const packSizeSuitability = getPackSizeSuitability(sku, format);

    const totalScore = (brandTierFit * 0.7) + (packSizeSuitability * 0.3);

    return {
      rank: 0, // Will be set after sorting
      sku_id: sku.sku_id,
      brand: sku.brand,
      name: sku.name,
      pack_size: sku.pack_size,
      total_score: Math.round(totalScore * 100) / 100,
      brand_tier_fit: brandTierFit,
      pack_size_suitability: packSizeSuitability
    };
  });

  // Sort by total score (descending)
  rankedSkus.sort((a, b) => b.total_score - a.total_score);

  // Assign ranks
  rankedSkus.forEach((sku, idx) => {
    sku.rank = idx + 1;
  });

  return rankedSkus;
}

/**
 * Identify aspirational mainstream SKU for discounter templates
 * (5% substitution rule for realism)
 */
function identifyAspirationalSku(retailer, format, rankedSkus, baselineSKUCount) {
  // Only apply to discounters (Aldi, Lidl)
  if (format !== "Discounter") {
    return null;
  }

  const baselineSkuIds = new Set(
    rankedSkus.slice(0, baselineSKUCount).map(s => s.sku_id)
  );

  // Find highest-ranked mainstream SKU NOT in baseline
  const aspirationalSku = rankedSkus.find(sku => {
    const brandTier = BRAND_TIERS[sku.brand] || "mainstream";
    return brandTier === "mainstream" && !baselineSkuIds.has(sku.sku_id);
  });

  return aspirationalSku || null;
}

/**
 * Identify unique retailer+format combinations
 */
function getRetailerFormatCombinations(stores) {
  const combinations = new Map();

  stores.forEach(store => {
    const key = `${store.retailer}|${store.format}`;
    if (!combinations.has(key)) {
      combinations.set(key, {
        retailer: store.retailer,
        format: store.format,
        count: 0
      });
    }
    combinations.get(key).count++;
  });

  return Array.from(combinations.values());
}

// ============= TEMPLATE GENERATION =============

function generateTemplates() {
  console.log('\nGenerating retailer+format templates...\n');

  const combinations = getRetailerFormatCombinations(stores);
  console.log(`Found ${combinations.length} unique retailer+format combinations`);

  const templates = [];

  combinations.forEach((combo, idx) => {
    const { retailer, format, count } = combo;

    // Check if this is a Tier 3 retailer (use parent template)
    const isTier3 = count < 5;
    const parentRetailer = TIER3_PARENT_MAPPING[retailer];

    const templateId = `${retailer.replace(/\s+/g, '')}_${format}`;
    const baselineSKUCount = getBaselineSKUCount(retailer, format);

    // Rank SKUs for this template
    const rankedSkus = rankSKUsForTemplate(retailer, format, skus);

    // Identify aspirational mainstream SKU for discounters (5% substitution rule)
    const aspirationalSku = identifyAspirationalSku(retailer, format, rankedSkus, baselineSKUCount);

    const template = {
      template_id: templateId,
      retailer: retailer,
      format: format,
      positioning: RETAILER_POSITIONING[retailer] || "mainstream",
      store_count: count,
      baseline_sku_count: baselineSKUCount,
      is_tier3: isTier3,
      parent_template: isTier3 ? `${parentRetailer.replace(/\s+/g, '')}_${format}` : null,
      aspirational_sku: aspirationalSku ? aspirationalSku.sku_id : null,
      ranked_skus: rankedSkus
    };

    templates.push(template);

    // Log progress
    if ((idx + 1) % 10 === 0 || idx === combinations.length - 1) {
      console.log(`Processed ${idx + 1}/${combinations.length} templates...`);
    }
  });

  return templates;
}

// ============= VALIDATION =============

function validateTemplates(templates) {
  console.log('\n=== TEMPLATE VALIDATION ===\n');

  // Sample validation: Check a few templates
  const sampleTemplates = [
    templates.find(t => t.retailer === "Tesco" && t.format === "Convenience"),
    templates.find(t => t.retailer === "Aldi" && t.format === "Discounter"),
    templates.find(t => t.retailer === "Waitrose" && t.format === "Supermarket"),
    templates.find(t => t.retailer === "ASDA" && t.format === "Hypermarket")
  ].filter(Boolean);

  sampleTemplates.forEach(template => {
    console.log(`\n📋 ${template.template_id}`);
    console.log(`   Positioning: ${template.positioning}`);
    console.log(`   Store count: ${template.store_count}`);
    console.log(`   Baseline SKU count: ${template.baseline_sku_count}`);
    console.log(`   Top 5 SKUs:`);

    template.ranked_skus.slice(0, 5).forEach(sku => {
      console.log(`     ${sku.rank}. ${sku.name.padEnd(30)} (Score: ${sku.total_score})`);
    });
  });

  // Tier distribution validation
  console.log('\n=== TIER DISTRIBUTION VALIDATION ===\n');

  sampleTemplates.forEach(template => {
    const baselineSkus = template.ranked_skus.slice(0, template.baseline_sku_count);
    const tierCounts = { premium: 0, mainstream: 0, value: 0 };

    baselineSkus.forEach(sku => {
      const tier = BRAND_TIERS[sku.brand] || "mainstream";
      tierCounts[tier]++;
    });

    const premiumPct = (tierCounts.premium / template.baseline_sku_count) * 100;
    const mainstreamPct = (tierCounts.mainstream / template.baseline_sku_count) * 100;
    const valuePct = (tierCounts.value / template.baseline_sku_count) * 100;

    console.log(`${template.template_id}:`);
    console.log(`  Premium: ${tierCounts.premium} (${premiumPct.toFixed(1)}%)`);
    console.log(`  Mainstream: ${tierCounts.mainstream} (${mainstreamPct.toFixed(1)}%)`);
    console.log(`  Value: ${tierCounts.value} (${valuePct.toFixed(1)}%)`);

    // Validation rules
    let status = '✅ PASS';
    if (template.positioning === 'premium' && premiumPct < 35) {
      status = '❌ FAIL (premium retailer should have >35% premium SKUs)';
    }
    if (template.positioning === 'value' && valuePct < 60) {
      status = '❌ FAIL (value retailer should have >60% value SKUs)';
    }
    if (template.positioning === 'value' && premiumPct > 20) {
      status = '❌ FAIL (value retailer should have <20% premium SKUs)';
    }

    console.log(`  Status: ${status}\n`);
  });

  // Tier 3 templates
  const tier3Templates = templates.filter(t => t.is_tier3);
  console.log(`=== TIER 3 TEMPLATES (${tier3Templates.length} templates) ===\n`);
  tier3Templates.forEach(t => {
    console.log(`  ${t.template_id} (${t.store_count} stores) → uses ${t.parent_template}`);
  });

  console.log('\n✅ Template generation complete\n');
}

// ============= EXECUTE =============

const templates = generateTemplates();

console.log(`\nGenerated ${templates.length} templates`);

// Validate
validateTemplates(templates);

// Save output
const output = {
  category: "Beer",
  generated_at: new Date().toISOString(),
  algorithm: "retailer_format_templates_v1",
  positioning_logic: "brand_tier_fit (70%) + pack_size_suitability (30%)",
  total_templates: templates.length,
  templates: templates
};

const outputPath = path.join(__dirname, '../data/retailer-format-templates.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Saved to: ${outputPath}`);
console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
