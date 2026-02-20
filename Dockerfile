# Build stage: install dependencies and produce static files
FROM node:24-alpine3.22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage: serve build output with lighttpd on Alpine Linux
FROM alpine:3.22
RUN apk add --no-cache lighttpd
RUN addgroup -S web && adduser -S -G web -h /app -s /sbin/nologin web
COPY --from=builder /app/build /app
RUN chown -R web:web /app
COPY lighttpd.conf /etc/lighttpd/lighttpd.conf
USER web:web
CMD ["lighttpd", "-D", "-f", "/etc/lighttpd/lighttpd.conf"]
