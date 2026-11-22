# ClinicPing Runbook

## Table of Contents

1. [Emergency Procedures](#emergency-procedures)
2. [Backup and Restore](#backup-and-restore)
3. [Monitoring](#monitoring)
4. [Deployment](#deployment)
5. [Troubleshooting](#troubleshooting)
6. [Common Tasks](#common-tasks)

---

## Emergency Procedures

### Service Down

**Symptoms:** Website returns 502/503, Docker containers restarting

**Steps:**
```powershell
# Check container status
docker ps -a

# Check logs
docker logs clinicping-web
docker logs clinicping-postgres
docker logs clinicping-n8n

# Restart services
docker compose -f docker/docker-compose.yml restart

# If persistent, check disk space
wmic logicaldisk get size,freespace,caption
```

### Database Corruption

**Symptoms:** Queries failing, "relation does not exist"

**Steps:**
```powershell
# Stop application
docker compose -f docker/docker-compose.yml down

# Restore from latest backup
docker exec -i clinicping-postgres pg_restore \
  -U clinicping \
  -d clinicping \
  -v \
  < backup_$(date +%Y%m%d).sql

# Restart
docker compose -f docker/docker-compose.yml up -d
```

### WhatsApp Not Working

**Symptoms:** Reminders not sending, messages stuck

**Steps:**
1. Check n8n workflow status: `http://localhost:5678`
2. Verify WhatsApp credentials in `.env`
3. Check webhook URL in Meta Developer Console
4. Test template in n8n manually
5. Check message_log table for errors

---

## Backup and Restore

### Manual Backup

```powershell
# Create backup directory
mkdir backups

# Database backup (daily)
docker exec clinicping-postgres pg_dump -U clinicping clinicping \
  > backups/backup_$(Get-Date -Format "yyyyMMdd").sql

# Verify backup
docker exec clinicping-postgres pg_dump -U clinicping clinicping \
  --schema-only > backups/schema_$(Get-Date -Format "yyyyMMdd").sql
```

### Scheduled Backup (Cron)

Add to crontab:
```bash
# Daily backup at 2 AM IST
0 2 * * * docker exec clinicping-postgres pg_dump -U clinicping clinicping > /backups/backup_$(date +\%Y\%m\%d).sql

# Rotate old backups (keep 30 days)
0 3 * * * find /backups -name "*.sql" -mtime +30 -delete
```

### Restore from Backup

```powershell
# Stop services
docker compose -f docker/docker-compose.yml stop web n8n

# Restore database
docker exec -i clinicping-postgres psql -U clinicping clinicping < backups/backup_20240101.sql

# Start services
docker compose -f docker/docker-compose.yml start web n8n
```

### Backup Location

| Environment | Path | Retention |
|-------------|------|-----------|
| Local | `/backups/` | 30 days |
| S3 (Production) | `s3://clinicping-backups/` | 90 days |

---

## Monitoring

### Health Check Endpoints

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
docker exec clinicping-postgres pg_isready -U clinicping

# n8n health
curl http://localhost:5678/healthz
```

### Grafana Dashboard (Production)

Import JSON dashboard to monitor:
- Response times
- Error rates
- Database connections
- Container health
- WhatsApp message volume

### Alert Rules

| Metric | Threshold | Action |
|--------|-----------|--------|
| Web response time | > 2s | Page team |
| 5xx errors | > 10/min | Page team |
| DB connections | > 80% capacity | Scale up |
| Disk usage | > 85% | Clean up |
| n8n queue | > 100 | Check workflows |

---

## Deployment

### Development Deployment

```powershell
# Pull latest code
git pull origin develop

# Build
bun run build

# Restart with zero downtime
docker compose -f docker/docker-compose.yml up -d --build
```

### Production Deployment

```powershell
# Create release tag
git tag v1.0.0
git push origin v1.0.0

# Build and push
docker buildx build -f apps/web/Dockerfile \
  -t clinicping/web:v1.0.0 \
  -t clinicping/web:latest \
  --push .

# Deploy on server
ssh user@server "cd /opt/clinic-ping && docker compose pull && docker compose up -d"
```

### Rollback

```powershell
# If v1.0.0 has issues, rollback to v0.9.0
docker pull clinicping/web:v0.9.0
docker tag clinicping/web:v0.9.0 clinicping/web:latest
docker compose -f docker/docker-compose.yml up -d
```

### Database Migrations

```powershell
# Run migrations
bun run db:migrate

# Check pending migrations
bun run db:status

# Revert last migration (development only)
bun run db:drop
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Fails

**Symptoms:** Login returns 401, cannot access dashboard

**Check:**
```bash
# Verify .env has correct values
cat .env | grep -E "NEXTAUTH|DATABASE"

# Check database connectivity
docker exec clinicping-postgres psql -U clinicping -c "SELECT 1;"

# Check user exists
docker exec clinicping-postgres psql -U clinicping -c "SELECT * FROM users LIMIT 5;"
```

#### 2. WhatsApp Messages Not Sending

**Check:**
1. n8n credentials in env vars
2. WhatsApp Cloud API access token validity
3. Message template approval status
4. Webhook URL in Meta dashboard

#### 3. Port Already in Use

```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process
taskkill /PID <pid> /F
```

#### 4. Container Memory Issues

```powershell
# Check memory
docker stats

# Increase memory limit
# Edit docker-compose.yml, add:
# deploy:
#   resources:
#     limits:
#       memory: 2G
```

### Log Analysis

```powershell
# Recent errors
docker logs clinicping-web --tail 100 | grep ERROR

# Slow queries
docker logs clinicping-postgres | grep -i "duration:"

# n8n workflow failures
docker logs clinicping-n8n | grep -i "error"
```

---

## Common Tasks

### Add New Doctor

1. Login as owner
2. Go to Settings > Doctors
3. Fill form: Name, Email, Weekly Slots
4. Save

### Create Recall Rule

1. Go to Settings > Recall Rules
2. Add new rule:
   - Days after visit: 7
   - Template: recall_7d
3. Save

### Change Time Zone

Edit `.env`:
```env
NEXT_PUBLIC_TIMEZONE=Asia/Kolkata
```

Restart services:
```powershell
docker compose restart
```

### Update WhatsApp Templates

1. Create templates in Meta Business Manager
2. Get template names
3. Add to `.env`:
```env
REMINDER_24H_TEMPLATE=appointment_reminder_24h
REMINDER_2H_TEMPLATE=appointment_reminder_2h
```

### Export Data

```powershell
# Export all clinic data
docker exec clinicping-postgres pg_dump -U clinicping \
  -t appointments -t patients -t cash_entries \
  clinicping > export_$(date +%Y%m%d).sql

# Export as CSV
docker exec clinicping-postgres psql -U clinicping \
  -c "COPY (SELECT * FROM patients) TO STDOUT WITH CSV HEADER" \
  clinicping > patients_$(date +%Y%m%d).csv
```

### User Management

```sql
-- Create admin user
INSERT INTO users (id, clinic_id, name, email, password_hash, role)
VALUES (
  'uuid_generate_v4()',
  'clinic-uuid',
  'Admin User',
  'admin@clinic.com',
  crypt('password123', gen_salt('bf')),
  'owner'
);
```

---

## Security Checklist

Before any deployment:

- [ ] No secrets in git (check `git diff` for `.env`, keys, passwords)
- [ ] All env vars set correctly
- [ ] Database migrations applied
- [ ] HTTPS working (Caddy got certificate)
- [ ] Backups configured
- [ ] Monitoring active

---

## Contacts

| Service | Contact |
|---------|---------|
| Platform Maintainer | rohan@clinicping.com |
| WhatsApp Support | Meta Business Suite |
| n8n Community | n8n.io/discord |
| Docker Support | docker.com/support |

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0