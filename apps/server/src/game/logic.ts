import {
  BUILDINGS,
  CLICK_BASE,
  CLICK_RATE_LIMIT,
  EPOCHS,
  MAX_OFFLINE_SECONDS,
  RESOURCES,
  TECHS,
  WORKER_EFFECTS,
  type BuildingId,
  type EpochId,
  type ResourceId,
  type TechId,
  type WorkerRole
} from "./config.js";

export type ResourceState = Record<ResourceId, { amount: number; cap: number }>;
export type BuildingState = Record<BuildingId, number>;
export type TechState = Record<TechId, boolean>;
export type WorkerState = Record<WorkerRole, number>;
export type MetaState = {
  clickWindowStart: number;
  clickCount: number;
};

export type GameState = {
  epoch: EpochId;
  resources: ResourceState;
  buildings: BuildingState;
  techs: TechState;
  workers: WorkerState;
  meta: MetaState;
  lastSyncAt: string;
};

const emptyBuildings = (): BuildingState =>
  Object.keys(BUILDINGS).reduce((acc, key) => {
    acc[key as BuildingId] = 0;
    return acc;
  }, {} as BuildingState);

const emptyTechs = (): TechState =>
  Object.keys(TECHS).reduce((acc, key) => {
    acc[key as TechId] = false;
    return acc;
  }, {} as TechState);

const emptyWorkers = (): WorkerState => ({
  gatherer: 2,
  lumberjack: 1,
  miner: 0,
  scholar: 0
});

export const createInitialState = (): GameState => {
  const resources = Object.entries(RESOURCES).reduce((acc, [key, value]) => {
    acc[key as ResourceId] = { amount: 0, cap: value.baseCap };
    return acc;
  }, {} as ResourceState);

  resources.food.amount = 40;
  resources.wood.amount = 30;
  resources.stone.amount = 20;
  resources.population.amount = 6;

  return {
    epoch: "stone",
    resources,
    buildings: emptyBuildings(),
    techs: emptyTechs(),
    workers: emptyWorkers(),
    meta: { clickWindowStart: Date.now(), clickCount: 0 },
    lastSyncAt: new Date().toISOString()
  };
};

const getEpochMultiplier = (epoch: EpochId) =>
  EPOCHS.find((item) => item.id === epoch)?.multiplier ?? 1;

const getTechMultiplier = (techs: TechState) => {
  return Object.entries(techs).reduce((multiplier, [techId, unlocked]) => {
    if (!unlocked) return multiplier;
    const bonus = TECHS[techId as TechId].bonus.productionMultiplier ?? 1;
    return multiplier * bonus;
  }, 1);
};

const getClickBonus = (techs: TechState) => {
  return Object.entries(techs).reduce((bonus, [techId, unlocked]) => {
    if (!unlocked) return bonus;
    return bonus + (TECHS[techId as TechId].bonus.clickBonus ?? 0);
  }, 0);
};

const clampResource = (state: GameState, resourceId: ResourceId) => {
  const resource = state.resources[resourceId];
  resource.amount = Math.min(resource.amount, resource.cap);
  if (resource.amount < 0) resource.amount = 0;
};

export const updateCaps = (state: GameState) => {
  Object.entries(RESOURCES).forEach(([resourceId, config]) => {
    state.resources[resourceId as ResourceId].cap = config.baseCap;
  });

  Object.entries(state.buildings).forEach(([buildingId, level]) => {
    if (level <= 0) return;
    const building = BUILDINGS[buildingId as BuildingId];
    Object.entries(building.capacity).forEach(([resourceId, cap]) => {
      state.resources[resourceId as ResourceId].cap += cap * level;
    });
  });

  Object.keys(state.resources).forEach((resourceId) => {
    clampResource(state, resourceId as ResourceId);
  });
};

export const computeProduction = (state: GameState) => {
  const production: Partial<Record<ResourceId, number>> = {};

  Object.entries(state.buildings).forEach(([buildingId, level]) => {
    if (level <= 0) return;
    const building = BUILDINGS[buildingId as BuildingId];
    Object.entries(building.production).forEach(([resourceId, perSec]) => {
      production[resourceId as ResourceId] =
        (production[resourceId as ResourceId] ?? 0) + perSec * level;
    });
  });

  Object.entries(state.workers).forEach(([role, count]) => {
    const effects = WORKER_EFFECTS[role as WorkerRole];
    Object.entries(effects).forEach(([resourceId, perSec]) => {
      production[resourceId as ResourceId] =
        (production[resourceId as ResourceId] ?? 0) + perSec * count;
    });
  });

  const epochMultiplier = getEpochMultiplier(state.epoch);
  const techMultiplier = getTechMultiplier(state.techs);

  Object.keys(production).forEach((resourceId) => {
    production[resourceId as ResourceId] =
      (production[resourceId as ResourceId] ?? 0) * epochMultiplier * techMultiplier;
  });

  return production;
};

export const addResources = (state: GameState, deltas: Partial<Record<ResourceId, number>>) => {
  Object.entries(deltas).forEach(([resourceId, amount]) => {
    const resource = state.resources[resourceId as ResourceId];
    resource.amount += amount ?? 0;
    clampResource(state, resourceId as ResourceId);
  });
};

