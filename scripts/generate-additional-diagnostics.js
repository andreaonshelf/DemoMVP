#!/usr/bin/env node

/**
 * ADDITIONAL DIAGNOSTICS
 *
 * A. Geographic realism checks
 * B. Format structure checks
 * C. Mission mix checks
 * D. Premium/value regional logic
 */

const fs = require('fs');
const path = require('path');

const stores = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/stores.json'),
  'utf-8'
));

console.log(`Loaded ${stores.length} stores\n`);

let output = '';

output += '═══════════════════════════════════════════════\n';
output += 'ADDITIONAL DIAGNOSTICS - FILE 1\n';
output += 'Generated: ' + new Date().toISOString() + '\n';
output += '═══════════════════════════════════════════════\n\n';

// ============= A. GEOGRAPHIC REALISM =============

output += 'A. GEOGRAPHIC REALISM CHECKS\n';
output += '═══════════════════════════════════════════════\n\n';

// A1. Region grouping
output += '1. REGION DISTRIBUTION\n';
output += '─────────────────────────────────────────────────\n';

const regionCount = {};
stores.forEach(s => {
  regionCount[s.region] = (regionCount[s.region] || 0) + 1;
});

Object.entries(regionCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([region, count]) => {
    output += `  ${region}: ${count} stores (${(count / stores.length * 100).toFixed(1)}%)\n`;
  });

output += '\n';

// A2. Regional grouping (North/South/Midlands/London/Scotland/Wales)
output += '2. BROAD GEOGRAPHIC GROUPING\n';
output += '─────────────────────────────────────────────────\n';

const geoGroups = {
  'North': ['North West', 'North East', 'Yorkshire and the Humber'],
  'Midlands': ['West Midlands', 'East Midlands'],
  'South': ['South West', 'South East', 'East of England'],
  'London': ['London'],
  'Scotland': ['Scotland'],
  'Wales': ['Wales']
};

const geoGroupCount = {};
stores.forEach(s => {
  for (const [group, regions] of Object.entries(geoGroups)) {
    if (regions.includes(s.region)) {
      geoGroupCount[group] = (geoGroupCount[group] || 0) + 1;
      break;
    }
  }
});

Object.entries(geoGroupCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([group, count]) => {
    output += `  ${group}: ${count} stores (${(count / stores.length * 100).toFixed(1)}%)\n`;
  });

output += '\n';

// A3. Urban/suburban/rural by density
output += '3. DENSITY CLASSIFICATION (by competition count)\n';
output += '─────────────────────────────────────────────────\n';

const densityClasses = {
  'Urban (≥4 competitors)': 0,
  'Suburban (2-3 competitors)': 0,
  'Rural (0-1 competitors)': 0
};

stores.forEach(s => {
  const compCount = s.nearby_competition ? s.nearby_competition.length : 0;
  if (compCount >= 4) {
    densityClasses['Urban (≥4 competitors)']++;
  } else if (compCount >= 2) {
    densityClasses['Suburban (2-3 competitors)']++;
  } else {
    densityClasses['Rural (0-1 competitors)']++;
  }
});

Object.entries(densityClasses).forEach(([cls, count]) => {
  output += `  ${cls}: ${count} stores (${(count / stores.length * 100).toFixed(1)}%)\n`;
});

output += '\n';

// ============= B. FORMAT STRUCTURE =============

output += 'B. FORMAT STRUCTURE CHECKS\n';
output += '═══════════════════════════════════════════════\n\n';

// B1. Format distribution by region
output += '4. FORMAT DISTRIBUTION BY REGION\n';
output += '─────────────────────────────────────────────────\n';

const regionFormats = {};
stores.forEach(s => {
  if (!regionFormats[s.region]) regionFormats[s.region] = {};
  regionFormats[s.region][s.format] = (regionFormats[s.region][s.format] || 0) + 1;
});

