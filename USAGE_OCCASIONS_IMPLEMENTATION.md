# Usage Occasions Implementation - Technical Documentation

## Overview
This document explains how usage occasions demand vs coverage is calculated in the OnShelf demo platform, the issues discovered, and the solutions implemented.

---

## The 4 Data Files

### 1. `stores.json` (535 stores)
**Purpose**: Store metadata and catchment demographics

**Key Fields**:
- `store_id`: Unique identifier
- `retailer`, `banner`, `format`: Store classification
- `location_type`: Urban, Suburban, Retail park, etc.
- `city`, `region_group`: Geographic location
- **`catchmentPopulation.demographics`**: Array of 10 segments with percentages
  - Each segment (e.g., "Premium Craft Enthusiasts") has a percentage of the catchment

**Example**:
```json
{
  "store_id": "TESCO-EXTRA-001",
  "retailer": "Tesco",
  "location_type": "Retail park",
  "catchmentPopulation": {
    "demographics": [
      { "segment": "Premium Craft Enthusiasts", "percentage": 8.7 },
      { "segment": "Mainstream Family Buyers", "percentage": 14.0 },
      { "segment": "Student Budget Shoppers", "percentage": 9.7 }
      // ... 7 more segments
    ]
  }
}
```

### 2. `category-performance.json`
**Purpose**: Store-level performance metrics for the beer category

**Key Fields**:
- `choice_share`: Brand percentages (what shoppers actually choose)
- `shelf_share`: Brand facings percentages
- `choice_share_by_segment`: Choice share broken down by segment
- **`choice_share_by_occasion`**: Choice share broken down by occasion
  - For each occasion, shows brand breakdown
  - **CRITICAL**: Used previously (incorrectly) for coverage calculation

**Example**:
```json
{
  "store_id": "TESCO-EXTRA-001",
  "choice_share_by_occasion": {
    "Weeknight unwind": {
      "Premium Craft Co": 18.2,
      "Traditional Ales Ltd": 29.5,
      "Heritage Beer Co": 20.2,
      "Value Lager Brewing": 31.2,
      "Others": 0.9
    }
    // ... 9 more occasions
  }
}
```

### 3. `shopper-responses.json` (40 SKUs)
**Purpose**: SKU-level data from shopper research

**Key Fields**:
- `sku_id`, `name`, `brand`, `pack_size`
- **`occasion_choice_share`**: For each occasion, % of respondents who'd buy this SKU for that occasion
- **`segment_choice_share`**: For each segment, % who'd buy this SKU
- **`available_in_stores`**: Array of store_ids where this SKU is stocked

**Example**:
```json
{
  "sku_id": "PCC-IPA-4PK-440",
  "brand": "Premium Craft Co",
  "occasion_choice_share": {
    "Weeknight unwind": 32.6,
    "House party": 2.7,
    "Having friends over": 21.5
    // ... 7 more occasions
  },
  "available_in_stores": ["TESCO-EXTRA-001", "WAITROSE-049", ...]
}
```

### 4. `retailer-analytics.json`
**Purpose**: Aggregated cross-retailer comparisons
- Less relevant for usage occasions
- Used for B2B page

---

## The Business Logic

### What We're Trying to Show
For each store, calculate:
1. **DEMAND**: What usage occasions does the catchment population need?
2. **COVERAGE**: What usage occasions can the current assortment actually serve?
3. **GAP**: Where is the store under-serving its catchment?

### The Methodology (Real-World)
1. Take pictures of beer category in each store
2. Ask respondents to click which product they'd buy
3. Ask: "For which usage occasion would you buy this?"
4. Aggregate: Each SKU gets occasion associations across all respondents
5. For each store:
   - Know the catchment demographics
   - Know which SKUs are in the assortment
   - Calculate demand from demographics
   - Calculate coverage from available SKUs

---

## Implementation History

### WRONG Implementation #1 (Initial Bug)
```typescript
// This was WRONG - used Math.random()
const coverage = demand * (0.7 + Math.random() * 0.5);
```
**Problem**: Random values caused hydration errors and meaningless data

