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

COPY package.json package-lock.json ./
RUN npm install -f

COPY . .

RUN npm run build

# EXPOSE 3000
# CMD ["npm", "start"]

# ---- Runtime image ----
FROM nginx:stable-alpine AS runtime

# Remove default nginx static config and add our SPA-friendly config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Expose the standard HTTP port
EXPOSE 3000

# Copy entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Simple healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qS --spider http://localhost/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
