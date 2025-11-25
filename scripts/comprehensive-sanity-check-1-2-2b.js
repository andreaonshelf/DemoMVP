#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE SANITY CHECK: FILE 1 → FILE 2 → FILE 2B
// ═══════════════════════════════════════════════════════════════════════════

function comprehensiveSanityCheck() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('COMPREHENSIVE SANITY CHECK: FILES 1 → 2 → 2B');
  console.log('═══════════════════════════════════════════════════\n');

  // Load all files
  const file1Path = path.join(__dirname, '../data/1-stores.json');
  const file2Path = path.join(__dirname, '../data/cluster-population.json');
  const file2bPath = path.join(__dirname, '../data/2b-cluster-segments.json');

  const stores = JSON.parse(fs.readFileSync(file1Path, 'utf-8'));
  const file2Records = JSON.parse(fs.readFileSync(file2Path, 'utf-8'));
  const file2bRecords = JSON.parse(fs.readFileSync(file2bPath, 'utf-8'));

  // Create maps
  const file1Map = {};
  stores.forEach(store => {
    if (!file1Map[store.cluster_id]) {
      file1Map[store.cluster_id] = {
        cluster_id: store.cluster_id,
        stores: [],
        retailers: new Set(),
        formats: {},
        contexts: {},
        hasPremium: false,
        hasDiscounters: false,
      };
    }
    const cluster = file1Map[store.cluster_id];
    cluster.stores.push(store);
    cluster.retailers.add(store.retailer);
    cluster.formats[store.format] = (cluster.formats[store.format] || 0) + 1;
    cluster.contexts[store.store_context] = (cluster.contexts[store.store_context] || 0) + 1;
    if (['Waitrose', 'M&S Food'].includes(store.retailer)) cluster.hasPremium = true;
    if (['Aldi', 'Lidl'].includes(store.retailer)) cluster.hasDiscounters = true;
  });

  const file2Map = {};
  file2Records.forEach(r => { file2Map[r.cluster_id] = r; });

  const file2bMap = {};
  file2bRecords.forEach(r => { file2bMap[r.cluster_id] = r; });

  const allClusterIds = Object.keys(file1Map);

  console.log(`Loaded ${stores.length} stores, ${allClusterIds.length} clusters\n`);

  const issues = [];
  const passedChecks = [];

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 1: TRACEABILITY - ARCHETYPE COHERENCE
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('CHECK 1: TRACEABILITY - ARCHETYPE COHERENCE');
  console.log('═══════════════════════════════════════════════════\n');

  let archetypeIssues = 0;

  allClusterIds.forEach(clusterId => {
    const file1 = file1Map[clusterId];
    const file2 = file2Map[clusterId];
    const file2b = file2bMap[clusterId];

    if (!file2 || !file2b) return;

    const demo = file2.demographic_mix;
    const segments = file2b.segments;

    // Archetype 1: Transit hub with premium retailers
    const transitPct = (file1.contexts.transit || 0) / file1.stores.length;
    if (transitPct > 0.6 && file1.hasPremium) {
      // Expect: high commuters, high income, young age
      if (demo.daily_commuters_share < 0.25) {
        issues.push(`${clusterId}: Transit+Premium but commuters only ${(demo.daily_commuters_share * 100).toFixed(1)}%`);
        archetypeIssues++;
      }
      if (demo.income_high < 0.15) {
        issues.push(`${clusterId}: Transit+Premium but income_high only ${(demo.income_high * 100).toFixed(1)}%`);
        archetypeIssues++;
      }
      // Expect: high premium_crafters, prestige_devotees
      if (segments.beer.premium_crafters < 0.20) {
        issues.push(`${clusterId}: Transit+Premium but premium_crafters only ${(segments.beer.premium_crafters * 100).toFixed(1)}%`);
        archetypeIssues++;
      }
    }

    // Archetype 2: Suburban residential with discounters
    const residentialPct = (file1.contexts.residential || 0) / file1.stores.length;
    if (residentialPct > 0.6 && file1.hasDiscounters) {
      // Expect: high residents, high families, lower income
      if (demo.local_residents_share < 0.60) {
        issues.push(`${clusterId}: Residential+Discounter but residents only ${(demo.local_residents_share * 100).toFixed(1)}%`);
        archetypeIssues++;
      }
      // Expect: high value_seekers or mainstream_loyalists
      const valueOrMainstream = segments.beer.value_seekers + segments.beer.mainstream_loyalists;
      if (valueOrMainstream < 0.30) {
        issues.push(`${clusterId}: Residential+Discounter but value_seekers+mainstream only ${(valueOrMainstream * 100).toFixed(1)}%`);
        archetypeIssues++;
      }
    }

    // Archetype 3: Office district
    const officePct = (file1.contexts.office_core || 0) / file1.stores.length;
    if (officePct > 0.4) {
      // Expect: high office workers
      if (demo.office_workers_share < 0.30) {
        issues.push(`${clusterId}: Office district but office_workers only ${(demo.office_workers_share * 100).toFixed(1)}%`);
        archetypeIssues++;
      }
      // Expect: high mindful_moderators, clean_conscious
      if (segments.beer.mindful_moderators < 0.08) {
        issues.push(`${clusterId}: Office district but mindful_moderators only ${(segments.beer.mindful_moderators * 100).toFixed(1)}%`);
        archetypeIssues++;
      }
    }
  });

  if (archetypeIssues === 0) {
    console.log('✅ All archetype coherence checks passed\n');
    passedChecks.push('Archetype coherence');
  } else {
    console.log(`⚠️  ${archetypeIssues} archetype coherence issues found\n`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 2: DEMOGRAPHIC-SEGMENT CORRELATION
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('CHECK 2: DEMOGRAPHIC-SEGMENT CORRELATION');
  console.log('═══════════════════════════════════════════════════\n');

  // Test key segment-demographic correlations
  const correlationTests = [
    {
      segment: 'beer.premium_crafters',
      demographic: 'income_high',
      expectedCorr: 0.3,
      rationale: 'Premium crafters should correlate with high income (weight: 1.6)'
    },
    {
      segment: 'beer.social_sessionists',
      demographic: 'age_18_24',
      expectedCorr: 0.3,
      rationale: 'Social sessionists should correlate with young age (weight: 1.6)'
    },
    {
      segment: 'beer.mainstream_loyalists',
      demographic: 'local_residents_share',
      expectedCorr: 0.3,
      rationale: 'Mainstream loyalists should correlate with residents (weight: 1.0)'
    },
    {
      segment: 'beauty.prestige_devotees',
      demographic: 'income_high',
      expectedCorr: 0.3,
      rationale: 'Prestige devotees should correlate with high income (weight: 1.8)'
    },
    {
      segment: 'beauty.glow_chasers',
      demographic: 'students_share',
      expectedCorr: 0.3,
      rationale: 'Glow chasers should correlate with students (weight: 1.3)'
    },
    {
      segment: 'home.family_protectors',
      demographic: 'families_with_kids',
      expectedCorr: 0.3,
      rationale: 'Family protectors should correlate with families (weight: 1.6)'
    },
  ];

  let correlationIssues = 0;

  correlationTests.forEach(test => {
    const segmentValues = [];
    const demoValues = [];

    allClusterIds.forEach(clusterId => {
      const file2 = file2Map[clusterId];
      const file2b = file2bMap[clusterId];
      if (!file2 || !file2b) return;

      const [category, segment] = test.segment.split('.');
      const segmentProb = file2b.segments[category][segment];
      const demoValue = file2.demographic_mix[test.demographic];

      segmentValues.push(segmentProb);
      demoValues.push(demoValue);
    });

    const correlation = pearsonCorrelation(segmentValues, demoValues);

    console.log(`${test.segment} ↔ ${test.demographic}:`);
    console.log(`  Correlation: ${correlation.toFixed(3)} (expected ≥ ${test.expectedCorr})`);
    console.log(`  ${test.rationale}`);

    if (correlation < test.expectedCorr) {
      console.log(`  ⚠️  Correlation too weak!\n`);
      issues.push(`${test.segment} has weak correlation with ${test.demographic} (${correlation.toFixed(3)} < ${test.expectedCorr})`);
      correlationIssues++;
    } else {
      console.log(`  ✅ Correlation adequate\n`);
    }
  });

  if (correlationIssues === 0) {
    console.log('✅ All demographic-segment correlations passed\n');
    passedChecks.push('Demographic-segment correlation');
  } else {
    console.log(`⚠️  ${correlationIssues} correlation issues found\n`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 3: RETAILER-SEGMENT ALIGNMENT
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('CHECK 3: RETAILER-SEGMENT ALIGNMENT');
  console.log('═══════════════════════════════════════════════════\n');

  let retailerIssues = 0;

  // Premium retailers (Waitrose, M&S)
  const premiumClusters = allClusterIds.filter(id => file1Map[id].hasPremium);
  const nonPremiumClusters = allClusterIds.filter(id => !file1Map[id].hasPremium);

  const avgPremiumCraftersPremium = premiumClusters
    .map(id => file2bMap[id]?.segments.beer.premium_crafters || 0)
    .reduce((a, b) => a + b, 0) / premiumClusters.length;

  const avgPremiumCraftersNonPremium = nonPremiumClusters
    .map(id => file2bMap[id]?.segments.beer.premium_crafters || 0)
    .reduce((a, b) => a + b, 0) / nonPremiumClusters.length;

  console.log(`Premium retailers (Waitrose/M&S):`);
  console.log(`  Clusters with premium retailers: ${premiumClusters.length}`);
  console.log(`  Avg premium_crafters: ${(avgPremiumCraftersPremium * 100).toFixed(1)}%`);
  console.log(`  Clusters without premium retailers: ${nonPremiumClusters.length}`);
  console.log(`  Avg premium_crafters: ${(avgPremiumCraftersNonPremium * 100).toFixed(1)}%`);

  const premiumLift = avgPremiumCraftersPremium - avgPremiumCraftersNonPremium;
  console.log(`  Lift: ${(premiumLift * 100).toFixed(1)}pp`);

  if (premiumLift < 0.05) {
    console.log(`  ⚠️  Premium retailers should have higher premium_crafters (lift < 5pp)\n`);
    issues.push(`Premium retailers have weak lift on premium_crafters (${(premiumLift * 100).toFixed(1)}pp)`);
    retailerIssues++;
  } else {
    console.log(`  ✅ Premium lift adequate\n`);
  }

  // Discounters (Aldi, Lidl)
  const discounterClusters = allClusterIds.filter(id => file1Map[id].hasDiscounters);
  const nonDiscounterClusters = allClusterIds.filter(id => !file1Map[id].hasDiscounters);

  const avgValueSeekersDiscounter = discounterClusters
    .map(id => file2bMap[id]?.segments.beer.value_seekers || 0)
    .reduce((a, b) => a + b, 0) / discounterClusters.length;

  const avgValueSeekersNonDiscounter = nonDiscounterClusters
    .map(id => file2bMap[id]?.segments.beer.value_seekers || 0)
    .reduce((a, b) => a + b, 0) / nonDiscounterClusters.length;

  console.log(`Discounters (Aldi/Lidl):`);
  console.log(`  Clusters with discounters: ${discounterClusters.length}`);
  console.log(`  Avg value_seekers: ${(avgValueSeekersDiscounter * 100).toFixed(1)}%`);
  console.log(`  Clusters without discounters: ${nonDiscounterClusters.length}`);
  console.log(`  Avg value_seekers: ${(avgValueSeekersNonDiscounter * 100).toFixed(1)}%`);

  const discounterLift = avgValueSeekersDiscounter - avgValueSeekersNonDiscounter;
  console.log(`  Lift: ${(discounterLift * 100).toFixed(1)}pp`);

  if (discounterLift < 0.03) {
    console.log(`  ⚠️  Discounters should have higher value_seekers (lift < 3pp)\n`);
    issues.push(`Discounters have weak lift on value_seekers (${(discounterLift * 100).toFixed(1)}pp)`);
    retailerIssues++;
  } else {
    console.log(`  ✅ Discounter lift adequate\n`);
  }

  if (retailerIssues === 0) {
    passedChecks.push('Retailer-segment alignment');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 4: CONTEXT-SEGMENT COHERENCE
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('CHECK 4: CONTEXT-SEGMENT COHERENCE');
  console.log('═══════════════════════════════════════════════════\n');

  let contextIssues = 0;

  // Transit contexts should have high social_sessionists, low family_protectors
  const transitClusters = allClusterIds.filter(id => {
    const transitPct = (file1Map[id].contexts.transit || 0) / file1Map[id].stores.length;
    return transitPct > 0.5;
  });

  if (transitClusters.length > 0) {
    const avgSocialSessionists = transitClusters
      .map(id => file2bMap[id]?.segments.beer.social_sessionists || 0)
      .reduce((a, b) => a + b, 0) / transitClusters.length;

    const avgFamilyProtectors = transitClusters
      .map(id => file2bMap[id]?.segments.home.family_protectors || 0)
      .reduce((a, b) => a + b, 0) / transitClusters.length;

    console.log(`Transit contexts (${transitClusters.length} clusters):`);
    console.log(`  Avg social_sessionists: ${(avgSocialSessionists * 100).toFixed(1)}% (expect >15%)`);
    console.log(`  Avg family_protectors: ${(avgFamilyProtectors * 100).toFixed(1)}% (expect <20%)`);

    if (avgSocialSessionists < 0.15) {
      console.log(`  ⚠️  Transit should have higher social_sessionists\n`);
      issues.push(`Transit contexts have low social_sessionists (${(avgSocialSessionists * 100).toFixed(1)}%)`);
      contextIssues++;
    } else if (avgFamilyProtectors > 0.20) {
      console.log(`  ⚠️  Transit should have lower family_protectors\n`);
      issues.push(`Transit contexts have high family_protectors (${(avgFamilyProtectors * 100).toFixed(1)}%)`);
      contextIssues++;
    } else {
      console.log(`  ✅ Transit context coherence adequate\n`);
    }
  }

  // Residential contexts should have high family_protectors, high mainstream_loyalists
  const residentialClusters = allClusterIds.filter(id => {
    const residentialPct = (file1Map[id].contexts.residential || 0) / file1Map[id].stores.length;
    return residentialPct > 0.6;
  });

  if (residentialClusters.length > 0) {
    const avgFamilyProtectors = residentialClusters
      .map(id => file2bMap[id]?.segments.home.family_protectors || 0)
      .reduce((a, b) => a + b, 0) / residentialClusters.length;

    const avgMainstreamLoyalists = residentialClusters
      .map(id => file2bMap[id]?.segments.beer.mainstream_loyalists || 0)
      .reduce((a, b) => a + b, 0) / residentialClusters.length;

    console.log(`Residential contexts (${residentialClusters.length} clusters):`);
    console.log(`  Avg family_protectors: ${(avgFamilyProtectors * 100).toFixed(1)}% (expect >15%)`);
    console.log(`  Avg mainstream_loyalists: ${(avgMainstreamLoyalists * 100).toFixed(1)}% (expect >20%)`);

    if (avgFamilyProtectors < 0.15) {
      console.log(`  ⚠️  Residential should have higher family_protectors\n`);
      issues.push(`Residential contexts have low family_protectors (${(avgFamilyProtectors * 100).toFixed(1)}%)`);
      contextIssues++;
    } else if (avgMainstreamLoyalists < 0.20) {
      console.log(`  ⚠️  Residential should have higher mainstream_loyalists\n`);
      issues.push(`Residential contexts have low mainstream_loyalists (${(avgMainstreamLoyalists * 100).toFixed(1)}%)`);
      contextIssues++;
    } else {
      console.log(`  ✅ Residential context coherence adequate\n`);
    }
  }

  if (contextIssues === 0) {
    passedChecks.push('Context-segment coherence');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 5: EXTENSION PROPENSITY REALITY
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('CHECK 5: EXTENSION PROPENSITY REALITY');
  console.log('═══════════════════════════════════════════════════\n');

  let extensionIssues = 0;

  // Office/transit clusters should have high functional_beverages
  const officeTransitClusters = allClusterIds.filter(id => {
    const file2 = file2Map[id];
    return file2 && (file2.demographic_mix.office_workers_share > 0.25 || file2.demographic_mix.daily_commuters_share > 0.30);
  });

  if (officeTransitClusters.length > 0) {
    const avgFuncBev = officeTransitClusters
      .map(id => file2bMap[id]?.extension_propensity.functional_beverages || 0)
      .reduce((a, b) => a + b, 0) / officeTransitClusters.length;

    console.log(`Office/Transit clusters (${officeTransitClusters.length} clusters):`);
    console.log(`  Avg functional_beverages: ${(avgFuncBev * 100).toFixed(1)}% (expect >60%)`);

    if (avgFuncBev < 0.60) {
      console.log(`  ⚠️  Office/Transit should have higher functional_beverages propensity\n`);
      issues.push(`Office/Transit have low functional_beverages (${(avgFuncBev * 100).toFixed(1)}%)`);
      extensionIssues++;
    } else {
      console.log(`  ✅ Functional beverages propensity adequate\n`);
    }
  }

  // Family residential clusters should have high home_wellness
  const familyResidentialClusters = allClusterIds.filter(id => {
    const file2 = file2Map[id];
    return file2 && file2.demographic_mix.families_with_kids > 0.35 && file2.demographic_mix.local_residents_share > 0.65;
  });

  if (familyResidentialClusters.length > 0) {
    const avgHomeWellness = familyResidentialClusters
      .map(id => file2bMap[id]?.extension_propensity.home_wellness || 0)
      .reduce((a, b) => a + b, 0) / familyResidentialClusters.length;

    console.log(`Family Residential clusters (${familyResidentialClusters.length} clusters):`);
    console.log(`  Avg home_wellness: ${(avgHomeWellness * 100).toFixed(1)}% (expect >60%)`);

    if (avgHomeWellness < 0.60) {
      console.log(`  ⚠️  Family Residential should have higher home_wellness propensity\n`);
      issues.push(`Family Residential have low home_wellness (${(avgHomeWellness * 100).toFixed(1)}%)`);
      extensionIssues++;
    } else {
      console.log(`  ✅ Home wellness propensity adequate\n`);
    }
  }

  if (extensionIssues === 0) {
    passedChecks.push('Extension propensity reality');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('FINAL SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`Total issues found: ${issues.length}`);
  console.log(`Checks passed: ${passedChecks.length}/5\n`);

  if (issues.length === 0) {
    console.log('✅ ALL SANITY CHECKS PASSED\n');
    console.log('File 1 → File 2 → File 2B pipeline is coherent and realistic.\n');
  } else {
    console.log('⚠️  ISSUES FOUND\n');
    console.log('Top 10 issues:');
    issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
    if (issues.length > 10) {
      console.log(`  ... and ${issues.length - 10} more\n`);
    }
  }

  console.log('Checks passed:');
  passedChecks.forEach(check => console.log(`  ✅ ${check}`));
  console.log('');

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    totalIssues: issues.length,
    checksPassed: passedChecks,
    issues,
    breakdown: {
      archetypeIssues,
      correlationIssues,
      retailerIssues,
      contextIssues,
      extensionIssues,
    },
  };

  const reportPath = path.join(__dirname, '../comprehensive-sanity-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('📄 Report written to comprehensive-sanity-check-report.json\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: PEARSON CORRELATION
// ═══════════════════════════════════════════════════════════════════════════

function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? 0 : numerator / denominator;
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

comprehensiveSanityCheck();