### WRONG Implementation #2 (After First Fix)
```typescript
// This was WRONG - summed brand shares
const occasions = storePerf.choice_share_by_occasion || {};
Object.entries(occasions).forEach(([occasion, brandShares]) => {
  coverage[occasion] = Object.values(brandShares).reduce((sum, val) => sum + val, 0);
});
```
**Problem**: Sum of brand shares = 100% for every occasion → all coverage = 100%

### CORRECT Implementation (Current)

#### Step 1: Create Segment-to-Occasion Mapping
Created `SEGMENT_OCCASION_PREFERENCES` in `types/demo-data.ts`:
- Maps each of 10 segments to preferences across all 10 occasions
- Totals 100% per segment
- Example: "Student Budget Shoppers" → 23% House party, 8% Weeknight unwind, etc.

#### Step 2: Calculate DEMAND from Catchment
```typescript
const demandByOccasion = {};

// For each segment in the catchment
store.catchmentPopulation.demographics.forEach(demo => {
  const segmentPercentage = demo.percentage; // e.g., 10% students
  const occasionPrefs = SEGMENT_OCCASION_PREFERENCES[demo.segment];

  // Multiply catchment % by occasion preferences
  Object.entries(occasionPrefs).forEach(([occasion, pref]) => {
    demandByOccasion[occasion] += (segmentPercentage * pref) / 100;
  });
});
```

**Example Math**:
- Store has 10% students, 15% families
- Students: 23% House party preference → contributes 2.3 points to House Party demand
- Families: 4% House party preference → contributes 0.6 points
- Total House Party demand = 2.3 + 0.6 + ... (all 10 segments) ≈ 12%

#### Step 3: Calculate COVERAGE from SKU Availability
```typescript
const allSKUs = shopperResp.skus;
const storeAvailableSKUs = allSKUs.filter(sku =>
  sku.available_in_stores?.includes(storeId)
);

OCCASIONS.forEach(occasion => {
  // Total potential = sum of all SKUs' occasion associations
  const totalPotential = allSKUs.reduce((sum, sku) => {
    return sum + (sku.occasion_choice_share[occasion] || 0);
  }, 0);

  // Store coverage = sum of only available SKUs
  const storeCoverage = storeAvailableSKUs.reduce((sum, sku) => {
    return sum + (sku.occasion_choice_share[occasion] || 0);
  }, 0);

  // Coverage % = (what store has / total possible) × 100
  coverageByOccasion[occasion] = totalPotential > 0
    ? (storeCoverage / totalPotential) * 100
    : 0;
});
```

---

## Problems Discovered

### Problem 1: Lack of Variability in Segment Preferences
**Initial values**: Range 6-16% per occasion
**Result**: All stores looked similar (same colors in UI)

**Fix Applied**: Increased differentiation to 2-26% range
- Students: 23% House party (dominant)
- Families: 22% Family meal (dominant)
- Sports fans: 25% Watching sport (dominant)
- etc.

### Problem 2: Catchment Demographics Too Similar
**Discovered**: Average demographics by location type showed only small differences:
- Students: 6.5% (Suburban) to 11.9% (Urban) - only 5% difference
- Convenience: 4.9% (Retail) to 13.8% (Urban) - only 9% difference

**Impact**: Even with strong segment preferences, demand looked similar across stores

### Problem 3: Retailer Brand Not Reflected in Demographics
**Discovered**: Waitrose vs Aldi catchments almost identical
- Waitrose: Value-Driven 10.7%, Premium not in top 5
- Aldi: Value-Driven only 13.5%

**Expected Reality**:
- Waitrose: 25%+ Premium Craft, 20%+ Health-Conscious, <5% Value
- Aldi: 35%+ Value-Driven, 25%+ Budget, <5% Premium

---

## Solution: Regenerate stores.json Demographics

### Approach
Create synthetic catchment demographics based on TWO dimensions:

