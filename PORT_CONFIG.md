# Standardized Port Configuration

## Reserved Ports (FROZEN)

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **abhaya-hasta-backend** | 3000 | http://localhost:3000 | Admin Dashboard Backend |
| **gaithri-backend** | 3002 | http://localhost:3002 | User App Backend |
| **sacred-ops-dashboard** | 8080 | http://localhost:8080 | Admin Dashboard Frontend |
| **culture-path-skeleton** | 8081 | http://localhost:8081 | User App Frontend |
| PostgreSQL Database | 5432 | localhost:5432 | Database |

## Service Mapping

### Main Code Paths (MCP)
- **gaithri-backend** (port 3002) ↔ **culture-path-skeleton** (port 8081) - User App
- **abhaya-hasta-backend** (port 3000) ↔ **sacred-ops-dashboard** (port 8080) - Admin Dashboard

## Configuration Files

### Admin Dashboard Backend (abhaya-hasta-backend)
- `.env`: `PORT=3000`
- `server.js`: Uses `process.env.PORT || 3000`
- `docker-compose.yml`: Maps `3000:3000`

### User App Backend (gaithri-backend)
- `server.js`: Uses `process.env.PORT || 3002`
- Default port: `3002`

### Admin Dashboard Frontend (sacred-ops-dashboard)
- `vite.config.ts`: `port: 8080`
- `src/services/apiClient.ts`: `http://localhost:3000/api`
- `src/services/classesApi.ts`: `http://localhost:3000/api`
- `docker-compose.yml`: Maps `8080:8080`

### User App Frontend (culture-path-skeleton)
- `vite.config.ts`: `port: 8081`
- `.env`: `VITE_API_BASE_URL=http://localhost:3002/api`

## Starting Servers

### Quick Start (Recommended)
```bash
./start-servers.sh
```

### Manual Start
```bash
# 1. Kill existing processes
lsof -ti :3000 :8080 | xargs kill -9

# 2. Start database
docker start temple_postgres

# 3. Start backend
cd backends/abhaya-hasta-backend
npm run dev &

# 4. Start dashboard
cd sacred-ops-dashboard
npm run dev &
```

## Stopping Servers

```bash
# Kill by port
lsof -ti :3000 :8080 | xargs kill -9

# Or use the PIDs from start-servers.sh output
kill <BACKEND_PID> <DASHBOARD_PID>
```

## Notes

- Always use these standardized ports to avoid configuration drift
- The `start-servers.sh` script automatically kills old processes on these ports
- Database must be running before starting the backend
- Backend must be running before dashboard can make API calls
