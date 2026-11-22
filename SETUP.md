# ClinicPing - Quick Setup Guide

This guide will help you set up ClinicPing and access all services in one place.

## Prerequisites

1. **Docker Desktop** - Required for running all services
2. **Node.js 18+** - For building the frontend
3. **PostgreSQL** - Will be provided by Docker container

## Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/dr-rohan-shaik/clinic-ping.git
cd clinic-ping
```

### 2. Set Up Environment Variables
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

> **Note**: For local development, the default DATABASE_URL works with Docker.

### 3. Start All Services
```bash
# Start all Docker containers
docker compose -f docker/docker-compose.yml up -d
```

This will start:
- **PostgreSQL** (port 5432)
- **ClinicPing Web** (port 3000)
- **n8n** (port 5678)
- **pgAdmin** (port 5050)
- **Caddy** (ports 80/443)
- **Watchtower** (auto-update)

### 4. Seed the Database
```bash
# Run the seed script
npm run seed
# or
node scripts/seed.js
```

### 5. Access the Services

| Service | Local URL | Description |
|---------|-----------|-------------|
| **Dashboard** | http://localhost:3000/setup | Setup dashboard with quick links |
| **ClinicPing Web** | http://localhost:3000/dashboard | Main application |
| **n8n** | http://localhost:5678 | Workflow automation |
| **pgAdmin** | http://localhost:5050 | Database administration |

## Service Consolidation Dashboard

Access the unified dashboard at: **http://localhost:3000/setup**

The setup dashboard provides:
- ✅ Real-time service status monitoring
- 🚀 Quick access links to all services
- 📋 Setup instructions and troubleshooting
- 📊 Health check endpoints

### Dashboard Features

1. **Quick Access Panel** - One-click access to all services
2. **Service Status** - Visual indicators for running/stopped services
3. **Setup Wizard** - Step-by-step instructions for new deployments
4. **URL Copying** - One-click copy for service URLs

## Login Credentials

### Admin Account (Seeded)
```
Email: admin@demo.clinic
Password: (configured in .env as SEED_PASSWORD or default)
Role: Owner
```

### pgAdmin Login
```
Email: admin@clinicping.local
Password: admin123
```

> Change these credentials immediately after first login!

## Service Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           Caddy (HTTPS)                  │
                    │         Ports 80/443                    │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────┼───────────────────────┐
                    │                 │                       │
         ┌──────────▼──────┐ ┌────────▼────────┐   ┌─────────▼───────┐
         │  ClinicPing     │ │     n8n         │   │    pgAdmin      │
         │   Web (3000)    │ │   (5678)        │   │     (5050)      │
         │                 │ │                 │   │                 │
         └─────────┬───────┘ └────────┬────────┘   └─────────┬───────┘
                   │                    │                      │
                   └────────────────────┼──────────────────────┘
                                        │
                                  ┌─────▼─────┐
                                  │ PostgreSQL│
                                  │  (5432)   │
                                  │           │
                                  └───────────┘
```

## Development vs Production

### Development Setup
- Services run on `localhost` with port mappings
- Hot reload enabled for web app
- Debug mode active in n8n

### Production Setup
- Enable HTTPS via Let's Encrypt (automatic with Caddy)
- Configure proper authentication
- Set up environment variables in `.env.production`
- Consider using `docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d`

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <process-id> /F
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | findstr clinicping-postgres

# Check logs
docker logs clinicping-postgres
```

### Reset Everything
```bash
# Stop all containers
docker compose -f docker/docker-compose.yml down

# Remove volumes (WARNING: This deletes data!)
docker volume rm clinic-ping_postgres_data

# Start fresh
docker compose -f docker/docker-compose.yml up -d
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `NEXTAUTH_SECRET` | Auth secret (min 32 chars) | - |
| `NEXTAUTH_URL` | Base URL for authentication | http://localhost:3000 |
| `SEED_PASSWORD` | Password for seeded admin user | demo12345 |
| `N8N_HOST` | n8n host | localhost |
| `N8N_PORT` | n8n port | 5678 |

## Files Reference

- `docker-compose.yml` - Main Docker configuration
- `Caddyfile` - Reverse proxy configuration
- `.env.example` - Environment variable template
- `SETUP.md` - This setup guide
- `README.md` - Project documentation
- `PLAN.md` - Implementation plan

## Next Steps

1. [ ] Configure WhatsApp Business API credentials
2. [ ] Set up domain names
3. [ ] Enable HTTPS in production
4. [ ] Configure backup jobs
5. [ ] Test email notifications

## Support

For issues and feature requests, please open a GitHub issue.