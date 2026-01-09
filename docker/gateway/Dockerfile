# ============================================
# NGINX Gateway Dockerfile
# ============================================
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom gateway config
COPY nginx.conf /etc/nginx/nginx.conf

# Create log directory
RUN mkdir -p /var/log/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/gateway/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
