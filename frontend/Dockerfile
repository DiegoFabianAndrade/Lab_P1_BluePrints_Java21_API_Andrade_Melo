# syntax=docker/dockerfile:1
# Imagen del cliente React de Blueprints.
#
# Etapa 1: compila la SPA con Vite. Las variables VITE_* se resuelven en tiempo
# de build (quedan incrustadas en el bundle), por eso llegan como ARG y no como
# variables de entorno del contenedor final.
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_USE_MOCK=false
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_USE_MOCK=${VITE_USE_MOCK}

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# Etapa 2: sirve los estaticos con nginx. La configuracion redirige cualquier
# ruta desconocida a index.html para que React Router maneje la navegacion.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
