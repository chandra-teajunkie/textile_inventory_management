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

# Copy package files
COPY package.json package-lock.json ./

# Clear npm cache and remove any existing node_modules
RUN npm install --legacy-peer-deps && \
    npm cache clean --force

# Install dependencies with exact versions and clean npm cache
# The previous RUN command is replaced by the one above to handle peer dependency conflicts

# Copy rest of the app
COPY . .

# Build the app
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
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Simple healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qS --spider http://localhost/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
