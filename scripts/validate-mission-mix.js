#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATE MISSION MIX IN FILE 2
// ═══════════════════════════════════════════════════════════════════════════

function validateMissionMix() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('MISSION MIX VALIDATION');
  console.log('═══════════════════════════════════════════════════\n');

  // Load enhanced File 2
  const file2Path = path.join(__dirname, '../data/2-cluster-population.json');
  const clusters = JSON.parse(fs.readFileSync(file2Path, 'utf-8'));

  console.log(`Loaded ${clusters.length} clusters\n`);

  const issues = [];
  const stats = {
    byClusterType: {},
    byDensity: { high: [], low: [] },
    byContext: {}
  };

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 1: Mission mix sums to 1.0
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 1: Mission mix sums\n');

  let sumErrors = 0;
  clusters.forEach(cluster => {
    if (!cluster.mission_mix) {
      issues.push(`${cluster.cluster_id}: Missing mission_mix`);
      sumErrors++;
      return;
    }

    const sum = Object.values(cluster.mission_mix).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      issues.push(`${cluster.cluster_id}: Mission mix sum = ${sum.toFixed(4)}`);
      sumErrors++;
    }
  });

  if (sumErrors === 0) {
    console.log('✅ All mission mixes sum to 1.0\n');
  } else {
    console.log(`❌ ${sumErrors} mission mix sum errors\n`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 2: Cluster type patterns
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 2: Mission patterns by cluster type\n');

  clusters.forEach(cluster => {
    const type = cluster.cluster_type;
    if (!stats.byClusterType[type]) {
      stats.byClusterType[type] = {
        count: 0,
        main_shop: [],
        top_up: [],
        immediate_consumption: [],
        convenience: []
      };
    }

    const stat = stats.byClusterType[type];
    stat.count++;
    stat.main_shop.push(cluster.mission_mix.main_shop);
    stat.top_up.push(cluster.mission_mix.top_up);
    stat.immediate_consumption.push(cluster.mission_mix.immediate_consumption);
    stat.convenience.push(cluster.mission_mix.convenience);
  });

  // Print averages by cluster type
  Object.keys(stats.byClusterType).forEach(type => {
    const stat = stats.byClusterType[type];
    console.log(`${type} (${stat.count} clusters):`);
    console.log(`  Main Shop: ${(stat.main_shop.reduce((a, b) => a + b, 0) / stat.count * 100).toFixed(1)}%`);
    console.log(`  Top-Up: ${(stat.top_up.reduce((a, b) => a + b, 0) / stat.count * 100).toFixed(1)}%`);
    console.log(`  Immediate: ${(stat.immediate_consumption.reduce((a, b) => a + b, 0) / stat.count * 100).toFixed(1)}%`);
    console.log(`  Convenience: ${(stat.convenience.reduce((a, b) => a + b, 0) / stat.count * 100).toFixed(1)}%\n`);
  });

  // Validate patterns
  const transitAvg = stats.byClusterType['TRANSIT_HUB'];
  const residentialAvg = stats.byClusterType['RESIDENTIAL'];

  if (transitAvg) {
    const avgImmediate = transitAvg.immediate_consumption.reduce((a, b) => a + b, 0) / transitAvg.count;
    const avgMainShop = transitAvg.main_shop.reduce((a, b) => a + b, 0) / transitAvg.count;

    if (avgImmediate < 0.25) {
      issues.push(`Transit hubs should have high immediate consumption (got ${(avgImmediate * 100).toFixed(1)}%)`);
    }
    if (avgMainShop > 0.20) {
      issues.push(`Transit hubs should have low main shop (got ${(avgMainShop * 100).toFixed(1)}%)`);
    }
  }

  if (residentialAvg) {
    const avgMainShop = residentialAvg.main_shop.reduce((a, b) => a + b, 0) / residentialAvg.count;
    const avgImmediate = residentialAvg.immediate_consumption.reduce((a, b) => a + b, 0) / residentialAvg.count;

    if (avgMainShop < 0.35) {
      issues.push(`Residential should have high main shop (got ${(avgMainShop * 100).toFixed(1)}%)`);
    }
    if (avgImmediate > 0.15) {
      issues.push(`Residential should have low immediate consumption (got ${(avgImmediate * 100).toFixed(1)}%)`);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 3: Demographic correlation
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 3: Mission patterns by demographics\n');

  // High commuters should have high immediate/convenience
  clusters.forEach(cluster => {
    const demo = cluster.demographic_mix;
    const missions = cluster.mission_mix;

    if (demo.daily_commuters_share > 0.35) {
      const immediateConvenience = missions.immediate_consumption + missions.convenience;
      if (immediateConvenience < 0.40) {
        issues.push(`${cluster.cluster_id}: High commuters (${(demo.daily_commuters_share * 100).toFixed(1)}%) but low immediate+convenience (${(immediateConvenience * 100).toFixed(1)}%)`);
      }
    }

    // High residents should have high main_shop
    if (demo.local_residents_share > 0.75) {
      if (missions.main_shop < 0.35) {
        issues.push(`${cluster.cluster_id}: High residents (${(demo.local_residents_share * 100).toFixed(1)}%) but low main_shop (${(missions.main_shop * 100).toFixed(1)}%)`);
      }
    }
  });

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 4: Variation check
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 4: Mission variation across clusters\n');

  const missionTypes = ['main_shop', 'top_up', 'immediate_consumption', 'convenience'];

  missionTypes.forEach(mission => {
    const values = clusters.map(c => c.mission_mix[mission]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    console.log(`${mission}:`);
    console.log(`  Min: ${(min * 100).toFixed(1)}%`);
    console.log(`  Max: ${(max * 100).toFixed(1)}%`);
    console.log(`  Range: ${(range * 100).toFixed(1)}pp`);
    console.log(`  Mean: ${(mean * 100).toFixed(1)}%\n`);

    if (range < 0.10) {
      issues.push(`${mission} has low variation (range=${(range * 100).toFixed(1)}pp)`);
    }
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`✅ Total clusters: ${clusters.length}`);
  console.log(`✅ Sum errors: ${sumErrors}`);
  console.log(`⚠️  Total issues: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log('✅ ALL VALIDATION CHECKS PASSED\n');
  } else {
    console.log('Issues found:');
    issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
    if (issues.length > 10) {
      console.log(`  ... and ${issues.length - 10} more\n`);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SAMPLE CLUSTERS
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('SAMPLE CLUSTERS');
  console.log('═══════════════════════════════════════════════════\n');

  // Find transit hub
  const transitHub = clusters.find(c => c.cluster_type === 'TRANSIT_HUB');
  if (transitHub) {
    console.log(`Transit Hub (${transitHub.cluster_id}):`);
    console.log(`  Commuters: ${(transitHub.demographic_mix.daily_commuters_share * 100).toFixed(1)}%`);
    console.log(`  Tourists: ${(transitHub.demographic_mix.tourists_share * 100).toFixed(1)}%`);
    console.log(`  Mission mix:`);
    console.log(`    Main Shop: ${(transitHub.mission_mix.main_shop * 100).toFixed(1)}%`);
    console.log(`    Top-Up: ${(transitHub.mission_mix.top_up * 100).toFixed(1)}%`);
    console.log(`    Immediate: ${(transitHub.mission_mix.immediate_consumption * 100).toFixed(1)}%`);
    console.log(`    Convenience: ${(transitHub.mission_mix.convenience * 100).toFixed(1)}%\n`);
  }

  // Find residential
  const residential = clusters.find(c => c.cluster_type === 'RESIDENTIAL');
  if (residential) {
    console.log(`Residential (${residential.cluster_id}):`);
    console.log(`  Residents: ${(residential.demographic_mix.local_residents_share * 100).toFixed(1)}%`);
    console.log(`  Families: ${(residential.demographic_mix.families_with_kids * 100).toFixed(1)}%`);
    console.log(`  Mission mix:`);
    console.log(`    Main Shop: ${(residential.mission_mix.main_shop * 100).toFixed(1)}%`);
    console.log(`    Top-Up: ${(residential.mission_mix.top_up * 100).toFixed(1)}%`);
    console.log(`    Immediate: ${(residential.mission_mix.immediate_consumption * 100).toFixed(1)}%`);
    console.log(`    Convenience: ${(residential.mission_mix.convenience * 100).toFixed(1)}%\n`);
  }

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    totalClusters: clusters.length,
    sumErrors,
    totalIssues: issues.length,
    issues,
    stats: stats.byClusterType
  };

  const reportPath = path.join(__dirname, '../mission-mix-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('📄 Validation report written to mission-mix-validation-report.json\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

validateMissionMix();
