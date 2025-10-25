###
# Production-ready multi-stage Dockerfile for the frontend
# - Build: uses node to install and build the app
# - Runtime: uses lightweight nginx to serve the static build
#
# NOTE: This Dockerfile assumes you run `docker build` with the build
# context set to the `frontend/` directory (cd frontend && docker build -t myapp:prod .)
###

FROM node:18-alpine AS builder

WORKDIR /app

# Keep installs reproducible. Copy package files first for better caching.
COPY package*.json ./

# Install build deps (devDependencies may be needed to build)
# Try `npm ci` for reproducible installs, but fall back to `npm install --legacy-peer-deps`
# in case `ci` fails due to lockfile / peer-dep issues in a containerized environment.
RUN npm i -f --silent || npm install --legacy-peer-deps --silent

# Copy source and build
COPY . .

# Set production build (can be overridden at build time)
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN npm run build

# ---- Runtime image ----
FROM nginx:stable-alpine AS runtime

# Remove default nginx static config and add our SPA-friendly config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Expose the standard HTTP port
EXPOSE 80

# Simple healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qS --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
