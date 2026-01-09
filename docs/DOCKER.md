# 🐳 Docker & Gateway Setup

This document explains the Docker infrastructure and API Gateway setup for Gurbetlik.

## 📁 Structure

```
gurbetlik_server/
├── docker/
│   └── gateway/
│       ├── Dockerfile       # NGINX gateway image
│       └── nginx.conf       # Gateway configuration
├── docker-compose.yml       # Main stack definition
├── docker-compose.dev.yml   # Dev dependencies only
├── docker-compose.prod.yml  # Production overrides
├── Dockerfile               # API server image
├── .dockerignore            # Build context exclusions
├── .env.docker.example      # Environment template
└── Makefile                 # Convenient commands
```

## 🏗️ Architecture

```
                    ┌──────────────────────────────────────┐
                    │           Internet                    │
                    └──────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Docker Network                             │
│  ┌─────────────────┐                                             │
│  │  NGINX Gateway  │◄────── Port 80/443 (only external)         │
│  │  (Rate Limit)   │                                             │
│  │  (Load Balance) │                                             │
│  └────────┬────────┘                                             │
│           │                                                       │
│           ▼                                                       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   API Server    │◄──►│   PostgreSQL    │    │    Redis     │ │
│  │   (Express)     │    │   (Database)    │    │   (Cache)    │ │
│  │   Port 3001     │    │   Port 5432     │    │  Port 6379   │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│         internal              internal              internal     │
└──────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Option 1: Full Stack (Everything in Docker)

```bash
# 1. Copy environment file
cp .env.docker.example .env.docker

# 2. Edit with your values
nano .env.docker

# 3. Start everything
make up
# or: docker-compose up -d

# 4. Check status
docker-compose ps
```

### Option 2: Development Mode (Only Dependencies)

```bash
# Start only PostgreSQL, Redis, Adminer
make dev
# or: docker-compose -f docker-compose.dev.yml up -d

# Run API locally
npm run dev
```

## 📍 Endpoints

| Endpoint | Description |
|----------|-------------|
| `http://localhost` | Gateway root (404) |
| `http://localhost/health` | API health check |
| `http://localhost/api-docs` | Swagger documentation |
| `http://localhost/api/v1/...` | API routes |
| `http://localhost/gateway/health` | Gateway health |
| `http://localhost:8080` | Adminer (dev only) |

## 🛡️ Gateway Features

### Rate Limiting

| Zone | Limit | Applies To |
|------|-------|------------|
| `api_limit` | 100 req/s | All API routes |
| `auth_limit` | 10 req/min | Login, Register |
| `ws_limit` | 10 connections | WebSocket |

### Security Headers

- `X-Request-ID` - Request tracing
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`

### Load Balancing

The gateway is pre-configured for horizontal scaling:

```nginx
upstream api_server {
    least_conn;
    server api:3001;
    # Add more servers:
    # server api-2:3001;
    # server api-3:3001;
}
```

## 🔧 Common Commands

```bash
# View all logs
make logs

# View specific service logs
make logs-api
make logs-gateway

# Run database migrations
make migrate

# Open PostgreSQL shell
make db-shell

# Rebuild images
make rebuild

# Clean everything
make clean-all
```

## 🌐 Production Deployment

```bash
# Start with production settings
make prod
# or: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Production mode includes:
- Resource limits (CPU/Memory)
- Multiple API replicas
- Optimized PostgreSQL settings
- Log rotation

## 🔒 SSL/TLS Setup

For HTTPS, add SSL certificates:

```bash
# 1. Create certs directory
mkdir -p docker/gateway/certs

# 2. Add your certificates
# docker/gateway/certs/cert.pem
# docker/gateway/certs/key.pem

# 3. Update nginx.conf to include SSL server block
```

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs api

# Check if ports are in use
netstat -an | grep 80
netstat -an | grep 5432
```

### Database connection issues

```bash
# Verify PostgreSQL is healthy
docker-compose ps postgres

# Check database logs
docker-compose logs postgres
```

### Gateway 502 errors

```bash
# Check if API is healthy
curl http://localhost:3001/health  # (if port exposed)

# Check upstream connectivity
docker-compose exec gateway ping api
```

## 📊 Monitoring

View container stats:

```bash
docker stats
```

View logs in real-time:

```bash
docker-compose logs -f --tail=100
```
