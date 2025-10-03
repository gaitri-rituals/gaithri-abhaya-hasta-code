#!/bin/bash

echo "🚀 Starting Temple Ecosystem (Dev Mode - No Docker for Frontends)"
echo "=================================================================="

# Kill existing processes on required ports
echo "🔄 Cleaning up existing processes..."
lsof -ti :3000 :3002 :8080 :8081 | xargs kill -9 2>/dev/null || true

# Start PostgreSQL with Docker (only for database)
echo "🐘 Starting PostgreSQL database..."
if ! docker ps | grep -q temple_postgres; then
  docker start temple_postgres 2>/dev/null || docker compose up -d postgres
fi

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 5

# Start backends with Docker
echo "🔧 Starting backend services..."
docker compose up -d abhaya-hasta-backend gaithri-backend

# Wait for backends to start
echo "⏳ Waiting for backends to initialize..."
sleep 10

# Start sacred-ops-dashboard (Port 8080)
echo "🎨 Starting sacred-ops-dashboard on port 8080..."
cd sacred-ops-dashboard
npm run dev > /tmp/sacred-ops.log 2>&1 &
DASHBOARD_PID=$!
cd ..

# Start culture-path-skeleton (Port 8081)  
echo "🌐 Starting culture-path-skeleton on port 8081..."
cd culture-path-skeleton
npm run dev > /tmp/culture-path.log 2>&1 &
CULTURE_PID=$!
cd ..

echo ""
echo "⏳ Waiting for frontends to start..."
sleep 5

echo ""
echo "✅ ALL SERVICES STARTED!"
echo "=================================================================="
echo ""
echo "🌐 FRONTEND DASHBOARDS:"
echo "   Sacred Ops Dashboard:        http://localhost:8080"
echo "   Culture Path Skeleton:       http://localhost:8081"
echo ""
echo "📡 BACKEND APIs:"
echo "   Abhaya Hasta Backend:        http://localhost:3000"
echo "   Gaithri Admin Backend:       http://localhost:3002"
echo ""
echo "🗄️  DATABASE:"
echo "   PostgreSQL:                  localhost:5432"
echo ""
echo "📊 PROCESS IDs:"
echo "   Sacred Ops Dashboard PID:    $DASHBOARD_PID"
echo "   Culture Path Skeleton PID:   $CULTURE_PID"
echo ""
echo "📋 LOGS:"
echo "   tail -f /tmp/sacred-ops.log"
echo "   tail -f /tmp/culture-path.log"
echo "   docker compose logs -f abhaya-hasta-backend"
echo "   docker compose logs -f gaithri-backend"
echo ""
echo "🛑 TO STOP ALL:"
echo "   kill $DASHBOARD_PID $CULTURE_PID"
echo "   docker compose stop abhaya-hasta-backend gaithri-backend"
echo ""
