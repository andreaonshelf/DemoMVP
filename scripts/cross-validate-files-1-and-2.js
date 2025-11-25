#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CROSS-VALIDATION: FILE 1 vs FILE 2
// ═══════════════════════════════════════════════════════════════════════════

function crossValidate() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('CROSS-VALIDATION: FILE 1 ↔ FILE 2');
  console.log('═══════════════════════════════════════════════════\n');

  // ═════════════════════════════════════════════════════════════════════════
  // 1. EXTRACT FROM FILE 1
  // ═════════════════════════════════════════════════════════════════════════

  const storesPath = path.join(__dirname, '../data/1-stores.json');
  const stores = JSON.parse(fs.readFileSync(storesPath, 'utf-8'));

  console.log(`Loaded ${stores.length} stores from File 1`);

  const file1Clusters = {};

  stores.forEach(store => {
    if (!file1Clusters[store.cluster_id]) {
      file1Clusters[store.cluster_id] = {
        cluster_id: store.cluster_id,
        region: store.region,
        store_count: 0,
        contexts: { residential: 0, mixed: 0, transit: 0, office_core: 0 },
        formats: { Convenience: 0, Supermarket: 0, Hypermarket: 0, Discounter: 0, Forecourt: 0 },
        retailers: new Set(),
        premium_retailers: false,
        discounters_present: false
      };
    }

    const cluster = file1Clusters[store.cluster_id];
    cluster.store_count++;
    cluster.contexts[store.store_context] = (cluster.contexts[store.store_context] || 0) + 1;
    cluster.formats[store.format] = (cluster.formats[store.format] || 0) + 1;
    cluster.retailers.add(store.retailer);

    if (['Waitrose', 'M&S Food'].includes(store.retailer)) {
      cluster.premium_retailers = true;
    }
    if (['Aldi', 'Lidl'].includes(store.retailer)) {
      cluster.discounters_present = true;
    }
  });

  // Calculate percentages
  Object.values(file1Clusters).forEach(cluster => {
    cluster.pct_residential = ((cluster.contexts.residential / cluster.store_count) * 100).toFixed(1);
    cluster.pct_mixed = ((cluster.contexts.mixed / cluster.store_count) * 100).toFixed(1);
    cluster.pct_transit = ((cluster.contexts.transit / cluster.store_count) * 100).toFixed(1);
    cluster.pct_office = ((cluster.contexts.office_core / cluster.store_count) * 100).toFixed(1);
  });

  console.log(`Extracted ${Object.keys(file1Clusters).length} clusters from File 1\n`);

  // ═════════════════════════════════════════════════════════════════════════
  // 2. EXTRACT FROM FILE 2
  // ═════════════════════════════════════════════════════════════════════════

  const clusterPopPath = path.join(__dirname, '../data/cluster-population.json');
  const file2Clusters = JSON.parse(fs.readFileSync(clusterPopPath, 'utf-8'));

  console.log(`Loaded ${file2Clusters.length} clusters from File 2\n`);

  // Convert to map
  const file2Map = {};
  file2Clusters.forEach(cluster => {
    file2Map[cluster.cluster_id] = cluster;
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 3. CROSS-FILE CONSISTENCY CHECKS
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('CONSISTENCY CHECKS');
  console.log('═══════════════════════════════════════════════════\n');

  const issues = [];

  // Check 3.1: Cluster count match
  const file1Count = Object.keys(file1Clusters).length;
  const file2Count = file2Clusters.length;

  if (file1Count !== file2Count) {
    issues.push(`❌ Cluster count mismatch: File 1 has ${file1Count}, File 2 has ${file2Count}`);
  } else {
    console.log(`✅ Cluster count matches: ${file1Count} clusters\n`);
  }

  // Check 3.2: Missing/extra cluster IDs
  const file1Ids = new Set(Object.keys(file1Clusters));
  const file2Ids = new Set(file2Clusters.map(c => c.cluster_id));

  const missingInFile2 = [...file1Ids].filter(id => !file2Ids.has(id));
  const extraInFile2 = [...file2Ids].filter(id => !file1Ids.has(id));

  if (missingInFile2.length > 0) {
    issues.push(`❌ Missing in File 2: ${missingInFile2.join(', ')}`);
  }
  if (extraInFile2.length > 0) {
    issues.push(`❌ Extra in File 2: ${extraInFile2.join(', ')}`);
  }

  if (missingInFile2.length === 0 && extraInFile2.length === 0) {
    console.log(`✅ All cluster IDs match between files\n`);
  }

  // Check 3.3: Demographic sum validation
  let sumErrors = 0;
  file2Clusters.forEach(cluster => {
    const demo = cluster.demographic_mix;

    const ageSum = demo.age_18_24 + demo.age_25_34 + demo.age_35_54 + demo.age_55_64 + demo.age_65_plus;
    const incomeSum = demo.income_low + demo.income_mid + demo.income_high;
    const householdSum = demo.single_person + demo.couples_no_kids + demo.families_with_kids + demo.multi_gen_households;
    const landUseSum = demo.land_use_office + demo.land_use_residential + demo.land_use_transit + demo.land_use_retail;

    if (Math.abs(ageSum - 1.0) > 0.01 || Math.abs(incomeSum - 1.0) > 0.01 ||
        Math.abs(householdSum - 1.0) > 0.01 || Math.abs(landUseSum - 1.0) > 0.01) {
      sumErrors++;
      issues.push(`❌ ${cluster.cluster_id}: demographic sum error`);
    }
  });

  if (sumErrors === 0) {
    console.log(`✅ All demographic sums valid (age, income, household, land use = 1.0)\n`);
  } else {
    console.log(`❌ ${sumErrors} clusters have demographic sum errors\n`);
  }

  // Check 3.4: Cluster type vs store context
  let contextMismatches = 0;
  Object.keys(file1Clusters).forEach(clusterId => {
    const file1 = file1Clusters[clusterId];
    const file2 = file2Map[clusterId];
    if (!file2) return;

    const transitPct = parseFloat(file1.pct_transit);
    const residentialPct = parseFloat(file1.pct_residential);
    const officePct = parseFloat(file1.pct_office);

    if (file2.cluster_type === 'TRANSIT_HUB' && transitPct < 50) {
      issues.push(`⚠️  ${clusterId}: TRANSIT_HUB but only ${transitPct}% transit stores`);
      contextMismatches++;
    }
    if (file2.cluster_type === 'OFFICE_DISTRICT' && officePct < 40) {
      issues.push(`⚠️  ${clusterId}: OFFICE_DISTRICT but only ${officePct}% office stores`);
      contextMismatches++;
    }
    if (file2.cluster_type === 'RESIDENTIAL' && residentialPct < 60) {
      issues.push(`⚠️  ${clusterId}: RESIDENTIAL but only ${residentialPct}% residential stores`);
      contextMismatches++;
    }
  });

  if (contextMismatches === 0) {
    console.log(`✅ All cluster types match store contexts\n`);
  } else {
    console.log(`⚠️  ${contextMismatches} cluster type/context mismatches\n`);
  }

  // Check 3.5: Region vs demographics
  let regionDemoIssues = 0;
  file2Clusters.forEach(cluster => {
    const file1 = file1Clusters[cluster.cluster_id];
    if (!file1) return;

    const demo = cluster.demographic_mix;

    // London should be younger + higher income
    if (file1.region === 'London') {
      if (demo.age_25_34 < 0.25) {
        issues.push(`⚠️  ${cluster.cluster_id}: London but age_25_34 only ${(demo.age_25_34 * 100).toFixed(1)}%`);
        regionDemoIssues++;
      }
    }

    // Wales/SW should be older
    if (['Wales', 'South West'].includes(file1.region)) {
      if (demo.age_65_plus < 0.15) {
        issues.push(`⚠️  ${cluster.cluster_id}: ${file1.region} but age_65_plus only ${(demo.age_65_plus * 100).toFixed(1)}%`);
        regionDemoIssues++;
      }
    }
  });

  if (regionDemoIssues === 0) {
    console.log(`✅ Regional demographics are consistent\n`);
  } else {
    console.log(`⚠️  ${regionDemoIssues} regional demographic inconsistencies\n`);
  }

  // Check 3.6: Transit vs daytime
  let daytimeMismatches = 0;
  Object.keys(file1Clusters).forEach(clusterId => {
    const file1 = file1Clusters[clusterId];
    const file2 = file2Map[clusterId];
    if (!file2) return;

    const transitPct = parseFloat(file1.pct_transit);
    const demo = file2.demographic_mix;

    if (transitPct > 60 && demo.daily_commuters_share < demo.local_residents_share) {
      issues.push(`⚠️  ${clusterId}: ${transitPct}% transit but residents > commuters`);
      daytimeMismatches++;
    }

    if (file2.cluster_type === 'OFFICE_DISTRICT' && demo.office_workers_share < 0.35) {
      issues.push(`⚠️  ${clusterId}: OFFICE_DISTRICT but office_workers only ${(demo.office_workers_share * 100).toFixed(1)}%`);
      daytimeMismatches++;
    }
  });

  if (daytimeMismatches === 0) {
    console.log(`✅ Daytime populations match contexts\n`);
  } else {
    console.log(`⚠️  ${daytimeMismatches} daytime/context mismatches\n`);
  }

  // Check 3.7: Formats vs income
  let formatIncomeIssues = 0;
  Object.keys(file1Clusters).forEach(clusterId => {
    const file1 = file1Clusters[clusterId];
    const file2 = file2Map[clusterId];
    if (!file2) return;

    const demo = file2.demographic_mix;

    if (file1.premium_retailers && demo.income_high < 0.20) {
      issues.push(`⚠️  ${clusterId}: Premium retailers but income_high only ${(demo.income_high * 100).toFixed(1)}%`);
      formatIncomeIssues++;
    }

    if (file1.discounters_present && demo.income_low < 0.20) {
      issues.push(`⚠️  ${clusterId}: Discounters but income_low only ${(demo.income_low * 100).toFixed(1)}%`);
      formatIncomeIssues++;
    }
  });

  if (formatIncomeIssues === 0) {
    console.log(`✅ Retailer positioning matches income levels\n`);
  } else {
    console.log(`⚠️  ${formatIncomeIssues} format/income mismatches\n`);
  }

  // Check 3.8: Impossible combinations
  let impossibleCombos = 0;
  file2Clusters.forEach(cluster => {
    const demo = cluster.demographic_mix;

    // High retirees + high students
    if (demo.age_65_plus > 0.25 && demo.students_share > 0.10) {
      issues.push(`⚠️  ${cluster.cluster_id}: High age_65_plus (${(demo.age_65_plus * 100).toFixed(1)}%) + high students (${(demo.students_share * 100).toFixed(1)}%)`);
      impossibleCombos++;
    }

    // High families + high single person
    if (demo.families_with_kids > 0.40 && demo.single_person > 0.40) {
      issues.push(`⚠️  ${cluster.cluster_id}: High families (${(demo.families_with_kids * 100).toFixed(1)}%) + high singles (${(demo.single_person * 100).toFixed(1)}%)`);
      impossibleCombos++;
    }
  });

  if (impossibleCombos === 0) {
    console.log(`✅ No impossible demographic combinations\n`);
  } else {
    console.log(`⚠️  ${impossibleCombos} impossible demographic combinations\n`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. GENERATE MERGED TABLE
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('GENERATING MERGED TABLE');
  console.log('═══════════════════════════════════════════════════\n');

  const mergedData = [];

  Object.keys(file1Clusters).sort().forEach(clusterId => {
    const file1 = file1Clusters[clusterId];
    const file2 = file2Map[clusterId];

    if (!file2) {
      mergedData.push({
        cluster_id: clusterId,
        region: file1.region,
        cluster_type: 'MISSING',
        store_count: file1.store_count,
        contexts: `${file1.pct_residential}/${file1.pct_mixed}/${file1.pct_transit}/${file1.pct_office}`,
        age_25_34: 'N/A',
        age_65_plus: 'N/A',
        income_high: 'N/A',
        commuters_share: 'N/A',
        tourists_share: 'N/A',
        premium_retailers: file1.premium_retailers ? 'Y' : 'N',
        discounters: file1.discounters_present ? 'Y' : 'N'
      });
      return;
    }

    const demo = file2.demographic_mix;

    mergedData.push({
      cluster_id: clusterId,
      region: file1.region,
      cluster_type: file2.cluster_type,
      store_count: file1.store_count,
      contexts: `${file1.pct_residential}/${file1.pct_mixed}/${file1.pct_transit}/${file1.pct_office}`,
      age_25_34: (demo.age_25_34 * 100).toFixed(1),
      age_65_plus: (demo.age_65_plus * 100).toFixed(1),
      income_high: (demo.income_high * 100).toFixed(1),
      commuters_share: (demo.daily_commuters_share * 100).toFixed(1),
      tourists_share: (demo.tourists_share * 100).toFixed(1),
      premium_retailers: file1.premium_retailers ? 'Y' : 'N',
      discounters: file1.discounters_present ? 'Y' : 'N'
    });
  });

  // Write CSV
  const csvPath = path.join(__dirname, '../CROSS-VALIDATION-TABLE.csv');
  let csv = 'cluster_id,region,cluster_type,store_count,contexts(res/mix/tra/off),age_25_34%,age_65+%,income_high%,commuters%,tourists%,premium,discounters\n';
  mergedData.forEach(row => {
    csv += `${row.cluster_id},${row.region},${row.cluster_type},${row.store_count},${row.contexts},${row.age_25_34},${row.age_65_plus},${row.income_high},${row.commuters_share},${row.tourists_share},${row.premium_retailers},${row.discounters}\n`;
  });
  fs.writeFileSync(csvPath, csv);

  console.log(`✅ Wrote merged table: CROSS-VALIDATION-TABLE.csv (${mergedData.length} rows)\n`);

  // Write markdown report
  const reportPath = path.join(__dirname, '../CROSS-VALIDATION-REPORT.md');
  let report = '═══════════════════════════════════════════════════\n';
  report += 'CROSS-VALIDATION REPORT: FILE 1 ↔ FILE 2\n';
  report += `Generated: ${new Date().toISOString()}\n`;
  report += '═══════════════════════════════════════════════════\n\n';

  report += '## Summary\n\n';
  report += `- File 1 clusters: ${file1Count}\n`;
  report += `- File 2 clusters: ${file2Count}\n`;
  report += `- Match: ${file1Count === file2Count ? '✅' : '❌'}\n\n`;

  report += '## Consistency Checks\n\n';
  report += `- Demographic sums valid: ${sumErrors === 0 ? '✅' : `❌ ${sumErrors} errors`}\n`;
  report += `- Cluster type/context match: ${contextMismatches === 0 ? '✅' : `⚠️  ${contextMismatches} mismatches`}\n`;
  report += `- Regional demographics: ${regionDemoIssues === 0 ? '✅' : `⚠️  ${regionDemoIssues} issues`}\n`;
  report += `- Daytime/context match: ${daytimeMismatches === 0 ? '✅' : `⚠️  ${daytimeMismatches} mismatches`}\n`;
  report += `- Format/income correlation: ${formatIncomeIssues === 0 ? '✅' : `⚠️  ${formatIncomeIssues} issues`}\n`;
  report += `- No impossible combos: ${impossibleCombos === 0 ? '✅' : `⚠️  ${impossibleCombos} found`}\n\n`;

  if (issues.length > 0) {
    report += '## Issues Found\n\n';
    issues.forEach(issue => {
      report += `${issue}\n`;
    });
    report += '\n';
  } else {
    report += '## ✅ No Issues Found\n\n';
    report += 'All consistency checks passed.\n\n';
  }

  report += '## Merged Table Preview (first 10 clusters)\n\n';
  report += '```\n';
  report += 'cluster_id | region | type | stores | contexts | age25-34 | age65+ | inc_high | commuters | tourists | premium | disc\n';
  report += '-----------|--------|------|--------|----------|----------|--------|----------|-----------|----------|---------|-----\n';
  mergedData.slice(0, 10).forEach(row => {
    report += `${row.cluster_id.padEnd(10)} | ${row.region.padEnd(6)} | ${row.cluster_type.padEnd(4)} | ${String(row.store_count).padEnd(6)} | ${row.contexts.padEnd(8)} | ${String(row.age_25_34).padEnd(8)} | ${String(row.age_65_plus).padEnd(6)} | ${String(row.income_high).padEnd(8)} | ${String(row.commuters_share).padEnd(9)} | ${String(row.tourists_share).padEnd(8)} | ${row.premium_retailers.padEnd(7)} | ${row.discounters}\n`;
  });
  report += '```\n\n';
  report += `Full table available in CROSS-VALIDATION-TABLE.csv (${mergedData.length} clusters)\n`;

  fs.writeFileSync(reportPath, report);

  console.log(`✅ Wrote validation report: CROSS-VALIDATION-REPORT.md\n`);

  // ═════════════════════════════════════════════════════════════════════════
  // 5. FINAL SUMMARY
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('FINAL SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`Total clusters validated: ${file1Count}`);
  console.log(`Total issues found: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log('✅ ALL VALIDATION CHECKS PASSED\n');
  } else {
    console.log(`⚠️  ${issues.length} issues found (see report for details)\n`);
  }

  console.log('Files generated:');
  console.log('  - CROSS-VALIDATION-TABLE.csv (92 clusters × 12 columns)');
  console.log('  - CROSS-VALIDATION-REPORT.md (full validation report)\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

crossValidate();
