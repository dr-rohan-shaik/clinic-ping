# ClinicPing - Implementation Plan

## Executive Summary

ClinicPing is a multi-clinic SaaS for Indian clinics that integrates WhatsApp appointment reminders, chat inbox, recall messages, and a simple cash book. The system leverages Chatwoot for WhatsApp messaging (reusing existing infrastructure) and n8n for automation workflows.

**STATUS:** InboxDesk/Chatwoot setup NOT found on this machine. This plan assumes Docker Desktop is available for containerized deployment.

---

## Current State Assessment

### InboxDesk/Chatwoot Setup
- **Status:** NOT FOUND
- **Searched locations:** Desktop, Projects, github-repos, selfhosted/, Downloads
- **Docker installation:** NOT FOUND in PATH or Program Files
- **Recommendation:** Install Docker Desktop first, then deploy Chatwoot

### Prerequisites
1. ✅ Windows 11 laptop with Docker (assumed available per requirements)
2. ❌ Docker Desktop installation (verified missing)
3. ❌ Chatwoot running (not found)
4. ❌ WhatsApp Business API credentials (not configured)

---

## Project Structure

```
clinic-ping/
├── apps/
│   └── web/                    # Next.js frontend (App Router)
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   ├── components/     # shadcn/ui components
│       │   ├── lib/            # Utilities, db, auth
│       │   └── styles/         # Tailwind config
│       └── package.json
├── packages/
│   ├── db/                     # Drizzle ORM schema & migrations
│   │   ├── schema/
│   │   ├── migrations/
│   │   └── package.json
│   └── ui/                     # Shared UI components
├── n8n/
│   └── workflows/              # Version-controlled workflow JSONs
├── docker/
│   ├── docker-compose.yml      # Main stack
│   └── nginx.conf             # Caddy for HTTPS
├── docs/
│   ├── architecture.md        # System architecture (Mermaid)
│   └── runbook.md            # Operations guide
├── .github/
│   └── workflows/
│       ├── ci.yml             # Lint, typecheck, test, build
│       └── dependabot.yml
├── .env.example               # Environment template
├── package.json               # Workspace root
└── README.md
```

---

## Scope Definition

### What We BUILD
1. **WhatsApp appointment reminders** - 24h and 2h before appointments with Confirm/Reschedule/STOP
2. **WhatsApp inbox with auto-replies** - Using Chatwoot as the messaging platform
3. **Follow-up/recall messages** - N days after completed visits
4. **Professional dashboard** - Cash book (inflow/outflow), reports

### What We DO NOT BUILD
- ❌ EMR/medical records
- ❌ Invoices/GST billing
- ❌ Patient self-booking portal
- ❌ AI diagnosis
- ❌ Lead engine / marketing analytics

---

## Technology Stack

| Layer | Technology | Version/Rationale |
|-------|------------|-------------------|
| Frontend | Next.js (App Router) | 14.x - SSR + React Server Components |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system |
| Charts | Recharts | Declarative, accessible |
| Icons | lucide-react | Open source, consistent |
| Database | PostgreSQL 16 | Multi-tenancy support |
| ORM | Drizzle ORM | Type-safe, migrations |
| Auth | Auth.js | Email+password, roles |
| Roles | owner, receptionist | RBAC |
| Automation | n8n (self-hosted) | Workflow orchestration |
| Messaging | Chatwoot | WhatsApp integration |
| WhatsApp | Meta Cloud API | Official provider |
| HTTPS | Caddy | Automatic Let's Encrypt |
| CI/CD | GitHub Actions | Monorepo workflow |
| Timezone | Asia/Kolkata | India Standard Time |
| Money | Integer paise | Avoid floating point |

---

## Core Data Model

