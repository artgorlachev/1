import { useEffect, useMemo, useState } from "react";
import { BUILDINGS, EPOCHS, RESOURCES, TECHS, WORKERS } from "./data/game";
import type { GameState, WorkerState } from "./types";
import { authenticate, fetchState, postAction, resetProgress } from "./utils/api";
import { useTelegram } from "./hooks/useTelegram";

const TABS = [
  "city",
  "buildings",
  "research",
  "workers",
  "epoch",
  "resources",
  "settings"
] as const;

type TabKey = (typeof TABS)[number];

type Locale = "ru" | "en";

const copy: Record<Locale, Record<string, string>> = {
  ru: {
    city: "Город",
    buildings: "Здания",
    research: "Исследования",
    workers: "Население",
    epoch: "Эпоха",
    resources: "Ресурсы",
    settings: "Настройки",
    click: "Собрать ресурсы",
    production: "Производство/сек",
    offline: "Оффлайн доход",
    reset: "Сбросить прогресс",
    syncing: "Синхронизация...",
    syncOk: "Синхронизировано",
    assign: "Назначить",
    advance: "Перейти в эпоху",
    export: "Экспорт",
    import: "Импорт",
    help: "Справка",
    language: "Язык",
    comingSoon: "Скоро появится",
    clickHint: "Тапайте, чтобы ускорить рост еды.",
    noTelegram: "Откройте мини-игру через Telegram WebApp."
  },
  en: {
    city: "City",
    buildings: "Buildings",
    research: "Research",
    workers: "Population",
    epoch: "Epoch",
    resources: "Resources",
    settings: "Settings",
    click: "Gather",
    production: "Production/sec",
    offline: "Offline income",
    reset: "Reset progress",
    syncing: "Syncing...",
    syncOk: "Synced",
    assign: "Assign",
    advance: "Advance epoch",
    export: "Export",
    import: "Import",
    help: "Help",
    language: "Language",
    comingSoon: "Coming soon",
    clickHint: "Tap to speed up food growth.",
    noTelegram: "Open this Mini App from Telegram."
  }
};

const formatNumber = (value: number) => Math.floor(value).toLocaleString("ru-RU");

