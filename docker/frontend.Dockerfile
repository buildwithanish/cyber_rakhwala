FROM node:20-alpine AS build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ARG VITE_API_URL=/api
ARG VITE_ADMIN_LOGIN_PATH=deepaklogin
ARG VITE_ADMIN_API_PATH=deepaklogin
ARG VITE_ENABLE_DEMO_AUTH=false

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ADMIN_LOGIN_PATH=$VITE_ADMIN_LOGIN_PATH
ENV VITE_ADMIN_API_PATH=$VITE_ADMIN_API_PATH
ENV VITE_ENABLE_DEMO_AUTH=$VITE_ENABLE_DEMO_AUTH

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx/production.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
