# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments para variables de entorno
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID

COPY package*.json ./

RUN npm ci

COPY . .

# Configurar variables de entorno para el build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