export const App = () => {
  const webApp = useTelegram();
  const [tab, setTab] = useState<TabKey>("city");
  const [state, setState] = useState<GameState | null>(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>("ru");
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);

  const t = useMemo(() => copy[locale], [locale]);

  useEffect(() => {
    const init = async () => {
      if (!webApp?.initData) {
        setError(t.noTelegram);
        return;
      }

      try {
        const auth = await authenticate(webApp.initData);
        setState(auth.state);
        if (auth.offline && (auth.offline as { elapsedSeconds: number }).elapsedSeconds > 0) {
          const seconds = (auth.offline as { elapsedSeconds: number }).elapsedSeconds;
          setOfflineMessage(`${t.offline}: +${Math.floor(seconds / 60)}m`);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    init();
  }, [webApp, t.noTelegram, t.offline]);

  const handleAction = async (type: string, payload?: Record<string, unknown>) => {
    try {
      setSyncStatus("syncing");
      const data = await postAction(type, payload);
      setState(data.state);
      setSyncStatus("idle");
    } catch (err) {
      setSyncStatus("idle");
      setError((err as Error).message);
    }
  };

  const refreshState = async () => {
    try {
      setSyncStatus("syncing");
      const data = await fetchState();
      setState(data.state);
      setSyncStatus("idle");
    } catch (err) {
      setSyncStatus("idle");
      setError((err as Error).message);
    }
  };

  const handleReset = async () => {
    try {
      setSyncStatus("syncing");
      const data = await resetProgress();
      setState(data.state);
      setSyncStatus("idle");
    } catch (err) {
      setSyncStatus("idle");
      setError((err as Error).message);
    }
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-tgBg text-tgText flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold">Evolution Settlement</div>
          <div className="text-sm text-tgHint">{error ?? t.syncing}</div>
        </div>
      </div>
    );
  }

  const availablePopulation = Math.floor(state.resources.population.amount);
  const assignedWorkers = Object.values(state.workers).reduce((sum, value) => sum + value, 0);

  return (
    <div className="min-h-screen bg-tgBg text-tgText flex flex-col">
      <header className="p-4 space-y-2 bg-tgSecondary">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-tgHint">{t.city}</div>
            <div className="text-lg font-semibold">{EPOCHS[state.epoch].name}</div>
          </div>
          <button
            className="text-xs px-3 py-2 rounded-full bg-tgButton text-tgButtonText"
            onClick={refreshState}
          >
            {syncStatus === "syncing" ? t.syncing : t.syncOk}
          </button>
        </div>
        {offlineMessage && (
          <div className="text-xs text-tgHint">{offlineMessage}</div>
        )}
        {error && (
          <div className="text-xs text-red-300">{error}</div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === "city" && (
          <section className="space-y-4">
            <div className="rounded-xl bg-tgSecondary p-4 space-y-2">
              <div className="text-sm text-tgHint">{t.production}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(state.resources)
                  .filter(([key]) => !["population"].includes(key))
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span>{RESOURCES[key as keyof typeof RESOURCES].icon} {RESOURCES[key as keyof typeof RESOURCES].label}</span>
                      <span>{formatNumber(value.amount)}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="rounded-xl bg-tgSecondary p-4 space-y-3">
              <button
                className="w-full py-3 rounded-xl bg-tgButton text-tgButtonText font-semibold"
                onClick={() => handleAction("click")}
              >
                {t.click}
              </button>
              <p className="text-xs text-tgHint">{t.clickHint}</p>
            </div>
          </section>
        )}

        {tab === "buildings" && (
          <section className="space-y-3">
            {Object.entries(BUILDINGS).map(([id, building]) => (
              <div key={id} className="rounded-xl bg-tgSecondary p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{building.name}</div>
                    <div className="text-xs text-tgHint">{building.description}</div>
                  </div>
                  <div className="text-sm">Lv {state.buildings[id as keyof typeof state.buildings]}</div>
                </div>
                <button
                  className="w-full py-2 rounded-lg bg-tgButton text-tgButtonText"
                  onClick={() => handleAction("build", { buildingId: id })}
                >
                  Построить
                </button>
              </div>
            ))}
          </section>
        )}

        {tab === "research" && (
          <section className="space-y-3">
            {Object.entries(TECHS).map(([id, tech]) => (
              <div key={id} className="rounded-xl bg-tgSecondary p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{tech.name}</div>
                    <div className="text-xs text-tgHint">{tech.description}</div>
                  </div>
                  <div className="text-xs">
                    {state.techs[id as keyof typeof state.techs] ? "✅" : "🧪"}
                  </div>
                </div>
                <button
                  className="w-full py-2 rounded-lg bg-tgButton text-tgButtonText"
                  onClick={() => handleAction("research", { techId: id })}
                >
                  Исследовать
                </button>
              </div>
            ))}
          </section>
        )}

        {tab === "workers" && (
          <section className="space-y-3">
            <div className="rounded-xl bg-tgSecondary p-4">
              <div className="text-sm text-tgHint">
                {t.workers}: {assignedWorkers}/{availablePopulation}
              </div>
            </div>
            {Object.entries(WORKERS).map(([role, info]) => (
              <div key={role} className="rounded-xl bg-tgSecondary p-4 space-y-2">
                <div className="font-semibold">{info.name}</div>
                <div className="text-xs text-tgHint">{info.description}</div>
                <div className="flex items-center gap-2">
                  <input
                    className="w-full bg-transparent border border-tgHint rounded-lg p-2"
                    type="number"
                    min={0}
                    value={state.workers[role as keyof WorkerState]}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setState((prev) =>
                        prev
                          ? {
                              ...prev,
                              workers: { ...prev.workers, [role]: Math.max(0, value) }
                            }
                          : prev
                      );
                    }}
                  />
                  <button
                    className="px-3 py-2 rounded-lg bg-tgButton text-tgButtonText"
                    onClick={() => handleAction("assignWorkers", { workers: state.workers })}
                  >
                    {t.assign}
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === "epoch" && (
          <section className="space-y-3">
            <div className="rounded-xl bg-tgSecondary p-4">
              <div className="text-lg font-semibold">{EPOCHS[state.epoch].name}</div>
              <div className="text-xs text-tgHint">{EPOCHS[state.epoch].bonus}</div>
            </div>
            <button
              className="w-full py-3 rounded-xl bg-tgButton text-tgButtonText"
              onClick={() => handleAction("advanceEpoch")}
            >
              {t.advance}
            </button>
          </section>
        )}

        {tab === "resources" && (
          <section className="grid grid-cols-2 gap-3">
            {Object.entries(state.resources).map(([id, resource]) => (
              <div key={id} className="rounded-xl bg-tgSecondary p-3">
                <div className="text-sm">{RESOURCES[id as keyof typeof RESOURCES].icon} {RESOURCES[id as keyof typeof RESOURCES].label}</div>
                <div className="text-xs text-tgHint">{formatNumber(resource.amount)} / {formatNumber(resource.cap)}</div>
              </div>
            ))}
          </section>
        )}

        {tab === "settings" && (
          <section className="space-y-3">
            <div className="rounded-xl bg-tgSecondary p-4 space-y-2">
              <div className="text-sm text-tgHint">{t.language}</div>
              <div className="flex gap-2">
                <button
                  className={`flex-1 py-2 rounded-lg ${locale === "ru" ? "bg-tgButton text-tgButtonText" : "bg-transparent border border-tgHint"}`}
                  onClick={() => setLocale("ru")}
                >
                  RU
                </button>
                <button
                  className={`flex-1 py-2 rounded-lg ${locale === "en" ? "bg-tgButton text-tgButtonText" : "bg-transparent border border-tgHint"}`}
                  onClick={() => setLocale("en")}
                >
                  EN
                </button>
              </div>
            </div>
            <button
              className="w-full py-3 rounded-xl bg-red-500 text-white"
              onClick={handleReset}
            >
              {t.reset}
            </button>
            <div className="rounded-xl bg-tgSecondary p-4 text-xs text-tgHint">
              {t.help}: прогресс хранится на сервере, а оффлайн доход начисляется до 8 часов.
            </div>
          </section>
        )}
      </main>

      <nav className="sticky bottom-0 bg-tgSecondary grid grid-cols-4 gap-1 p-2 text-xs">
        {TABS.map((key) => (
          <button
            key={key}
            className={`py-2 rounded-lg ${tab === key ? "bg-tgButton text-tgButtonText" : "text-tgHint"}`}
            onClick={() => setTab(key)}
          >
            {t[key]}
          </button>
        ))}
      </nav>
    </div>
  );
};