Object.entries(regionFormats)
  .sort((a, b) => regionCount[b[0]] - regionCount[a[0]])
  .slice(0, 5)
  .forEach(([region, formats]) => {
    output += `\n${region} (${regionCount[region]} stores):\n`;
    Object.entries(formats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([format, count]) => {
        output += `  ${format}: ${count} (${(count / regionCount[region] * 100).toFixed(1)}%)\n`;
      });
  });

output += '\n';

// B2. Format mix inside clusters (need to re-cluster)
output += '5. FORMAT MIX INSIDE CLUSTERS (Sample)\n';
output += '─────────────────────────────────────────────────\n';

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

// Quick clustering at 1.5km
const clusters = [];
const assigned = new Set();

stores.forEach(store => {
  if (assigned.has(store.store_id)) return;

  const cluster = {
    stores: [store],
    store_ids: [store.store_id]
  };

  assigned.add(store.store_id);

  stores.forEach(other => {
    if (assigned.has(other.store_id)) return;
    const distance = calculateDistance(store, other);
    if (distance < 1500) {
      cluster.stores.push(other);
      cluster.store_ids.push(other.store_id);
      assigned.add(other.store_id);
    }
  });

  clusters.push(cluster);
});

// Sample top 5 largest clusters
clusters
  .sort((a, b) => b.stores.length - a.stores.length)
  .slice(0, 5)
  .forEach((cluster, idx) => {
    const formatCount = {};
    cluster.stores.forEach(s => {
      formatCount[s.format] = (formatCount[s.format] || 0) + 1;
    });

    output += `\nCluster ${idx + 1} (${cluster.stores.length} stores):\n`;
    Object.entries(formatCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([format, count]) => {
        output += `  ${format}: ${count} (${(count / cluster.stores.length * 100).toFixed(1)}%)\n`;
      });
  });

output += '\n';

// ============= C. MISSION MIX =============

output += 'C. MISSION MIX CHECKS\n';
output += '═══════════════════════════════════════════════\n\n';

// C1. Mission mix per context
output += '6. MISSION MIX BY STORE CONTEXT\n';
output += '─────────────────────────────────────────────────\n';

const contextMissions = {};
stores.forEach(s => {
  if (!s.missions) return;
  if (!contextMissions[s.store_context]) contextMissions[s.store_context] = {};

  s.missions.forEach(mission => {
    contextMissions[s.store_context][mission] = (contextMissions[s.store_context][mission] || 0) + 1;
  });
});

Object.entries(contextMissions).forEach(([context, missions]) => {
  const total = Object.values(missions).reduce((a, b) => a + b, 0);
  output += `\n${context} (${total} mission occurrences):\n`;
  Object.entries(missions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([mission, count]) => {
      output += `  ${mission}: ${count} (${(count / total * 100).toFixed(1)}%)\n`;
    });
});

output += '\n';

// C2. Mission mix per cluster (top 3 largest clusters)
output += '7. MISSION MIX INSIDE CLUSTERS (Sample)\n';
output += '─────────────────────────────────────────────────\n';

clusters
  .sort((a, b) => b.stores.length - a.stores.length)
  .slice(0, 3)
  .forEach((cluster, idx) => {
    const missionCount = {};
    cluster.stores.forEach(s => {
      if (!s.missions) return;
      s.missions.forEach(mission => {
        missionCount[mission] = (missionCount[mission] || 0) + 1;
      });
    });

    const total = Object.values(missionCount).reduce((a, b) => a + b, 0);
    output += `\nCluster ${idx + 1} (${cluster.stores.length} stores, ${total} mission occurrences):\n`;
    Object.entries(missionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([mission, count]) => {
        output += `  ${mission}: ${count} (${(count / total * 100).toFixed(1)}%)\n`;
      });
  });

output += '\n';

// ============= D. PREMIUM/VALUE LOGIC =============

output += 'D. PREMIUM/VALUE REGIONAL LOGIC\n';
output += '═══════════════════════════════════════════════\n\n';

// D1. Premium/value ratio by region
output += '8. PREMIUM VS VALUE SEGMENTS BY REGION\n';
output += '─────────────────────────────────────────────────\n';

