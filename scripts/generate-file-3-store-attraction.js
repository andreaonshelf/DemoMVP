#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE FILE 3: 3-store-attraction.json
// ═══════════════════════════════════════════════════════════════════════════
// Splits cluster-level population across stores based on retailer positioning,
// format, context, and competition

// ═════════════════════════════════════════════════════════════════════════
// RETAILER POSITIONING PROFILES
// ═════════════════════════════════════════════════════════════════════════

const RETAILER_POSITIONING = {
  // PREMIUM TIER
  'Waitrose': {
    tier: 'premium',
    income_pull: { income_low: 0.3, income_mid: 0.8, income_high: 2.5 },
    age_pull: { age_18_24: 0.7, age_25_34: 1.4, age_35_54: 1.2, age_55_64: 1.0, age_65_plus: 0.8 },
    household_pull: { single_person: 1.0, couples_no_kids: 1.5, families_with_kids: 1.1, multi_gen_households: 0.7 },
    daytime_pull: { local_residents_share: 1.3, daily_commuters_share: 1.1, office_workers_share: 1.4, students_share: 0.6, tourists_share: 1.2 },
    segment_affinity: {
      beer: { mindful_moderators: 1.5, premium_crafters: 2.0, social_sessionists: 1.1, mainstream_loyalists: 0.7, value_seekers: 0.4 },
      beauty: { prestige_devotees: 2.2, clean_conscious: 1.3, experimental_trendsetters: 1.4, family_protectors: 0.9, low_maintenance_minimalists: 0.5 },
      home: { clean_living_advocates: 1.8, sensory_homemakers: 1.4, germ_defenders: 1.1, family_protectors: 0.9, functional_pragmatists: 0.6 }
    }
  },
  'M&S': {
    tier: 'premium',
    income_pull: { income_low: 0.4, income_mid: 0.9, income_high: 2.3 },
    age_pull: { age_18_24: 0.6, age_25_34: 1.2, age_35_54: 1.3, age_55_64: 1.4, age_65_plus: 1.2 },
    household_pull: { single_person: 1.1, couples_no_kids: 1.6, families_with_kids: 1.0, multi_gen_households: 0.8 },
    daytime_pull: { local_residents_share: 1.2, daily_commuters_share: 1.3, office_workers_share: 1.5, students_share: 0.7, tourists_share: 1.4 },
    segment_affinity: {
      beer: { mindful_moderators: 1.4, premium_crafters: 1.8, social_sessionists: 1.0, mainstream_loyalists: 0.8, value_seekers: 0.5 },
      beauty: { prestige_devotees: 2.0, clean_conscious: 1.4, experimental_trendsetters: 1.2, family_protectors: 1.0, low_maintenance_minimalists: 0.6 },
      home: { clean_living_advocates: 1.6, sensory_homemakers: 1.5, germ_defenders: 1.2, family_protectors: 1.0, functional_pragmatists: 0.7 }
    }
  },

  // MAINSTREAM TIER
  'Tesco': {
    tier: 'mainstream',
    income_pull: { income_low: 1.0, income_mid: 1.3, income_high: 0.9 },
    age_pull: { age_18_24: 1.0, age_25_34: 1.1, age_35_54: 1.2, age_55_64: 1.0, age_65_plus: 0.9 },
    household_pull: { single_person: 1.0, couples_no_kids: 1.1, families_with_kids: 1.3, multi_gen_households: 1.1 },
    daytime_pull: { local_residents_share: 1.2, daily_commuters_share: 1.0, office_workers_share: 1.0, students_share: 1.0, tourists_share: 0.9 },
    segment_affinity: {
      beer: { mindful_moderators: 1.0, premium_crafters: 1.1, social_sessionists: 1.2, mainstream_loyalists: 1.5, value_seekers: 1.0 },
      beauty: { prestige_devotees: 0.9, clean_conscious: 1.3, experimental_trendsetters: 1.1, family_protectors: 1.4, low_maintenance_minimalists: 1.0 },
      home: { clean_living_advocates: 1.2, sensory_homemakers: 1.1, germ_defenders: 1.4, family_protectors: 1.5, functional_pragmatists: 1.1 }
    }
  },
  'Sainsbury\'s': {
    tier: 'mainstream',
    income_pull: { income_low: 0.9, income_mid: 1.3, income_high: 1.1 },
    age_pull: { age_18_24: 0.9, age_25_34: 1.1, age_35_54: 1.2, age_55_64: 1.1, age_65_plus: 1.0 },
    household_pull: { single_person: 1.0, couples_no_kids: 1.2, families_with_kids: 1.3, multi_gen_households: 1.0 },
    daytime_pull: { local_residents_share: 1.2, daily_commuters_share: 1.0, office_workers_share: 1.1, students_share: 0.9, tourists_share: 0.9 },
    segment_affinity: {
      beer: { mindful_moderators: 1.1, premium_crafters: 1.2, social_sessionists: 1.2, mainstream_loyalists: 1.4, value_seekers: 0.9 },
      beauty: { prestige_devotees: 1.1, clean_conscious: 1.4, experimental_trendsetters: 1.2, family_protectors: 1.3, low_maintenance_minimalists: 0.9 },
      home: { clean_living_advocates: 1.3, sensory_homemakers: 1.2, germ_defenders: 1.3, family_protectors: 1.4, functional_pragmatists: 1.0 }
    }
  },
  'Asda': {
    tier: 'mainstream',
    income_pull: { income_low: 1.5, income_mid: 1.2, income_high: 0.6 },
    age_pull: { age_18_24: 1.1, age_25_34: 1.1, age_35_54: 1.3, age_55_64: 1.0, age_65_plus: 0.9 },
    household_pull: { single_person: 0.9, couples_no_kids: 1.0, families_with_kids: 1.5, multi_gen_households: 1.2 },
    daytime_pull: { local_residents_share: 1.3, daily_commuters_share: 0.9, office_workers_share: 0.8, students_share: 1.1, tourists_share: 0.7 },
    segment_affinity: {
      beer: { mindful_moderators: 0.9, premium_crafters: 0.8, social_sessionists: 1.3, mainstream_loyalists: 1.5, value_seekers: 1.6 },
      beauty: { prestige_devotees: 0.7, clean_conscious: 1.0, experimental_trendsetters: 0.9, family_protectors: 1.5, low_maintenance_minimalists: 1.4 },
      home: { clean_living_advocates: 1.0, sensory_homemakers: 0.9, germ_defenders: 1.2, family_protectors: 1.6, functional_pragmatists: 1.4 }
    }
  },
  'ASDA': {  // Uppercase variant
    tier: 'mainstream',
    income_pull: { income_low: 1.5, income_mid: 1.2, income_high: 0.6 },
    age_pull: { age_18_24: 1.1, age_25_34: 1.1, age_35_54: 1.3, age_55_64: 1.0, age_65_plus: 0.9 },
    household_pull: { single_person: 0.9, couples_no_kids: 1.0, families_with_kids: 1.5, multi_gen_households: 1.2 },
    daytime_pull: { local_residents_share: 1.3, daily_commuters_share: 0.9, office_workers_share: 0.8, students_share: 1.1, tourists_share: 0.7 },
    segment_affinity: {
      beer: { mindful_moderators: 0.9, premium_crafters: 0.8, social_sessionists: 1.3, mainstream_loyalists: 1.5, value_seekers: 1.6 },
      beauty: { prestige_devotees: 0.7, clean_conscious: 1.0, experimental_trendsetters: 0.9, family_protectors: 1.5, low_maintenance_minimalists: 1.4 },
      home: { clean_living_advocates: 1.0, sensory_homemakers: 0.9, germ_defenders: 1.2, family_protectors: 1.6, functional_pragmatists: 1.4 }
    }
  },
  'Morrisons': {
    tier: 'mainstream',
    income_pull: { income_low: 1.3, income_mid: 1.2, income_high: 0.7 },
    age_pull: { age_18_24: 0.9, age_25_34: 1.0, age_35_54: 1.2, age_55_64: 1.2, age_65_plus: 1.1 },
    household_pull: { single_person: 0.9, couples_no_kids: 1.1, families_with_kids: 1.4, multi_gen_households: 1.1 },
    daytime_pull: { local_residents_share: 1.3, daily_commuters_share: 0.9, office_workers_share: 0.9, students_share: 1.0, tourists_share: 0.8 },
    segment_affinity: {
      beer: { mindful_moderators: 0.9, premium_crafters: 0.9, social_sessionists: 1.2, mainstream_loyalists: 1.5, value_seekers: 1.4 },
      beauty: { prestige_devotees: 0.8, clean_conscious: 1.1, experimental_trendsetters: 0.9, family_protectors: 1.4, low_maintenance_minimalists: 1.3 },
      home: { clean_living_advocates: 1.1, sensory_homemakers: 1.0, germ_defenders: 1.3, family_protectors: 1.5, functional_pragmatists: 1.3 }
    }
  },
  'Co-op': {
    tier: 'mainstream',
    income_pull: { income_low: 1.1, income_mid: 1.2, income_high: 0.9 },
    age_pull: { age_18_24: 1.0, age_25_34: 1.1, age_35_54: 1.1, age_55_64: 1.1, age_65_plus: 1.2 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.2, families_with_kids: 1.0, multi_gen_households: 0.9 },
    daytime_pull: { local_residents_share: 1.4, daily_commuters_share: 1.1, office_workers_share: 1.0, students_share: 1.2, tourists_share: 0.9 },
    segment_affinity: {
      beer: { mindful_moderators: 1.1, premium_crafters: 1.0, social_sessionists: 1.2, mainstream_loyalists: 1.3, value_seekers: 1.0 },
      beauty: { prestige_devotees: 0.9, clean_conscious: 1.3, experimental_trendsetters: 1.0, family_protectors: 1.2, low_maintenance_minimalists: 1.1 },
      home: { clean_living_advocates: 1.3, sensory_homemakers: 1.1, germ_defenders: 1.2, family_protectors: 1.3, functional_pragmatists: 1.1 }
    }
  },

  // VALUE TIER
  'Aldi': {
    tier: 'value',
    income_pull: { income_low: 2.0, income_mid: 1.2, income_high: 0.4 },
    age_pull: { age_18_24: 1.0, age_25_34: 1.1, age_35_54: 1.3, age_55_64: 1.2, age_65_plus: 1.1 },
    household_pull: { single_person: 0.8, couples_no_kids: 1.0, families_with_kids: 1.6, multi_gen_households: 1.3 },
    daytime_pull: { local_residents_share: 1.4, daily_commuters_share: 0.8, office_workers_share: 0.7, students_share: 1.3, tourists_share: 0.6 },
    segment_affinity: {
      beer: { mindful_moderators: 0.8, premium_crafters: 0.5, social_sessionists: 1.3, mainstream_loyalists: 1.4, value_seekers: 2.5 },
      beauty: { prestige_devotees: 0.4, clean_conscious: 0.9, experimental_trendsetters: 0.7, family_protectors: 1.6, low_maintenance_minimalists: 2.3 },
      home: { clean_living_advocates: 0.8, sensory_homemakers: 0.7, germ_defenders: 1.1, family_protectors: 1.7, functional_pragmatists: 2.0 }
    }
  },
  'Lidl': {
    tier: 'value',
    income_pull: { income_low: 1.9, income_mid: 1.2, income_high: 0.5 },
    age_pull: { age_18_24: 1.1, age_25_34: 1.2, age_35_54: 1.3, age_55_64: 1.1, age_65_plus: 1.0 },
    household_pull: { single_person: 0.9, couples_no_kids: 1.0, families_with_kids: 1.5, multi_gen_households: 1.2 },
    daytime_pull: { local_residents_share: 1.4, daily_commuters_share: 0.8, office_workers_share: 0.8, students_share: 1.2, tourists_share: 0.7 },
    segment_affinity: {
      beer: { mindful_moderators: 0.8, premium_crafters: 0.6, social_sessionists: 1.2, mainstream_loyalists: 1.4, value_seekers: 2.3 },
      beauty: { prestige_devotees: 0.5, clean_conscious: 1.0, experimental_trendsetters: 0.8, family_protectors: 1.5, low_maintenance_minimalists: 2.1 },
      home: { clean_living_advocates: 0.9, sensory_homemakers: 0.8, germ_defenders: 1.2, family_protectors: 1.6, functional_pragmatists: 1.9 }
    }
  },

  // CONVENIENCE SPECIALISTS
  'Tesco Express': {
    tier: 'convenience',
    income_pull: { income_low: 0.9, income_mid: 1.2, income_high: 1.1 },
    age_pull: { age_18_24: 1.3, age_25_34: 1.4, age_35_54: 1.1, age_55_64: 0.8, age_65_plus: 0.7 },
    household_pull: { single_person: 1.5, couples_no_kids: 1.3, families_with_kids: 0.8, multi_gen_households: 0.7 },
    daytime_pull: { local_residents_share: 1.0, daily_commuters_share: 1.5, office_workers_share: 1.6, students_share: 1.4, tourists_share: 1.3 },
    segment_affinity: {
      beer: { mindful_moderators: 1.0, premium_crafters: 1.2, social_sessionists: 1.4, mainstream_loyalists: 1.2, value_seekers: 0.8 },
      beauty: { prestige_devotees: 1.0, clean_conscious: 1.2, experimental_trendsetters: 1.3, family_protectors: 0.9, low_maintenance_minimalists: 1.0 },
      home: { clean_living_advocates: 1.1, sensory_homemakers: 1.0, germ_defenders: 1.2, family_protectors: 0.9, functional_pragmatists: 1.0 }
    }
  },
  'Sainsbury\'s Local': {
    tier: 'convenience',
    income_pull: { income_low: 0.8, income_mid: 1.2, income_high: 1.3 },
    age_pull: { age_18_24: 1.3, age_25_34: 1.5, age_35_54: 1.1, age_55_64: 0.8, age_65_plus: 0.6 },
    household_pull: { single_person: 1.6, couples_no_kids: 1.4, families_with_kids: 0.7, multi_gen_households: 0.6 },
    daytime_pull: { local_residents_share: 1.0, daily_commuters_share: 1.5, office_workers_share: 1.7, students_share: 1.4, tourists_share: 1.2 },
    segment_affinity: {
      beer: { mindful_moderators: 1.1, premium_crafters: 1.3, social_sessionists: 1.3, mainstream_loyalists: 1.1, value_seekers: 0.7 },
      beauty: { prestige_devotees: 1.2, clean_conscious: 1.3, experimental_trendsetters: 1.3, family_protectors: 0.8, low_maintenance_minimalists: 0.9 },
      home: { clean_living_advocates: 1.2, sensory_homemakers: 1.1, germ_defenders: 1.1, family_protectors: 0.8, functional_pragmatists: 1.0 }
    }
  },
  'Co-op Food': {
    tier: 'convenience',
    income_pull: { income_low: 1.0, income_mid: 1.2, income_high: 1.0 },
    age_pull: { age_18_24: 1.2, age_25_34: 1.3, age_35_54: 1.1, age_55_64: 1.0, age_65_plus: 1.1 },
    household_pull: { single_person: 1.4, couples_no_kids: 1.3, families_with_kids: 0.9, multi_gen_households: 0.8 },
    daytime_pull: { local_residents_share: 1.3, daily_commuters_share: 1.3, office_workers_share: 1.3, students_share: 1.3, tourists_share: 1.0 },
    segment_affinity: {
      beer: { mindful_moderators: 1.1, premium_crafters: 1.1, social_sessionists: 1.3, mainstream_loyalists: 1.2, value_seekers: 0.9 },
      beauty: { prestige_devotees: 0.9, clean_conscious: 1.2, experimental_trendsetters: 1.1, family_protectors: 1.1, low_maintenance_minimalists: 1.1 },
      home: { clean_living_advocates: 1.2, sensory_homemakers: 1.1, germ_defenders: 1.2, family_protectors: 1.1, functional_pragmatists: 1.1 }
    }
  },
  'Londis': {
    tier: 'convenience',
    income_pull: { income_low: 1.2, income_mid: 1.1, income_high: 0.8 },
    age_pull: { age_18_24: 1.2, age_25_34: 1.2, age_35_54: 1.0, age_55_64: 1.0, age_65_plus: 1.0 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.1, families_with_kids: 0.9, multi_gen_households: 0.9 },
    daytime_pull: { local_residents_share: 1.2, daily_commuters_share: 1.2, office_workers_share: 1.2, students_share: 1.2, tourists_share: 1.0 },
    segment_affinity: {
      beer: { mindful_moderators: 1.0, premium_crafters: 0.9, social_sessionists: 1.3, mainstream_loyalists: 1.3, value_seekers: 1.1 },
      beauty: { prestige_devotees: 0.8, clean_conscious: 1.0, experimental_trendsetters: 1.0, family_protectors: 1.1, low_maintenance_minimalists: 1.2 },
      home: { clean_living_advocates: 1.0, sensory_homemakers: 1.0, germ_defenders: 1.1, family_protectors: 1.1, functional_pragmatists: 1.2 }
    }
  },
  'Spar': {
    tier: 'convenience',
    income_pull: { income_low: 1.2, income_mid: 1.1, income_high: 0.8 },
    age_pull: { age_18_24: 1.2, age_25_34: 1.1, age_35_54: 1.0, age_55_64: 1.0, age_65_plus: 1.0 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.1, families_with_kids: 0.9, multi_gen_households: 0.9 },
    daytime_pull: { local_residents_share: 1.2, daily_commuters_share: 1.2, office_workers_share: 1.2, students_share: 1.2, tourists_share: 1.0 },
    segment_affinity: {
      beer: { mindful_moderators: 1.0, premium_crafters: 0.9, social_sessionists: 1.3, mainstream_loyalists: 1.3, value_seekers: 1.1 },
      beauty: { prestige_devotees: 0.8, clean_conscious: 1.0, experimental_trendsetters: 1.0, family_protectors: 1.1, low_maintenance_minimalists: 1.2 },
      home: { clean_living_advocates: 1.0, sensory_homemakers: 1.0, germ_defenders: 1.1, family_protectors: 1.1, functional_pragmatists: 1.2 }
    }
  },

  // DISCOUNT STORES
  'Iceland': {
    tier: 'discount',
    income_pull: { income_low: 1.8, income_mid: 1.1, income_high: 0.4 },
    age_pull: { age_18_24: 1.0, age_25_34: 1.1, age_35_54: 1.2, age_55_64: 1.2, age_65_plus: 1.1 },
    household_pull: { single_person: 1.0, couples_no_kids: 0.9, families_with_kids: 1.5, multi_gen_households: 1.2 },
    daytime_pull: { local_residents_share: 1.4, daily_commuters_share: 0.8, office_workers_share: 0.7, students_share: 1.2, tourists_share: 0.6 },
    segment_affinity: {
      beer: { mindful_moderators: 0.8, premium_crafters: 0.5, social_sessionists: 1.2, mainstream_loyalists: 1.5, value_seekers: 2.2 },
      beauty: { prestige_devotees: 0.5, clean_conscious: 0.9, experimental_trendsetters: 0.7, family_protectors: 1.6, low_maintenance_minimalists: 2.1 },
      home: { clean_living_advocates: 0.8, sensory_homemakers: 0.7, germ_defenders: 1.2, family_protectors: 1.7, functional_pragmatists: 1.9 }
    }
  },

  // PHARMACY RETAILERS
  'Boots': {
    tier: 'specialist',
    income_pull: { income_low: 0.8, income_mid: 1.2, income_high: 1.3 },
    age_pull: { age_18_24: 1.3, age_25_34: 1.4, age_35_54: 1.2, age_55_64: 1.0, age_65_plus: 0.9 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.2, families_with_kids: 1.0, multi_gen_households: 0.9 },
    daytime_pull: { local_residents_share: 1.0, daily_commuters_share: 1.4, office_workers_share: 1.5, students_share: 1.3, tourists_share: 1.3 },
    segment_affinity: {
      beer: { mindful_moderators: 1.4, premium_crafters: 1.0, social_sessionists: 1.0, mainstream_loyalists: 1.0, value_seekers: 0.7 },
      beauty: { prestige_devotees: 1.8, clean_conscious: 1.6, experimental_trendsetters: 1.7, family_protectors: 1.1, low_maintenance_minimalists: 0.6 },
      home: { clean_living_advocates: 1.5, sensory_homemakers: 1.3, germ_defenders: 1.4, family_protectors: 1.2, functional_pragmatists: 0.8 }
    }
  },
  'Superdrug': {
    tier: 'specialist',
    income_pull: { income_low: 1.2, income_mid: 1.3, income_high: 0.8 },
    age_pull: { age_18_24: 1.6, age_25_34: 1.5, age_35_54: 1.1, age_55_64: 0.8, age_65_plus: 0.7 },
    household_pull: { single_person: 1.4, couples_no_kids: 1.2, families_with_kids: 1.0, multi_gen_households: 0.8 },
    daytime_pull: { local_residents_share: 1.0, daily_commuters_share: 1.3, office_workers_share: 1.4, students_share: 1.5, tourists_share: 1.2 },
    segment_affinity: {
      beer: { mindful_moderators: 1.2, premium_crafters: 0.8, social_sessionists: 1.1, mainstream_loyalists: 1.0, value_seekers: 0.9 },
      beauty: { prestige_devotees: 1.2, clean_conscious: 1.3, experimental_trendsetters: 1.6, family_protectors: 1.2, low_maintenance_minimalists: 1.1 },
      home: { clean_living_advocates: 1.3, sensory_homemakers: 1.2, germ_defenders: 1.3, family_protectors: 1.2, functional_pragmatists: 1.0 }
    }
  },

  // FORECOURT
  'Shell Select': {
    tier: 'forecourt',
    income_pull: { income_low: 0.9, income_mid: 1.1, income_high: 1.2 },
    age_pull: { age_18_24: 1.2, age_25_34: 1.4, age_35_54: 1.3, age_55_64: 0.9, age_65_plus: 0.7 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.2, families_with_kids: 1.0, multi_gen_households: 0.8 },
    daytime_pull: { local_residents_share: 0.8, daily_commuters_share: 1.8, office_workers_share: 1.5, students_share: 1.1, tourists_share: 1.4 },
    segment_affinity: {
      beer: { mindful_moderators: 0.9, premium_crafters: 1.1, social_sessionists: 1.4, mainstream_loyalists: 1.2, value_seekers: 0.9 },
      beauty: { prestige_devotees: 0.8, clean_conscious: 1.0, experimental_trendsetters: 1.1, family_protectors: 1.0, low_maintenance_minimalists: 1.1 },
      home: { clean_living_advocates: 1.0, sensory_homemakers: 0.9, germ_defenders: 1.1, family_protectors: 1.0, functional_pragmatists: 1.2 }
    }
  },
  'BP M&S Simply Food': {
    tier: 'forecourt',
    income_pull: { income_low: 0.7, income_mid: 1.0, income_high: 1.5 },
    age_pull: { age_18_24: 1.1, age_25_34: 1.4, age_35_54: 1.3, age_55_64: 1.0, age_65_plus: 0.7 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.3, families_with_kids: 1.0, multi_gen_households: 0.7 },
    daytime_pull: { local_residents_share: 0.8, daily_commuters_share: 1.9, office_workers_share: 1.6, students_share: 1.0, tourists_share: 1.3 },
    segment_affinity: {
      beer: { mindful_moderators: 1.2, premium_crafters: 1.4, social_sessionists: 1.2, mainstream_loyalists: 1.0, value_seekers: 0.6 },
      beauty: { prestige_devotees: 1.3, clean_conscious: 1.3, experimental_trendsetters: 1.2, family_protectors: 0.9, low_maintenance_minimalists: 0.8 },
      home: { clean_living_advocates: 1.3, sensory_homemakers: 1.2, germ_defenders: 1.1, family_protectors: 0.9, functional_pragmatists: 1.0 }
    }
  },

  // ONLINE SPECIALIST
  'Ocado': {
    tier: 'premium_online',
    income_pull: { income_low: 0.2, income_mid: 0.7, income_high: 2.8 },
    age_pull: { age_18_24: 0.8, age_25_34: 1.5, age_35_54: 1.4, age_55_64: 0.9, age_65_plus: 0.6 },
    household_pull: { single_person: 0.7, couples_no_kids: 1.6, families_with_kids: 1.5, multi_gen_households: 0.8 },
    daytime_pull: { local_residents_share: 1.5, daily_commuters_share: 0.8, office_workers_share: 1.3, students_share: 0.5, tourists_share: 0.3 },
    segment_affinity: {
      beer: { mindful_moderators: 1.6, premium_crafters: 2.2, social_sessionists: 1.0, mainstream_loyalists: 0.6, value_seekers: 0.3 },
      beauty: { prestige_devotees: 2.4, clean_conscious: 1.7, experimental_trendsetters: 1.5, family_protectors: 0.8, low_maintenance_minimalists: 0.4 },
      home: { clean_living_advocates: 2.0, sensory_homemakers: 1.6, germ_defenders: 1.2, family_protectors: 0.8, functional_pragmatists: 0.5 }
    }
  },

  // ADDITIONAL CONVENIENCE/SYMBOLS
  'SPAR': {
    tier: 'convenience',
    income_pull: { income_low: 1.2, income_mid: 1.1, income_high: 0.8 },
    age_pull: { age_18_24: 1.2, age_25_34: 1.1, age_35_54: 1.0, age_55_64: 1.0, age_65_plus: 1.0 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.1, families_with_kids: 0.9, multi_gen_households: 0.9 },
    daytime_pull: { local_residents_share: 1.2, daily_commuters_share: 1.2, office_workers_share: 1.2, students_share: 1.2, tourists_share: 1.0 },
    segment_affinity: {
      beer: { mindful_moderators: 1.0, premium_crafters: 0.9, social_sessionists: 1.3, mainstream_loyalists: 1.3, value_seekers: 1.1 },
      beauty: { prestige_devotees: 0.8, clean_conscious: 1.0, experimental_trendsetters: 1.0, family_protectors: 1.1, low_maintenance_minimalists: 1.2 },
      home: { clean_living_advocates: 1.0, sensory_homemakers: 1.0, germ_defenders: 1.1, family_protectors: 1.1, functional_pragmatists: 1.2 }
    }
  },
  'Premier': {
    tier: 'convenience',
    income_pull: { income_low: 1.3, income_mid: 1.1, income_high: 0.7 },
    age_pull: { age_18_24: 1.2, age_25_34: 1.1, age_35_54: 1.0, age_55_64: 1.0, age_65_plus: 1.0 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.1, families_with_kids: 0.9, multi_gen_households: 0.9 },
    daytime_pull: { local_residents_share: 1.3, daily_commuters_share: 1.1, office_workers_share: 1.1, students_share: 1.2, tourists_share: 0.9 },
    segment_affinity: {
      beer: { mindful_moderators: 0.9, premium_crafters: 0.8, social_sessionists: 1.3, mainstream_loyalists: 1.3, value_seekers: 1.2 },
      beauty: { prestige_devotees: 0.7, clean_conscious: 1.0, experimental_trendsetters: 0.9, family_protectors: 1.2, low_maintenance_minimalists: 1.3 },
      home: { clean_living_advocates: 0.9, sensory_homemakers: 0.9, germ_defenders: 1.1, family_protectors: 1.2, functional_pragmatists: 1.3 }
    }
  },
  'Nisa': {
    tier: 'convenience',
    income_pull: { income_low: 1.2, income_mid: 1.1, income_high: 0.8 },
    age_pull: { age_18_24: 1.1, age_25_34: 1.1, age_35_54: 1.0, age_55_64: 1.0, age_65_plus: 1.1 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.1, families_with_kids: 0.9, multi_gen_households: 0.9 },
    daytime_pull: { local_residents_share: 1.3, daily_commuters_share: 1.1, office_workers_share: 1.1, students_share: 1.2, tourists_share: 0.9 },
    segment_affinity: {
      beer: { mindful_moderators: 1.0, premium_crafters: 0.9, social_sessionists: 1.3, mainstream_loyalists: 1.3, value_seekers: 1.1 },
      beauty: { prestige_devotees: 0.8, clean_conscious: 1.0, experimental_trendsetters: 1.0, family_protectors: 1.1, low_maintenance_minimalists: 1.2 },
      home: { clean_living_advocates: 1.0, sensory_homemakers: 1.0, germ_defenders: 1.1, family_protectors: 1.1, functional_pragmatists: 1.2 }
    }
  },
  'Costcutter': {
    tier: 'convenience',
    income_pull: { income_low: 1.3, income_mid: 1.0, income_high: 0.7 },
    age_pull: { age_18_24: 1.1, age_25_34: 1.1, age_35_54: 1.0, age_55_64: 1.0, age_65_plus: 1.0 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.0, families_with_kids: 0.9, multi_gen_households: 0.9 },
    daytime_pull: { local_residents_share: 1.3, daily_commuters_share: 1.1, office_workers_share: 1.0, students_share: 1.2, tourists_share: 0.9 },
    segment_affinity: {
      beer: { mindful_moderators: 0.9, premium_crafters: 0.8, social_sessionists: 1.3, mainstream_loyalists: 1.3, value_seekers: 1.2 },
      beauty: { prestige_devotees: 0.7, clean_conscious: 0.9, experimental_trendsetters: 0.9, family_protectors: 1.2, low_maintenance_minimalists: 1.4 },
      home: { clean_living_advocates: 0.9, sensory_homemakers: 0.9, germ_defenders: 1.1, family_protectors: 1.2, functional_pragmatists: 1.3 }
    }
  },

  // ADDITIONAL FORECOURT
  'Shell': {
    tier: 'forecourt',
    income_pull: { income_low: 0.9, income_mid: 1.1, income_high: 1.2 },
    age_pull: { age_18_24: 1.2, age_25_34: 1.4, age_35_54: 1.3, age_55_64: 0.9, age_65_plus: 0.7 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.2, families_with_kids: 1.0, multi_gen_households: 0.8 },
    daytime_pull: { local_residents_share: 0.8, daily_commuters_share: 1.8, office_workers_share: 1.5, students_share: 1.1, tourists_share: 1.4 },
    segment_affinity: {
      beer: { mindful_moderators: 0.9, premium_crafters: 1.1, social_sessionists: 1.4, mainstream_loyalists: 1.2, value_seekers: 0.9 },
      beauty: { prestige_devotees: 0.8, clean_conscious: 1.0, experimental_trendsetters: 1.1, family_protectors: 1.0, low_maintenance_minimalists: 1.1 },
      home: { clean_living_advocates: 1.0, sensory_homemakers: 0.9, germ_defenders: 1.1, family_protectors: 1.0, functional_pragmatists: 1.2 }
    }
  },
  'BP': {
    tier: 'forecourt',
    income_pull: { income_low: 0.8, income_mid: 1.1, income_high: 1.3 },
    age_pull: { age_18_24: 1.2, age_25_34: 1.4, age_35_54: 1.3, age_55_64: 0.9, age_65_plus: 0.7 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.2, families_with_kids: 1.0, multi_gen_households: 0.8 },
    daytime_pull: { local_residents_share: 0.8, daily_commuters_share: 1.8, office_workers_share: 1.5, students_share: 1.1, tourists_share: 1.3 },
    segment_affinity: {
      beer: { mindful_moderators: 1.0, premium_crafters: 1.2, social_sessionists: 1.3, mainstream_loyalists: 1.1, value_seekers: 0.8 },
      beauty: { prestige_devotees: 0.9, clean_conscious: 1.1, experimental_trendsetters: 1.2, family_protectors: 1.0, low_maintenance_minimalists: 1.0 },
      home: { clean_living_advocates: 1.1, sensory_homemakers: 1.0, germ_defenders: 1.1, family_protectors: 1.0, functional_pragmatists: 1.1 }
    }
  },
  'Esso': {
    tier: 'forecourt',
    income_pull: { income_low: 1.0, income_mid: 1.1, income_high: 1.1 },
    age_pull: { age_18_24: 1.2, age_25_34: 1.3, age_35_54: 1.2, age_55_64: 0.9, age_65_plus: 0.7 },
    household_pull: { single_person: 1.3, couples_no_kids: 1.2, families_with_kids: 1.0, multi_gen_households: 0.8 },
    daytime_pull: { local_residents_share: 0.8, daily_commuters_share: 1.7, office_workers_share: 1.4, students_share: 1.1, tourists_share: 1.3 },
    segment_affinity: {
      beer: { mindful_moderators: 0.9, premium_crafters: 1.0, social_sessionists: 1.4, mainstream_loyalists: 1.2, value_seekers: 1.0 },
      beauty: { prestige_devotees: 0.8, clean_conscious: 1.0, experimental_trendsetters: 1.0, family_protectors: 1.0, low_maintenance_minimalists: 1.1 },
      home: { clean_living_advocates: 1.0, sensory_homemakers: 0.9, germ_defenders: 1.1, family_protectors: 1.0, functional_pragmatists: 1.2 }
    }
  },
  'EG Group': {
    tier: 'forecourt',
    income_pull: { income_low: 1.1, income_mid: 1.1, income_high: 1.0 },
    age_pull: { age_18_24: 1.2, age_25_34: 1.3, age_35_54: 1.2, age_55_64: 0.9, age_65_plus: 0.7 },
    household_pull: { single_person: 1.2, couples_no_kids: 1.1, families_with_kids: 1.0, multi_gen_households: 0.8 },
    daytime_pull: { local_residents_share: 0.9, daily_commuters_share: 1.6, office_workers_share: 1.4, students_share: 1.2, tourists_share: 1.2 },
    segment_affinity: {
      beer: { mindful_moderators: 0.9, premium_crafters: 1.0, social_sessionists: 1.4, mainstream_loyalists: 1.2, value_seekers: 1.0 },
      beauty: { prestige_devotees: 0.8, clean_conscious: 1.0, experimental_trendsetters: 1.0, family_protectors: 1.0, low_maintenance_minimalists: 1.1 },
      home: { clean_living_advocates: 1.0, sensory_homemakers: 0.9, germ_defenders: 1.1, family_protectors: 1.0, functional_pragmatists: 1.2 }
    }
  },

  // M&S FOOD (standalone stores)
  'M&S Food': {
    tier: 'premium',
    income_pull: { income_low: 0.4, income_mid: 0.9, income_high: 2.2 },
    age_pull: { age_18_24: 0.7, age_25_34: 1.2, age_35_54: 1.3, age_55_64: 1.3, age_65_plus: 1.2 },
    household_pull: { single_person: 1.2, couples_no_kids: 1.5, families_with_kids: 1.0, multi_gen_households: 0.8 },
    daytime_pull: { local_residents_share: 1.1, daily_commuters_share: 1.4, office_workers_share: 1.5, students_share: 0.8, tourists_share: 1.3 },
    segment_affinity: {
      beer: { mindful_moderators: 1.4, premium_crafters: 1.7, social_sessionists: 1.1, mainstream_loyalists: 0.9, value_seekers: 0.6 },
      beauty: { prestige_devotees: 1.9, clean_conscious: 1.4, experimental_trendsetters: 1.2, family_protectors: 1.0, low_maintenance_minimalists: 0.7 },
      home: { clean_living_advocates: 1.6, sensory_homemakers: 1.4, germ_defenders: 1.2, family_protectors: 1.0, functional_pragmatists: 0.8 }
    }
  }
};

