# Stage 1: build the React app
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_POCKETBASE_URL
ARG VITE_APP_NAME
ARG VITE_APP_SHORT_NAME
ENV VITE_POCKETBASE_URL=${VITE_POCKETBASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_SHORT_NAME=${VITE_APP_SHORT_NAME}
RUN npm run build

# Stage 2: serve the static build with nginx
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
