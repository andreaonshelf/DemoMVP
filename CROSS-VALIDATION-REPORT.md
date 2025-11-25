═══════════════════════════════════════════════════
CROSS-VALIDATION REPORT: FILE 1 ↔ FILE 2
Generated: 2025-11-24T22:04:20.067Z
═══════════════════════════════════════════════════

## Summary

- File 1 clusters: 92
- File 2 clusters: 92
- Match: ✅

## Consistency Checks

- Demographic sums valid: ✅
- Cluster type/context match: ✅
- Regional demographics: ✅
- Daytime/context match: ✅
- Format/income correlation: ⚠️  15 issues
- No impossible combos: ✅

## Issues Found

⚠️  CLUSTER-5: Discounters but income_low only 15.5%
⚠️  CLUSTER-6: Discounters but income_low only 13.7%
⚠️  CLUSTER-20: Discounters but income_low only 11.2%
⚠️  CLUSTER-27: Discounters but income_low only 19.6%
⚠️  CLUSTER-30: Premium retailers but income_high only 16.0%
⚠️  CLUSTER-31: Discounters but income_low only 11.2%
⚠️  CLUSTER-33: Discounters but income_low only 11.8%
⚠️  CLUSTER-38: Discounters but income_low only 19.6%
⚠️  CLUSTER-39: Discounters but income_low only 13.3%
⚠️  CLUSTER-45: Discounters but income_low only 17.7%
⚠️  CLUSTER-53: Premium retailers but income_high only 18.8%
⚠️  CLUSTER-55: Premium retailers but income_high only 17.8%
⚠️  CLUSTER-59: Premium retailers but income_high only 18.9%
⚠️  CLUSTER-62: Premium retailers but income_high only 14.9%
⚠️  CLUSTER-74: Discounters but income_low only 18.4%

## Merged Table Preview (first 10 clusters)

```
cluster_id | region | type | stores | contexts | age25-34 | age65+ | inc_high | commuters | tourists | premium | disc
-----------|--------|------|--------|----------|----------|--------|----------|-----------|----------|---------|-----
CLUSTER-1  | Yorkshire and the Humber | MIXED | 11     | 54.5/45.5/0.0/0.0 | 20.6     | 20.2   | 17.1     | 24.1      | 6.0      | N       | Y
CLUSTER-10 | North West | MIXED | 7      | 57.1/42.9/0.0/0.0 | 24.8     | 15.1   | 19.3     | 23.5      | 8.3      | N       | Y
CLUSTER-11 | North West | MIXED | 7      | 28.6/14.3/42.9/14.3 | 24.4     | 16.5   | 13.6     | 29.8      | 4.1      | N       | Y
CLUSTER-12 | West Midlands | RESIDENTIAL | 7      | 85.7/0.0/0.0/14.3 | 21.1     | 21.3   | 14.2     | 10.3      | 1.6      | N       | Y
CLUSTER-13 | West Midlands | MIXED | 6      | 33.3/16.7/0.0/50.0 | 24.7     | 18.4   | 18.2     | 27.6      | 4.5      | N       | N
CLUSTER-14 | North West | MIXED | 9      | 44.4/22.2/0.0/33.3 | 23.3     | 12.6   | 14.0     | 26.4      | 2.8      | N       | Y
CLUSTER-15 | North West | MIXED | 5      | 0.0/80.0/20.0/0.0 | 24.5     | 17.2   | 12.5     | 20.9      | 3.4      | N       | Y
CLUSTER-16 | South West | RESIDENTIAL | 8      | 100.0/0.0/0.0/0.0 | 17.7     | 24.5   | 16.1     | 8.8       | 1.2      | N       | Y
CLUSTER-17 | West Midlands | MIXED | 11     | 54.5/18.2/27.3/0.0 | 20.9     | 16.3   | 16.0     | 23.4      | 5.0      | N       | Y
CLUSTER-18 | Yorkshire and the Humber | TRANSIT_HUB | 7      | 14.3/14.3/71.4/0.0 | 30.9     | 8.2    | 20.3     | 37.8      | 19.0     | Y       | N
```

Full table available in CROSS-VALIDATION-TABLE.csv (92 clusters)
