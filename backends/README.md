# Temple Ecosystem Backend Services

Complete backend implementation for both **Abhaya Hasta** (Consumer App) and **Gaithri** (Temple Management) applications.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Environment                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│  PostgreSQL DB  │  Abhaya Hasta   │      Gaithri            │
│  Port: 5432     │  Consumer API   │   Admin API             │
│                 │  Port: 3000     │   Port: 3002            │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## 🚀 Quick Start with Docker

### Prerequisites

- Docker & Docker Compose installed
- Minimum 4GB RAM allocated to Docker

### 1. Start All Services

```bash
# Navigate to backends directory
cd backends

# Start all services (Database + Both APIs)
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

### 2. Verify Services

Check that all services are running:

```bash
# Check container status
docker-compose ps

# Test health endpoints
curl http://localhost:3000/health  # Abhaya Hasta Backend
curl http://localhost:3002/health  # Gaithri Backend
```

### 3. Access Services

| Service               | URL                   | Purpose                   |
| --------------------- | --------------------- | ------------------------- |
| **Abhaya Hasta API**  | http://localhost:3001 | Consumer app backend      |
| **Gaithri Admin API** | http://localhost:3002 | Temple management backend |
| **PostgreSQL**        | localhost:5432        | Database (internal)       |
| **PgAdmin**           | http://localhost:5050 | Database management       |

## 🔐 Database Access

### Via PgAdmin (Web Interface)

- URL: http://localhost:5050
- Email: `admin@temple.com`
- Password: `admin123`

**Add Database Connection:**

- Host: `postgres`
- Port: `5432`
- Database: `temple_ecosystem_db`
- Username: `temple_admin`
- Password: `temple_password123`

### Direct Connection

```bash
# Connect via psql in Docker
docker exec -it temple_postgres psql -U temple_admin -d temple_ecosystem_db

# Or from host machine
psql -h localhost -p 5432 -U temple_admin -d temple_ecosystem_db
```

## 📊 Database Schema

The system uses a **unified database** with 50+ tables supporting both applications:

### Core Tables

- `temples` - Temple information
- `users` - Consumer users
- `admin_users` - Temple staff/admins
- `bookings` - Puja/service bookings
- `events` - Temple events
- `classes` - Educational classes
- `store_products` - Temple store items
- `subscription_plans` - Membership plans

### Sample Data

The database is pre-loaded with:

- **10 Sample Temples** across different categories
- **Sample Admin User** (username: `admin`, password: `admin123`)
- **Temple Services** and pricing
- **Store Products** and inventory
- **Class Schedules** and enrollment options

## 🔧 Development Mode

### Start with hot-reload:

```bash
# Start in development mode
docker-compose up

# Or for specific service
docker-compose up abhaya-hasta-backend
docker-compose up gaithri-backend
```

### Local Development (without Docker):

```bash
# Abhaya Hasta Backend
cd abhaya-hasta-backend
cp .env.example .env
npm install
npm run dev

# Gaithri Backend
cd gaithri-backend
cp .env.example .env
npm install
npm run dev
```

## 📡 API Endpoints

### Abhaya Hasta (Consumer API) - Port 3001

#### Authentication

- `POST /api/auth/register` - User registration with OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/forgot-password` - Password reset

#### Temple Discovery

- `GET /api/temples` - Search temples by location/category
- `GET /api/temples/:id` - Temple details
- `GET /api/temples/nearby` - Find nearby temples

#### Booking System

- `POST /api/bookings` - Create puja booking
- `GET /api/bookings` - User's bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/:id/qr` - Generate QR code

#### Payment Processing

- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/refund` - Process refund
- `GET /api/payments/history` - Payment history

#### Classes & Store

- `GET /api/classes` - Available classes
- `POST /api/classes/:id/enroll` - Enroll in class
- `GET /api/store/products` - Temple store products
- `POST /api/store/cart/add` - Add to cart
- `POST /api/store/orders` - Create order

### Gaithri (Admin API) - Port 3002

#### Admin Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/create-admin` - Create temple admin
- `GET /api/auth/me` - Get admin profile

#### Dashboard Analytics

- `GET /api/dashboard/metrics` - Key metrics
- `GET /api/dashboard/revenue` - Revenue analytics
- `GET /api/dashboard/visitors` - Visitor analytics
- `GET /api/dashboard/community` - Community metrics

