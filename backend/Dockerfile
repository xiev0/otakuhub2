# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules

# Вместо копирования одного файла, копируем всю папку src целиком в папку src контейнера:
COPY --from=prerelease /usr/src/app/src ./src

COPY --from=prerelease /usr/src/app/package.json .

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "start" ]