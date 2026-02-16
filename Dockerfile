# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
# Remove default nginx static assets
RUN rm -rf ./*
# Copy static assets from builder stage
COPY --from=build /app/dist .
# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Containers run nginx with global directives and daemon off
CMD ["nginx", "-g", "daemon off;"]