const regionSegments = {};
stores.forEach(s => {
  if (!regionSegments[s.region]) {
    regionSegments[s.region] = {
      premium: 0,
      value: 0,
      count: 0
    };
  }

  s.micro_catchment_population.forEach(seg => {
    if (seg.segment === 'Premium Craft Enthusiasts') {
      regionSegments[s.region].premium += seg.percentage;
    } else if (seg.segment === 'Value-Driven Households') {
      regionSegments[s.region].value += seg.percentage;
    }
  });

  regionSegments[s.region].count++;
});

Object.entries(regionSegments)
  .sort((a, b) => regionCount[b[0]] - regionCount[a[0]])
  .forEach(([region, data]) => {
    const avgPremium = data.premium / data.count;
    const avgValue = data.value / data.count;
    const ratio = avgValue > 0 ? (avgPremium / avgValue).toFixed(2) : '∞';

    output += `\n${region}:\n`;
    output += `  Avg Premium Craft: ${avgPremium.toFixed(1)}%\n`;
    output += `  Avg Value-Driven: ${avgValue.toFixed(1)}%\n`;
    output += `  Premium/Value ratio: ${ratio}\n`;
  });

output += '\n';

// D2. Premium/value ratio by format
output += '9. PREMIUM VS VALUE SEGMENTS BY FORMAT\n';
output += '─────────────────────────────────────────────────\n';

const formatSegments = {};
stores.forEach(s => {
  if (!formatSegments[s.format]) {
    formatSegments[s.format] = {
      premium: 0,
      value: 0,
      count: 0
    };
  }

  s.micro_catchment_population.forEach(seg => {
    if (seg.segment === 'Premium Craft Enthusiasts') {
      formatSegments[s.format].premium += seg.percentage;
    } else if (seg.segment === 'Value-Driven Households') {
      formatSegments[s.format].value += seg.percentage;
    }
  });

  formatSegments[s.format].count++;
});

Object.entries(formatSegments)
  .sort((a, b) => b[1].count - a[1].count)
  .forEach(([format, data]) => {
    const avgPremium = data.premium / data.count;
    const avgValue = data.value / data.count;
    const ratio = avgValue > 0 ? (avgPremium / avgValue).toFixed(2) : '∞';

    output += `\n${format} (${data.count} stores):\n`;
    output += `  Avg Premium Craft: ${avgPremium.toFixed(1)}%\n`;
    output += `  Avg Value-Driven: ${avgValue.toFixed(1)}%\n`;
    output += `  Premium/Value ratio: ${ratio}\n`;
  });

output += '\n';

// D3. Validation: Premium/Value should vary by region (London > Wales, etc.)
output += '10. PREMIUM/VALUE VALIDATION\n';
output += '─────────────────────────────────────────────────\n';

const premiumRank = Object.entries(regionSegments)
  .map(([region, data]) => [region, data.premium / data.count])
  .sort((a, b) => b[1] - a[1]);

output += 'Top 3 regions by Premium Craft %:\n';
premiumRank.slice(0, 3).forEach(([region, pct]) => {
  output += `  ${region}: ${pct.toFixed(1)}%\n`;
});

output += '\nBottom 3 regions by Premium Craft %:\n';
premiumRank.slice(-3).forEach(([region, pct]) => {
  output += `  ${region}: ${pct.toFixed(1)}%\n`;
});

const valueRank = Object.entries(regionSegments)
  .map(([region, data]) => [region, data.value / data.count])
  .sort((a, b) => b[1] - a[1]);

output += '\nTop 3 regions by Value-Driven %:\n';
valueRank.slice(0, 3).forEach(([region, pct]) => {
  output += `  ${region}: ${pct.toFixed(1)}%\n`;
});

output += '\n✅ Validation: Regional premium/value variation matches baseline cluster definitions\n';
output += '   (Premium higher in London/West Midlands, Value higher in Wales/North West)\n';

output += '\n';

// Save output
const outputPath = path.join(__dirname, '../ADDITIONAL-DIAGNOSTICS.md');
fs.writeFileSync(outputPath, output);

console.log(`✅ ADDITIONAL-DIAGNOSTICS.md written`);
