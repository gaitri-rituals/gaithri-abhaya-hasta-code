#!/bin/bash

echo "🚀 Starting Temple Ecosystem Backend Services..."
echo "================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    echo ""
    echo "On Mac:"
    echo "1. Open Docker Desktop application"
    echo "2. Wait for Docker to start (whale icon in menu bar)"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Docker is running"

# Stop existing containers if running
echo "🔄 Stopping existing containers..."
docker compose down

# Remove old volumes to ensure clean database
echo "🗑️  Cleaning up old data..."
docker compose down -v

# Build and start services
echo "🏗️  Building and starting services..."
docker compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

echo "🏥 Checking service health..."

# Check PostgreSQL
for i in {1..30}; do
    if docker exec temple_postgres pg_isready -U temple_admin -d temple_ecosystem_db > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start"
        docker compose logs postgres
        exit 1
    fi
    sleep 2
done

# Check Abhaya Hasta Backend
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "✅ Abhaya Hasta Backend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Abhaya Hasta Backend failed to start"
        docker compose logs abhaya-hasta-backend
        exit 1
    fi
    sleep 2
done

# Check Gaithri Backend
for i in {1..30}; do
    if curl -s http://localhost:3002/health > /dev/null; then
        echo "✅ Gaithri Backend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Gaithri Backend failed to start"
        docker compose logs gaithri-backend
        exit 1
    fi
    sleep 2
done

echo ""
echo "🎉 All services are running successfully!"
echo "================================================"
echo ""
echo "📡 API Endpoints:"
echo "  Abhaya Hasta (Consumer):  http://localhost:3001"
echo "  Gaithri (Admin):         http://localhost:3002"
echo "  Database Admin:          http://localhost:5050"
echo ""
echo "🧪 Test APIs:"
echo "  curl http://localhost:3001/health"
echo "  curl http://localhost:3002/health"
echo ""
echo "📊 View Logs:"
echo "  docker compose logs -f"
echo ""
echo "🛑 Stop Services:"
echo "  docker compose down"
echo ""
echo "Ready for UI integration! 🎯"
