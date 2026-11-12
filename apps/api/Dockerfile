# Image API. Dibangun dari root repo: docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS base
RUN npm install -g pnpm@11.21.0
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @muhasabah/shared build \
  && pnpm --filter api build \
  && pnpm --filter api deploy --prod --legacy /out \
  && cd /out && ./node_modules/.bin/prisma generate \
  # Ganti symlink paket workspace dengan salinan nyata (dist + package.json).
  && rm node_modules/@muhasabah/shared \
  && mkdir -p node_modules/@muhasabah/shared \
  && cp -r /repo/packages/shared/dist /repo/packages/shared/package.json node_modules/@muhasabah/shared/

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
COPY --from=build /repo/apps/api/dist ./dist
USER node
EXPOSE 3000
# Migrasi dijalankan saat start agar `docker compose --profile full up` langsung siap.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main.js"]
