#!/bin/bash

# Standardized Port Configuration
# - abhaya-hasta-backend: 3000
# - sacred-ops-dashboard: 8080

echo "🔄 Killing processes on ports 3000 and 8080..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :8080 | xargs kill -9 2>/dev/null || true

echo "🗑️  Stopping Docker containers..."
docker stop abhaya_hasta_api 2>/dev/null || true
docker rm abhaya_hasta_api 2>/dev/null || true

echo "🐘 Starting PostgreSQL database..."
if ! docker ps | grep -q temple_postgres; then
  docker start temple_postgres 2>/dev/null || docker compose up -d postgres
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 3

echo "🚀 Starting abhaya-hasta-backend on port 3000..."
cd backends/abhaya-hasta-backend
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!
cd ../..

echo "⏳ Waiting for backend to start..."
sleep 5

echo "🎨 Starting sacred-ops-dashboard on port 8080..."
cd sacred-ops-dashboard
npm run dev > /dev/null 2>&1 &
DASHBOARD_PID=$!
cd ..

echo ""
echo "✅ Servers started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Backend:   http://localhost:3000"
echo "📍 Dashboard: http://localhost:8080"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Dashboard PID: $DASHBOARD_PID"
echo ""
echo "To stop servers:"
echo "  kill $BACKEND_PID $DASHBOARD_PID"
echo "  or run: lsof -ti :3000 :8080 | xargs kill -9"