// ═════════════════════════════════════════════════════════════════════════
// FORMAT MODIFIERS
// ═════════════════════════════════════════════════════════════════════════

const FORMAT_MODIFIERS = {
  'Hypermarket': {
    mission_pull: { main_shop: 2.5, top_up: 0.5, immediate_consumption: 0.3, convenience: 0.4 }
  },
  'Supermarket': {
    mission_pull: { main_shop: 1.8, top_up: 1.2, immediate_consumption: 0.7, convenience: 0.8 }
  },
  'Convenience': {
    mission_pull: { main_shop: 0.3, top_up: 1.8, immediate_consumption: 2.2, convenience: 2.5 }
  },
  'Discounter': {
    mission_pull: { main_shop: 2.0, top_up: 1.0, immediate_consumption: 0.4, convenience: 0.5 }
  },
  'Forecourt': {
    mission_pull: { main_shop: 0.1, top_up: 0.8, immediate_consumption: 3.0, convenience: 2.0 }
  },
  'Pharmacy': {
    mission_pull: { main_shop: 0.2, top_up: 1.5, immediate_consumption: 1.8, convenience: 2.0 }
  }
};

// ═════════════════════════════════════════════════════════════════════════
// CONTEXT MODIFIERS
// ═════════════════════════════════════════════════════════════════════════

