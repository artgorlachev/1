import dotenv from "dotenv";
import { Telegraf, Markup } from "telegraf";

dotenv.config();

const botToken = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;
const serverUrl = process.env.SERVER_URL;
const botApiToken = process.env.BOT_API_TOKEN;

if (!botToken || !webAppUrl || !serverUrl || !botApiToken) {
  throw new Error("Missing bot configuration in .env");
}

const bot = new Telegraf(botToken);

bot.start(async (ctx) => {
  await ctx.reply(
    "Добро пожаловать в Evolution Settlement! Откройте мини-игру ниже.",
    Markup.inlineKeyboard([
      Markup.button.webApp("Открыть игру", webAppUrl)
    ])
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "Команды:\n/start — открыть игру\n/profile — посмотреть эпоху и ресурсы\n\nСовет: игра сохраняет прогресс на сервере и начисляет оффлайн доход до 8 часов."
  );
});

bot.command("profile", async (ctx) => {
  const telegramId = String(ctx.from?.id ?? "");
  if (!telegramId) {
    await ctx.reply("Не удалось определить пользователя.");
    return;
  }

  const response = await fetch(`${serverUrl}/api/bot/profile?telegramId=${telegramId}`, {
    headers: {
      "x-bot-token": botApiToken
    }
  });

  if (!response.ok) {
    await ctx.reply("Профиль пока недоступен. Откройте игру хотя бы один раз.");
    return;
  }

  const data = (await response.json()) as {
    epoch: string;
    resources: Record<string, { amount: number; cap: number }>;
  };

  const summary = Object.entries(data.resources)
    .filter(([key]) => ["food", "wood", "stone", "metal", "science", "gold", "population"].includes(key))
    .map(([key, value]) => `${key}: ${Math.floor(value.amount)}/${Math.floor(value.cap)}`)
    .join("\n");

  await ctx.reply(`Эпоха: ${data.epoch}\n${summary}`);
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
