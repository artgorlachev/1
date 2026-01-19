export type ResourceId =
  | "food"
  | "wood"
  | "stone"
  | "clay"
  | "skins"
  | "metal"
  | "coal"
  | "energy"
  | "science"
  | "gold"
  | "population"
  | "influence";

export type BuildingId =
  | "hut"
  | "lumber_camp"
  | "quarry"
  | "clay_pit"
  | "tannery"
  | "mine"
  | "furnace"
  | "workshop"
  | "library"
  | "power_plant";

export type TechId =
  | "stone_tools"
  | "fire_control"
  | "agriculture"
  | "bronze_working"
  | "iron_working"
  | "guilds"
  | "steam_power"
  | "electrification"
  | "automation"
  | "quantum_research";

export type WorkerRole = "gatherer" | "lumberjack" | "miner" | "scholar";

export type EpochId =
  | "stone"
  | "bronze"
  | "iron"
  | "medieval"
  | "industrial"
  | "modern"
  | "future";

export const RESOURCES: Record<ResourceId, { label: string; baseCap: number }> = {
  food: { label: "Food", baseCap: 120 },
  wood: { label: "Wood", baseCap: 80 },
  stone: { label: "Stone", baseCap: 80 },
  clay: { label: "Clay", baseCap: 60 },
  skins: { label: "Skins", baseCap: 40 },
  metal: { label: "Metal", baseCap: 40 },
  coal: { label: "Coal", baseCap: 30 },
  energy: { label: "Energy", baseCap: 40 },
  science: { label: "Science", baseCap: 40 },
  gold: { label: "Gold", baseCap: 50 },
  population: { label: "Population", baseCap: 8 },
  influence: { label: "Influence", baseCap: 10 }
};

export const EPOCHS: Array<{
  id: EpochId;
  name: string;
  multiplier: number;
  requirements: {
    resources: Partial<Record<ResourceId, number>>;
    techs: TechId[];
    population: number;
  };
  bonus: string;
}> = [
  {
    id: "stone",
    name: "Stone Age",
    multiplier: 1,
    requirements: { resources: {}, techs: [], population: 0 },
    bonus: "Foundations of survival."
  },
  {
    id: "bronze",
    name: "Bronze Age",
    multiplier: 1.1,
    requirements: {
      resources: { food: 120, wood: 80, clay: 60, science: 40 },
      techs: ["agriculture"],
      population: 12
    },
    bonus: "+10% production, unlocks bronze buildings."
  },
  {
    id: "iron",
    name: "Iron Age",
    multiplier: 1.2,
    requirements: {
      resources: { food: 200, wood: 140, metal: 80, science: 80 },
      techs: ["bronze_working"],
      population: 18
    },
    bonus: "+20% production, stronger infrastructure."
  },
  {
    id: "medieval",
    name: "Medieval",
    multiplier: 1.35,
    requirements: {
      resources: { food: 320, gold: 120, stone: 180, science: 140 },
      techs: ["iron_working"],
      population: 26
    },
    bonus: "+35% production, guild economy."
  },
  {
    id: "industrial",
    name: "Industrial",
    multiplier: 1.5,
    requirements: {
      resources: { coal: 160, metal: 220, gold: 200, science: 220 },
      techs: ["guilds"],
      population: 36
    },
    bonus: "+50% production, power infrastructure."
  },
  {
    id: "modern",
    name: "Modern",
    multiplier: 1.7,
    requirements: {
      resources: { energy: 280, metal: 280, gold: 260, science: 360 },
      techs: ["steam_power"],
      population: 48
    },
    bonus: "+70% production, electrification era."
  },
  {
    id: "future",
    name: "Future",
    multiplier: 2.1,
    requirements: {
      resources: { energy: 500, science: 600, influence: 220 },
      techs: ["automation"],
      population: 60
    },
    bonus: "+110% production, futuristic tech."
  }
];

