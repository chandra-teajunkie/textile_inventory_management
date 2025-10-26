#!/bin/sh

# Generate env.js with runtime values or use defaults
if [ ! -z "$BACKEND_URL" ]; then
  echo "Generating env.js with BACKEND_URL=$BACKEND_URL"
  cat <<EOF > /usr/share/nginx/html/env.js
window._env_ = {
  BACKEND_URL: '${BACKEND_URL}',
};
EOF
fi

# Start nginx
exec nginx -g 'daemon off;'