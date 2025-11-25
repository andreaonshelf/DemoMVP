#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// FILE 2B VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

function validateFile2B() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('FILE 2B VALIDATION');
  console.log('═══════════════════════════════════════════════════\n');

  const file2bPath = path.join(__dirname, '../data/2b-cluster-segments.json');
  const records = JSON.parse(fs.readFileSync(file2bPath, 'utf-8'));

  console.log(`Loaded ${records.length} cluster records\n`);

  const errors = [];
  const warnings = [];
  const stats = {};

  // ═════════════════════════════════════════════════════════════════════════
  // 1. Check segment probabilities sum to 1
  // ═════════════════════════════════════════════════════════════════════════

  console.log('Checking segment probability sums...');
  let sumErrors = 0;

  for (const record of records) {
    for (const category of ['beer', 'beauty', 'home']) {
      const sum = Object.values(record.segments[category]).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.001) {
        errors.push(`Cluster ${record.cluster_id}: ${category} segments sum to ${sum.toFixed(4)}, not 1.0`);
        sumErrors++;
      }
    }
  }

  if (sumErrors === 0) {
    console.log(`✅ All segment sums are valid\n`);
  } else {
    console.log(`❌ ${sumErrors} segment sum errors\n`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. Check all probabilities are in [0, 1]
  // ═════════════════════════════════════════════════════════════════════════

  console.log('Checking probability ranges...');
  let rangeErrors = 0;

  for (const record of records) {
    for (const category of ['beer', 'beauty', 'home']) {
      for (const [seg, prob] of Object.entries(record.segments[category])) {
        if (prob < 0 || prob > 1) {
          errors.push(`Cluster ${record.cluster_id}: ${category}.${seg} = ${prob} is out of range [0,1]`);
          rangeErrors++;
        }
      }
    }
    for (const [ext, prop] of Object.entries(record.extension_propensity)) {
      if (prop < 0 || prop > 1) {
        errors.push(`Cluster ${record.cluster_id}: extension.${ext} = ${prop} is out of range [0,1]`);
        rangeErrors++;
      }
    }
  }

  if (rangeErrors === 0) {
    console.log(`✅ All probabilities in valid range [0,1]\n`);
  } else {
    console.log(`❌ ${rangeErrors} range errors\n`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. Check for sufficient variation across clusters
  // ═════════════════════════════════════════════════════════════════════════

  console.log('Analyzing segment variation across clusters...\n');

  for (const category of ['beer', 'beauty', 'home']) {
    const segments = Object.keys(records[0].segments[category]);
    console.log(`${category.toUpperCase()} segments:`);

    for (const seg of segments) {
      const values = records.map(r => r.segments[category][seg]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;

      stats[`${category}.${seg}`] = {
        min: parseFloat(min.toFixed(3)),
        max: parseFloat(max.toFixed(3)),
        range: parseFloat(range.toFixed(3)),
        mean: parseFloat(mean.toFixed(3)),
      };

      console.log(`  ${seg}: min=${min.toFixed(3)}, max=${max.toFixed(3)}, range=${range.toFixed(3)}, mean=${mean.toFixed(3)}`);

      if (range < 0.05) {
        warnings.push(`${category}.${seg} has low variation (range=${range.toFixed(3)}). Consider adjusting weights.`);
      }
    }
    console.log('');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. Check extension propensities have variation
  // ═════════════════════════════════════════════════════════════════════════

  console.log('EXTENSION propensities:');
  for (const ext of ['functional_beverages', 'nutraceuticals', 'home_wellness']) {
    const values = records.map(r => r.extension_propensity[ext]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    stats[`extension.${ext}`] = {
      min: parseFloat(min.toFixed(3)),
      max: parseFloat(max.toFixed(3)),
      range: parseFloat(range.toFixed(3)),
      mean: parseFloat(mean.toFixed(3)),
    };

    console.log(`  ${ext}: min=${min.toFixed(3)}, max=${max.toFixed(3)}, range=${range.toFixed(3)}, mean=${mean.toFixed(3)}`);

    if (range < 0.1) {
      warnings.push(`extension.${ext} has low variation (range=${range.toFixed(3)}). Consider adjusting weights.`);
    }
  }
  console.log('');

  // ═════════════════════════════════════════════════════════════════════════
  // 5. Check no segment dominates everywhere
  // ═════════════════════════════════════════════════════════════════════════

  console.log('Analyzing segment dominance...\n');

  for (const category of ['beer', 'beauty', 'home']) {
    const segments = Object.keys(records[0].segments[category]);
    const winCounts = {};
    for (const seg of segments) winCounts[seg] = 0;

    for (const record of records) {
      let maxSeg = '';
      let maxProb = 0;
      for (const [seg, prob] of Object.entries(record.segments[category])) {
        if (prob > maxProb) {
          maxProb = prob;
          maxSeg = seg;
        }
      }
      winCounts[maxSeg]++;
    }

    stats[`${category}_dominant_segment_counts`] = winCounts;

    console.log(`${category.toUpperCase()} dominant segment counts:`);
    for (const [seg, count] of Object.entries(winCounts)) {
      const pct = (count / records.length) * 100;
      console.log(`  ${seg}: ${count} clusters (${pct.toFixed(1)}%)`);

      if (pct > 60) {
        warnings.push(`${category}.${seg} is dominant in ${pct.toFixed(1)}% of clusters. May indicate imbalanced weights.`);
      }
      if (count === 0) {
        warnings.push(`${category}.${seg} is never the dominant segment. May be too weak.`);
      }
    }
    console.log('');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  const valid = errors.length === 0;

  console.log(`✅ Total clusters validated: ${records.length}`);
  console.log(`✅ Segment sum errors: ${sumErrors}`);
  console.log(`✅ Range errors: ${rangeErrors}`);
  console.log(`⚠️  Warnings: ${warnings.length}\n`);

  if (valid) {
    console.log('✅ VALIDATION PASSED\n');
  } else {
    console.log('❌ VALIDATION FAILED\n');
    console.log('Errors:');
    errors.forEach(err => console.log(`  ${err}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.slice(0, 10).forEach(warn => console.log(`  ${warn}`));
    if (warnings.length > 10) {
      console.log(`  ... and ${warnings.length - 10} more`);
    }
    console.log('');
  }

  // Write validation report
  const report = {
    timestamp: new Date().toISOString(),
    valid,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
    stats,
  };

  const reportPath = path.join(__dirname, '../file2b-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`📄 Validation report written to file2b-validation-report.json\n`);

  return report;
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

validateFile2B();
