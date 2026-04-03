# Simple static file server — no build step needed.
# unkayOS loads everything dynamically via fetch() and import().
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy everything, .dockerignore handles exclusions
COPY . .

# Remove dev-only files
RUN rm -rf node_modules .git .kiro .vscode coverage dist tests \
           Dockerfile docker-compose.yml nginx.conf .dockerignore \
           .gitignore .prettierrc eslint.config.js tsconfig.json \
           vite.config.js vitest.config.js package.json package-lock.json \
           *.md *.ai

# Nginx config (copy before cleanup since it was removed above)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
