FROM nginx:1.27-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1