export const canAfford = (state: GameState, cost: Partial<Record<ResourceId, number>>) => {
  return Object.entries(cost).every(([resourceId, amount]) => {
    return state.resources[resourceId as ResourceId].amount >= (amount ?? 0);
  });
};

export const spendResources = (state: GameState, cost: Partial<Record<ResourceId, number>>) => {
  Object.entries(cost).forEach(([resourceId, amount]) => {
    state.resources[resourceId as ResourceId].amount -= amount ?? 0;
    clampResource(state, resourceId as ResourceId);
  });
};

export const applyOfflineProgress = (state: GameState, now: Date) => {
  updateCaps(state);
  const lastSync = new Date(state.lastSyncAt).getTime();
  const elapsedSeconds = Math.min(
    MAX_OFFLINE_SECONDS,
    Math.max(0, Math.floor((now.getTime() - lastSync) / 1000))
  );

  if (elapsedSeconds <= 0) {
    state.lastSyncAt = now.toISOString();
    return { elapsedSeconds, production: {} as Partial<Record<ResourceId, number>> };
  }

  const production = computeProduction(state);
  Object.entries(production).forEach(([resourceId, perSec]) => {
    const gained = (perSec ?? 0) * elapsedSeconds;
    state.resources[resourceId as ResourceId].amount += gained;
    clampResource(state, resourceId as ResourceId);
  });

  state.lastSyncAt = now.toISOString();
  return { elapsedSeconds, production };
};

export const applyClick = (state: GameState, now: number) => {
  const { windowMs, maxClicks } = CLICK_RATE_LIMIT;
  if (now - state.meta.clickWindowStart > windowMs) {
    state.meta.clickWindowStart = now;
    state.meta.clickCount = 0;
  }

  if (state.meta.clickCount >= maxClicks) {
    return { allowed: false, message: "Too many clicks" };
  }

  state.meta.clickCount += 1;
  const epochBase = CLICK_BASE[state.epoch] ?? 1;
  const clickGain = epochBase + getClickBonus(state.techs);

  state.resources.food.amount += clickGain;
  clampResource(state, "food");

  return { allowed: true, clickGain };
};

export const getNextEpoch = (epoch: EpochId) => {
  const index = EPOCHS.findIndex((item) => item.id === epoch);
  return EPOCHS[index + 1];
};

export const canAdvanceEpoch = (state: GameState) => {
  const next = getNextEpoch(state.epoch);
  if (!next) return { ok: false, reason: "No further epoch" };

  const techsReady = next.requirements.techs.every((tech) => state.techs[tech]);
  if (!techsReady) return { ok: false, reason: "Missing technologies" };

  const resourcesReady = Object.entries(next.requirements.resources).every(
    ([resourceId, amount]) => state.resources[resourceId as ResourceId].amount >= (amount ?? 0)
  );

  if (!resourcesReady) return { ok: false, reason: "Missing resources" };

  if (state.resources.population.amount < next.requirements.population) {
    return { ok: false, reason: "Population too low" };
  }

  return { ok: true, next };
};

export const build = (state: GameState, buildingId: BuildingId) => {
  const building = BUILDINGS[buildingId];
  if (!building) return { ok: false, reason: "Unknown building" };

  const currentEpochIndex = EPOCHS.findIndex((item) => item.id === state.epoch);
  const buildingEpochIndex = EPOCHS.findIndex((item) => item.id === building.epoch);
  if (buildingEpochIndex > currentEpochIndex) {
    return { ok: false, reason: "Building locked" };
  }

  const level = state.buildings[buildingId];
  const scaledCost = Object.fromEntries(
    Object.entries(building.cost).map(([resourceId, amount]) => [
      resourceId,
      Math.ceil((amount ?? 0) * Math.pow(1.15, level))
    ])
  ) as Partial<Record<ResourceId, number>>;

  if (!canAfford(state, scaledCost)) {
    return { ok: false, reason: "Not enough resources" };
  }

  spendResources(state, scaledCost);
  state.buildings[buildingId] = level + 1;
  return { ok: true, cost: scaledCost, newLevel: state.buildings[buildingId] };
};

export const research = (state: GameState, techId: TechId) => {
  const tech = TECHS[techId];
  if (!tech) return { ok: false, reason: "Unknown tech" };
  if (state.techs[techId]) return { ok: false, reason: "Already researched" };

  const currentEpochIndex = EPOCHS.findIndex((item) => item.id === state.epoch);
  const techEpochIndex = EPOCHS.findIndex((item) => item.id === tech.epoch);
  if (techEpochIndex > currentEpochIndex) return { ok: false, reason: "Tech locked" };

  const hasReqs = tech.requires.every((req) => state.techs[req]);
  if (!hasReqs) return { ok: false, reason: "Missing prerequisites" };

  if (!canAfford(state, tech.cost)) return { ok: false, reason: "Not enough resources" };

  spendResources(state, tech.cost);
  state.techs[techId] = true;
  return { ok: true };
};

export const assignWorkers = (state: GameState, assignments: WorkerState) => {
  const totalAssigned = Object.values(assignments).reduce((sum, value) => sum + value, 0);
  if (totalAssigned > Math.floor(state.resources.population.amount)) {
    return { ok: false, reason: "Not enough population" };
  }

  state.workers = assignments;
  return { ok: true };
};
