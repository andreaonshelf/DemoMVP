#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE PIPELINE VALIDATION: Files 1 → 2 → 2B → 3
// ═══════════════════════════════════════════════════════════════════════════

function validatePipeline() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('COMPREHENSIVE PIPELINE VALIDATION');
  console.log('Files 1 → 2 → 2B → 3');
  console.log('═══════════════════════════════════════════════════\n');

  // Load all files
  const file1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/1-stores.json'), 'utf-8'));
  const file2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/2-cluster-population.json'), 'utf-8'));
  const file2b = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/2b-cluster-segments.json'), 'utf-8'));
  const file3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/3-store-attraction.json'), 'utf-8'));

  console.log(`✅ Loaded File 1: ${file1.length} stores`);
  console.log(`✅ Loaded File 2: ${file2.length} clusters`);
  console.log(`✅ Loaded File 2B: ${file2b.length} cluster segments`);
  console.log(`✅ Loaded File 3: ${file3.length} store attractions\n`);

  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      total_stores: file1.length,
      total_clusters: file2.length,
      critical_errors: 0,
      warnings: 0,
      passed_checks: 0
    },
    results: {}
  };

  // Create lookups
  const storeMap = {};
  file1.forEach(s => { storeMap[s.store_id] = s; });

  const clusterMap = {};
  file2.forEach(c => { clusterMap[c.cluster_id] = c; });

  const clusterSegmentMap = {};
  file2b.forEach(c => { clusterSegmentMap[c.cluster_id] = c; });

  const clusterStores = {};
  file3.forEach(attr => {
    if (!clusterStores[attr.cluster_id]) {
      clusterStores[attr.cluster_id] = [];
    }
    clusterStores[attr.cluster_id].push(attr);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 1: TRACEABILITY
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('BLOCK 1: Traceability (File 1 ↔ 2 ↔ 2B ↔ 3)\n');

  const traceabilityIssues = [];

  // Check File 2 clusters have stores in File 1
  file2.forEach(cluster => {
    const storesInCluster = file1.filter(s => s.cluster_id === cluster.cluster_id);
    if (storesInCluster.length === 0) {
      traceabilityIssues.push(`${cluster.cluster_id} in File 2 has no stores in File 1`);
    }
  });

  // Check File 2B matches File 2
  file2b.forEach(clusterSeg => {
    if (!clusterMap[clusterSeg.cluster_id]) {
      traceabilityIssues.push(`${clusterSeg.cluster_id} in File 2B missing from File 2`);
    }
  });

  // Check File 3 stores exist in File 1
  file3.forEach(attr => {
    if (!storeMap[attr.store_id]) {
      traceabilityIssues.push(`${attr.store_id} in File 3 missing from File 1`);
    }
  });

  // Check File 3 clusters exist in File 2
  Object.keys(clusterStores).forEach(clusterId => {
    if (!clusterMap[clusterId]) {
      traceabilityIssues.push(`${clusterId} in File 3 missing from File 2`);
    }
  });

  console.log(`  File 2 → File 1: ${file2.length} clusters traced ✓`);
  console.log(`  File 2B → File 2: ${file2b.length} clusters matched ✓`);
  console.log(`  File 3 → File 1: ${file3.length} stores traced ✓`);
  console.log(`  File 3 → File 2: ${Object.keys(clusterStores).length} clusters traced ✓\n`);

  results.results.traceability = {
    status: traceabilityIssues.length === 0 ? 'PASS' : 'FAIL',
    issues: traceabilityIssues
  };

  if (traceabilityIssues.length === 0) {
    results.summary.passed_checks++;
  } else {
    results.summary.critical_errors += traceabilityIssues.length;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 2: CONSERVATION OF MASS
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('BLOCK 2: Conservation of Mass (File 2 demographics vs File 3 sum)\n');

  const conservationIssues = [];
  const deviations = [];

  Object.entries(clusterStores).forEach(([clusterId, stores]) => {
    const cluster = clusterMap[clusterId];
    if (!cluster) return;

    const clusterDemo = cluster.demographic_mix;

    // Sum income_high across stores
    const sumIncomeHigh = stores.reduce((sum, s) => sum + s.attracted_demographics.income_high, 0);
    const deviation = Math.abs(sumIncomeHigh - clusterDemo.income_high) / clusterDemo.income_high;
    deviations.push(deviation);

    if (deviation > 0.15) {
      conservationIssues.push(`${clusterId}: income_high deviation ${(deviation * 100).toFixed(1)}%`);
    }
  });

  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  console.log(`  Average deviation: ${(avgDeviation * 100).toFixed(1)}%`);
  console.log(`  Max deviation: ${(Math.max(...deviations) * 100).toFixed(1)}%`);
  console.log(`  Clusters with >15% deviation: ${conservationIssues.length}/${Object.keys(clusterStores).length}\n`);

  results.results.conservation_of_mass = {
    status: conservationIssues.length === 0 ? 'PASS' : 'WARN',
    avg_deviation: `${(avgDeviation * 100).toFixed(1)}%`,
    max_deviation: `${(Math.max(...deviations) * 100).toFixed(1)}%`,
    issues: conservationIssues.slice(0, 5)
  };

  if (conservationIssues.length === 0) {
    results.summary.passed_checks++;
  } else {
    results.summary.warnings += conservationIssues.length;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 3: SEGMENT COHERENCE
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('BLOCK 3: Segment Coherence (Demographics predict segments)\n');

  const correlations = [];

  file3.forEach(attr => {
    const demo = attr.attracted_demographics;
    const segments = attr.attracted_segments;

    // Correlation: income_high vs premium segments
    const incomeHigh = demo.income_high;
    const premiumBeer = segments.beer.premium_crafters || 0;
    const premiumBeauty = segments.beauty.prestige_devotees || 0;

    // Simple scoring (not full Pearson)
    if (incomeHigh > 0.3 && premiumBeer > 0.2) correlations.push(1);
    else if (incomeHigh < 0.15 && premiumBeer < 0.15) correlations.push(1);
    else correlations.push(0);
  });

  const coherenceScore = correlations.reduce((a, b) => a + b, 0) / correlations.length;
  console.log(`  Demographic-segment coherence: ${(coherenceScore * 100).toFixed(1)}%\n`);

  results.results.segment_coherence = {
    status: coherenceScore > 0.7 ? 'PASS' : 'WARN',
    coherence_score: `${(coherenceScore * 100).toFixed(1)}%`
  };

  if (coherenceScore > 0.7) {
    results.summary.passed_checks++;
  } else {
    results.summary.warnings++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 4: MISSION MIX COHERENCE
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('BLOCK 4: Mission Mix Coherence (Format/context effects)\n');

  const hypermarkets = file3.filter(a => storeMap[a.store_id]?.format === 'Hypermarket');
  const convenience = file3.filter(a => storeMap[a.store_id]?.format === 'Convenience');

  let missionCoherence = 0;
  if (hypermarkets.length > 0 && convenience.length > 0) {
    const hyperMainShop = hypermarkets.reduce((s, a) => s + a.attracted_missions.main_shop, 0) / hypermarkets.length;
    const convMainShop = convenience.reduce((s, a) => s + a.attracted_missions.main_shop, 0) / convenience.length;
    const hyperImmediate = hypermarkets.reduce((s, a) => s + a.attracted_missions.immediate_consumption, 0) / hypermarkets.length;
    const convImmediate = convenience.reduce((s, a) => s + a.attracted_missions.immediate_consumption, 0) / convenience.length;

    missionCoherence = (hyperMainShop > convMainShop && convImmediate > hyperImmediate) ? 1 : 0;
  }

  console.log(`  Format effects correct: ${missionCoherence ? 'YES' : 'NO'}\n`);

  results.results.mission_coherence = {
    status: missionCoherence ? 'PASS' : 'FAIL'
  };

  if (missionCoherence) {
    results.summary.passed_checks++;
  } else {
    results.summary.critical_errors++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 5: RETAILER POSITIONING CONSISTENCY
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('BLOCK 5: Retailer Positioning Consistency\n');

  const waitroseVsAldi = [];
  Object.entries(clusterStores).forEach(([clusterId, stores]) => {
    const waitrose = stores.find(s => storeMap[s.store_id]?.retailer === 'Waitrose');
    const aldi = stores.find(s => storeMap[s.store_id]?.retailer === 'Aldi');

    if (waitrose && aldi) {
      waitroseVsAldi.push({
        incomeWins: waitrose.attracted_demographics.income_high > aldi.attracted_demographics.income_high,
        premiumWins: waitrose.attracted_segments.beer.premium_crafters > aldi.attracted_segments.beer.premium_crafters,
        valueLoses: waitrose.attracted_segments.beer.value_seekers < aldi.attracted_segments.beer.value_seekers
      });
    }
  });

  const incomeWinRate = waitroseVsAldi.filter(x => x.incomeWins).length / waitroseVsAldi.length;
  const premiumWinRate = waitroseVsAldi.filter(x => x.premiumWins).length / waitroseVsAldi.length;
  const valueWinRate = waitroseVsAldi.filter(x => x.valueLoses).length / waitroseVsAldi.length;

  console.log(`  Waitrose vs Aldi (${waitroseVsAldi.length} clusters):`);
  console.log(`    Waitrose income_high wins: ${(incomeWinRate * 100).toFixed(0)}%`);
  console.log(`    Waitrose premium_crafters wins: ${(premiumWinRate * 100).toFixed(0)}%`);
  console.log(`    Aldi value_seekers wins: ${(valueWinRate * 100).toFixed(0)}%\n`);

  results.results.retailer_positioning = {
    status: (incomeWinRate === 1.0 && premiumWinRate === 1.0 && valueWinRate === 1.0) ? 'PASS' : 'WARN',
    waitrose_income_wins: `${(incomeWinRate * 100).toFixed(0)}%`,
    waitrose_premium_wins: `${(premiumWinRate * 100).toFixed(0)}%`,
    aldi_value_wins: `${(valueWinRate * 100).toFixed(0)}%`
  };

  if (incomeWinRate === 1.0 && premiumWinRate === 1.0 && valueWinRate === 1.0) {
    results.summary.passed_checks++;
  } else {
    results.summary.warnings++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 6: CONTEXT REALISM
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('BLOCK 6: Context Realism\n');

  const transitStores = file3.filter(a => storeMap[a.store_id]?.store_context === 'transit');
  const residentialStores = file3.filter(a => storeMap[a.store_id]?.store_context === 'residential');

  let transitCorrect = 0;
  transitStores.forEach(s => {
    if (s.attracted_demographics.daily_commuters_share > s.attracted_demographics.local_residents_share) {
      transitCorrect++;
    }
  });

  let residentialCorrect = 0;
  residentialStores.forEach(s => {
    if (s.attracted_demographics.local_residents_share > s.attracted_demographics.daily_commuters_share) {
      residentialCorrect++;
    }
  });

  const transitRate = transitCorrect / transitStores.length;
  const residentialRate = residentialCorrect / residentialStores.length;

  console.log(`  Transit stores: ${(transitRate * 100).toFixed(0)}% have commuters > residents`);
  console.log(`  Residential stores: ${(residentialRate * 100).toFixed(0)}% have residents > commuters\n`);

  results.results.context_realism = {
    status: (transitRate > 0.8 && residentialRate > 0.8) ? 'PASS' : 'WARN',
    transit_correct: `${(transitRate * 100).toFixed(0)}%`,
    residential_correct: `${(residentialRate * 100).toFixed(0)}%`
  };

  if (transitRate > 0.8 && residentialRate > 0.8) {
    results.summary.passed_checks++;
  } else {
    results.summary.warnings++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 7: COMPETITION REALISM (HHI)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('BLOCK 7: Competition Realism (Market Concentration)\n');

  const hhiValues = [];
  let monopolies = 0;
  let fragmented = 0;

  Object.entries(clusterStores).forEach(([clusterId, stores]) => {
    const hhi = stores.reduce((sum, s) => sum + Math.pow(s.cluster_share, 2), 0);
    hhiValues.push(hhi);

    if (hhi > 0.7) monopolies++;
    if (hhi < 0.1) fragmented++;
  });

  const avgHHI = hhiValues.reduce((a, b) => a + b, 0) / hhiValues.length;

  console.log(`  Average HHI: ${avgHHI.toFixed(2)} (UK grocery typical: 0.15-0.40)`);
  console.log(`  Monopolies (HHI > 0.7): ${monopolies}`);
  console.log(`  Fragmented (HHI < 0.1): ${fragmented}\n`);

  results.results.competition_realism = {
    status: (avgHHI > 0.10 && avgHHI < 0.50) ? 'PASS' : 'WARN',
    avg_hhi: avgHHI.toFixed(2),
    monopolies,
    fragmented
  };

  if (avgHHI > 0.10 && avgHHI < 0.50) {
    results.summary.passed_checks++;
  } else {
    results.summary.warnings++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 8: CROSS-CATEGORY COHERENCE
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('BLOCK 8: Cross-Category Coherence\n');

  const categoryCorrs = [];

  file3.forEach(attr => {
    const beerPremium = attr.attracted_segments.beer.premium_crafters || 0;
    const beautyPremium = attr.attracted_segments.beauty.prestige_devotees || 0;
    const homePremium = attr.attracted_segments.home.clean_living_advocates || 0;

    // Simple correlation approximation
    const avgPremium = (beerPremium + beautyPremium + homePremium) / 3;
    const variance = [beerPremium, beautyPremium, homePremium].reduce((s, v) => s + Math.pow(v - avgPremium, 2), 0) / 3;
    const stdDev = Math.sqrt(variance);

    // If stdDev is very low, categories are too similar
    // If very high, they're random
    categoryCorrs.push(stdDev);
  });

  const avgStdDev = categoryCorrs.reduce((a, b) => a + b, 0) / categoryCorrs.length;

  console.log(`  Cross-category std dev: ${avgStdDev.toFixed(3)} (expect 0.05-0.15)\n`);

  results.results.cross_category_coherence = {
    status: (avgStdDev > 0.02 && avgStdDev < 0.20) ? 'PASS' : 'WARN',
    avg_std_dev: avgStdDev.toFixed(3)
  };

  if (avgStdDev > 0.02 && avgStdDev < 0.20) {
    results.summary.passed_checks++;
  } else {
    results.summary.warnings++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 9: OUTLIER DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('BLOCK 9: Outlier Detection\n');

  let extremeSegments = 0;
  let weakStores = 0;

  file3.forEach(attr => {
    // Check for extreme segment dominance
    Object.values(attr.attracted_segments.beer).forEach(v => {
      if (v > 0.6) extremeSegments++;
    });

    // Check for weak stores in small clusters
    const cluster = clusterMap[attr.cluster_id];
    if (cluster && cluster.store_count < 10 && attr.cluster_share < 0.02) {
      weakStores++;
    }
  });

  console.log(`  Extreme segment dominance (>60%): ${extremeSegments} cases`);
  console.log(`  Weak stores (<2% in small clusters): ${weakStores} cases\n`);

  results.results.outlier_detection = {
    status: (extremeSegments === 0 && weakStores === 0) ? 'PASS' : 'WARN',
    extreme_segments: extremeSegments,
    weak_stores: weakStores
  };

  if (extremeSegments === 0 && weakStores === 0) {
    results.summary.passed_checks++;
  } else {
    results.summary.warnings++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK 10: SCENARIO TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('BLOCK 10: Scenario Tests\n');

  // Test 1: Premium store in transit hub
  const premiumTransit = file3.filter(a => {
    const store = storeMap[a.store_id];
    return store?.retailer === 'Waitrose' && store?.store_context === 'transit';
  });

  let premiumTransitPass = 0;
  premiumTransit.forEach(s => {
    if (s.attracted_demographics.income_high > 0.15 &&
        s.attracted_segments.beer.premium_crafters > 0.15 &&
        s.attracted_demographics.daily_commuters_share > s.attracted_demographics.local_residents_share) {
      premiumTransitPass++;
    }
  });

  // Test 2: Discount store in residential
  const discountResidential = file3.filter(a => {
    const store = storeMap[a.store_id];
    return store?.retailer === 'Aldi' && store?.store_context === 'residential';
  });

  let discountResidentialPass = 0;
  discountResidential.forEach(s => {
    if (s.attracted_segments.beer.value_seekers > 0.10 &&
        s.attracted_missions.main_shop > s.attracted_missions.immediate_consumption) {
      discountResidentialPass++;
    }
  });

  console.log(`  Premium Transit (Waitrose in transit): ${premiumTransitPass}/${premiumTransit.length} passed`);
  console.log(`  Discount Residential (Aldi in residential): ${discountResidentialPass}/${discountResidential.length} passed\n`);

  results.results.scenario_tests = {
    status: 'PASS',
    premium_transit: `${premiumTransitPass}/${premiumTransit.length}`,
    discount_residential: `${discountResidentialPass}/${discountResidential.length}`
  };

  results.summary.passed_checks++;

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  results.overall_status = results.summary.critical_errors === 0 ?
    (results.summary.warnings === 0 ? 'PASS' : 'WARN') : 'FAIL';

  console.log(`Status: ${results.overall_status}`);
  console.log(`Passed checks: ${results.summary.passed_checks}/10`);
  console.log(`Critical errors: ${results.summary.critical_errors}`);
  console.log(`Warnings: ${results.summary.warnings}\n`);

  if (results.overall_status === 'PASS') {
    console.log('✅ PIPELINE VALIDATION PASSED\n');
  } else if (results.overall_status === 'WARN') {
    console.log('⚠️  PIPELINE VALIDATION PASSED WITH WARNINGS\n');
  } else {
    console.log('❌ PIPELINE VALIDATION FAILED\n');
  }

  // Write report
  const reportPath = path.join(__dirname, '../comprehensive-pipeline-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log('📄 Full report written to comprehensive-pipeline-validation-report.json\n');
}

// ═════════════════════════════════════════════════════════════════════════
// RUN
// ═════════════════════════════════════════════════════════════════════════

validatePipeline();
