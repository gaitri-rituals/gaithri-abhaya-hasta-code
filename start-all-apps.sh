#!/bin/bash

echo "🚀 Starting Complete Temple Ecosystem (Frontend + Backend + Database)"
echo "======================================================================="

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

# Build and start all services
echo "🏗️  Building and starting all services..."
echo "   📦 PostgreSQL Database"
echo "   🔧 Abhaya Hasta Backend API"
echo "   🔧 Gaithri Admin Backend API" 
echo "   🌐 Abhaya Hasta Frontend UI"
echo "   🌐 Gaithri Admin Dashboard UI"
echo "   📊 PgAdmin Database Manager"
docker compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 15

echo "🏥 Checking service health..."

# Check PostgreSQL
for i in {1..30}; do
    if docker exec temple_postgres pg_isready -U temple_admin -d temple_ecosystem_db > /dev/null 2>&1; then
        echo "✅ PostgreSQL Database is ready"
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
        echo "✅ Abhaya Hasta Backend API is ready"
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
        echo "✅ Gaithri Admin Backend API is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Gaithri Backend failed to start"
        docker compose logs gaithri-backend
        exit 1
    fi
    sleep 2
done

# Check Abhaya Hasta Frontend
for i in {1..45}; do
    if curl -s http://localhost:5174 > /dev/null; then
        echo "✅ Abhaya Hasta Frontend UI is ready"
        break
    fi
    if [ $i -eq 45 ]; then
        echo "❌ Abhaya Hasta Frontend failed to start"
        docker compose logs abhaya-hasta-frontend
        exit 1
    fi
    sleep 3
done

# Check Gaithri Frontend
for i in {1..45}; do
    if curl -s http://localhost:5173 > /dev/null; then
        echo "✅ Gaithri Admin Dashboard UI is ready"
        break
    fi
    if [ $i -eq 45 ]; then
        echo "❌ Gaithri Frontend failed to start"
        docker compose logs gaithri-frontend
        exit 1
    fi
    sleep 3
done

echo ""
echo "🎉 ALL SERVICES ARE RUNNING SUCCESSFULLY!"
echo "======================================================================="
echo ""
echo "🌐 FRONTEND APPLICATIONS:"
echo "   Abhaya Hasta (Consumer App):  http://localhost:5174"
echo "   Gaithri Admin Dashboard:      http://localhost:5173"
echo ""
echo "📡 BACKEND APIs:"
echo "   Abhaya Hasta API:             http://localhost:3001"
echo "   Gaithri Admin API:            http://localhost:3002"
echo ""
echo "🗄️  DATABASE ACCESS:"
echo "   PgAdmin Web Interface:        http://localhost:5050"
echo "   PostgreSQL Direct:            localhost:5432"
echo ""
echo "🧪 HEALTH CHECK ENDPOINTS:"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3002/health"
echo ""
echo "📊 SAMPLE CREDENTIALS:"
echo "   Admin Login: username=admin, password=admin123"
echo "   PgAdmin: admin@temple.com / admin123"
echo ""
echo "📋 MANAGEMENT COMMANDS:"
echo "   View all logs:     docker compose logs -f"
echo "   Stop all:          docker compose down"
echo "   Restart:           docker compose restart"
echo "   Clean restart:     docker compose down -v && docker compose up -d"
echo ""
echo "🎯 COMPLETE TEMPLE ECOSYSTEM IS READY!"
echo "Frontend UIs are connected to Backend APIs with sample data loaded."
