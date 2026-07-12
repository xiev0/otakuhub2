# OtakuHub 2

Упрощённая и переписанная версия OtakuHub.

## Стек

| Часть     | Технология                                   |
|-----------|----------------------------------------------|
| Frontend  | React + TypeScript + Vite + Redux Toolkit    |
| Backend   | Bun + Fastify + TypeScript + Drizzle ORM     |
| Database  | PostgreSQL                                   |
| Плеер     | hls.js (только AniLibria)                    |

## Что убрано по сравнению с v1

- ❌ OAuth (Google, VK и др.) — только логин/пароль
- ❌ Форум
- ❌ Каталог
- ❌ Лидерборд
- ❌ Kodik, Yummy, VK плееры — **только AniLibria HLS**
- ❌ Стена профиля, подписки, уведомления, чат

## Что осталось

- ✅ Главная: герой-баннер, расписание, популярное, обновления
- ✅ Страница аниме: постер + описание + AniLibria плеер + комментарии
- ✅ Авторизация (регистрация, вход, сброс пароля по email)
- ✅ Профиль: список аниме, история просмотра, настройки

## Запуск

### 1. PostgreSQL

Создайте базу данных:
```sql
CREATE DATABASE otakuhub2;
```

### 2. Backend

```bash
cd backend

# Скопируйте и настройте переменные окружения
cp .env.example .env
# Отредактируйте .env — укажите DATABASE_URL, JWT_SECRET, EMAIL_*

# Запустите миграции
bun run db:migrate

# Запустите dev-сервер
bun run dev
```

Backend будет доступен на `http://localhost:8000`

### 3. Frontend

```bash
cd frontend
bun install
bun run dev
```

Frontend будет доступен на `http://localhost:5173`

## Скрипты backend

| Команда           | Описание                          |
|-------------------|-----------------------------------|
| `bun run dev`     | Запуск dev-сервера (с hot reload) |
| `bun run db:generate` | Генерация миграций Drizzle   |
| `bun run db:migrate`  | Применение миграций к БД     |
| `bun run db:studio`   | Drizzle Studio (UI для БД)   |

## Скрипты frontend

| Команда         | Описание                  |
|-----------------|---------------------------|
| `bun run dev`   | Запуск Vite dev-сервера   |
| `bun run build` | Production сборка         |
| `bun run preview` | Предпросмотр production |

## Структура проекта

```
otakuhub2/
├── backend/
│   └── src/
│       ├── db/          # Drizzle schema + client
│       ├── middleware/  # JWT auth
│       ├── routes/      # anime, auth, user
│       └── services/    # AniLibria API
└── frontend/
    └── src/
        ├── components/  # Layout, Header, Footer, HlsPlayer, AnimeCard
        ├── pages/       # Home, AnimeDetail, Auth, Profile
        ├── services/    # API client
        └── store/       # Redux (auth slice)
```