const CONTEXT_MODIFIERS = {
  'transit': {
    daytime_boost: { local_residents_share: 0.7, daily_commuters_share: 1.8, office_workers_share: 1.5, students_share: 1.6, tourists_share: 2.0 },
    mission_shift: { main_shop: 0.4, top_up: 1.1, immediate_consumption: 1.8, convenience: 1.6 }
  },
  'residential': {
    daytime_boost: { local_residents_share: 1.5, daily_commuters_share: 0.8, office_workers_share: 0.7, students_share: 1.0, tourists_share: 0.6 },
    mission_shift: { main_shop: 1.4, top_up: 1.2, immediate_consumption: 0.7, convenience: 0.8 }
  },
  'office_core': {
    daytime_boost: { local_residents_share: 0.6, daily_commuters_share: 1.4, office_workers_share: 2.0, students_share: 0.9, tourists_share: 1.1 },
    mission_shift: { main_shop: 0.5, top_up: 1.1, immediate_consumption: 1.5, convenience: 1.8 }
  },
  'mixed': {
    daytime_boost: { local_residents_share: 1.0, daily_commuters_share: 1.0, office_workers_share: 1.0, students_share: 1.0, tourists_share: 1.0 },
    mission_shift: { main_shop: 1.0, top_up: 1.0, immediate_consumption: 1.0, convenience: 1.0 }
  }
};

