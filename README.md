# Evolution Settlement — Telegram Mini App + Bot

Полностью рабочий монорепозиторий для Telegram Mini App (WebApp) и бота. Игра — idle/clicker со стратегическими элементами: развитие поселения по эпохам от Каменного века до Будущего.

## Структура репозитория

```
/apps
  /web      # Telegram Mini App (React + Vite + Tailwind)
  /server   # Backend (Node.js + Express + Prisma + SQLite)
  /bot      # Telegram Bot (Telegraf)
```

## Технологии

- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js + TypeScript + Express
- **База:** SQLite + Prisma ORM (миграции включены)
- **Bot:** Telegraf
- **Auth:** Telegram WebApp initData (проверка подписи на сервере)

## Быстрый старт (локально)

### 1) Установите зависимости

```bash
npm install
```

### 2) Настройте переменные окружения

Скопируйте примеры `.env` и заполните своими значениями:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/bot/.env.example apps/bot/.env
cp apps/web/.env.example apps/web/.env
```

**apps/server/.env**
- `BOT_TOKEN` — токен Telegram бота
- `JWT_SECRET` — секрет для JWT
- `DATABASE_URL` — SQLite файл
- `BOT_API_TOKEN` — секрет для вызовов из бота
- `ADMIN_TOKEN` — токен для админ-эндпоинтов

**apps/bot/.env**
- `BOT_TOKEN` — тот же токен
- `WEBAPP_URL` — внешний URL вашего WebApp
- `SERVER_URL` — адрес сервера
- `BOT_API_TOKEN` — тот же, что на сервере

**apps/web/.env**
- `VITE_API_URL` — адрес сервера

### 3) Подготовьте базу и миграции

```bash
cd apps/server
npm install
npm run prisma:migrate
```

### 4) Запуск сервера

```bash
npm run dev
```

Сервер будет доступен на `http://localhost:4000`.

### 5) Запуск WebApp

В другом терминале:

```bash
cd apps/web
npm install
npm run dev
```

WebApp будет доступен на `http://localhost:5173`.

### 6) Запуск бота

В третьем терминале:

```bash
cd apps/bot
npm install
npm run dev
```

## Запуск через ngrok (для Telegram WebApp)

1. Установите ngrok.
2. Запустите туннели:

```bash
ngrok http 5173
ngrok http 4000
```

3. Обновите `.env`:

- `apps/web/.env`: `VITE_API_URL=https://<ngrok-server>.ngrok.app`
- `apps/bot/.env`: `WEBAPP_URL=https://<ngrok-web>.ngrok.app`
- `apps/bot/.env`: `SERVER_URL=https://<ngrok-server>.ngrok.app`

4. В BotFather установите WebApp URL (через `/setdomain`).
5. Откройте бота и нажмите «Открыть игру».

## Игровая модель

- **Ресурсы (12):** food, wood, stone, clay, skins, metal, coal, energy, science, gold, population, influence.
- **Клик:** даёт еду, сила клика зависит от эпохи и технологий.
- **Пассивный доход:** здания и рабочие дают ресурсы в сек.
- **Исследования:** открывают бонусы и эпохи.
- **Эпохи:** переходы по требованиям ресурсов/населения/теха.
- **Оффлайн доход:** начисляется до 8 часов.

## Основные API

- `POST /api/auth/telegram` — авторизация по initData
- `GET /api/state` — получить состояние
- `POST /api/action` — действия (click/build/research/assignWorkers/advanceEpoch)
- `POST /api/reset` — сброс
- `GET /api/bot/profile` — для бота (через BOT_API_TOKEN)
- `GET /api/admin/users` — список пользователей (ADMIN_TOKEN)

## Скрипты

### Server
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run prisma:migrate`
- `npm run prisma:studio`
- `npm run test`

## Пошаговое тестирование (smoke + unit)

### 1) Установка зависимостей и миграции

```bash
cd apps/server
npm install
npm run prisma:migrate
```

### 2) Запуск сервера и WebApp

```bash
# терминал 1
cd apps/server
npm run dev

# терминал 2
cd apps/web
npm install
npm run dev
```

Проверьте, что сервер отвечает:

```bash
curl http://localhost:4000/health
```

### 3) Запуск бота

```bash
cd apps/bot
npm install
npm run dev
```

### 4) Мини-игра в Telegram

1. Поднимите ngrok для WebApp и сервера:

```bash
ngrok http 5173
ngrok http 4000
```

2. Обновите `.env`:
   - `apps/web/.env`: `VITE_API_URL=https://<ngrok-server>.ngrok.app`
   - `apps/bot/.env`: `WEBAPP_URL=https://<ngrok-web>.ngrok.app`
   - `apps/bot/.env`: `SERVER_URL=https://<ngrok-server>.ngrok.app`

3. В BotFather установите WebApp URL (`/setdomain`).
4. Откройте бота → `/start` → «Открыть игру».
5. Проверьте:
   - Клики увеличивают еду.
   - Строительство списывает ресурсы и увеличивает уровни.
   - Исследования открываются после условий.
   - Прогресс сохраняется после перезапуска сервера.

### 5) Юнит-тесты логики

```bash
cd apps/server
npm run test
```

### Web
- `npm run dev`
- `npm run build`
- `npm run preview`

### Bot
- `npm run dev`
- `npm run build`
- `npm run start`

## Docker (опционально)

```bash
docker compose up --build
```

## Примечания

- Для корректной авторизации WebApp требуется открыть игру из Telegram.
- Сервер валидирует клики и ограничения ресурсов, есть лимит кликов (5/сек).
- Состояние хранится в SQLite и не пропадает при перезапуске.

---

Готово! Репозиторий можно расширять — баланс и контент находятся в `apps/server/src/game/config.ts` и `apps/web/src/data/game.ts`.
