# ============================================
# Makefile for Docker Operations
# ============================================
# Usage: make <target>

.PHONY: help dev up down build logs clean migrate shell

# Default target
help:
	@echo "Gurbetlik Docker Commands"
	@echo "========================="
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development dependencies (DB, Redis)"
	@echo "  make dev-down     - Stop development dependencies"
	@echo ""
	@echo "Full Stack:"
	@echo "  make up           - Start all services (gateway + api + db)"
	@echo "  make down         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production stack"
	@echo "  make prod-down    - Stop production stack"
	@echo ""
	@echo "Build & Maintenance:"
	@echo "  make build        - Build all Docker images"
	@echo "  make rebuild      - Rebuild without cache"
	@echo "  make logs         - View all logs"
	@echo "  make logs-api     - View API logs"
	@echo "  make logs-gateway - View gateway logs"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make seed         - Seed database"
	@echo "  make db-shell     - Open PostgreSQL shell"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Remove containers and networks"
	@echo "  make clean-all    - Remove everything including volumes"
	@echo "  make cache-clear  - Clear NGINX gateway cache"

# ==========================================
# Development
# ==========================================
dev:
	docker-compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "✅ Development dependencies started!"
	@echo "   PostgreSQL: localhost:5432"
	@echo "   Redis:      localhost:6379"
	@echo "   Adminer:    http://localhost:8080"
	@echo ""
	@echo "Now run: npm run dev"

dev-down:
	docker-compose -f docker-compose.dev.yml down

# ==========================================
# Full Stack (Default)
# ==========================================
up:
	docker-compose up -d
	@echo ""
	@echo "✅ All services started!"
	@echo "   Gateway: http://localhost"
	@echo "   Health:  http://localhost/health"
	@echo "   Docs:    http://localhost/api-docs"

down:
	docker-compose down

restart:
	docker-compose restart

# ==========================================
# Production
# ==========================================
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# ==========================================
# Build
# ==========================================
build:
	docker-compose build

rebuild:
	docker-compose build --no-cache

# ==========================================
# Logs
# ==========================================
logs:
	docker-compose logs -f

logs-api:
	docker-compose logs -f api

logs-gateway:
	docker-compose logs -f gateway

logs-db:
	docker-compose logs -f postgres

# ==========================================
# Database
# ==========================================
migrate:
	docker-compose exec api npx prisma migrate deploy

seed:
	docker-compose exec api npm run db:seed

db-shell:
	docker-compose exec postgres psql -U gurbetlik -d gurbetlik

# ==========================================
# Shell Access
# ==========================================
shell-api:
	docker-compose exec api sh

shell-gateway:
	docker-compose exec gateway sh

# ==========================================
# Cleanup
# ==========================================
clean:
	docker-compose down --remove-orphans
	docker-compose -f docker-compose.dev.yml down --remove-orphans

clean-all:
	docker-compose down -v --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f
