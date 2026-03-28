COMPOSE_DEV  = docker compose -f docker-compose.dev.yml
COMPOSE_PROD = docker compose -f docker-compose.prod.yml

.PHONY: dev infra monitor stop install docker-dev help \
        migration migrate db-rollback db-history db-current

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

# ── Local development (infra in Docker, app processes run locally) ───────────

dev: infra ## Start infra containers + run backend and frontend locally
	@echo ""
	@echo "  Backend  → http://localhost:8080"
	@echo "  Frontend → http://localhost:3000"
	@echo "  Press Ctrl+C to stop all processes"
	@echo ""
	@trap 'kill %1 %2 2>/dev/null; exit 0' INT TERM; \
		(cd backend && poetry run fastapi dev server/main.py --port 8080) & \
		(cd frontend && pnpm dev) & \
		wait

infra: ## Start core infrastructure containers (postgres, chroma, anki)
	$(COMPOSE_DEV) up -d postgres-server chroma-server anki

monitor: ## Start the monitoring stack (grafana, loki, tempo, prometheus, otelcol)
	$(COMPOSE_DEV) --profile monitoring up -d

stop: ## Stop and remove all dev containers
	$(COMPOSE_DEV) --profile app --profile monitoring down

# ── Full Docker stack ────────────────────────────────────────────────────────

docker-dev: ## Start the full dev stack entirely in Docker (including backend + frontend)
	$(COMPOSE_DEV) --profile app up --build

docker-dev-d: ## Same as docker-dev but detached
	$(COMPOSE_DEV) --profile app up --build -d

# ── Dependencies ─────────────────────────────────────────────────────────────

install: ## Install all dependencies (backend + frontend)
	cd backend && poetry install
	cd frontend && pnpm install

install-be: ## Install backend dependencies only
	cd backend && poetry install

install-fe: ## Install frontend dependencies only
	cd frontend && pnpm install

# ── Utilities ────────────────────────────────────────────────────────────────

logs: ## Tail logs for all running infra containers
	$(COMPOSE_DEV) logs -f postgres-server chroma-server anki

reset-db: ## Drop and recreate the vector DB collections
	cd backend && poetry run reset-vector-db

# ── Database migrations (Alembic) ────────────────────────────────────────────

migration: ## Autogenerate a migration (usage: make migration msg="add foo column")
	@test -n "$(msg)" || (echo "Usage: make migration msg=\"description\""; exit 1)
	cd backend && poetry run alembic revision --autogenerate -m "$(msg)"

migrate: ## Apply all pending migrations to head
	cd backend && poetry run alembic upgrade head

db-rollback: ## Roll back the last applied migration
	cd backend && poetry run alembic downgrade -1

db-history: ## Show full migration history
	cd backend && poetry run alembic history --verbose

db-current: ## Show the current migration revision of the live DB
	cd backend && poetry run alembic current
