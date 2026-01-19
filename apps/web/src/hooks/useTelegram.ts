import { useEffect, useState } from "react";

type TelegramWebApp = {
  initData: string;
  initDataUnsafe: { user?: { id: number; username?: string; first_name?: string } };
  ready: () => void;
  expand: () => void;
  themeParams: Record<string, string>;
  onEvent: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (app) {
      app.ready();
      app.expand();
      setWebApp(app);
    }
  }, []);

  return webApp;
};