export const BUILDINGS: Record<BuildingId, {
  name: string;
  epoch: EpochId;
  cost: Partial<Record<ResourceId, number>>;
  production: Partial<Record<ResourceId, number>>;
  capacity: Partial<Record<ResourceId, number>>;
}> = {
  hut: {
    name: "Hut",
    epoch: "stone",
    cost: { wood: 20, skins: 10 },
    production: { population: 0.2 },
    capacity: { population: 4 }
  },
  lumber_camp: {
    name: "Lumber Camp",
    epoch: "stone",
    cost: { wood: 30, stone: 10 },
    production: { wood: 0.6 },
    capacity: { wood: 40 }
  },
  quarry: {
    name: "Quarry",
    epoch: "stone",
    cost: { wood: 25, stone: 15 },
    production: { stone: 0.5 },
    capacity: { stone: 40 }
  },
  clay_pit: {
    name: "Clay Pit",
    epoch: "stone",
    cost: { wood: 20, stone: 10 },
    production: { clay: 0.4 },
    capacity: { clay: 30 }
  },
  tannery: {
    name: "Tannery",
    epoch: "bronze",
    cost: { wood: 30, clay: 20, food: 40 },
    production: { skins: 0.3, gold: 0.1 },
    capacity: { skins: 20 }
  },
  mine: {
    name: "Mine",
    epoch: "bronze",
    cost: { wood: 50, stone: 30, clay: 20 },
    production: { metal: 0.4, coal: 0.2 },
    capacity: { metal: 30, coal: 30 }
  },
  furnace: {
    name: "Furnace",
    epoch: "iron",
    cost: { stone: 60, metal: 40, coal: 30 },
    production: { metal: 0.6 },
    capacity: { metal: 50 }
  },
  workshop: {
    name: "Workshop",
    epoch: "medieval",
    cost: { wood: 80, metal: 50, gold: 30 },
    production: { gold: 0.4, influence: 0.1 },
    capacity: { gold: 40 }
  },
  library: {
    name: "Library",
    epoch: "medieval",
    cost: { wood: 60, stone: 50, gold: 40 },
    production: { science: 0.6 },
    capacity: { science: 40 }
  },
  power_plant: {
    name: "Power Plant",
    epoch: "industrial",
    cost: { metal: 120, coal: 80, gold: 60 },
    production: { energy: 1.2 },
    capacity: { energy: 80 }
  }
};

export const TECHS: Record<TechId, {
  name: string;
  epoch: EpochId;
  cost: Partial<Record<ResourceId, number>>;
  requires: TechId[];
  description: string;
  bonus: {
    productionMultiplier?: number;
    clickBonus?: number;
  };
}> = {
  stone_tools: {
    name: "Stone Tools",
    epoch: "stone",
    cost: { food: 40, wood: 30, stone: 20 },
    requires: [],
    description: "Improves gathering efficiency.",
    bonus: { productionMultiplier: 1.05 }
  },
  fire_control: {
    name: "Fire Control",
    epoch: "stone",
    cost: { wood: 50, stone: 30, science: 10 },
    requires: ["stone_tools"],
    description: "Unlocks better processing and warmth.",
    bonus: { clickBonus: 1 }
  },
  agriculture: {
    name: "Agriculture",
    epoch: "stone",
    cost: { food: 80, wood: 60, science: 30 },
    requires: ["fire_control"],
    description: "Farming boosts food growth.",
    bonus: { productionMultiplier: 1.1 }
  },
  bronze_working: {
    name: "Bronze Working",
    epoch: "bronze",
    cost: { metal: 60, clay: 40, science: 60 },
    requires: ["agriculture"],
    description: "Unlocks bronze tools and mining upgrades.",
    bonus: { productionMultiplier: 1.1 }
  },
  iron_working: {
    name: "Iron Working",
    epoch: "iron",
    cost: { metal: 120, coal: 50, science: 120 },
    requires: ["bronze_working"],
    description: "Stronger alloys and infrastructure.",
    bonus: { productionMultiplier: 1.12 }
  },
  guilds: {
    name: "Guilds",
    epoch: "medieval",
    cost: { gold: 140, science: 160, influence: 40 },
    requires: ["iron_working"],
    description: "Specialized labor boosts output.",
    bonus: { productionMultiplier: 1.15 }
  },
  steam_power: {
    name: "Steam Power",
    epoch: "industrial",
    cost: { coal: 160, metal: 180, science: 220 },
    requires: ["guilds"],
    description: "Mechanization increases production.",
    bonus: { productionMultiplier: 1.2 }
  },
  electrification: {
    name: "Electrification",
    epoch: "modern",
    cost: { energy: 200, science: 260, gold: 140 },
    requires: ["steam_power"],
    description: "Unlocks higher energy output.",
    bonus: { productionMultiplier: 1.25 }
  },
  automation: {
    name: "Automation",
    epoch: "modern",
    cost: { energy: 260, science: 340, influence: 120 },
    requires: ["electrification"],
    description: "Automated systems boost clicks and passive gains.",
    bonus: { productionMultiplier: 1.3, clickBonus: 2 }
  },
  quantum_research: {
    name: "Quantum Research",
    epoch: "future",
    cost: { energy: 360, science: 500, influence: 220 },
    requires: ["automation"],
    description: "Futuristic breakthroughs.",
    bonus: { productionMultiplier: 1.4 }
  }
};

export const WORKER_EFFECTS: Record<WorkerRole, Partial<Record<ResourceId, number>>> = {
  gatherer: { food: 0.12 },
  lumberjack: { wood: 0.1 },
  miner: { stone: 0.08, metal: 0.05, coal: 0.04 },
  scholar: { science: 0.08, influence: 0.02 }
};

export const CLICK_BASE: Record<EpochId, number> = {
  stone: 1,
  bronze: 2,
  iron: 3,
  medieval: 4,
  industrial: 5,
  modern: 6,
  future: 8
};

export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
export const CLICK_RATE_LIMIT = { windowMs: 1000, maxClicks: 5 };