#### Dimension 1: Location Type
- **Urban Central**: 30%+ Convenience, 20%+ Students, 15%+ Premium
- **Suburban Family**: 30%+ Families, 20%+ Health-Conscious, 15%+ Value
- **Retail Park**: 25%+ Value-Driven, 20%+ Families
- **University Towns**: 35-40% Students, 15% Social Party Hosts
- **Business District**: 35%+ Convenience, 20%+ Premium

#### Dimension 2: Retailer Brand
Apply multipliers to base distribution:
- **Waitrose/M&S**: Boost Premium (+10%), Health (+8%), reduce Value (-8%)
- **Aldi/Lidl**: Boost Value (+15%), Budget (+10%), reduce Premium (-10%)
- **Tesco/Sainsbury's/Asda**: Mainstream balanced (no major shifts)
- **Convenience stores**: Boost Convenience (+12%), reduce Families (-6%)

#### Combined Effect Example
**Waitrose in Urban London**:
- Base Urban: 30% Convenience, 20% Students, 15% Premium
- Waitrose modifier: +10% Premium, +8% Health
- Result: 25% Premium, 30% Convenience, 15% Health, 12% Students, ...

**Aldi in Retail Park**:
- Base Retail Park: 25% Value, 20% Families
- Aldi modifier: +15% Value, +10% Budget
- Result: 40% Value, 18% Families, 12% Budget, ...

### Expected Outcome
- **Visual variety**: Different colored tiles across retailers and locations
- **Business sense**: Waitrose stores cluster around premium occasions, Aldi around bulk/value occasions
- **Demo impact**: Clients see clear differentiation, understand the value proposition

---

## Files Modified

1. **types/demo-data.ts**:
   - Added `SEGMENT_OCCASION_PREFERENCES` constant
   - Fixed SKU type: `available_stores` → `available_in_stores`

2. **lib/demo-data.ts**:
   - Rewrote `getUsageOccasionData()` function
   - Implemented demand calculation from catchment
   - Implemented coverage calculation from SKU availability

3. **components/shopper/sku-card.tsx**:
   - Fixed field name: `available_stores` → `available_in_stores`

4. **components/optimize-panel.tsx**:
   - Fixed field name: `available_stores` → `available_in_stores`

5. **data/stores.json** (TO BE REGENERATED):
   - Will update `catchmentPopulation.demographics` for all 535 stores
   - Apply location type + retailer brand logic
   - Create dramatic, visible differences

---

## Technical Notes

### Seasonality
Current mapping reflects Oct-Nov (winter):
- Barbecue: 3-8% (low - it's winter!)
- Picnic: 2-8% (low - outdoor summer activity)
- Movie night, Weeknight unwind: 8-25% (high - indoor winter activities)
- Watching sport: 7-25% (high - football season)

### Edge Cases
- If `available_in_stores` is empty/undefined: Coverage = 0%
- If no SKUs have occasion data: Coverage = 0%
- If catchment has unknown segments: Ignored in demand calculation

### Performance
- All calculations happen at render time (not cached)
- Uses lookup maps (O(1) access) for stores and SKUs
- Typical calculation time: <10ms per store

---

## Next Steps

1. ✅ Create segment-to-occasion preferences (DONE)
2. ✅ Implement demand/coverage calculation (DONE)
3. ✅ Fix field naming bugs (DONE)
4. ⏳ Regenerate stores.json with dramatic demographic differences (IN PROGRESS)
5. ⏳ Test visual variety across Overview page
6. ⏳ Validate business logic makes sense (Waitrose ≠ Aldi)

---

## Validation Checklist

After regeneration, verify:
- [ ] Waitrose stores show premium occasions (Having friends over, Celebration)
- [ ] Aldi/Lidl show value occasions (Weekend stock-up)
- [ ] Urban stores show convenience occasions (Weeknight unwind)
- [ ] Student areas show party occasions (House party)
- [ ] Family suburbs show family occasions (Family meal, Movie night)
- [ ] Overview page shows variety of colors across stores
- [ ] No hydration errors
- [ ] Coverage percentages vary (not all 100%)
- [ ] Demand percentages vary by store catchment

---

**Last Updated**: 2025-11-22
**Author**: Claude (with user guidance)
