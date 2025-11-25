#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// ADD MISSION MIX TO FILE 2 (cluster-population.json)
// ═══════════════════════════════════════════════════════════════════════════
// Creates an enhanced version with mission_mix added

function addMissionMix() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('ADDING MISSION MIX TO FILE 2');
  console.log('═══════════════════════════════════════════════════\n');

  // Load File 2
  const file2Path = path.join(__dirname, '../data/cluster-population.json');
  const clusters = JSON.parse(fs.readFileSync(file2Path, 'utf-8'));

  console.log(`Loaded ${clusters.length} clusters from File 2\n`);

  // Generate mission mix for each cluster
  clusters.forEach((cluster, idx) => {
    const demo = cluster.demographic_mix;
    const clusterType = cluster.cluster_type;

    // Base mission distribution (UK average)
    let missions = {
      main_shop: 0.30,
      top_up: 0.35,
      immediate_consumption: 0.20,
      convenience: 0.15
    };

    // Adjust based on cluster type
    if (clusterType === 'TRANSIT_HUB') {
      // Transit: high immediate/convenience, low main shop
      missions.immediate_consumption += 0.20;
      missions.convenience += 0.15;
      missions.main_shop -= 0.20;
      missions.top_up -= 0.15;
    } else if (clusterType === 'OFFICE_DISTRICT') {
      // Office: high convenience/immediate, low main shop
      missions.convenience += 0.18;
      missions.immediate_consumption += 0.12;
      missions.main_shop -= 0.18;
      missions.top_up -= 0.12;
    } else if (clusterType === 'RESIDENTIAL') {
      // Residential: high main shop, low immediate
      missions.main_shop += 0.15;
      missions.top_up += 0.10;
      missions.immediate_consumption -= 0.15;
      missions.convenience -= 0.10;
    }
    // MIXED: no major adjustments, stays close to baseline

    // Fine-tune based on demographics

    // High commuters → more immediate/convenience
    if (demo.daily_commuters_share > 0.30) {
      missions.immediate_consumption += 0.05;
      missions.convenience += 0.05;
      missions.main_shop -= 0.10;
    }

    // High residents → more main shop
    if (demo.local_residents_share > 0.70) {
      missions.main_shop += 0.08;
      missions.top_up += 0.05;
      missions.immediate_consumption -= 0.08;
      missions.convenience -= 0.05;
    }

    // High transit land use → more immediate
    if (demo.land_use_transit > 0.25) {
      missions.immediate_consumption += 0.08;
      missions.convenience += 0.05;
      missions.main_shop -= 0.08;
      missions.top_up -= 0.05;
    }

    // High residential land use → more main shop
    if (demo.land_use_residential > 0.60) {
      missions.main_shop += 0.08;
      missions.top_up += 0.05;
      missions.immediate_consumption -= 0.08;
      missions.convenience -= 0.05;
    }

    // High density → more convenience/immediate
    if (demo.density_index > 0.75) {
      missions.convenience += 0.05;
      missions.immediate_consumption += 0.05;
      missions.main_shop -= 0.10;
    }

    // Low density → more main shop
    if (demo.density_index < 0.40) {
      missions.main_shop += 0.08;
      missions.top_up += 0.05;
      missions.convenience -= 0.08;
      missions.immediate_consumption -= 0.05;
    }

    // Normalize to sum to 1.0
    const sum = Object.values(missions).reduce((a, b) => a + b, 0);
    Object.keys(missions).forEach(key => {
      missions[key] = parseFloat((missions[key] / sum).toFixed(4));
    });

    // Add to cluster
    cluster.mission_mix = missions;

    if ((idx + 1) % 10 === 0) {
      console.log(`Added mission_mix for ${idx + 1}/${clusters.length} clusters...`);
    }
  });

  console.log(`\n✅ Added mission_mix to all ${clusters.length} clusters\n`);

  // Write to NEW file (don't overwrite original)
  const outputPath = path.join(__dirname, '../data/2-cluster-population.json');
  fs.writeFileSync(outputPath, JSON.stringify(clusters, null, 2));

  const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`📁 Wrote: data/2-cluster-population.json (${fileSizeMB} MB)`);
  console.log(`📊 Total clusters: ${clusters.length}\n`);

  return clusters;
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

addMissionMix().then(() => {
  console.log('✅ Mission mix generation complete\n');
}).catch(err => {
  console.error('❌ Error adding mission mix:', err);
  process.exit(1);
});
