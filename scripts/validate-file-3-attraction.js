#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATE FILE 3: 3-store-attraction.json
// ═══════════════════════════════════════════════════════════════════════════

function validateFile3() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('FILE 3 VALIDATION');
  console.log('═══════════════════════════════════════════════════\n');

  // Load files
  const file1Path = path.join(__dirname, '../data/1-stores.json');
  const file2Path = path.join(__dirname, '../data/2-cluster-population.json');
  const file3Path = path.join(__dirname, '../data/3-store-attraction.json');

  const stores = JSON.parse(fs.readFileSync(file1Path, 'utf-8'));
  const clusters = JSON.parse(fs.readFileSync(file2Path, 'utf-8'));
  const attractions = JSON.parse(fs.readFileSync(file3Path, 'utf-8'));

  console.log(`Loaded ${stores.length} stores from File 1`);
  console.log(`Loaded ${clusters.length} clusters from File 2`);
  console.log(`Loaded ${attractions.length} store attractions from File 3\n`);

  const issues = [];

  // Create lookups
  const storeMap = {};
  stores.forEach(s => { storeMap[s.store_id] = s; });

  const clusterMap = {};
  clusters.forEach(c => { clusterMap[c.cluster_id] = c; });

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 1: Cluster-level sum validation
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 1: Cluster share sums to 1.0\\n');

  const clusterGroups = {};
  attractions.forEach(attr => {
    if (!clusterGroups[attr.cluster_id]) {
      clusterGroups[attr.cluster_id] = [];
    }
    clusterGroups[attr.cluster_id].push(attr);
  });

  let sumErrors = 0;
  for (const [clusterId, clusterStores] of Object.entries(clusterGroups)) {
    const shareSum = clusterStores.reduce((sum, s) => sum + s.cluster_share, 0);
    if (Math.abs(shareSum - 1.0) > 0.01) {
      issues.push(`${clusterId}: Cluster shares sum to ${shareSum.toFixed(4)}`);
      sumErrors++;
    }
  }

  if (sumErrors === 0) {
    console.log(`✅ All ${Object.keys(clusterGroups).length} clusters sum to 1.0\\n`);
  } else {
    console.log(`❌ ${sumErrors} cluster share sum errors\\n`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 2: Retailer positioning effects
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 2: Retailer positioning effects\\n');

  // Find clusters with Waitrose vs Aldi
  const waitroseVsAldi = [];
  for (const [clusterId, clusterStores] of Object.entries(clusterGroups)) {
    const waitrose = clusterStores.find(s => storeMap[s.store_id]?.retailer === 'Waitrose');
    const aldi = clusterStores.find(s => storeMap[s.store_id]?.retailer === 'Aldi');

    if (waitrose && aldi) {
      waitroseVsAldi.push({
        cluster_id: clusterId,
        waitrose: {
          income_high: waitrose.attracted_demographics.income_high,
          premium_crafters: waitrose.attracted_segments.beer.premium_crafters,
          value_seekers: waitrose.attracted_segments.beer.value_seekers
        },
        aldi: {
          income_high: aldi.attracted_demographics.income_high,
          premium_crafters: aldi.attracted_segments.beer.premium_crafters,
          value_seekers: aldi.attracted_segments.beer.value_seekers
        }
      });
    }
  }

  console.log(`Found ${waitroseVsAldi.length} clusters with both Waitrose and Aldi\\n`);

  if (waitroseVsAldi.length > 0) {
    const sample = waitroseVsAldi[0];
    console.log('Example cluster:');
    console.log(`  Waitrose income_high: ${(sample.waitrose.income_high * 100).toFixed(1)}%`);
    console.log(`  Aldi income_high: ${(sample.aldi.income_high * 100).toFixed(1)}%`);
    console.log(`  Waitrose premium_crafters: ${(sample.waitrose.premium_crafters * 100).toFixed(1)}%`);
    console.log(`  Aldi premium_crafters: ${(sample.aldi.premium_crafters * 100).toFixed(1)}%`);
    console.log(`  Waitrose value_seekers: ${(sample.waitrose.value_seekers * 100).toFixed(1)}%`);
    console.log(`  Aldi value_seekers: ${(sample.aldi.value_seekers * 100).toFixed(1)}%\\n`);

    // Calculate averages
    const avgWaitroseIncomeHigh = waitroseVsAldi.reduce((sum, c) => sum + c.waitrose.income_high, 0) / waitroseVsAldi.length;
    const avgAldiIncomeHigh = waitroseVsAldi.reduce((sum, c) => sum + c.aldi.income_high, 0) / waitroseVsAldi.length;
    const avgWaitrosePremium = waitroseVsAldi.reduce((sum, c) => sum + c.waitrose.premium_crafters, 0) / waitroseVsAldi.length;
    const avgAldiPremium = waitroseVsAldi.reduce((sum, c) => sum + c.aldi.premium_crafters, 0) / waitroseVsAldi.length;
    const avgWaitroseValue = waitroseVsAldi.reduce((sum, c) => sum + c.waitrose.value_seekers, 0) / waitroseVsAldi.length;
    const avgAldiValue = waitroseVsAldi.reduce((sum, c) => sum + c.aldi.value_seekers, 0) / waitroseVsAldi.length;

    console.log('Averages across all Waitrose vs Aldi clusters:');
    console.log(`  Waitrose income_high: ${(avgWaitroseIncomeHigh * 100).toFixed(1)}%`);
    console.log(`  Aldi income_high: ${(avgAldiIncomeHigh * 100).toFixed(1)}%`);
    console.log(`  Lift: ${((avgWaitroseIncomeHigh - avgAldiIncomeHigh) * 100).toFixed(1)}pp\\n`);

    console.log(`  Waitrose premium_crafters: ${(avgWaitrosePremium * 100).toFixed(1)}%`);
    console.log(`  Aldi premium_crafters: ${(avgAldiPremium * 100).toFixed(1)}%`);
    console.log(`  Lift: ${((avgWaitrosePremium - avgAldiPremium) * 100).toFixed(1)}pp\\n`);

    console.log(`  Waitrose value_seekers: ${(avgWaitroseValue * 100).toFixed(1)}%`);
    console.log(`  Aldi value_seekers: ${(avgAldiValue * 100).toFixed(1)}%`);
    console.log(`  Lift: ${((avgWaitroseValue - avgAldiValue) * 100).toFixed(1)}pp\\n`);

    // Validate expected patterns
    if (avgWaitroseIncomeHigh <= avgAldiIncomeHigh) {
      issues.push('Waitrose should attract more income_high than Aldi');
    }
    if (avgWaitrosePremium <= avgAldiPremium) {
      issues.push('Waitrose should attract more premium_crafters than Aldi');
    }
    if (avgWaitroseValue >= avgAldiValue) {
      issues.push('Waitrose should attract fewer value_seekers than Aldi');
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 3: Format effects on missions
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 3: Format effects on missions\\n');

  const hypermarkets = attractions.filter(a => storeMap[a.store_id]?.format === 'Hypermarket');
  const convenience = attractions.filter(a => storeMap[a.store_id]?.format === 'Convenience');

  if (hypermarkets.length > 0 && convenience.length > 0) {
    const avgHyperMainShop = hypermarkets.reduce((sum, s) => sum + s.attracted_missions.main_shop, 0) / hypermarkets.length;
    const avgConvMainShop = convenience.reduce((sum, s) => sum + s.attracted_missions.main_shop, 0) / convenience.length;
    const avgHyperImmediate = hypermarkets.reduce((sum, s) => sum + s.attracted_missions.immediate_consumption, 0) / hypermarkets.length;
    const avgConvImmediate = convenience.reduce((sum, s) => sum + s.attracted_missions.immediate_consumption, 0) / convenience.length;

    console.log(`Hypermarkets (${hypermarkets.length} stores):`);
    console.log(`  Main Shop: ${(avgHyperMainShop * 100).toFixed(1)}%`);
    console.log(`  Immediate: ${(avgHyperImmediate * 100).toFixed(1)}%\\n`);

    console.log(`Convenience (${convenience.length} stores):`);
    console.log(`  Main Shop: ${(avgConvMainShop * 100).toFixed(1)}%`);
    console.log(`  Immediate: ${(avgConvImmediate * 100).toFixed(1)}%\\n`);

    if (avgHyperMainShop <= avgConvMainShop) {
      issues.push('Hypermarkets should have higher main_shop than Convenience');
    }
    if (avgHyperImmediate >= avgConvImmediate) {
      issues.push('Convenience should have higher immediate_consumption than Hypermarkets');
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 4: Context effects on daytime population
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 4: Context effects on daytime population\\n');

  const transitStores = attractions.filter(a => storeMap[a.store_id]?.store_context === 'transit');
  const residentialStores = attractions.filter(a => storeMap[a.store_id]?.store_context === 'residential');

  if (transitStores.length > 0 && residentialStores.length > 0) {
    const avgTransitCommuters = transitStores.reduce((sum, s) => sum + s.attracted_demographics.daily_commuters_share, 0) / transitStores.length;
    const avgResidentialCommuters = residentialStores.reduce((sum, s) => sum + s.attracted_demographics.daily_commuters_share, 0) / residentialStores.length;
    const avgTransitResidents = transitStores.reduce((sum, s) => sum + s.attracted_demographics.local_residents_share, 0) / transitStores.length;
    const avgResidentialResidents = residentialStores.reduce((sum, s) => sum + s.attracted_demographics.local_residents_share, 0) / residentialStores.length;

    console.log(`Transit stores (${transitStores.length} stores):`);
    console.log(`  Commuters: ${(avgTransitCommuters * 100).toFixed(1)}%`);
    console.log(`  Residents: ${(avgTransitResidents * 100).toFixed(1)}%\\n`);

    console.log(`Residential stores (${residentialStores.length} stores):`);
    console.log(`  Commuters: ${(avgResidentialCommuters * 100).toFixed(1)}%`);
    console.log(`  Residents: ${(avgResidentialResidents * 100).toFixed(1)}%\\n`);

    if (avgTransitCommuters <= avgResidentialCommuters) {
      issues.push('Transit stores should attract more commuters than Residential');
    }
    if (avgTransitResidents >= avgResidentialResidents) {
      issues.push('Residential stores should attract more residents than Transit');
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 5: Competition effects
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 5: Competition dampening effects\\n');

  const monopolyStores = attractions.filter(a => {
    const store = storeMap[a.store_id];
    return store?.nearby_competition.filter(c => c.distance < 400).length === 0;
  });

  const heavyCompetitionStores = attractions.filter(a => {
    const store = storeMap[a.store_id];
    return store?.nearby_competition.filter(c => c.distance < 400).length >= 3;
  });

  if (monopolyStores.length > 0 && heavyCompetitionStores.length > 0) {
    const avgMonopolyShare = monopolyStores.reduce((sum, s) => sum + s.cluster_share, 0) / monopolyStores.length;
    const avgHeavyCompShare = heavyCompetitionStores.reduce((sum, s) => sum + s.cluster_share, 0) / heavyCompetitionStores.length;

    console.log(`Monopoly stores (${monopolyStores.length} stores):`);
    console.log(`  Avg cluster_share: ${(avgMonopolyShare * 100).toFixed(1)}%\\n`);

    console.log(`Heavy competition stores (${heavyCompetitionStores.length} stores, 3+ competitors):`);
    console.log(`  Avg cluster_share: ${(avgHeavyCompShare * 100).toFixed(1)}%\\n`);

    if (avgMonopolyShare <= avgHeavyCompShare) {
      issues.push('Monopoly stores should have higher cluster_share than heavy competition stores');
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════\\n');

  console.log(`✅ Total stores: ${attractions.length}`);
  console.log(`✅ Cluster share sum errors: ${sumErrors}`);
  console.log(`⚠️  Total issues: ${issues.length}\\n`);

  if (issues.length === 0) {
    console.log('✅ ALL VALIDATION CHECKS PASSED\\n');
  } else {
    console.log('Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  }

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    totalStores: attractions.length,
    totalClusters: Object.keys(clusterGroups).length,
    sumErrors,
    totalIssues: issues.length,
    issues,
    stats: {
      waitroseVsAldiCount: waitroseVsAldi.length,
      hypermarketCount: hypermarkets.length,
      convenienceCount: convenience.length,
      transitCount: transitStores.length,
      residentialCount: residentialStores.length,
      monopolyCount: monopolyStores.length,
      heavyCompetitionCount: heavyCompetitionStores.length
    }
  };

  const reportPath = path.join(__dirname, '../file3-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('📄 Validation report written to file3-validation-report.json\\n');
}

// ═════════════════════════════════════════════════════════════════════════
// RUN
// ═════════════════════════════════════════════════════════════════════════

validateFile3();
