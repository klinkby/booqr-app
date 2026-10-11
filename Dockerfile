# Build stage: install dependencies and produce static files
FROM node:24-alpine3.23 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run lint
RUN npm run build

# Runtime stage: serve build output with lighttpd on Alpine Linux
FROM alpine:3.23
RUN apk add --no-cache lighttpd
RUN addgroup -S web && adduser -S -G web -h /app -s /sbin/nologin web
COPY --from=builder /app/build /app
RUN chown -R web:web /app
COPY lighttpd.conf /etc/lighttpd/lighttpd.conf
# Mirror the build-specific CSP from index.html's <meta> into the response header; fail the build if absent
RUN csp="$(sed -n 's/.*http-equiv="content-security-policy" content="\([^"]*\)".*/\1/p' /app/index.html)" \
 && test -n "$csp" \
 && sed -i "s|__CSP__|$(printf '%s' "$csp" | sed 's/[&|\\]/\\&/g')|" /etc/lighttpd/lighttpd.conf \
 && ! grep -q __CSP__ /etc/lighttpd/lighttpd.conf
USER web:web
CMD ["lighttpd", "-D", "-f", "/etc/lighttpd/lighttpd.conf"]
