import { describe, expect, it } from "vitest";
import { applyOfflineProgress, computeProduction, createInitialState, updateCaps } from "./logic.js";

describe("game logic", () => {
  it("computes production and offline progress", () => {
    const state = createInitialState();
    state.buildings.hut = 1;
    state.buildings.lumber_camp = 1;
    updateCaps(state);

    const production = computeProduction(state);
    expect(production.wood).toBeGreaterThan(0);

    const now = new Date(Date.now() + 2000);
    const progress = applyOfflineProgress(state, now);
    expect(progress.elapsedSeconds).toBeGreaterThan(0);
    expect(state.resources.wood.amount).toBeGreaterThan(0);
  });
});
