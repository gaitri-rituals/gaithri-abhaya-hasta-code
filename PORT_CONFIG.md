# Standardized Port Configuration

## Reserved Ports

| Service | Port | URL |
|---------|------|-----|
| **abhaya-hasta-backend** | 3000 | http://localhost:3000 |
| **sacred-ops-dashboard** | 8080 | http://localhost:8080 |
| PostgreSQL Database | 5432 | localhost:5432 |

## Configuration Files

### Backend (abhaya-hasta-backend)
- `.env`: `PORT=3000`
- `server.js`: Uses `process.env.PORT || 3000`
- `docker-compose.yml`: Maps `3000:3000`

### Dashboard (sacred-ops-dashboard)
- `vite.config.ts`: `port: 8080`
- `src/services/apiClient.ts`: `http://localhost:3000/api`
- `src/services/classesApi.ts`: `http://localhost:3000/api`
- `docker-compose.yml`: Maps `8080:8080`

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
