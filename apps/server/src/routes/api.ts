import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { verifyTelegramInitData } from "../utils/telegramAuth.js";
import {
  applyClick,
  applyOfflineProgress,
  assignWorkers,
  build,
  canAdvanceEpoch,
  createInitialState,
  research,
  updateCaps,
  type GameState,
  type WorkerState
} from "../game/logic.js";
import { EPOCHS, type BuildingId, type TechId } from "../game/config.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";

export const apiRouter = Router();

const actionSchema = z.object({
  type: z.enum(["click", "build", "research", "assignWorkers", "advanceEpoch", "sync"]),
  payload: z.record(z.any()).optional()
});

const serializeState = (state: GameState) => ({
  ...state,
  lastSyncAt: state.lastSyncAt
});

const recordEvent = async (userId: string, type: string, payload: unknown) => {
  await prisma.event.create({
    data: {
      userId,
      type,
      payload
    }
  });
};

apiRouter.post("/auth/telegram", async (req, res) => {
  const botToken = process.env.BOT_TOKEN;
  const jwtSecret = process.env.JWT_SECRET;
  if (!botToken || !jwtSecret) {
    res.status(500).json({ error: "Missing server configuration" });
    return;
  }

  const initData = req.body?.initData as string | undefined;
  if (!initData) {
    res.status(400).json({ error: "initData required" });
    return;
  }

  const verification = verifyTelegramInitData(initData, botToken);
  if (!verification.ok) {
    res.status(401).json({ error: verification.reason });
    return;
  }

  const telegramId = String(verification.user.id);
  const existingUser = await prisma.user.findUnique({
    where: { telegramId },
    include: { state: true }
  });

  let user = existingUser;
  let state = existingUser?.state;

  if (!user) {
    const initialState = createInitialState();
    user = await prisma.user.create({
      data: {
        telegramId,
        username: verification.user.username,
        firstName: verification.user.first_name,
        lastName: verification.user.last_name,
        state: {
          create: {
            epoch: initialState.epoch,
            resources: initialState.resources,
            buildings: initialState.buildings,
            techs: initialState.techs,
            workers: initialState.workers,
            meta: initialState.meta,
            lastSyncAt: new Date(initialState.lastSyncAt)
          }
        }
      },
      include: { state: true }
    });
    state = user.state;
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: verification.user.username,
        firstName: verification.user.first_name,
        lastName: verification.user.last_name
      },
      include: { state: true }
    });
    state = user.state;
  }

  if (!state) {
    res.status(500).json({ error: "State missing" });
    return;
  }

  const parsedState: GameState = {
    epoch: state.epoch as GameState["epoch"],
    resources: state.resources as GameState["resources"],
    buildings: state.buildings as GameState["buildings"],
    techs: state.techs as GameState["techs"],
    workers: state.workers as GameState["workers"],
    meta: state.meta as GameState["meta"],
    lastSyncAt: state.lastSyncAt.toISOString()
  };

  const progress = applyOfflineProgress(parsedState, new Date());

  await prisma.state.update({
    where: { id: state.id },
    data: {
      epoch: parsedState.epoch,
      resources: parsedState.resources,
      buildings: parsedState.buildings,
      techs: parsedState.techs,
      workers: parsedState.workers,
      meta: parsedState.meta,
      lastSyncAt: new Date(parsedState.lastSyncAt)
    }
  });

  const token = jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: "7d" });

  res.json({
    token,
    profile: {
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName
    },
    state: serializeState(parsedState),
    offline: progress
  });
});

apiRouter.get("/bot/profile", async (req, res) => {
  const token = req.headers["x-bot-token"] as string | undefined;
  if (!token || token !== process.env.BOT_API_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const telegramId = req.query.telegramId as string | undefined;
  if (!telegramId) {
    res.status(400).json({ error: "telegramId required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: { state: true }
  });

  if (!user?.state) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const state = user.state;
  const epoch = EPOCHS.find((item) => item.id === state.epoch);

  res.json({
    epoch: epoch?.name ?? state.epoch,
    resources: state.resources
  });
});

apiRouter.get("/admin/users", async (req, res) => {
  const token = req.headers["x-admin-token"] as string | undefined;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const users = await prisma.user.findMany({
    include: { state: true },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    users: users.map((user) => ({
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      epoch: user.state?.epoch ?? "unknown",
      createdAt: user.createdAt
    }))
  });
});

apiRouter.use(authMiddleware);

apiRouter.get("/state", async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { state: true }
  });

  if (!user?.state) {
    res.status(404).json({ error: "State not found" });
    return;
  }

  const parsedState: GameState = {
    epoch: user.state.epoch as GameState["epoch"],
    resources: user.state.resources as GameState["resources"],
    buildings: user.state.buildings as GameState["buildings"],
    techs: user.state.techs as GameState["techs"],
    workers: user.state.workers as GameState["workers"],
    meta: user.state.meta as GameState["meta"],
    lastSyncAt: user.state.lastSyncAt.toISOString()
  };

  const progress = applyOfflineProgress(parsedState, new Date());

  await prisma.state.update({
    where: { id: user.state.id },
    data: {
      epoch: parsedState.epoch,
      resources: parsedState.resources,
      buildings: parsedState.buildings,
      techs: parsedState.techs,
      workers: parsedState.workers,
      meta: parsedState.meta,
      lastSyncAt: new Date(parsedState.lastSyncAt)
    }
  });

  res.json({ state: serializeState(parsedState), offline: progress });
});

