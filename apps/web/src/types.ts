import type { BuildingId, EpochId, ResourceId, TechId, WorkerRole } from "./data/game";

export type ResourceState = Record<ResourceId, { amount: number; cap: number }>;
export type BuildingState = Record<BuildingId, number>;
export type TechState = Record<TechId, boolean>;
export type WorkerState = Record<WorkerRole, number>;

export type GameState = {
  epoch: EpochId;
  resources: ResourceState;
  buildings: BuildingState;
  techs: TechState;
  workers: WorkerState;
  lastSyncAt: string;
};
