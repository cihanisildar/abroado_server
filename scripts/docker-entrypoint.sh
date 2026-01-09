#!/bin/sh
# ============================================
# Docker Entrypoint Script
# ============================================
# This script runs before the main application starts
# It handles database migrations and other setup tasks

set -e

echo "🚀 Starting Gurbetlik API Server..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until nc -z postgres 5432 2>/dev/null; do
    echo "   PostgreSQL is not ready - waiting..."
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (in case it wasn't in the image)
echo "🔧 Ensuring Prisma client is generated..."
npx prisma generate

echo "✅ Database setup complete!"
echo "🌐 Starting Node.js server..."

# Execute the main command
exec "$@"
