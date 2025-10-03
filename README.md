# 🏛️ Temple Ecosystem - Complete Full-Stack Application

A comprehensive temple management ecosystem with consumer app and admin dashboard, featuring complete backend APIs, PostgreSQL database, and Docker containerization.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Environment                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│  PostgreSQL DB  │  Backend APIs   │   Frontend UIs          │
│  Port: 5432     │  Ports: 3000-2  │   Ports: 5173-4         │
│                 │                 │                         │
│  + PgAdmin      │  • Abhaya Hasta │   • Abhaya Hasta UI     │
│  Port: 5050     │  • Gaithri      │   • Gaithri Dashboard   │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## 🚀 **ONE-COMMAND SETUP**

### **Prerequisites**

- Docker Desktop installed and running
- Minimum 6GB RAM allocated to Docker
- Ports 3000, 3002, 5173, 5174, 5432, 5050 available

### **Start Everything**

```bash
# Clone and navigate to project
cd manjumegaproject

# Start complete ecosystem (Frontend + Backend + Database)
./start-all-apps.sh
```

**That's it!** The script will:

1. ✅ Check Docker is running
2. 🔄 Clean up old containers
3. 🏗️ Build all services
4. ⏳ Wait for services to be ready
5. 🧪 Verify all endpoints
6. 🎉 Display access URLs

## 🌐 **Application URLs**

| Service                  | URL                   | Purpose                      |
| ------------------------ | --------------------- | ---------------------------- |
| **🛕 Abhaya Hasta App**  | http://localhost:5174 | Consumer temple services app |
| **🏛️ Gaithri Dashboard** | http://localhost:5173 | Temple management dashboard  |
| **📡 Abhaya Hasta API**  | http://localhost:3000 | Consumer app backend         |
| **📡 Gaithri Admin API** | http://localhost:3002 | Admin dashboard backend      |
| **🗄️ Database Admin**    | http://localhost:5050 | PgAdmin web interface        |

## 🎯 **Quick Test Guide**

### **1. Test Consumer App (Abhaya Hasta)**

```bash
# Open in browser
open http://localhost:5174

# Test API directly
curl http://localhost:3000/health
curl http://localhost:3000/api/temples
```

### **2. Test Admin Dashboard (Gaithri)**

```bash
# Open in browser
open http://localhost:5173

# Test admin login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### **3. Test Database Access**

```bash
# Open PgAdmin
open http://localhost:5050

# Login: admin@temple.com / admin123
# Connect to: postgres:5432, temple_ecosystem_db
```

## 📊 **Sample Data Included**

### **🏛️ Temples (10 Sample)**

- Ganapathi temples with services and pricing
- Shaiva temples with ritual offerings
- Vaishnava temples with class schedules
- Complete location and contact information

### **👤 Admin User**

- **Username:** `admin`
- **Password:** `admin123`
- Full access to Gaithri dashboard

### **🛍️ Store & Services**

- Temple store products with inventory
- Puja services with pricing tiers
- Educational class schedules
- Event templates and booking options

## 🔧 **Development Features**

### **🔄 Hot Reload Enabled**

All services support hot reload for development:

- Frontend changes reflect immediately
- Backend API changes restart automatically
- Database schema updates via migrations

### **📝 Comprehensive Logging**

```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f abhaya-hasta-frontend
docker compose logs -f gaithri-backend
docker compose logs -f postgres
```

### **🗄️ Database Management**

```bash
# Access database directly
docker exec -it temple_postgres psql -U temple_admin -d temple_ecosystem_db

# Backup database
docker exec temple_postgres pg_dump -U temple_admin temple_ecosystem_db > backup.sql

# Restore database
docker exec -i temple_postgres psql -U temple_admin -d temple_ecosystem_db < backup.sql
```

## 🛠️ **Management Commands**

```bash
# Stop all services
docker compose down

# Restart all services
docker compose restart

# Clean restart (resets database)
docker compose down -v && docker compose up -d

# Rebuild after code changes
docker compose up -d --build

# Scale specific service
docker compose up -d --scale abhaya-hasta-frontend=2

# View resource usage
docker compose top
```

## 🧪 **API Testing**

### **Consumer App APIs**

```bash
# User registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"9876543210","email":"test@example.com"}'

# Get temples
curl http://localhost:3000/api/temples

# Search temples by location
curl "http://localhost:3000/api/temples?city=Bangalore&category=Ganapathi"

# Create booking (requires auth token)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"temple_id":1,"service_name":"Ganapathi Homam","booking_date":"2024-10-01"}'
```

### **Admin Dashboard APIs**

```bash
# Admin login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get dashboard metrics
curl http://localhost:3002/api/dashboard/metrics \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Create event
curl -X POST http://localhost:3002/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{"name":"Diwali Celebration","event_date":"2024-10-28","max_participants":100}'
```

## 🔐 **Authentication Flows**

### **Consumer Authentication**

1. **Registration:** POST `/api/auth/register` → OTP sent
2. **OTP Verification:** POST `/api/auth/verify-otp` → JWT token returned
3. **Protected Routes:** Include `Authorization: Bearer JWT_TOKEN`

### **Admin Authentication**

1. **Login:** POST `/api/auth/login` with username/password
2. **Token:** JWT token returned in response
3. **Dashboard Access:** Include token in subsequent requests

## 📈 **Production Features**

### **🛡️ Security**

- ✅ CORS protection with environment-specific origins
- ✅ Helmet.js security headers
- ✅ Rate limiting (200 requests/15min for consumer, 100/15min for admin)
- ✅ Input validation with express-validator
- ✅ JWT authentication with secure secrets
- ✅ SQL injection protection via parameterized queries

### **💳 Payment Processing**

- ✅ Razorpay integration with test keys
- ✅ Payment verification webhooks
- ✅ Order creation and tracking
- ✅ Refund processing capabilities
- ✅ Payment history and analytics

### **📊 Real Business Logic**

- ✅ Complete booking workflow with status tracking
- ✅ Event management with attendee limits
- ✅ Class enrollment with waitlist support
- ✅ Store inventory management
- ✅ Subscription plans with billing cycles
- ✅ Address management with geocoding
- ✅ QR code generation for bookings

##
