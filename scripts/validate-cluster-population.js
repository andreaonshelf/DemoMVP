#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION SCRIPT FOR FILE 2 (cluster-population.json)
// ═══════════════════════════════════════════════════════════════════════════

function validateClusterPopulation() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('FILE 2 VALIDATION — CLUSTER POPULATION');
  console.log('═══════════════════════════════════════════════════\n');

  // Load File 2
  const clusterPopPath = path.join(__dirname, '../data/cluster-population.json');
  const clusters = JSON.parse(fs.readFileSync(clusterPopPath, 'utf-8'));

  console.log(`Loaded ${clusters.length} clusters from File 2\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION 1: Demographic Mix Sums
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('1. DEMOGRAPHIC MIX SUMS (must = 1.0)');
  console.log('═══════════════════════════════════════════════════\n');

  const sumErrors = [];

  clusters.forEach(cluster => {
    const demo = cluster.demographic_mix;

    // Age mix
    const ageSum = demo.age_18_24 + demo.age_25_34 + demo.age_35_54 + demo.age_55_64 + demo.age_65_plus;
    if (Math.abs(ageSum - 1.0) > 0.01) {
      sumErrors.push(`${cluster.cluster_id}: Age mix sum = ${ageSum.toFixed(4)}`);
    }

    // Income mix
    const incomeSum = demo.income_low + demo.income_mid + demo.income_high;
    if (Math.abs(incomeSum - 1.0) > 0.01) {
      sumErrors.push(`${cluster.cluster_id}: Income mix sum = ${incomeSum.toFixed(4)}`);
    }

    // Household mix
    const householdSum = demo.single_person + demo.couples_no_kids + demo.families_with_kids + demo.multi_gen_households;
    if (Math.abs(householdSum - 1.0) > 0.01) {
      sumErrors.push(`${cluster.cluster_id}: Household mix sum = ${householdSum.toFixed(4)}`);
    }

    // Daytime mix (allowed to be 1.0-1.2 due to overlap)
    const daytimeSum = demo.local_residents_share + demo.daily_commuters_share + demo.office_workers_share + demo.students_share + demo.tourists_share;
    if (daytimeSum < 0.95 || daytimeSum > 1.25) {
      sumErrors.push(`${cluster.cluster_id}: Daytime mix sum = ${daytimeSum.toFixed(4)} (expected 0.95-1.25)`);
    }

    // Land use
    const landUseSum = demo.land_use_office + demo.land_use_residential + demo.land_use_transit + demo.land_use_retail;
    if (Math.abs(landUseSum - 1.0) > 0.01) {
      sumErrors.push(`${cluster.cluster_id}: Land use sum = ${landUseSum.toFixed(4)}`);
    }
  });

  if (sumErrors.length === 0) {
    console.log('✅ All demographic mix sums are correct\n');
  } else {
    console.log(`❌ Found ${sumErrors.length} sum errors:\n`);
    sumErrors.slice(0, 10).forEach(err => console.log(`  ${err}`));
    if (sumErrors.length > 10) console.log(`  ... and ${sumErrors.length - 10} more\n`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION 2: Transit Hub Characteristics
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('2. TRANSIT HUB CHARACTERISTICS');
  console.log('═══════════════════════════════════════════════════\n');

  const transitHubs = clusters.filter(c => c.cluster_type === 'TRANSIT_HUB');
  console.log(`Found ${transitHubs.length} transit hub clusters\n`);

  const transitValidation = {
    high_commuters: 0,
    high_tourists: 0,
    low_residents: 0,
    young_age: 0
  };

  transitHubs.forEach(cluster => {
    const demo = cluster.demographic_mix;
    if (demo.daily_commuters_share > 0.40) transitValidation.high_commuters++;
    if (demo.tourists_share > 0.10) transitValidation.high_tourists++;
    if (demo.local_residents_share < 0.30) transitValidation.low_residents++;
    if (demo.age_25_34 > 0.25) transitValidation.young_age++;
  });

  console.log(`✅ ${transitValidation.high_commuters}/${transitHubs.length} have daily_commuters_share > 0.40`);
  console.log(`✅ ${transitValidation.high_tourists}/${transitHubs.length} have tourists_share > 0.10`);
  console.log(`✅ ${transitValidation.low_residents}/${transitHubs.length} have local_residents_share < 0.30`);
  console.log(`✅ ${transitValidation.young_age}/${transitHubs.length} have age_25_34 > 0.25\n`);

  // Show sample transit hub
  if (transitHubs.length > 0) {
    const sample = transitHubs[0];
    console.log(`Sample Transit Hub: ${sample.cluster_id}`);
    console.log(`  Commuters: ${(sample.demographic_mix.daily_commuters_share * 100).toFixed(1)}%`);
    console.log(`  Tourists: ${(sample.demographic_mix.tourists_share * 100).toFixed(1)}%`);
    console.log(`  Residents: ${(sample.demographic_mix.local_residents_share * 100).toFixed(1)}%`);
    console.log(`  Age 25-34: ${(sample.demographic_mix.age_25_34 * 100).toFixed(1)}%\n`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION 3: Residential Cluster Characteristics
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('3. RESIDENTIAL CLUSTER CHARACTERISTICS');
  console.log('═══════════════════════════════════════════════════\n');

  const residential = clusters.filter(c => c.cluster_type === 'RESIDENTIAL');
  console.log(`Found ${residential.length} residential clusters\n`);

  const residentialValidation = {
    high_residents: 0,
    high_families: 0,
    older_age: 0
  };

  residential.forEach(cluster => {
    const demo = cluster.demographic_mix;
    if (demo.local_residents_share > 0.70) residentialValidation.high_residents++;
    if (demo.families_with_kids > 0.30) residentialValidation.high_families++;
    if (demo.age_35_54 + demo.age_55_64 + demo.age_65_plus > 0.50) residentialValidation.older_age++;
  });

  console.log(`✅ ${residentialValidation.high_residents}/${residential.length} have local_residents_share > 0.70`);
  console.log(`✅ ${residentialValidation.high_families}/${residential.length} have families_with_kids > 0.30`);
  console.log(`✅ ${residentialValidation.older_age}/${residential.length} have older demographics (35+) > 0.50\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION 4: Regional Demographic Variation
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('4. REGIONAL DEMOGRAPHIC VARIATION');
  console.log('═══════════════════════════════════════════════════\n');

  // Load stores to get region mapping
  const storesPath = path.join(__dirname, '../data/STORES-FINAL.json');
  const stores = JSON.parse(fs.readFileSync(storesPath, 'utf-8'));
  const clusterToRegion = {};
  stores.forEach(s => {
    clusterToRegion[s.cluster_id] = s.region;
  });

  // Calculate region averages
  const regionStats = {};
  clusters.forEach(cluster => {
    const region = clusterToRegion[cluster.cluster_id];
    if (!regionStats[region]) {
      regionStats[region] = {
        count: 0,
        age_25_34_sum: 0,
        age_65_plus_sum: 0,
        income_high_sum: 0,
        commuters_sum: 0
      };
    }
    regionStats[region].count++;
    regionStats[region].age_25_34_sum += cluster.demographic_mix.age_25_34;
    regionStats[region].age_65_plus_sum += cluster.demographic_mix.age_65_plus;
    regionStats[region].income_high_sum += cluster.demographic_mix.income_high;
    regionStats[region].commuters_sum += cluster.demographic_mix.daily_commuters_share;
  });

  Object.keys(regionStats).forEach(region => {
    const stats = regionStats[region];
    console.log(`${region} (${stats.count} clusters):`);
    console.log(`  Avg age_25_34: ${(stats.age_25_34_sum / stats.count * 100).toFixed(1)}%`);
    console.log(`  Avg age_65_plus: ${(stats.age_65_plus_sum / stats.count * 100).toFixed(1)}%`);
    console.log(`  Avg income_high: ${(stats.income_high_sum / stats.count * 100).toFixed(1)}%`);
    console.log(`  Avg commuters: ${(stats.commuters_sum / stats.count * 100).toFixed(1)}%\n`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION 5: Density & Land Use Correlation
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('5. DENSITY & LAND USE CORRELATION');
  console.log('═══════════════════════════════════════════════════\n');

  const clusterTypes = ['TRANSIT_HUB', 'OFFICE_DISTRICT', 'RESIDENTIAL', 'MIXED'];

  clusterTypes.forEach(type => {
    const typeClusters = clusters.filter(c => c.cluster_type === type);
    if (typeClusters.length === 0) return;

    const avgDensity = typeClusters.reduce((sum, c) => sum + c.demographic_mix.density_index, 0) / typeClusters.length;
    const avgTransitLandUse = typeClusters.reduce((sum, c) => sum + c.demographic_mix.land_use_transit, 0) / typeClusters.length;
    const avgOfficeLandUse = typeClusters.reduce((sum, c) => sum + c.demographic_mix.land_use_office, 0) / typeClusters.length;
    const avgResidentialLandUse = typeClusters.reduce((sum, c) => sum + c.demographic_mix.land_use_residential, 0) / typeClusters.length;

    console.log(`${type} (${typeClusters.length} clusters):`);
    console.log(`  Avg density: ${avgDensity.toFixed(2)}`);
    console.log(`  Avg transit land use: ${(avgTransitLandUse * 100).toFixed(1)}%`);
    console.log(`  Avg office land use: ${(avgOfficeLandUse * 100).toFixed(1)}%`);
    console.log(`  Avg residential land use: ${(avgResidentialLandUse * 100).toFixed(1)}%\n`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`✅ Total clusters: ${clusters.length}`);
  console.log(`✅ Cluster types: ${transitHubs.length} transit, ${clusters.filter(c => c.cluster_type === 'OFFICE_DISTRICT').length} office, ${residential.length} residential, ${clusters.filter(c => c.cluster_type === 'MIXED').length} mixed`);
  console.log(`✅ Sum validation: ${sumErrors.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Transit hub realism: ${transitValidation.high_commuters >= transitHubs.length * 0.8 ? 'PASS' : 'WARN'}`);
  console.log(`✅ Residential realism: ${residentialValidation.high_residents >= residential.length * 0.8 ? 'PASS' : 'WARN'}\n`);

  // Write validation report
  const report = {
    timestamp: new Date().toISOString(),
    total_clusters: clusters.length,
    cluster_type_distribution: {
      transit_hub: transitHubs.length,
      office_district: clusters.filter(c => c.cluster_type === 'OFFICE_DISTRICT').length,
      residential: residential.length,
      mixed: clusters.filter(c => c.cluster_type === 'MIXED').length
    },
    sum_errors: sumErrors.length,
    transit_hub_validation: transitValidation,
    residential_validation: residentialValidation,
    region_stats: regionStats
  };

  const reportPath = path.join(__dirname, '../CLUSTER-POPULATION-VALIDATION.md');
  let markdown = '═══════════════════════════════════════════════════\n';
  markdown += 'FILE 2 VALIDATION REPORT\n';
  markdown += `Generated: ${report.timestamp}\n`;
  markdown += '═══════════════════════════════════════════════════\n\n';
  markdown += `## Summary\n\n`;
  markdown += `- Total clusters: ${report.total_clusters}\n`;
  markdown += `- Transit hubs: ${report.cluster_type_distribution.transit_hub}\n`;
  markdown += `- Office districts: ${report.cluster_type_distribution.office_district}\n`;
  markdown += `- Residential: ${report.cluster_type_distribution.residential}\n`;
  markdown += `- Mixed: ${report.cluster_type_distribution.mixed}\n`;
  markdown += `- Sum validation errors: ${report.sum_errors}\n\n`;
  markdown += `## Transit Hub Validation\n\n`;
  markdown += `- High commuters (>40%): ${report.transit_hub_validation.high_commuters}/${transitHubs.length}\n`;
  markdown += `- High tourists (>10%): ${report.transit_hub_validation.high_tourists}/${transitHubs.length}\n`;
  markdown += `- Low residents (<30%): ${report.transit_hub_validation.low_residents}/${transitHubs.length}\n`;
  markdown += `- Young demographics: ${report.transit_hub_validation.young_age}/${transitHubs.length}\n\n`;
  markdown += `## Residential Validation\n\n`;
  markdown += `- High residents (>70%): ${report.residential_validation.high_residents}/${residential.length}\n`;
  markdown += `- High families (>30%): ${report.residential_validation.high_families}/${residential.length}\n`;
  markdown += `- Older demographics (>50%): ${report.residential_validation.older_age}/${residential.length}\n\n`;

  fs.writeFileSync(reportPath, markdown);
  console.log('📄 Validation report written to CLUSTER-POPULATION-VALIDATION.md\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

validateClusterPopulation();
