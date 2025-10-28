// This file provides default values for local development
// At runtime in Docker, this file will be overwritten by the container's entrypoint script
// using values from environment variables
window._env_ = {
  BACKEND_URL: 'http://localhost:3002',
};