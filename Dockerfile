# ---- BUILD STAGE ----
FROM node:18-slim AS builder

WORKDIR /app

# copy only lockfiles and package.json
COPY package*.json ./

# install everything
RUN npm ci

# copy the rest
COPY . .

# build your Next app
RUN npm run build

# ---- PRODUCTION STAGE ----

FROM node:18-slim AS runner
WORKDIR /app

# 1) Copy JSON manifests
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# debug: list files
RUN ls -lah /app

# 2) Copy build outputs
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 3) Install prod deps
RUN npm ci --only=production

ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm","start"]