#### Event Management

- `GET /api/events` - Temple events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `GET /api/events/:id/bookings` - Event attendees
- `DELETE /api/events/:id` - Cancel event

## 🛠️ Configuration

### Environment Variables

Both backends use similar environment configurations:

**Abhaya Hasta (.env)**

```env
NODE_ENV=development
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=temple_ecosystem_db
DB_USER=temple_admin
DB_PASSWORD=temple_password123
JWT_SECRET=abhaya_hasta_secret_key_2024
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

**Gaithri (.env)**

```env
NODE_ENV=development
PORT=3002
DB_HOST=postgres
DB_PORT=5432
DB_NAME=temple_ecosystem_db
DB_USER=temple_admin
DB_PASSWORD=temple_password123
JWT_SECRET=gaithri_admin_secret_key_2024
```

## 🧪 Testing the APIs

### Sample API Calls

```bash
# Register new user (Abhaya Hasta)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","phone":"9876543210","email":"john@example.com"}'

# Admin login (Gaithri)
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get temple list
curl http://localhost:3001/api/temples

# Get dashboard metrics (with admin token)
curl http://localhost:3002/api/dashboard/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📋 Service Management

### Docker Commands

```bash
# View service status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# Rebuild services after code changes
docker-compose up --build

# View logs
docker-compose logs -f [service_name]

# Scale services (if needed)
docker-compose up --scale abhaya-hasta-backend=2
```

### Health Monitoring

Both backends include health check endpoints:

```bash
# Check service health
curl http://localhost:3001/health
curl http://localhost:3002/health

# Docker health status
docker-compose ps
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**

   ```bash
   # Check what's using the port
   lsof -i :3001
   lsof -i :3002
   lsof -i :5432

   # Kill process or change ports in docker-compose.yml
   ```

2. **Database Connection Issues**

   ```bash
   # Check database is ready
   docker-compose logs postgres

   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

3. **Container Build Failures**
   ```bash
   # Clean build
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Logs and Debugging

```bash
# All service logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f abhaya-hasta-backend
docker-compose logs -f gaithri-backend
docker-compose logs -f postgres

# Execute commands in running container
docker exec -it abhaya_hasta_api sh
docker exec -it gaithri_admin_api sh
```

## 📈 Production Deployment

### Environment Setup

1. **Update Environment Variables**

   - Set strong JWT secrets
   - Configure real Razorpay keys
   - Set production database credentials
   - Configure SMTP settings for emails
   - Set up push notification services

2. **Security Considerations**

   - Enable HTTPS
   - Configure proper CORS origins
   - Set up rate limiting
   - Enable request logging
   - Set up monitoring and alerts

3. **Database Migration**
   - Use managed PostgreSQL service
   - Run migrations in production
   - Set up database backups
   - Configure read replicas if needed

### Docker Production Setup

```bash
# Create production docker-compose.prod.yml
# with appropriate configurations

docker-compose -f docker-compose.prod.yml up -d
```

## 💡 Features Implemented

### ✅ Complete Business Logic

- **User Authentication** with OTP verification
- **Temple Discovery** with search and filtering
- **Booking Management** with status tracking
- **Payment Processing** with Razorpay integration
- **Event Management** with attendee tracking
- **Class Enrollment** with waitlist support
- **Store Management** with inventory control
- **Analytics Dashboard** with real-time metrics

### ✅ Production Ready

- **Security Middleware** (Helmet, CORS, Rate Limiting)
- **Input Validation** with express-validator
- **Error Handling** with proper status codes
- **Health Checks** for monitoring
- **Database Transactions** for data integrity
- **Scheduled Tasks** for maintenance
- **Docker Support** for easy deployment

## 🤝 Integration with Frontend

The backends are designed to work seamlessly with the existing React frontends:

- **Abhaya Hasta Frontend**: Connect to `http://localhost:3001`
- **Gaithri Dashboard Frontend**: Connect to `http://localhost:3002`

Update the frontend API base URLs to point to these backend services.

---

**🎉 Backend Implementation Complete!** Both temple management applications now have fully functional APIs with real business logic, payment processing, and comprehensive data management.
