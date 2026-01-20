# Shift Calendar Mini App

## Структура проекта

```
webapp/
  index.html
  styles.css
  app.js
bot/
  index.js
  package.json
```

## Запуск webapp (локально)

1. Откройте файл `webapp/index.html` в браузере.
2. Данные сохраняются в `localStorage`.

## Размещение webapp (обязательно HTTPS)

Telegram Mini App требует HTTPS. Можно использовать любой хостинг статических файлов.

1. Загрузите содержимое папки `webapp/` на HTTPS-хостинг.
2. Получите URL вида `https://your-domain.example/`.
3. Укажите этот URL в переменной окружения `WEBAPP_URL` для бота.

## Запуск бота

### Требования
- Node.js 18+
- Токен Telegram-бота

### Установка

```bash
cd bot
npm install
```

### Запуск

```bash
export BOT_TOKEN="<TOKEN>"
export WEBAPP_URL="https://your-domain.example/index.html"
node index.js
```

## Проверка в Telegram

1. Откройте чат с ботом и отправьте `/start`.
2. Нажмите кнопку **«Открыть календарь»**.
3. Для резервной копии нажмите в приложении **«Сделать резервную копию»** — бот пришлёт JSON-файл в чат.

## Где вставлять URL Mini App

- Значение `WEBAPP_URL` должно указывать на размещённый `index.html` из папки `webapp/`.
