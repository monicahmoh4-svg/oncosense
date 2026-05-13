FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Backend proxy (GEMINI_API_KEY) is preferred — set in backend env.
# VITE_GEMINI_API_KEY is a browser-only fallback for dev/demo only.
ARG VITE_API_URL=/api
ARG VITE_AI_URL=/ai
ARG VITE_SOCKET_URL=/
ARG VITE_GEMINI_API_KEY=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_AI_URL=$VITE_AI_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
