#!/usr/bin/env node

/**
 * FILE 1 VALIDATION - 5 REQUIRED CHECKS
 *
 * A. Format-Region Matrix
 * B. Format Spacing Diagnostics
 * C. Competition Realism
 * D. Cluster Health
 * E. Outlier Checks
 */

const fs = require('fs');
const path = require('path');

const stores = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/STORES-FINAL.json'),
  'utf-8'
));

console.log(`Loaded ${stores.length} stores\n`);

// Helper functions
function calculateDistance(store1, store2) {
  if (!store1.latitude || !store2.latitude) return 999999;
  const R = 6371e3;
  const φ1 = store1.latitude * Math.PI / 180;
  const φ2 = store2.latitude * Math.PI / 180;
  const Δφ = (store2.latitude - store1.latitude) * Math.PI / 180;
  const Δλ = (store2.longitude - store1.longitude) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isLondonCentral(lat, lng) {
  const centralLat = 51.5074;
  const centralLng = -0.1278;
  const distance = Math.sqrt(
    Math.pow((lat - centralLat) * 111, 2) +
    Math.pow((lng - centralLng) * 111 * Math.cos(centralLat * Math.PI / 180), 2)
  );
  return distance < 5;
}

// ============= A. FORMAT-REGION MATRIX =============

console.log('CHECK A: Format-Region Matrix...\n');

const regionFormatMatrix = {};
stores.forEach(s => {
  if (!regionFormatMatrix[s.region]) regionFormatMatrix[s.region] = {};
  regionFormatMatrix[s.region][s.format] = (regionFormatMatrix[s.region][s.format] || 0) + 1;
});

let formatRegionOutput = '';
formatRegionOutput += '═══════════════════════════════════════════════\n';
formatRegionOutput += 'A. FORMAT-REGION DISTRIBUTION\n';
formatRegionOutput += '═══════════════════════════════════════════════\n\n';

Object.entries(regionFormatMatrix)
  .sort((a, b) => {
    const totalA = Object.values(a[1]).reduce((sum, v) => sum + v, 0);
    const totalB = Object.values(b[1]).reduce((sum, v) => sum + v, 0);
    return totalB - totalA;
  })
  .forEach(([region, formats]) => {
    const total = Object.values(formats).reduce((sum, v) => sum + v, 0);
    formatRegionOutput += `${region} (${total} stores):\n`;
    Object.entries(formats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([format, count]) => {
        formatRegionOutput += `  ${format}: ${count} (${(count / total * 100).toFixed(1)}%)\n`;
      });
    formatRegionOutput += '\n';
  });

// Flags
formatRegionOutput += 'FLAGS:\n';
formatRegionOutput += '─────────────────────────────────────────────────\n';

let flags = [];

// Check for hypermarkets in central London
stores.filter(s => s.format === 'Hypermarket').forEach(s => {
  if (isLondonCentral(s.latitude, s.longitude)) {
    flags.push(`⚠️  ${s.store_id}: Hypermarket in central London`);
  }
});

// Check London convenience ratio
const londonStores = stores.filter(s => s.region === 'London');
const londonConvenience = londonStores.filter(s => s.format === 'Convenience').length;
if (londonConvenience / londonStores.length < 0.4) {
  flags.push(`⚠️  London has only ${(londonConvenience / londonStores.length * 100).toFixed(1)}% convenience stores (expected >40%)`);
}

if (flags.length === 0) {
  formatRegionOutput += '✅ No issues detected\n';
} else {
  flags.forEach(flag => formatRegionOutput += flag + '\n');
}

formatRegionOutput += '\n';

// ============= B. FORMAT SPACING DIAGNOSTICS =============

console.log('CHECK B: Format Spacing...\n');

let spacingOutput = '';
spacingOutput += '═══════════════════════════════════════════════\n';
spacingOutput += 'B. FORMAT SPACING DIAGNOSTICS\n';
spacingOutput += '═══════════════════════════════════════════════\n\n';

const formats = ['Hypermarket', 'Supermarket', 'Convenience', 'Discounter', 'Forecourt'];

formats.forEach(format => {
  const formatStores = stores.filter(s => s.format === format);
  if (formatStores.length < 2) return;

  const distances = [];
  formatStores.forEach((store, i) => {
    let minDist = Infinity;
    formatStores.forEach((other, j) => {
      if (i !== j) {
        const dist = calculateDistance(store, other);
        if (dist < minDist) minDist = dist;
      }
    });
    if (minDist !== Infinity) distances.push(minDist);
  });

  distances.sort((a, b) => a - b);
  const min = Math.round(distances[0]);
  const median = Math.round(distances[Math.floor(distances.length / 2)]);
  const max = Math.round(distances[distances.length - 1]);

  spacingOutput += `${format} (${formatStores.length} stores):\n`;
  spacingOutput += `  Min: ${min}m, Median: ${median}m, Max: ${max}m\n`;

  // Flags
  const expectedMin = {
    'Hypermarket': 1200,
    'Supermarket': 300,
    'Convenience': 50,
    'Discounter': 500,
    'Forecourt': 200
  };

  if (min < expectedMin[format]) {
    spacingOutput += `  ⚠️  Too close: ${min}m < ${expectedMin[format]}m expected\n`;
  } else {
    spacingOutput += `  ✅ Spacing acceptable\n`;
  }

  spacingOutput += '\n';
});

// ============= C. COMPETITION REALISM =============

console.log('CHECK C: Competition Realism...\n');

let competitionOutput = '';
competitionOutput += '═══════════════════════════════════════════════\n';
competitionOutput += 'C. COMPETITION REALISM\n';
competitionOutput += '═══════════════════════════════════════════════\n\n';

const expectedCompetition = {
  'Convenience': [3, 8, 'high'],
  'Supermarket': [1, 3, 'moderate'],
  'Discounter': [0, 2, 'low'],
  'Hypermarket': [0, 1, 'very low'],
  'Forecourt': [0, 3, 'low-moderate']
};

formats.forEach(format => {
  const formatStores = stores.filter(s => s.format === format);
  if (formatStores.length === 0) return;

  const compCounts = formatStores.map(s => {
    return s.nearby_competition ? s.nearby_competition.filter(c => c.distance < 400).length : 0;
  });

  const avg = compCounts.reduce((a, b) => a + b, 0) / compCounts.length;
  const min = Math.min(...compCounts);
  const max = Math.max(...compCounts);

  competitionOutput += `${format}:\n`;
  competitionOutput += `  Avg competitors <400m: ${avg.toFixed(1)}\n`;
  competitionOutput += `  Range: ${min} - ${max}\n`;

  const [expectedMin, expectedMax, label] = expectedCompetition[format] || [0, 5, 'moderate'];
  if (avg < expectedMin || avg > expectedMax) {
    competitionOutput += `  ⚠️  Expected ${label} (${expectedMin}-${expectedMax}), got ${avg.toFixed(1)}\n`;
  } else {
    competitionOutput += `  ✅ Competition level appropriate\n`;
  }

  competitionOutput += '\n';
});

// ============= D. CLUSTER HEALTH =============

console.log('CHECK D: Cluster Health...\n');

let clusterOutput = '';
clusterOutput += '═══════════════════════════════════════════════\n';
clusterOutput += 'D. CLUSTER HEALTH\n';
clusterOutput += '═══════════════════════════════════════════════\n\n';

const clusters = {};
stores.forEach(s => {
  if (!clusters[s.cluster_id]) {
    clusters[s.cluster_id] = {
      stores: [],
      retailers: new Set(),
      formats: new Set()
    };
  }
  clusters[s.cluster_id].stores.push(s);
  clusters[s.cluster_id].retailers.add(s.retailer);
  clusters[s.cluster_id].formats.add(s.format);
});

const clusterSizes = Object.values(clusters).map(c => c.stores.length);
const clusterRetailerDiversity = Object.values(clusters).map(c => c.retailers.size);

clusterOutput += `Total clusters: ${Object.keys(clusters).length}\n`;
clusterOutput += `Median cluster size: ${clusterSizes.sort((a, b) => a - b)[Math.floor(clusterSizes.length / 2)]}\n`;
clusterOutput += `Avg retailers per cluster: ${(clusterRetailerDiversity.reduce((a, b) => a + b, 0) / clusterRetailerDiversity.length).toFixed(1)}\n`;
clusterOutput += '\n';

clusterOutput += 'Sample clusters:\n';
Object.entries(clusters)
  .sort((a, b) => b[1].stores.length - a[1].stores.length)
  .slice(0, 5)
  .forEach(([clusterId, data]) => {
    clusterOutput += `\n${clusterId} (${data.stores.length} stores):\n`;
    clusterOutput += `  Retailers: ${Array.from(data.retailers).join(', ')}\n`;
    clusterOutput += `  Formats: ${Array.from(data.formats).join(', ')}\n`;
  });

clusterOutput += '\n';

// ============= E. OUTLIER CHECKS =============

console.log('CHECK E: Outlier Checks...\n');

let outlierOutput = '';
outlierOutput += '═══════════════════════════════════════════════\n';
outlierOutput += 'E. CAPACITY OUTLIERS\n';
outlierOutput += '═══════════════════════════════════════════════\n\n';

const outliers = [];

stores.forEach(s => {
  // Supermarket with <8 category SKUs
  if (s.format === 'Supermarket' && s.category_sku_capacity < 8) {
    outliers.push(`⚠️  ${s.store_id}: Supermarket with only ${s.category_sku_capacity} category SKUs (expected ≥8)`);
  }

  // Convenience with >20 category SKUs
  if (s.format === 'Convenience' && s.category_sku_capacity > 20) {
    outliers.push(`⚠️  ${s.store_id}: Convenience with ${s.category_sku_capacity} category SKUs (expected ≤15)`);
  }

  // Hypermarket with <25 category SKUs
  if (s.format === 'Hypermarket' && s.category_sku_capacity < 25) {
    outliers.push(`⚠️  ${s.store_id}: Hypermarket with only ${s.category_sku_capacity} category SKUs (expected ≥35)`);
  }

  // Forecourt with >12 category SKUs
  if (s.format === 'Forecourt' && s.category_sku_capacity > 12) {
    outliers.push(`⚠️  ${s.store_id}: Forecourt with ${s.category_sku_capacity} category SKUs (expected ≤8)`);
  }
});

if (outliers.length === 0) {
  outlierOutput += '✅ No capacity outliers detected\n';
} else {
  outlierOutput += `Found ${outliers.length} outliers:\n\n`;
  outliers.forEach(outlier => outlierOutput += outlier + '\n');
}

outlierOutput += '\n';

// Category SKU capacity distribution
outlierOutput += 'Category SKU Capacity by Format:\n';
outlierOutput += '─────────────────────────────────────────────────\n';

formats.forEach(format => {
  const formatStores = stores.filter(s => s.format === format);
  if (formatStores.length === 0) return;

  const capacities = formatStores.map(s => s.category_sku_capacity);
  const avg = capacities.reduce((a, b) => a + b, 0) / capacities.length;
  const min = Math.min(...capacities);
  const max = Math.max(...capacities);

  outlierOutput += `${format}: avg ${avg.toFixed(1)}, range ${min}-${max}\n`;
});

// ============= SAVE ALL OUTPUTS =============

const outputs = {
  'FORMAT-DISTRIBUTION-BY-REGION.md': formatRegionOutput,
  'SPATIAL-FORMAT-VALIDATION.md': spacingOutput,
  'COMPETITION-REALISM.md': competitionOutput,
  'CLUSTER-FORMAT-HEATMAP.md': clusterOutput,
  'CAPACITY-OUTLIERS.md': outlierOutput
};

Object.entries(outputs).forEach(([filename, content]) => {
  const filePath = path.join(__dirname, `../${filename}`);
  fs.writeFileSync(filePath, content);
  console.log(`✅ SAVED: ${filename}`);
});

console.log('\n✅ All validation checks complete\n');
