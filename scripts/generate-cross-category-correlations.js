#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CROSS-CATEGORY CORRELATION REPORT
// ═══════════════════════════════════════════════════════════════════════════

function generateCrossCorrelationReport() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('CROSS-CATEGORY CORRELATION REPORT');
  console.log('═══════════════════════════════════════════════════\n');

  const file2bPath = path.join(__dirname, '../data/2b-cluster-segments.json');
  const records = JSON.parse(fs.readFileSync(file2bPath, 'utf-8'));

  console.log(`Loaded ${records.length} cluster records\n`);

  const categories = ['beer', 'beauty', 'home'];
  const matrices = {};

  // ═════════════════════════════════════════════════════════════════════════
  // Generate correlation matrix for each category pair
  // ═════════════════════════════════════════════════════════════════════════

  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const catA = categories[i];
      const catB = categories[j];
      const key = `${catA}_vs_${catB}`;

      console.log(`Generating ${key} correlation matrix...`);

      const segmentsA = Object.keys(records[0].segments[catA]);
      const segmentsB = Object.keys(records[0].segments[catB]);

      // Initialize matrix
      const matrix = {};
      for (const segA of segmentsA) {
        matrix[segA] = {};
        for (const segB of segmentsB) {
          matrix[segA][segB] = 0;
        }
      }

      // Accumulate weighted co-occurrence across all clusters
      for (const record of records) {
        for (const segA of segmentsA) {
          for (const segB of segmentsB) {
            const probA = record.segments[catA][segA];
            const probB = record.segments[catB][segB];
            matrix[segA][segB] += probA * probB;
          }
        }
      }

      // Normalize rows: "Given segment A, what's the distribution over segment B?"
      for (const segA of segmentsA) {
        const rowSum = Object.values(matrix[segA]).reduce((a, b) => a + b, 0);
        for (const segB of segmentsB) {
          matrix[segA][segB] = Math.round((matrix[segA][segB] / rowSum) * 1000) / 1000;
        }
      }

      matrices[key] = matrix;
    }
  }

  console.log('');

  // ═════════════════════════════════════════════════════════════════════════
  // Find interesting correlations (non-obvious patterns)
  // ═════════════════════════════════════════════════════════════════════════

  console.log('Analyzing correlation patterns...\n');

  const insights = [];

  for (const [key, matrix] of Object.entries(matrices)) {
    console.log(`${key}:`);

    for (const [segA, row] of Object.entries(matrix)) {
      const sorted = Object.entries(row).sort((a, b) => b[1] - a[1]);
      const top = sorted[0];
      const second = sorted[1];

      // Flag if top correlation is very strong
      if (top[1] > 0.4) {
        const msg = `${key}: ${segA} strongly correlates with ${top[0]} (${(top[1] * 100).toFixed(1)}%)`;
        console.log(`  ⚡ ${msg}`);
        insights.push(msg);
      }

      // Flag if distribution is fairly even (no strong correlation)
      if (top[1] < 0.25) {
        const msg = `${key}: ${segA} has diffuse correlation (top is ${top[0]} at only ${(top[1] * 100).toFixed(1)}%)`;
        console.log(`  ⚠️  ${msg}`);
        insights.push(msg);
      }
    }
    console.log('');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Print readable correlation tables
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('DETAILED CORRELATION MATRICES');
  console.log('═══════════════════════════════════════════════════\n');

  for (const [key, matrix] of Object.entries(matrices)) {
    console.log(`${key}:`);
    console.log('');

    const segmentsB = Object.keys(Object.values(matrix)[0]);

    // Print header
    const headerPadding = 30;
    let header = ''.padEnd(headerPadding);
    for (const segB of segmentsB) {
      header += segB.substring(0, 10).padEnd(12);
    }
    console.log(header);
    console.log('-'.repeat(header.length));

    // Print rows
    for (const [segA, row] of Object.entries(matrix)) {
      let line = segA.padEnd(headerPadding);
      for (const segB of segmentsB) {
        line += String((row[segB] * 100).toFixed(1) + '%').padEnd(12);
      }
      console.log(line);
    }
    console.log('');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Summary statistics
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`✅ Generated ${Object.keys(matrices).length} correlation matrices`);
  console.log(`✅ Found ${insights.length} notable correlation patterns\n`);

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    matrices,
    insights,
  };

  const reportPath = path.join(__dirname, '../cross-category-correlations.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`📄 Correlation report written to cross-category-correlations.json\n`);

  return report;
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

generateCrossCorrelationReport();
