// Global filter state management using Zustand
// Shared across Overview, Store View, Shopper, and B2B pages

import { create } from 'zustand';
import type { MeasureType, Segment, Occasion } from '@/types/demo-data';

interface FilterState {
  // ============= STORE SELECTION =============
  selectedStoreId: string;
  setSelectedStoreId: (storeId: string) => void;

  // ============= MEASURE + BREAKDOWNS =============
  // Measure type (choice_share, shelf_share, etc.)
  measureType: MeasureType;
  setMeasureType: (measure: MeasureType) => void;

  // Split by Segment (checkbox + dropdown)
  splitBySegment: boolean;
  selectedSegment: Segment | null;
  setSplitBySegment: (enabled: boolean) => void;
  setSelectedSegment: (segment: Segment | null) => void;

  // Split by Occasion (checkbox + dropdown)
  splitByOccasion: boolean;
  selectedOccasion: Occasion | null;
  setSplitByOccasion: (enabled: boolean) => void;
  setSelectedOccasion: (occasion: Occasion | null) => void;

  // ============= GRID FILTERS (Overview page) =============
  // Retailer filters
  retailerFilters: string[];
  toggleRetailer: (retailer: string) => void;
  setRetailerFilters: (retailers: string[]) => void;

  // Format filters
  formatFilters: string[];
  toggleFormat: (format: string) => void;
  setFormatFilters: (formats: string[]) => void;

  // Region filters
  regionFilters: string[];
  toggleRegion: (region: string) => void;
  setRegionFilters: (regions: string[]) => void;

  // Mission filters
  missionFilters: string[];
  toggleMission: (mission: string) => void;
  setMissionFilters: (missions: string[]) => void;

  // ============= SHOPPER PAGE FILTERS =============
  // SKU brand filters (multiple selection)
  brandFilters: string[];
  toggleBrandFilter: (brand: string) => void;
  setBrandFilters: (brands: string[]) => void;

  // ============= B2B PAGE FILTERS =============
  // Selected retailers for comparison
  selectedRetailersForComparison: string[];
  toggleRetailerForComparison: (retailer: string) => void;
  setSelectedRetailersForComparison: (retailers: string[]) => void;

  // ============= UTILITIES =============
  // Reset all filters
  resetFilters: () => void;

  // Reset just grid filters (Overview)
  resetGridFilters: () => void;
}

export const useFilters = create<FilterState>((set, get) => ({
  // ============= DEFAULT STATE =============
  selectedStoreId: "WAITROSE-049", // Default to first Waitrose store
  measureType: "choice_share",
  splitBySegment: false,
  selectedSegment: null,
  splitByOccasion: false,
  selectedOccasion: null,
  retailerFilters: [],
  formatFilters: [],
  regionFilters: [],
  missionFilters: [],
  brandFilters: [],
  selectedRetailersForComparison: [],

  // ============= STORE SELECTION =============
  setSelectedStoreId: (storeId) => set({ selectedStoreId: storeId }),

  // ============= MEASURE + BREAKDOWNS =============
  setMeasureType: (measure) => set({ measureType: measure }),

  setSplitBySegment: (enabled) => set({
    splitBySegment: enabled,
    // If enabling segment, disable occasion (mutually exclusive for MVP)
    splitByOccasion: enabled ? false : get().splitByOccasion,
    // Reset selections when disabling
    selectedSegment: enabled ? get().selectedSegment : null
  }),

  setSelectedSegment: (segment) => set({ selectedSegment: segment }),

  setSplitByOccasion: (enabled) => set({
    splitByOccasion: enabled,
    // If enabling occasion, disable segment (mutually exclusive for MVP)
    splitBySegment: enabled ? false : get().splitBySegment,
    // Reset selections when disabling
    selectedOccasion: enabled ? get().selectedOccasion : null
  }),

  setSelectedOccasion: (occasion) => set({ selectedOccasion: occasion }),

  // ============= GRID FILTERS =============
  toggleRetailer: (retailer) => {
    const current = get().retailerFilters;
    if (current.includes(retailer)) {
      set({ retailerFilters: current.filter(r => r !== retailer) });
    } else {
      set({ retailerFilters: [...current, retailer] });
    }
  },

  setRetailerFilters: (retailers) => set({ retailerFilters: retailers }),

  toggleFormat: (format) => {
    const current = get().formatFilters;
    if (current.includes(format)) {
      set({ formatFilters: current.filter(f => f !== format) });
    } else {
      set({ formatFilters: [...current, format] });
    }
  },

  setFormatFilters: (formats) => set({ formatFilters: formats }),

  toggleRegion: (region) => {
    const current = get().regionFilters;
    if (current.includes(region)) {
      set({ regionFilters: current.filter(r => r !== region) });
    } else {
      set({ regionFilters: [...current, region] });
    }
  },

  setRegionFilters: (regions) => set({ regionFilters: regions }),

  toggleMission: (mission) => {
    const current = get().missionFilters;
    if (current.includes(mission)) {
      set({ missionFilters: current.filter(m => m !== mission) });
    } else {
      set({ missionFilters: [...current, mission] });
    }
  },

  setMissionFilters: (missions) => set({ missionFilters: missions }),

  // ============= SHOPPER PAGE FILTERS =============
  toggleBrandFilter: (brand) => {
    const current = get().brandFilters;
    if (current.includes(brand)) {
      set({ brandFilters: current.filter(b => b !== brand) });
    } else {
      set({ brandFilters: [...current, brand] });
    }
  },

  setBrandFilters: (brands) => set({ brandFilters: brands }),

  // ============= B2B PAGE FILTERS =============
  toggleRetailerForComparison: (retailer) => {
    const current = get().selectedRetailersForComparison;
    if (current.includes(retailer)) {
      set({ selectedRetailersForComparison: current.filter(r => r !== retailer) });
    } else {
      set({ selectedRetailersForComparison: [...current, retailer] });
    }
  },

  setSelectedRetailersForComparison: (retailers) => set({ selectedRetailersForComparison: retailers }),

  // ============= UTILITIES =============
  resetFilters: () => set({
    measureType: "choice_share",
    splitBySegment: false,
    selectedSegment: null,
    splitByOccasion: false,
    selectedOccasion: null,
    retailerFilters: [],
    formatFilters: [],
    regionFilters: [],
    missionFilters: [],
    brandFilters: [],
    selectedRetailersForComparison: []
  }),

  resetGridFilters: () => set({
    retailerFilters: [],
    formatFilters: [],
    regionFilters: [],
    missionFilters: []
  })
}));
