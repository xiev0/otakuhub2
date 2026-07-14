# === ЭТАП 1: Базовый образ с Bun ===
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# === ЭТАП 2: Установка зависимостей (кэширование) ===
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Установка чистых продакшн-зависимостей (без devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# === ЭТАП 3: Подготовка исходного кода ===
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# === ЭТАП 4: Финальный легковесный образ для запуска ===
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules

# Копируем всю папку src и файлы конфигурации
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/tsconfig.json .

# Запуск приложения
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "start" ]