```sql
-- Multi-tenancy via clinic_id (UUID, indexed)
clinics (
  id UUID PK,
  name TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

users (
  id UUID PK,
  clinic_id UUID FK,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT CHECK(role IN ('owner', 'receptionist')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

doctors (
  id UUID PK,
  clinic_id UUID FK,
  name TEXT,
  email TEXT,
  weekly_slots JSONB,  -- {mon: [{start: "09:00", end: "12:00"}]}
  breaks JSONB,         -- [{day: "monday", start: "11:00", end: "11:30"}]
  holidays JSONB,       -- Array of dates
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

patients (
  id UUID PK,
  clinic_id UUID FK,
  name TEXT,
  phone TEXT,
  opt_in_status BOOLEAN DEFAULT false,
  opt_in_at TIMESTAMP,
  opt_out_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
  -- NO medical data per requirements
)

appointments (
  id UUID PK,
  clinic_id UUID FK,
  patient_id UUID FK,
  doctor_id UUID FK,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status TEXT CHECK(status IN ('scheduled', 'confirmed', 'reschedule_requested', 'completed', 'no_show', 'cancelled')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
  -- Exclusion constraint: no overlapping appointments for same doctor
)

reminders (
  id UUID PK,
  clinic_id UUID FK,
  appointment_id UUID FK,
  type TEXT CHECK(type IN ('appointment_24h', 'appointment_2h', 'recall')),
  scheduled_for TIMESTAMP,
  status TEXT CHECK(status IN ('pending', 'sent', 'failed', 'cancelled')),
  wa_message_id TEXT,      -- WhatsApp message ID
  template TEXT,           -- Template name used
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

recall_rules (
  id UUID PK,
  clinic_id UUID FK,
  days_after_visit INTEGER,
  template TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

cash_entries (
  id UUID PK,
  clinic_id UUID FK,
  type TEXT CHECK(type IN ('inflow', 'outflow')),
  amount_paise INTEGER,     -- Stored as paise
  mode TEXT CHECK(mode IN ('cash', 'upi', 'card')),
  category TEXT,            -- For outflow: rent, salaries, supplies, lab_fees, other
  appointment_id UUID FK NULLABLE,
  created_by UUID FK,       -- user_id
  note TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

message_log (
  id UUID PK,
  clinic_id UUID FK,
  direction TEXT CHECK(direction IN ('inbound', 'outbound')),
  wa_message_id TEXT,
  from_number TEXT,
  to_number TEXT,
  body TEXT,
  status TEXT,
  processed JSONB,          -- n8n processing info
  created_at TIMESTAMP
)

audit_log (
  id UUID PK,
  clinic_id UUID FK,
  user_id UUID FK,
  action TEXT,              -- login, export, delete, etc.
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP
)
```

---

## Multi-Tenancy Security

### Row-Level Security (PostgreSQL)
```sql
-- RLS enabled on all tenant tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Policy: user can only see their clinic's data
CREATE POLICY clinic_isolation ON appointments
  USING (clinic_id = current_setting('app.current_clinic_id')::uuid);
```

### Application-Level Checks
- Middleware sets `app.current_clinic_id` from session
- All queries filtered by `clinic_id`
- Automated tests: **clinic_a_cannot_access_clinic_b**

---

## WhatsApp Integration Design

### Webhook Architecture (Critical Decision)

**Problem:** A WhatsApp number can only send webhooks to ONE endpoint. Chatwoot claims inbound webhook, Meta Cloud API needs webhook for button replies.

**Proposed Solution:** Hybrid approach

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────┐
│  WhatsApp       │────▶│  Webhook     │────▶│  Chatwoot     │
│  Cloud API      │     │  (single)    │     │  (receives    │
│                 │◀────│              │────▶│   inbound,    │
│  Templates      │     │  → n8n via   │     │   outbound   │
│  (outbound)     │     │  webhook     │     │   messages)   │
└─────────────────┘     └──────────────┘     └───────┬───────┘
                                                     │
                                                     ▼
                                              ┌───────────────┐
                                              │  n8n          │
                                              │  (processes   │
                                              │   button      │
                                              │   replies,    │
                                              │   updates DB) │
                                              └───────┬───────┘
                                                      │
                                                      ▼
                                             ┌────────────────┐
                                             │  Postgres DB   │
                                             │  (appointments)│
                                             └────────────────┘
```

### Button Reply Flow
1. User presses "Confirm" → WhatsApp webhook → Chatwoot
2. Chatwoot forwards message to n8n via webhook URL
3. n8n:
   - Validates HMAC signature
   - Checks idempotency key (message_id)
   - Updates appointment.status = 'confirmed'
   - Sends confirmation message back via Chatwoot API
4. Owner dashboard shows updated status

### Opt-Out Handling
- STOP keyword stops ALL future messages
- Record `opt_out_at` timestamp
- n8n checks before any outbound message

---

## n8n Workflows (JSON exports)

| Workflow | Trigger | Actions |
|----------|---------|---------|
| reminder-scheduler | Every 5 min | Query due reminders → Send WhatsApp → Log → Retry with backoff |
| inbound-replies | Webhook from Chatwoot | Parse Confirm/Reschedule/STOP → Update DB |
| recall-daily | Daily 10:00 IST | Find due recalls → Filter opt-outs → Check quiet hours (9pm-8am) → Send |
| monthly-owner-report | 1st of month | Generate stats → Send WhatsApp summary |
| error-alerts | Any workflow failure | Alert owner via WhatsApp/email |

---

## UI Design Tokens

```css
/* Tokens from CareCode screenshot */
--color-primary: #F97316 → #EA580C (orange gradient)
--color-bg: #FAFAFA
--color-card: #FFFFFF
--color-border: #E5E7EB
--color-text: #111827
--color-muted: #6B7280
--radius: 12-16px
--shadow: subtle

