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

export type EpochId =
  | "stone"
  | "bronze"
  | "iron"
  | "medieval"
  | "industrial"
  | "modern"
  | "future";

export type WorkerRole = "gatherer" | "lumberjack" | "miner" | "scholar";

export const RESOURCES: Record<ResourceId, { label: string; icon: string }> = {
  food: { label: "Food", icon: "🍖" },
  wood: { label: "Wood", icon: "🪵" },
  stone: { label: "Stone", icon: "🪨" },
  clay: { label: "Clay", icon: "🧱" },
  skins: { label: "Skins", icon: "🦌" },
  metal: { label: "Metal", icon: "⛓️" },
  coal: { label: "Coal", icon: "🪨" },
  energy: { label: "Energy", icon: "⚡" },
  science: { label: "Science", icon: "🔬" },
  gold: { label: "Gold", icon: "🪙" },
  population: { label: "Population", icon: "👥" },
  influence: { label: "Influence", icon: "🏛️" }
};

export const EPOCHS: Record<EpochId, { name: string; bonus: string }> = {
  stone: { name: "Stone Age", bonus: "Survival basics" },
  bronze: { name: "Bronze Age", bonus: "+10% production" },
  iron: { name: "Iron Age", bonus: "+20% production" },
  medieval: { name: "Medieval", bonus: "+35% production" },
  industrial: { name: "Industrial", bonus: "+50% production" },
  modern: { name: "Modern", bonus: "+70% production" },
  future: { name: "Future", bonus: "+110% production" }
};

export const BUILDINGS: Record<BuildingId, { name: string; description: string }> = {
  hut: { name: "Hut", description: "Increases population capacity" },
  lumber_camp: { name: "Lumber Camp", description: "Produces wood" },
  quarry: { name: "Quarry", description: "Produces stone" },
  clay_pit: { name: "Clay Pit", description: "Produces clay" },
  tannery: { name: "Tannery", description: "Produces skins and gold" },
  mine: { name: "Mine", description: "Produces metal and coal" },
  furnace: { name: "Furnace", description: "Refines metal" },
  workshop: { name: "Workshop", description: "Produces gold and influence" },
  library: { name: "Library", description: "Produces science" },
  power_plant: { name: "Power Plant", description: "Produces energy" }
};

export const TECHS: Record<TechId, { name: string; description: string }> = {
  stone_tools: { name: "Stone Tools", description: "Gathering efficiency" },
  fire_control: { name: "Fire Control", description: "Improves click gain" },
  agriculture: { name: "Agriculture", description: "Food growth" },
  bronze_working: { name: "Bronze Working", description: "Unlocks bronze era" },
  iron_working: { name: "Iron Working", description: "Stronger alloys" },
  guilds: { name: "Guilds", description: "Labor specialization" },
  steam_power: { name: "Steam Power", description: "Mechanization" },
  electrification: { name: "Electrification", description: "Energy boost" },
  automation: { name: "Automation", description: "Faster progress" },
  quantum_research: { name: "Quantum Research", description: "Futuristic tech" }
};

export const WORKERS: Record<WorkerRole, { name: string; description: string }> = {
  gatherer: { name: "Gatherers", description: "Food output" },
  lumberjack: { name: "Lumberjacks", description: "Wood output" },
  miner: { name: "Miners", description: "Stone/metal output" },
  scholar: { name: "Scholars", description: "Science output" }
};