apiRouter.post("/action", async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { state: true }
  });

  if (!user?.state) {
    res.status(404).json({ error: "State missing" });
    return;
  }

  const state: GameState = {
    epoch: user.state.epoch as GameState["epoch"],
    resources: user.state.resources as GameState["resources"],
    buildings: user.state.buildings as GameState["buildings"],
    techs: user.state.techs as GameState["techs"],
    workers: user.state.workers as GameState["workers"],
    meta: user.state.meta as GameState["meta"],
    lastSyncAt: user.state.lastSyncAt.toISOString()
  };

  applyOfflineProgress(state, new Date());

  let result: Record<string, unknown> = {};

  switch (parsed.data.type) {
    case "click": {
      const click = applyClick(state, Date.now());
      if (!click.allowed) {
        res.status(429).json({ error: click.message });
        return;
      }
      result = click;
      await recordEvent(userId, "click", { clickGain: click.clickGain });
      break;
    }
    case "build": {
      const buildingId = parsed.data.payload?.buildingId as BuildingId | undefined;
      if (!buildingId) {
        res.status(400).json({ error: "buildingId required" });
        return;
      }
      const outcome = build(state, buildingId);
      if (!outcome.ok) {
        res.status(400).json({ error: outcome.reason });
        return;
      }
      result = outcome;
      await recordEvent(userId, "build", { buildingId, level: outcome.newLevel });
      break;
    }
    case "research": {
      const techId = parsed.data.payload?.techId as TechId | undefined;
      if (!techId) {
        res.status(400).json({ error: "techId required" });
        return;
      }
      const outcome = research(state, techId);
      if (!outcome.ok) {
        res.status(400).json({ error: outcome.reason });
        return;
      }
      result = outcome;
      await recordEvent(userId, "research", { techId });
      break;
    }
    case "assignWorkers": {
      const assignments = parsed.data.payload?.workers as WorkerState;
      if (!assignments) {
        res.status(400).json({ error: "Workers required" });
        return;
      }
      const outcome = assignWorkers(state, assignments);
      if (!outcome.ok) {
        res.status(400).json({ error: outcome.reason });
        return;
      }
      result = outcome;
      await recordEvent(userId, "assignWorkers", assignments);
      break;
    }
    case "advanceEpoch": {
      const outcome = canAdvanceEpoch(state);
      if (!outcome.ok || !outcome.next) {
        res.status(400).json({ error: outcome.reason });
        return;
      }
      const next = outcome.next;
      state.epoch = next.id;
      updateCaps(state);
      result = { epoch: next };
      await recordEvent(userId, "advanceEpoch", { epoch: next.id });
      break;
    }
    case "sync": {
      updateCaps(state);
      result = { ok: true };
      break;
    }
    default:
      res.status(400).json({ error: "Unsupported action" });
      return;
  }

  updateCaps(state);

  await prisma.state.update({
    where: { id: user.state.id },
    data: {
      epoch: state.epoch,
      resources: state.resources,
      buildings: state.buildings,
      techs: state.techs,
      workers: state.workers,
      meta: state.meta,
      lastSyncAt: new Date(state.lastSyncAt)
    }
  });

  res.json({ state: serializeState(state), result });
});

apiRouter.post("/reset", async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const initial = createInitialState();

  const state = await prisma.state.findUnique({
    where: { userId }
  });

  if (!state) {
    res.status(404).json({ error: "State missing" });
    return;
  }

  await prisma.state.update({
    where: { id: state.id },
    data: {
      epoch: initial.epoch,
      resources: initial.resources,
      buildings: initial.buildings,
      techs: initial.techs,
      workers: initial.workers,
      meta: initial.meta,
      lastSyncAt: new Date(initial.lastSyncAt)
    }
  });

  await recordEvent(userId, "reset", {});

  res.json({ state: serializeState(initial) });
});
