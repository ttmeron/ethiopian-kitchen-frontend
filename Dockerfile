# Stage 1: Build the Angular app
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy all source code
COPY . .

# Build the app
RUN npm run build --prod

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist/ethiopian-kitchen-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["/bin/sh", "-c", "echo '=== DEBUG: BACKEND_URL =' $BACKEND_URL && envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp && cat /etc/nginx/nginx.conf.tmp && mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
