# Image web (dev server Vite). Dibangun dari root repo: docker build -f apps/web/Dockerfile .
FROM node:24-alpine
RUN npm install -g pnpm@11.21.0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter web... \
  && pnpm --filter @muhasabah/shared build
ENV VITE_HOST=0.0.0.0
EXPOSE 5173
WORKDIR /repo/apps/web
CMD ["pnpm", "exec", "vite", "--port", "5173", "--strictPort"]
