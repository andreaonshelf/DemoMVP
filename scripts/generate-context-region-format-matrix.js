#!/usr/bin/env node

/**
 * CONTEXT-REGION-FORMAT MATRIX
 *
 * Validates that store_context aligns with UK retail reality
 */

const fs = require('fs');
const path = require('path');

const stores = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/1-stores.json'),
  'utf-8'
));

console.log(`Loaded ${stores.length} stores\n`);

let output = '';

output += '═══════════════════════════════════════════════\n';
output += 'CONTEXT × REGION × FORMAT MATRIX\n';
output += `Generated: ${new Date().toISOString()}\n`;
output += '═══════════════════════════════════════════════\n\n';

// ============= BUILD MATRIX =============

const matrix = {};

stores.forEach(s => {
  const key = `${s.region}|${s.store_context}|${s.format}`;
  matrix[key] = (matrix[key] || 0) + 1;
});

// ============= OUTPUT BY CONTEXT =============

const contexts = ['residential', 'mixed', 'transit', 'office_core'];

contexts.forEach(context => {
  const contextStores = stores.filter(s => s.store_context === context);

  output += `${context.toUpperCase()} CONTEXT (${contextStores.length} stores)\n`;
  output += '─────────────────────────────────────────────────\n';

  // Group by region
  const regionCounts = {};
  contextStores.forEach(s => {
    if (!regionCounts[s.region]) regionCounts[s.region] = {};
    regionCounts[s.region][s.format] = (regionCounts[s.region][s.format] || 0) + 1;
  });

  Object.entries(regionCounts)
    .sort((a, b) => {
      const totalA = Object.values(a[1]).reduce((sum, v) => sum + v, 0);
      const totalB = Object.values(b[1]).reduce((sum, v) => sum + v, 0);
      return totalB - totalA;
    })
    .forEach(([region, formats]) => {
      const total = Object.values(formats).reduce((sum, v) => sum + v, 0);
      output += `\n${region} (${total} stores):\n`;
      Object.entries(formats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([format, count]) => {
          output += `  ${format}: ${count}\n`;
        });
    });

  output += '\n';
});

// ============= VALIDATION FLAGS =============

output += 'VALIDATION FLAGS\n';
output += '═══════════════════════════════════════════════\n\n';

const flags = [];

// Check 1: Hypermarkets should NOT be in transit or office_core
const hypermarketsTransit = stores.filter(s =>
  s.format === 'Hypermarket' && (s.store_context === 'transit' || s.store_context === 'office_core')
);

if (hypermarketsTransit.length > 0) {
  flags.push(`⚠️  ${hypermarketsTransit.length} hypermarkets in transit/office_core contexts`);
  hypermarketsTransit.slice(0, 5).forEach(s => {
    flags.push(`   - ${s.store_id}: ${s.store_context} in ${s.region}`);
  });
} else {
  flags.push('✅ No hypermarkets in transit/office_core contexts');
}

// Check 2: Discounters should NOT be in transit in metro areas
const denseRegions = ['London', 'North West', 'Yorkshire and the Humber', 'West Midlands'];
const discountersTransitMetro = stores.filter(s =>
  s.format === 'Discounter' && s.store_context === 'transit' && denseRegions.includes(s.region)
);

if (discountersTransitMetro.length > 0) {
  flags.push(`⚠️  ${discountersTransitMetro.length} discounters in transit context in metro areas`);
  discountersTransitMetro.slice(0, 5).forEach(s => {
    flags.push(`   - ${s.store_id}: transit in ${s.region}`);
  });
} else {
  flags.push('✅ No discounters in transit contexts in metro areas');
}

// Check 3: Convenience should dominate transit/office_core in dense regions
const transitStores = stores.filter(s => s.store_context === 'transit' && denseRegions.includes(s.region));
const transitConvenience = transitStores.filter(s => s.format === 'Convenience').length;

const transitConvPct = transitStores.length > 0 ? (transitConvenience / transitStores.length * 100) : 0;

if (transitConvPct < 40) {
  flags.push(`⚠️  Convenience is only ${transitConvPct.toFixed(1)}% of transit stores in metro areas (expected >40%)`);
} else {
  flags.push(`✅ Convenience dominates transit contexts (${transitConvPct.toFixed(1)}%)`);
}

// Check 4: Forecourts should map to transit or suburban contexts
const forecourts = stores.filter(s => s.format === 'Forecourt');
const forecourtTransit = forecourts.filter(s => s.store_context === 'transit' || s.store_context === 'residential').length;
const forecourtPct = forecourts.length > 0 ? (forecourtTransit / forecourts.length * 100) : 0;

if (forecourtPct < 60) {
  flags.push(`⚠️  Only ${forecourtPct.toFixed(1)}% of forecourts are in transit/residential contexts (expected >60%)`);
} else {
  flags.push(`✅ Forecourts appropriately positioned (${forecourtPct.toFixed(1)}% in transit/residential)`);
}

flags.forEach(flag => output += flag + '\n');
output += '\n';

// ============= FORMAT × CONTEXT SUMMARY =============

output += 'FORMAT × CONTEXT SUMMARY\n';
output += '═══════════════════════════════════════════════\n\n';

const formats = ['Hypermarket', 'Supermarket', 'Convenience', 'Discounter', 'Forecourt'];

formats.forEach(format => {
  const formatStores = stores.filter(s => s.format === format);
  if (formatStores.length === 0) return;

  output += `${format} (${formatStores.length} stores):\n`;

  const contextCounts = {};
  formatStores.forEach(s => {
    contextCounts[s.store_context] = (contextCounts[s.store_context] || 0) + 1;
  });

  Object.entries(contextCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([context, count]) => {
      output += `  ${context}: ${count} (${(count / formatStores.length * 100).toFixed(1)}%)\n`;
    });

  output += '\n';
});

// ============= SAVE OUTPUT =============

const outputPath = path.join(__dirname, '../CONTEXT-REGION-FORMAT.md');
fs.writeFileSync(outputPath, output);

console.log(`✅ SAVED: ${outputPath}\n`);
