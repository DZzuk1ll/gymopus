#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== GymOpus Bootstrap ==="

# 1. Start database
echo "Starting database..."
cd "$PROJECT_ROOT"
docker compose up -d
echo "Waiting for database to be ready..."
sleep 3

# 2. Run migrations
echo "Running migrations..."
cd "$PROJECT_ROOT/backend"
uv run alembic upgrade head

# 3. Seed exercises
echo "Seeding exercises..."
cd "$PROJECT_ROOT"
uv run --project backend python scripts/seed_exercises.py

# 4. Ingest methodology documents
echo "Ingesting methodology documents..."
uv run --project backend python scripts/ingest_documents.py

echo ""
echo "=== Bootstrap complete! ==="
echo "Start backend: cd backend && uv run uvicorn app.main:app --reload --port 8000"
echo "Start frontend: cd frontend && pnpm dev"
