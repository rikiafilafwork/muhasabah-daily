# Image API. Dibangun dari root repo: docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS base
RUN npm install -g pnpm@11.21.0
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @muhasabah/shared build \
  && pnpm --filter api build \
  && pnpm --filter api build:seed \
  && pnpm --filter api deploy --prod --legacy /out \
  # Klien Prisma 7 sudah ikut terkompilasi di dist/ dan dist-seed/, jadi tidak perlu generate.
  && cd /out \
  # Ganti symlink paket workspace dengan salinan nyata (dist + package.json).
  && rm node_modules/@muhasabah/shared \
  && mkdir -p node_modules/@muhasabah/shared \
  && cp -r /repo/packages/shared/dist /repo/packages/shared/package.json node_modules/@muhasabah/shared/

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/dist-seed ./dist-seed
COPY --chmod=755 apps/api/docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN mkdir -p /app/secrets && chown node:node /app/secrets
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=90s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1
# Secret, migrasi, seed dasar, dan impor Al-Qur'an dijalankan saat start (docker/entrypoint.sh).
ENTRYPOINT ["entrypoint.sh"]