// ═════════════════════════════════════════════════════════════════════════
// COMPETITION DAMPENING
// ═════════════════════════════════════════════════════════════════════════

function competitionDampening(store) {
  const competitorCount = store.nearby_competition.filter(c => c.distance < 400).length;

  if (competitorCount === 0) return 1.2;      // Monopoly boost
  if (competitorCount === 1) return 1.0;      // Normal
  if (competitorCount === 2) return 0.85;
  if (competitorCount >= 3) return 0.70;      // Heavy competition

  return 1.0;
}

// ═════════════════════════════════════════════════════════════════════════
// CORE ATTRACTION CALCULATION
// ═════════════════════════════════════════════════════════════════════════

function calculateStoreAttraction(store, clusterDemo, clusterSegments, clusterMissions) {
  const retailerProfile = RETAILER_POSITIONING[store.retailer];
  if (!retailerProfile) {
    console.warn(`Unknown retailer: ${store.retailer}`);
    return null;
  }

  const formatProfile = FORMAT_MODIFIERS[store.format];
  if (!formatProfile) {
    console.warn(`Unknown format: ${store.format}`);
    return null;
  }

  const contextProfile = CONTEXT_MODIFIERS[store.store_context];
  if (!contextProfile) {
    console.warn(`Unknown context: ${store.store_context}`);
    return null;
  }

  const compDampening = competitionDampening(store);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. DEMOGRAPHICS
  // ─────────────────────────────────────────────────────────────────────────

  const attractedDemographics = {};

  // Income
  for (const incomeKey of ['income_low', 'income_mid', 'income_high']) {
    attractedDemographics[incomeKey] =
      clusterDemo[incomeKey] *
      retailerProfile.income_pull[incomeKey] *
      compDampening;
  }

  // Age
  for (const ageKey of ['age_18_24', 'age_25_34', 'age_35_54', 'age_55_64', 'age_65_plus']) {
    attractedDemographics[ageKey] =
      clusterDemo[ageKey] *
      retailerProfile.age_pull[ageKey] *
      compDampening;
  }

  // Household
  for (const hhKey of ['single_person', 'couples_no_kids', 'families_with_kids', 'multi_gen_households']) {
    attractedDemographics[hhKey] =
      clusterDemo[hhKey] *
      retailerProfile.household_pull[hhKey] *
      compDampening;
  }

  // Daytime population (with context boost)
  for (const dayKey of ['local_residents_share', 'daily_commuters_share', 'office_workers_share', 'students_share', 'tourists_share']) {
    attractedDemographics[dayKey] =
      clusterDemo[dayKey] *
      retailerProfile.daytime_pull[dayKey] *
      contextProfile.daytime_boost[dayKey] *
      compDampening;
  }

  // Density + land use (pass through with dampening)
  attractedDemographics.density_index = clusterDemo.density_index * compDampening;
  for (const landKey of ['land_use_office', 'land_use_residential', 'land_use_transit', 'land_use_retail']) {
    attractedDemographics[landKey] = clusterDemo[landKey] * compDampening;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. SEGMENTS (all 3 categories)
  // ─────────────────────────────────────────────────────────────────────────

  const attractedSegments = { beer: {}, beauty: {}, home: {} };

  for (const category of ['beer', 'beauty', 'home']) {
    for (const [segment, baseProb] of Object.entries(clusterSegments[category])) {
      const affinity = retailerProfile.segment_affinity[category]?.[segment] || 1.0;
      attractedSegments[category][segment] = baseProb * affinity * compDampening;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. MISSIONS
  // ─────────────────────────────────────────────────────────────────────────

  const attractedMissions = {};

  for (const [mission, baseProb] of Object.entries(clusterMissions)) {
    attractedMissions[mission] =
      baseProb *
      formatProfile.mission_pull[mission] *
      contextProfile.mission_shift[mission] *
      compDampening;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. RAW ATTRACTION SCORE (sum of all demographics + segments)
  // ─────────────────────────────────────────────────────────────────────────

  let rawScore = 0;

  // Sum demographics
  for (const val of Object.values(attractedDemographics)) {
    rawScore += val;
  }

  // Sum segments
  for (const category of ['beer', 'beauty', 'home']) {
    for (const val of Object.values(attractedSegments[category])) {
      rawScore += val;
    }
  }

  return {
    store_id: store.store_id,
    cluster_id: store.cluster_id,
    attracted_demographics: attractedDemographics,
    attracted_segments: attractedSegments,
    attracted_missions: attractedMissions,
    raw_attraction_score: rawScore
  };
}

// ═════════════════════════════════════════════════════════════════════════
// NORMALIZE WITHIN CLUSTER
// ═════════════════════════════════════════════════════════════════════════

function normalizeCluster(clusterStores) {
  const totalAttraction = clusterStores.reduce((sum, s) => sum + s.raw_attraction_score, 0);

  if (totalAttraction === 0) {
    console.warn(`Cluster ${clusterStores[0].cluster_id} has zero total attraction`);
    return;
  }

  clusterStores.forEach(store => {
    const share = store.raw_attraction_score / totalAttraction;
    store.cluster_share = parseFloat(share.toFixed(4));

    // Normalize demographics
    for (const [key, value] of Object.entries(store.attracted_demographics)) {
      store.attracted_demographics[key] = parseFloat((value * share).toFixed(4));
    }

    // Normalize segments
    for (const category of ['beer', 'beauty', 'home']) {
      for (const [segment, value] of Object.entries(store.attracted_segments[category])) {
        store.attracted_segments[category][segment] = parseFloat((value * share).toFixed(4));
      }
    }

    // Normalize missions
    for (const [mission, value] of Object.entries(store.attracted_missions)) {
      store.attracted_missions[mission] = parseFloat((value * share).toFixed(4));
    }

    // Remove raw_attraction_score from final output
    delete store.raw_attraction_score;
  });
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN GENERATION
// ═════════════════════════════════════════════════════════════════════════

function generateFile3() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('GENERATING FILE 3: 3-store-attraction.json');
  console.log('═══════════════════════════════════════════════════\n');

  // Load inputs
  const file1Path = path.join(__dirname, '../data/1-stores.json');
  const file2Path = path.join(__dirname, '../data/2-cluster-population.json');
  const file2bPath = path.join(__dirname, '../data/2b-cluster-segments.json');

  const stores = JSON.parse(fs.readFileSync(file1Path, 'utf-8'));
  const clusterPopulation = JSON.parse(fs.readFileSync(file2Path, 'utf-8'));
  const clusterSegments = JSON.parse(fs.readFileSync(file2bPath, 'utf-8'));

  console.log(`✅ Loaded ${stores.length} stores`);
  console.log(`✅ Loaded ${clusterPopulation.length} cluster demographics`);
  console.log(`✅ Loaded ${clusterSegments.length} cluster segments\n`);

  // Create lookup maps
  const clusterDemoMap = {};
  clusterPopulation.forEach(c => {
    clusterDemoMap[c.cluster_id] = c;
  });

  const clusterSegmentMap = {};
  clusterSegments.forEach(c => {
    clusterSegmentMap[c.cluster_id] = c.segments;
  });

  // Group stores by cluster
  const storesByCluster = {};
  stores.forEach(store => {
    if (!storesByCluster[store.cluster_id]) {
      storesByCluster[store.cluster_id] = [];
    }
    storesByCluster[store.cluster_id].push(store);
  });

  console.log(`📊 ${Object.keys(storesByCluster).length} clusters with stores\n`);

  // Generate attraction for each store
  const allAttractions = [];
  let processed = 0;

  for (const [clusterId, clusterStores] of Object.entries(storesByCluster)) {
    const clusterDemo = clusterDemoMap[clusterId];
    const clusterSegs = clusterSegmentMap[clusterId];

    if (!clusterDemo) {
      console.warn(`Missing demographics for ${clusterId}`);
      continue;
    }
    if (!clusterSegs) {
      console.warn(`Missing segments for ${clusterId}`);
      continue;
    }

    const clusterMissions = clusterDemo.mission_mix;
    const clusterDemographics = clusterDemo.demographic_mix;

    // Calculate attraction for each store in cluster
    const clusterAttractions = [];
    for (const store of clusterStores) {
      const attraction = calculateStoreAttraction(store, clusterDemographics, clusterSegs, clusterMissions);
      if (attraction) {
        clusterAttractions.push(attraction);
      }
    }

    // Normalize within cluster
    if (clusterAttractions.length > 0) {
      normalizeCluster(clusterAttractions);
      allAttractions.push(...clusterAttractions);
    }

    processed++;
    if (processed % 10 === 0) {
      console.log(`Processed ${processed}/${Object.keys(storesByCluster).length} clusters...`);
    }
  }

  console.log(`\n✅ Generated attraction for ${allAttractions.length} stores\n`);

  // Write output
  const outputPath = path.join(__dirname, '../data/3-store-attraction.json');
  fs.writeFileSync(outputPath, JSON.stringify(allAttractions, null, 2));

  const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`📁 Wrote: data/3-store-attraction.json (${fileSizeMB} MB)`);
  console.log(`📊 Total stores: ${allAttractions.length}\n`);

  return allAttractions;
}

// ═════════════════════════════════════════════════════════════════════════
// RUN
// ═════════════════════════════════════════════════════════════════════════

generateFile3();
