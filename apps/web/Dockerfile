# Image web: build produksi Vite disajikan nginx. Dibangun dari root repo:
#   docker build -f apps/web/Dockerfile .
FROM node:24-alpine AS build
RUN npm install -g pnpm@11.21.0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter "web..." \
  && pnpm --filter @muhasabah/shared build \
  && pnpm --filter web exec vite build

FROM nginx:1.27-alpine
COPY apps/web/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost/ >/dev/null || exit 1
