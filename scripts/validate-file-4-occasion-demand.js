#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATE FILE 4: 4-store-occasion-demand.json
// ═══════════════════════════════════════════════════════════════════════════

function validateFile4() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('FILE 4 VALIDATION');
  console.log('═══════════════════════════════════════════════════\n');

  // Load File 4
  const file4Path = path.join(__dirname, '../data/4-store-occasion-demand.json');
  const stores = JSON.parse(fs.readFileSync(file4Path, 'utf-8'));

  console.log(`Loaded ${stores.length} stores from File 4\n`);

  const issues = [];
  const warnings = [];

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 1: Normalisation checks
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 1: Normalisation (all distributions sum to 1.0)\n');

  let segmentSumErrors = 0;
  let missionSumErrors = 0;
  let occasionSumErrors = 0;

  stores.forEach(store => {
    // Check segment_mix sums
    for (const category of ['beer', 'beauty', 'home']) {
      const sum = Object.values(store.segment_mix[category]).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.01) {
        issues.push(`${store.store_id}: ${category} segment_mix sums to ${sum.toFixed(4)}`);
        segmentSumErrors++;
      }
    }

    // Check mission_mix sum
    const missionSum = Object.values(store.mission_mix).reduce((a, b) => a + b, 0);
    if (Math.abs(missionSum - 1.0) > 0.01) {
      issues.push(`${store.store_id}: mission_mix sums to ${missionSum.toFixed(4)}`);
      missionSumErrors++;
    }

    // Check occasion_demand sums
    for (const category of ['beer', 'beauty', 'home']) {
      const sum = Object.values(store.occasion_demand[category]).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.01) {
        issues.push(`${store.store_id}: ${category} occasion_demand sums to ${sum.toFixed(4)}`);
        occasionSumErrors++;
      }
    }
  });

  console.log(`  Segment mix sum errors: ${segmentSumErrors}`);
  console.log(`  Mission mix sum errors: ${missionSumErrors}`);
  console.log(`  Occasion demand sum errors: ${occasionSumErrors}\n`);

  if (segmentSumErrors === 0 && missionSumErrors === 0 && occasionSumErrors === 0) {
    console.log('✅ All normalisation checks passed\n');
  } else {
    console.log('❌ Normalisation errors found\n');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 2: Retailer positioning sanity checks
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 2: Retailer positioning patterns\n');

  const waitroseStores = stores.filter(s => s.retailer === 'Waitrose');
  const aldiStores = stores.filter(s => s.retailer === 'Aldi');

  if (waitroseStores.length > 0 && aldiStores.length > 0) {
    // Waitrose should have higher "health_conscious_choice" demand than Aldi
    const avgWaitroseHealthConscious = waitroseStores.reduce((sum, s) => sum + s.occasion_demand.beer.health_conscious_choice, 0) / waitroseStores.length;
    const avgAldiHealthConscious = aldiStores.reduce((sum, s) => sum + s.occasion_demand.beer.health_conscious_choice, 0) / aldiStores.length;

    console.log('  Beer health_conscious_choice:');
    console.log(`    Waitrose avg: ${(avgWaitroseHealthConscious * 100).toFixed(1)}%`);
    console.log(`    Aldi avg: ${(avgAldiHealthConscious * 100).toFixed(1)}%`);

    if (avgWaitroseHealthConscious > avgAldiHealthConscious) {
      console.log(`    ✅ Waitrose > Aldi (${((avgWaitroseHealthConscious - avgAldiHealthConscious) * 100).toFixed(1)}pp lift)\n`);
    } else {
      issues.push('Waitrose health_conscious_choice should be > Aldi');
      console.log(`    ❌ Aldi > Waitrose\n`);
    }

    // Aldi should have higher "everyday_drink" demand than Waitrose
    const avgWaitroseEveryday = waitroseStores.reduce((sum, s) => sum + s.occasion_demand.beer.everyday_drink, 0) / waitroseStores.length;
    const avgAldiEveryday = aldiStores.reduce((sum, s) => sum + s.occasion_demand.beer.everyday_drink, 0) / aldiStores.length;

    console.log('  Beer everyday_drink:');
    console.log(`    Waitrose avg: ${(avgWaitroseEveryday * 100).toFixed(1)}%`);
    console.log(`    Aldi avg: ${(avgAldiEveryday * 100).toFixed(1)}%`);

    if (avgAldiEveryday > avgWaitroseEveryday) {
      console.log(`    ✅ Aldi > Waitrose (${((avgAldiEveryday - avgWaitroseEveryday) * 100).toFixed(1)}pp lift)\n`);
    } else {
      issues.push('Aldi everyday_drink should be > Waitrose');
      console.log(`    ❌ Waitrose > Aldi\n`);
    }

    // Waitrose should have higher "special_celebration" demand than Aldi
    const avgWaitroseCelebration = waitroseStores.reduce((sum, s) => sum + s.occasion_demand.beer.special_celebration, 0) / waitroseStores.length;
    const avgAldiCelebration = aldiStores.reduce((sum, s) => sum + s.occasion_demand.beer.special_celebration, 0) / aldiStores.length;

    console.log('  Beer special_celebration:');
    console.log(`    Waitrose avg: ${(avgWaitroseCelebration * 100).toFixed(1)}%`);
    console.log(`    Aldi avg: ${(avgAldiCelebration * 100).toFixed(1)}%`);

    if (avgWaitroseCelebration > avgAldiCelebration) {
      console.log(`    ✅ Waitrose > Aldi (${((avgWaitroseCelebration - avgAldiCelebration) * 100).toFixed(1)}pp lift)\n`);
    } else {
      issues.push('Waitrose special_celebration should be > Aldi');
      console.log(`    ❌ Aldi > Waitrose\n`);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 3: Format positioning sanity checks
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 3: Format positioning patterns\n');

  const convenienceStores = stores.filter(s => s.format === 'Convenience');
  const hypermarketStores = stores.filter(s => s.format === 'Hypermarket');

  if (convenienceStores.length > 0 && hypermarketStores.length > 0) {
    const avgConvQuickFix = convenienceStores.reduce((sum, s) => sum + s.occasion_demand.beauty.quick_fix, 0) / convenienceStores.length;
    const avgHyperQuickFix = hypermarketStores.reduce((sum, s) => sum + s.occasion_demand.beauty.quick_fix, 0) / hypermarketStores.length;

    console.log('  Beauty quick_fix:');
    console.log(`    Convenience avg: ${(avgConvQuickFix * 100).toFixed(1)}%`);
    console.log(`    Hypermarket avg: ${(avgHyperQuickFix * 100).toFixed(1)}%`);

    if (avgConvQuickFix > avgHyperQuickFix) {
      console.log(`    ✅ Convenience > Hypermarket (${((avgConvQuickFix - avgHyperQuickFix) * 100).toFixed(1)}pp lift)\n`);
    } else {
      console.log(`    ℹ️  Hypermarket > Convenience (depends on segment attraction)\n`);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 4: Occasion demand range checks
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 4: Occasion demand range checks\n');

  let extremeHigh = 0;
  let extremeLow = 0;

  stores.forEach(store => {
    for (const category of ['beer', 'beauty', 'home']) {
      for (const [occasion, demand] of Object.entries(store.occasion_demand[category])) {
        if (demand > 0.60) {
          warnings.push(`${store.store_id} ${category}.${occasion} = ${(demand * 100).toFixed(1)}% (>60%)`);
          extremeHigh++;
        }
        if (demand < 0.05) {
          warnings.push(`${store.store_id} ${category}.${occasion} = ${(demand * 100).toFixed(1)}% (<5%)`);
          extremeLow++;
        }
      }
    }
  });

  console.log(`  Extreme high (>60%): ${extremeHigh} cases`);
  console.log(`  Extreme low (<5%): ${extremeLow} cases\n`);

  if (extremeHigh === 0 && extremeLow === 0) {
    console.log('✅ All occasion demands within reasonable range\n');
  } else {
    console.log('⚠️  Some extreme occasion demand values found\n');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK 5: Segment occasion detail integrity
  // ═════════════════════════════════════════════════════════════════════════

  console.log('CHECK 5: Segment occasion detail integrity\n');

  let detailErrors = 0;

  stores.forEach(store => {
    for (const category of ['beer', 'beauty', 'home']) {
      // Check that segment_occasion_detail matches segment_mix
      const detailSegments = store.segment_occasion_detail[category];
      const mixSegments = store.segment_mix[category];

      if (detailSegments.length !== Object.keys(mixSegments).length) {
        issues.push(`${store.store_id}: ${category} segment_occasion_detail length mismatch`);
        detailErrors++;
      }

      // Check that segment shares match
      detailSegments.forEach(detail => {
        const expectedShare = mixSegments[detail.segment];
        if (Math.abs(detail.segment_share - expectedShare) > 0.001) {
          issues.push(`${store.store_id}: ${category}.${detail.segment} share mismatch (${detail.segment_share} vs ${expectedShare})`);
          detailErrors++;
        }
      });
    }
  });

  console.log(`  Segment occasion detail errors: ${detailErrors}\n`);

  if (detailErrors === 0) {
    console.log('✅ All segment occasion details match segment mix\n');
  } else {
    console.log('❌ Segment occasion detail errors found\n');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════');
  console.log('VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`✅ Total stores: ${stores.length}`);
  console.log(`❌ Critical errors: ${issues.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}\n`);

  if (issues.length === 0) {
    console.log('✅ ALL VALIDATION CHECKS PASSED\n');
  } else {
    console.log('Issues found:');
    issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
    if (issues.length > 10) {
      console.log(`  ... and ${issues.length - 10} more\n`);
    }
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings (first 5):');
    warnings.slice(0, 5).forEach(warning => console.log(`  - ${warning}`));
    if (warnings.length > 5) {
      console.log(`  ... and ${warnings.length - 5} more\n`);
    }
  }

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    totalStores: stores.length,
    criticalErrors: issues.length,
    warnings: warnings.length,
    issues: issues.slice(0, 20),
    checks: {
      normalisation: {
        segmentSumErrors,
        missionSumErrors,
        occasionSumErrors,
      },
      retailerPositioning: {
        waitroseVsAldi: {
          healthConsciousCorrect: waitroseStores.length > 0 && aldiStores.length > 0 &&
            (waitroseStores.reduce((sum, s) => sum + s.occasion_demand.beer.health_conscious_choice, 0) / waitroseStores.length) >
            (aldiStores.reduce((sum, s) => sum + s.occasion_demand.beer.health_conscious_choice, 0) / aldiStores.length),
          everydayDrinkCorrect: waitroseStores.length > 0 && aldiStores.length > 0 &&
            (aldiStores.reduce((sum, s) => sum + s.occasion_demand.beer.everyday_drink, 0) / aldiStores.length) >
            (waitroseStores.reduce((sum, s) => sum + s.occasion_demand.beer.everyday_drink, 0) / waitroseStores.length),
        }
      },
      occasionRanges: {
        extremeHigh,
        extremeLow,
      },
      segmentOccasionDetail: {
        detailErrors,
      }
    }
  };

  const reportPath = path.join(__dirname, '../file4-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('📄 Validation report written to file4-validation-report.json\n');
}

// ═════════════════════════════════════════════════════════════════════════
// RUN
// ═════════════════════════════════════════════════════════════════════════

validateFile4();
