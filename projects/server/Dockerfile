FROM node:22-alpine AS builder
WORKDIR /app

# Install workspace dependencies (manifests first for layer caching).
# The single root lockfile requires every workspace package.json to be present.
COPY package.json package-lock.json ./
COPY projects/shared/package.json ./projects/shared/
COPY projects/server/package.json ./projects/server/
COPY projects/client/package.json ./projects/client/
RUN npm ci

# Copy the sources needed to build the server.
# (shared is referenced by the server tsconfig path mapping.)
COPY projects/shared ./projects/shared
COPY projects/server ./projects/server

# Bundle the server into a single self-contained CJS file (no runtime node_modules).
RUN npm run build:bundle -w @fifa-draft/server

# ---- Runtime image ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# App bundle + static player datasets (read from process.cwd()/data at runtime).
COPY --from=builder /app/projects/server/dist/index.cjs ./index.cjs
COPY --from=builder /app/projects/server/data ./data

# Cloud Run injects PORT (default 8080); the app already respects process.env.PORT.
EXPOSE 8080
CMD ["node", "index.cjs"]
