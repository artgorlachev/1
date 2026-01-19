import type { GameState } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const getToken = () => localStorage.getItem("auth_token");
const setToken = (token: string) => localStorage.setItem("auth_token", token);

export const authenticate = async (initData: string) => {
  const response = await fetch(`${API_URL}/api/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData })
  });

  if (!response.ok) {
    throw new Error("Auth failed");
  }

  const data = (await response.json()) as { token: string; state: GameState };
  setToken(data.token);
  return data;
};

export const fetchState = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/api/state`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch state");
  }

  return (await response.json()) as { state: GameState; offline?: unknown };
};

export const postAction = async (type: string, payload?: Record<string, unknown>) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/api/action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ type, payload })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? "Action failed");
  }

  return (await response.json()) as { state: GameState; result: unknown };
};

export const resetProgress = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/api/reset`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Reset failed");
  }

  return (await response.json()) as { state: GameState };
};