/* KPI Cards */
--card-primary-gradient: orange (Today's Appointments)
--card-white: other 3 cards
```

---

## Milestone Plan

### M0: Repository Setup, Docker Compose, CI/CD
**Duration:** 1-2 days

**Deliverables:**
- [ ] GitHub repo created (or use existing)
- [ ] Initial folder structure
- [ ] Docker Compose with: app, postgres, n8n, chatwoot (if found), caddy
- [ ] .env.example with all required variables
- [ ] CI workflow (lint, typecheck, test, build)
- [ ] Dependabot configuration

**Verification commands:**
```powershell
cd clinic-ping
docker compose up -d
docker compose down
```

### M1: Auth, Tenancy, RLS, Design System
**Duration:** 3-4 days

**Deliverables:**
- [ ] Next.js app scaffold (App Router)
- [ ] Auth.js configuration (email+password)
- [ ] Role-based access control
- [ ] PostgreSQL schema with RLS policies
- [ ] Design system (Tailwind + shadcn/ui)
- [ ] Dark/light mode toggle
- [ ] Clinic switcher

### M2: Doctors & Slots, Appointments
**Duration:** 3-4 days

**Deliverables:**
- [ ] Doctor management (CRUD)
- [ ] Weekly slots, breaks, holidays
- [ ] Appointment booking (receptionist only)
- [ ] Slot grid UI
- [ ] Exclusion constraint (no double booking)
- [ ] CSV import/export

### M3: Patients & Consent
**Duration:** 2 days

**Deliverables:**
- [ ] Patient management
- [ ] Opt-in workflow (WhatsApp message)
- [ ] Opt-out handling
- [ ] Quiet hours enforcement

### M4: n8n Reminders & Replies
**Duration:** 3-4 days

**Deliverables:**
- [ ] WhatsApp Cloud API integration
- [ ] Template submission (24h, 2h reminders)
- [ ] n8n: reminder-scheduler workflow
- [ ] n8n: inbound-replies workflow
- [ ] Dashboard: message tracking

### M5: Chatwoot Auto-replies
**Duration:** 2 days

**Deliverables:**
- [ ] Chatwoot integration
- [ ] Auto-reply rules (timing, location, booking)
- [ ] Human handoff for medical questions
- [ ] Message log persistence

### M6: Recall Messages
**Duration:** 1-2 days

**Deliverables:**
- [ ] Recall rules configuration
- [ ] n8n: recall-daily workflow
- [ ] Template for recall messages
- [ ] Quiet hours enforcement

### M7: Cash Book
**Duration:** 2-3 days

**Deliverables:**
- [ ] Inflow: "Mark visit done" flow
- [ ] Outflow: add expense
- [ ] Daily/monthly totals
- [ ] CSV export
- [ ] Mode/Category split

### M8: Dashboard & Reports
**Duration:** 2-3 days

**Deliverables:**
- [ ] Welcome banner
- [ ] KPI row (4 cards + 4 cards)
- [ ] Latest conversations panel
- [ ] Human Handoff panel
- [ ] Cash Flow chart (Recharts)
- [ ] Today's appointments table
- [ ] Monthly reports

### M9: Hardening, Backups, HTTPS
**Duration:** 2 days

**Deliverables:**
- [ ] Security audit (no secrets, CSRF, rate limiting)
- [ ] Daily pg_dump, weekly restore test
- [ ] Caddy HTTPS with Let's Encrypt
- [ ] Production-ready deployment guide
- [ ] Monitoring & alerting

---

## Key Decisions Needed

### 1. Chatwoot Availability
**Decision:** Chatwoot not found. Need to either:
- Option A: Install Docker Desktop, deploy Chatwoot from official Docker images
- Option B: Use alternative WhatsApp business platform
- **Recommendation:** Install Docker Desktop and deploy Chatwoot as per requirements

### 2. WhatsApp Business API Credentials
**Status:** Not configured
**Action:** Need INR-billed Meta Cloud API account with:
- WhatsApp Business Account
- Phone number ID
- Webhook URL
- Pre-approved message templates

### 3. Docker Desktop Installation
**Command (PowerShell, as Admin):**
```powershell
# Download Docker Desktop installer
Invoke-WebRequest -Uri "https://desktop.docker.com/win/main/amd64/Docker Desktop Installer.exe" -OutFile "$env:TEMP\DockerDesktopInstaller.exe"

# Run installer silently (requires reboot)
Start-Process -FilePath "$env:TEMP\DockerDesktopInstaller.exe" -ArgumentList "install", "--quiet" -Wait

# Or manual: https://docs.docker.com/desktop/install/windows-install/
```

### 4. Port Allocation
| Service | Port | Local URL |
|---------|------|-----------|
| web | 3000 | http://localhost:3000 |
| postgres | 5432 | localhost:5432 |
| n8n | 5678 | http://localhost:5678 |
| chatwoot | 3001 | http://localhost:3001 |
| caddy | 80, 443 | https://clinic-ping.local |

---

## API Design

### Internal API (n8n ↔ App)

All n8n calls use HMAC-signed requests:

```
Headers:
  X-Timestamp: 1699900000
  X-Signature: sha256_hmac(timestamp + path + body, secret)
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/webhooks/n8n/replies | HMAC | Process button replies |
| GET | /api/reminders/due | Bearer | Get due reminders |
| POST | /api/reminders/{id}/send | Bearer | Send specific reminder |
| GET | /api/stats/monthly | Bearer | Monthly report data |
| GET | /api/appointments | Bearer | User's clinic appointments |
| POST | /api/appointments | Bearer | Create appointment |
| PATCH | /api/appointments/{id} | Bearer | Update appointment |
| GET | /api/patients | Bearer | List patients |
| POST | /api/patients | Bearer | Create patient |
| GET | /api/cash-entries | Bearer | Get cash entries |
| POST | /api/cash-entries | Bearer | Create cash entry |

---

## Testing Strategy

### Unit Tests (Vitest)
- Slot conflict detection
- Reminder scheduling logic
- Cash total calculations
- Tenant isolation verification

### Integration Tests
- API endpoint authentication
- RLS policy enforcement
- WhatsApp message flow

### E2E Tests (Playwright)
- Login flow
- Appointment creation
- WhatsApp reminder trigger
- Cash book entry

### Test Coverage
- **Target:** 80%+ minimum
- **Command:** `npm test && npm run coverage`

---

## Security Checklist

- [ ] No hardcoded secrets (env vars only)
- [ ] Password hashing (bcrypt/argon2)
- [ ] CSRF protection
- [ ] Rate limiting (auth, webhooks)
- [ ] Input validation (Zod schemas)
- [ ] Audit logging (logins, exports, deletes)
- [ ] HIPAA/DPDP compliance (no medical data storage)
- [ ] Secure cookies (HttpOnly, SameSite, Secure)

---

## Assumptions & Dependencies

### Assumptions
1. User has WhatsApp Business API account with templates pre-approved
2. Docker Desktop can be installed on Windows 11
3. PostgreSQL credentials and backup storage are provided
4. Meta Cloud API credentials are available

### Dependencies
1. Docker Desktop (required)
2. Node.js 20+ (via Docker)
3. WhatsApp Business Account (separate setup)
4. Domain name for HTTPS (optional, Caddy can use self-signed)

---

## Next Steps

1. **Install Docker Desktop**
   ```powershell
   # Run as Administrator
   Set-ExecutionPolicy Bypass -Scope Process -Force
   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
   Invoke-WebRequest -Uri "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -OutFile "$env:TEMP\DockerDesktopInstaller.exe"
   Start-Process -FilePath "$env:TEMP\DockerDesktopInstaller.exe" -ArgumentList "install", "--quiet" -Wait
   ```
   *Requires system reboot after installation*

2. **Deploy Chatwoot** (after Docker is running)
   ```powershell
   cd clinic-ping/docker
   docker compose -f docker-compose.yml --profile chatwoot up -d
   ```

3. **Wait for my approval** before proceeding to M0 implementation

---

## Questions for You

1. **Docker Desktop:** Should I proceed with Docker Desktop installation commands, or do you have it installed but just need to start it?

2. **Chatwoot:** Since Chatwoot wasn't found in your setup, should I include it in the docker-compose.yml and help you deploy it?

3. **WhatsApp Credentials:** Do you have Meta Cloud API credentials ready, or should we start with mock templates for development?

4. **Domain/URL:** What domain should Caddy use for HTTPS? (e.g., clinic-ping.local or a real domain)

---

*This plan will be updated as we progress. Each milestone ends with verification instructions you can run.