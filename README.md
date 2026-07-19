# Aniki

Упрощённая и переписанная версия OtakuHub.

## Стек

| Часть     | Технология          |
|-----------|---------------------|
| Frontend  | React + TypeScript + Vite + Redux Toolkit |
| Backend   | Bun + Fastify + TypeScript + Drizzle ORM |
| Database  | PostgreSQL          |
| Плеер     |                     |

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
│       └── services/    # Api
└── frontend/
    └── src/
        ├── components/  # Layout, Header, Footer, HlsPlayer, AnimeCard
        ├── pages/       # Home, AnimeDetail, Auth, Profile
        ├── services/    # API client
        └── store/       # Redux (auth slice)
```
