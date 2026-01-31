# Build stage: install dependencies and produce static files
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install && npm run build

# Runtime stage: serve build output with lighttpd on Alpine Linux
FROM alpine
RUN apk add --no-cache lighttpd
RUN addgroup -S web && adduser -S -G web -h /app -s /sbin/nologin web
COPY --from=builder /app/build /app
RUN chown -R web:web /app
COPY lighttpd.conf /etc/lighttpd/lighttpd.conf
EXPOSE 8080
USER web:web
CMD ["lighttpd", "-D", "-f", "/etc/lighttpd/lighttpd.conf"]
