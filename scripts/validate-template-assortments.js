#!/usr/bin/env node

/**
 * Comprehensive validation of template-based assortments
 *
 * Runs 4 validation checks as specified in OCCASION-COVERAGE-ARCHITECTURE.md:
 * A. Within-Retailer Overlap (80-90% expected)
 * B. SKU Diversity per Retailer
 * C. Template Consistency (<5% exact matches)
 * D. Brand Tier Distribution
 */

const fs = require('fs');
const path = require('path');

// ============= LOAD DATA =============

const assortmentsData = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/store-assortments-template-based.json'),
  'utf-8'
));

const templatesData = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/retailer-format-templates.json'),
  'utf-8'
));

const assortments = assortmentsData.assortments;
const templates = templatesData.templates;

console.log(`Loaded ${assortments.length} assortments and ${templates.length} templates`);

// ============= CONSTANTS =============

const BRAND_TIERS = {
  "Premium Craft Co": "premium",
  "Heritage Beer Co": "premium",
  "Traditional Ales Ltd": "mainstream",
  "Value Lager Brewing": "value",
  "Others": "value"
};

// ============= VALIDATION A: WITHIN-RETAILER OVERLAP =============

function validateWithinRetailerOverlap() {
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION A: WITHIN-RETAILER OVERLAP');
  console.log('='.repeat(80));
  console.log('\nExpected: 80-90% overlap for same retailer+format\n');

  // Group by retailer+format
  const groups = {};
  assortments.forEach(a => {
    const key = `${a.retailer}|${a.format}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });

  // Analyze groups with 2+ stores
  const results = [];
  Object.entries(groups).filter(([_, stores]) => stores.length >= 2).forEach(([key, stores]) => {
    const [retailer, format] = key.split('|');

    // Calculate pairwise overlaps
    let totalOverlap = 0;
    let comparisons = 0;

    for (let i = 0; i < Math.min(stores.length, 5); i++) {
      for (let j = i + 1; j < Math.min(stores.length, 5); j++) {
        const set1 = new Set(stores[i].sku_ids);
        const set2 = new Set(stores[j].sku_ids);
        const intersection = [...set1].filter(x => set2.has(x));
        const overlap = (intersection.length / stores[i].sku_count) * 100;

        totalOverlap += overlap;
        comparisons++;
      }
    }

    const avgOverlap = comparisons > 0 ? totalOverlap / comparisons : 0;

    results.push({
      retailer,
      format,
      storeCount: stores.length,
      avgOverlap,
      status: avgOverlap >= 80 && avgOverlap <= 95 ? '✅ PASS' : avgOverlap < 80 ? '⚠️  LOW' : '❌ HIGH'
    });
  });

  // Sort by status (failures first)
  results.sort((a, b) => {
    if (a.status === b.status) return b.storeCount - a.storeCount;
    if (a.status.includes('❌')) return -1;
    if (b.status.includes('❌')) return 1;
    if (a.status.includes('⚠️')) return -1;
    if (b.status.includes('⚠️')) return 1;
    return 0;
  });

  // Show top 10
  results.slice(0, 10).forEach(r => {
    console.log(`${r.status} ${r.retailer.padEnd(20)} ${r.format.padEnd(15)} ${r.avgOverlap.toFixed(1)}% (${r.storeCount} stores)`);
  });

  const passCount = results.filter(r => r.status === '✅ PASS').length;
  const totalCount = results.length;
  console.log(`\n📊 Summary: ${passCount}/${totalCount} retailer+format combinations passed (${((passCount/totalCount)*100).toFixed(1)}%)`);
}

// ============= VALIDATION B: SKU DIVERSITY =============

function validateSKUDiversity() {
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION B: SKU DIVERSITY PER RETAILER');
  console.log('='.repeat(80));
  console.log('\nExpected ranges by format:');
  console.log('  Discounter: 18-25 unique SKUs');
  console.log('  Convenience: 25-35 unique SKUs');
  console.log('  Supermarket: 35-40 unique SKUs');
  console.log('  Hypermarket: 38-40 unique SKUs\n');

  const expectedRanges = {
    "Discounter": { min: 18, max: 25 },
    "Convenience": { min: 25, max: 35 },
    "Supermarket": { min: 35, max: 40 },
    "Hypermarket": { min: 38, max: 40 }
  };

  // Group by retailer+format
  const groups = {};
  assortments.forEach(a => {
    const key = `${a.retailer}|${a.format}`;
    if (!groups[key]) groups[key] = { retailer: a.retailer, format: a.format, skus: new Set() };
    a.sku_ids.forEach(id => groups[key].skus.add(id));
  });

  const results = Object.values(groups).map(g => {
    const uniqueCount = g.skus.size;
    const expected = expectedRanges[g.format];
    const status = expected && uniqueCount >= expected.min && uniqueCount <= expected.max
      ? '✅ PASS'
      : expected && uniqueCount < expected.min
      ? '⚠️  LOW'
      : '❌ HIGH';

    return {
      retailer: g.retailer,
      format: g.format,
      uniqueCount,
      expected: expected ? `${expected.min}-${expected.max}` : 'N/A',
      status
    };
  });

  // Sort by status
  results.sort((a, b) => {
    if (a.status === b.status) return b.uniqueCount - a.uniqueCount;
    if (a.status.includes('❌')) return -1;
    if (b.status.includes('❌')) return 1;
    if (a.status.includes('⚠️')) return -1;
    if (b.status.includes('⚠️')) return 1;
    return 0;
  });

  // Show top 15
  results.slice(0, 15).forEach(r => {
    console.log(`${r.status} ${r.retailer.padEnd(20)} ${r.format.padEnd(15)} ${r.uniqueCount} unique SKUs (expected: ${r.expected})`);
  });

  const passCount = results.filter(r => r.status === '✅ PASS').length;
  const totalCount = results.length;
  console.log(`\n📊 Summary: ${passCount}/${totalCount} retailer+format combinations passed (${((passCount/totalCount)*100).toFixed(1)}%)`);
}

// ============= VALIDATION C: TEMPLATE CONSISTENCY =============

function validateTemplateConsistency() {
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION C: TEMPLATE CONSISTENCY');
  console.log('='.repeat(80));
  console.log('\nExpected: < 5% of stores have exactly baseline assortment\n');

  // For each template, check how many stores have exactly the baseline
  const templateResults = [];

  templates.forEach(template => {
    const baselineSKUs = template.ranked_skus
      .slice(0, template.baseline_sku_count)
      .map(s => s.sku_id)
      .sort()
      .join(',');

    const matchingStores = assortments.filter(a => {
      if (a.template_id !== template.template_id) return false;
      const storeSKUs = [...a.sku_ids].sort().join(',');
      return storeSKUs === baselineSKUs;
    });

    const storesUsingTemplate = assortments.filter(a => a.template_id === template.template_id);
    const exactMatchPct = storesUsingTemplate.length > 0
      ? (matchingStores.length / storesUsingTemplate.length) * 100
      : 0;

    const status = exactMatchPct < 5 ? '✅ PASS' : exactMatchPct < 10 ? '⚠️  WARNING' : '❌ FAIL';

    templateResults.push({
      template: template.template_id,
      storeCount: storesUsingTemplate.length,
      exactMatches: matchingStores.length,
      exactMatchPct,
      status
    });
  });

  // Sort by exact match percentage (highest first)
  templateResults.sort((a, b) => b.exactMatchPct - a.exactMatchPct);

  // Show top 10
  templateResults.slice(0, 10).forEach(r => {
    console.log(`${r.status} ${r.template.padEnd(30)} ${r.exactMatches}/${r.storeCount} stores exact (${r.exactMatchPct.toFixed(1)}%)`);
  });

  const passCount = templateResults.filter(r => r.status === '✅ PASS').length;
  const totalCount = templateResults.length;
  console.log(`\n📊 Summary: ${passCount}/${totalCount} templates passed (${((passCount/totalCount)*100).toFixed(1)}%)`);
}

// ============= VALIDATION D: BRAND TIER DISTRIBUTION =============

function validateBrandTierDistribution() {
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION D: BRAND TIER DISTRIBUTION');
  console.log('='.repeat(80));
  console.log('\nExpected:');
  console.log('  Premium retailers: 40-60% premium SKUs');
  console.log('  Value retailers: 60-80% value SKUs');
  console.log('  Mainstream: balanced across tiers\n');

  const retailerPositioning = {
    "Waitrose": "premium",
    "M&S Food": "premium",
    "Aldi": "value",
    "Lidl": "value"
  };

  // Group by retailer
  const retailerGroups = {};
  assortments.forEach(a => {
    if (!retailerGroups[a.retailer]) {
      retailerGroups[a.retailer] = {
        retailer: a.retailer,
        positioning: retailerPositioning[a.retailer] || "mainstream",
        tierCounts: { premium: 0, mainstream: 0, value: 0, total: 0 }
      };
    }

    const group = retailerGroups[a.retailer];
    group.tierCounts.premium += a.tier_breakdown.premium;
    group.tierCounts.mainstream += a.tier_breakdown.mainstream;
    group.tierCounts.value += a.tier_breakdown.value;
    group.tierCounts.total += a.sku_count;
  });

  const results = Object.values(retailerGroups).map(g => {
    const premiumPct = (g.tierCounts.premium / g.tierCounts.total) * 100;
    const mainstreamPct = (g.tierCounts.mainstream / g.tierCounts.total) * 100;
    const valuePct = (g.tierCounts.value / g.tierCounts.total) * 100;

    let status = '✅ PASS';
    if (g.positioning === 'premium' && premiumPct < 35) {
      status = '❌ FAIL (premium < 35%)';
    } else if (g.positioning === 'value' && valuePct < 60) {
      status = '❌ FAIL (value < 60%)';
    } else if (g.positioning === 'value' && premiumPct > 20) {
      status = '❌ FAIL (premium > 20%)';
    }

    return {
      retailer: g.retailer,
      positioning: g.positioning,
      premiumPct,
      mainstreamPct,
      valuePct,
      status
    };
  });

  // Sort by positioning then retailer
  results.sort((a, b) => {
    if (a.positioning !== b.positioning) {
      const order = { premium: 0, mainstream: 1, value: 2 };
      return order[a.positioning] - order[b.positioning];
    }
    return a.retailer.localeCompare(b.retailer);
  });

  // Show all
  results.forEach(r => {
    console.log(`${r.status.padEnd(30)} ${r.retailer.padEnd(20)} P:${r.premiumPct.toFixed(1)}% M:${r.mainstreamPct.toFixed(1)}% V:${r.valuePct.toFixed(1)}%`);
  });

  const passCount = results.filter(r => r.status === '✅ PASS').length;
  const totalCount = results.length;
  console.log(`\n📊 Summary: ${passCount}/${totalCount} retailers passed (${((passCount/totalCount)*100).toFixed(1)}%)`);
}

// ============= EXECUTE =============

console.log('\n' + '█'.repeat(80));
console.log('TEMPLATE-BASED ASSORTMENT VALIDATION');
console.log('█'.repeat(80));

validateWithinRetailerOverlap();
validateSKUDiversity();
validateTemplateConsistency();
validateBrandTierDistribution();

console.log('\n' + '█'.repeat(80));
console.log('VALIDATION COMPLETE');
console.log('█'.repeat(80) + '\n');
