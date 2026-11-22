# ClinicPing Architecture

## System Architecture

```mermaid
graph TB
    subgraph "Internet"
        WA[WhatsApp Cloud API]
        WEB[Browser]
    end

    subgraph "Docker Network"
        direction TB
        CADDY[Caddy:80, 443]
        
        subgraph "Application Layer"
            WEB_UI[Next.js:3000]
            N8N[n8n:5678]
        end
        
        WEB_UI <--> N8N
        
        subgraph "Data Layer"
            DB[(PostgreSQL:16)]
        end
        
        subgraph "Admin Tools"
            PGADMIN[pgAdmin:5050]
        end
    end

    WA --> N8N
    WA --> WEB_UI
    WEB --> CADDY
    CADDY --> WEB_UI
    WEB_UI --> DB
    N8N --> DB
    PGADMIN --> DB

    style WEB_UI fill:#F97316,stroke:#EA580C,stroke-width:3px
    style N8N fill:#0EA5E9,stroke:#0284C7,stroke-width:3px
    style DB fill:#10B981,stroke:#059669,stroke-width:3px
    style CADDY fill:#8B5CF6,stroke:#7C3AED,stroke-width:3px
```

## Multi-Tenancy Architecture

```mermaid
erDiagram
    clinics ||--o{ users : has
    clinics ||--o{ doctors : employs
    clinics ||--o{ patients : manages
    clinics ||--o{ appointments : schedules
    clinics ||--o{ reminders : sends
    clinics ||--o{ recall_rules : defines
    clinics ||--o{ cash_entries : records
    clinics ||--o{ message_log : logs
    clinics ||--o{ audit_log : tracks

    users }|..|{ cash_entries : creates
    appointments ||--o{ reminders : triggers
    appointments ||--o{ cash_entries : uses
    appointments }|..|| patients : for
    appointments }|..|| doctors : with
```

## WhatsApp Integration Flow

```mermaid
sequenceDiagram
    participant User
    participant WA
    participant Webhook
    participant Chatwoot
    participant N8N
    participant DB
    participant App

    Note over User,App: Reminder Flow
    App->>DB: Query due reminders
    DB-->>App: Return pending reminders
    App->>Chatwoot: Send template message
    Chatwoot->>WA: Send via WhatsApp API
    WA->>User: Deliver message

    Note over User,App: Button Reply Flow
    User->>WA: Press Confirm/Reschedule/STOP
    WA->>Webhook: POST webhook
    Webhook->>Chatwoot: Forward message
    Chatwoot->>N8N: Webhook notification
    N8N->>N8N: Validate HMAC, check idempotency
    N8N->>DB: Update appointment/patient state
    DB-->>N8N: Confirmation
    N8N->>Chatwoot: Send confirmation message
    Chatwoot->>User: Delivery receipt
```

## Technology Decisions

### Why Next.js App Router?

1. **Server Components** - Reduces client bundle size
2. **Route Segments** - Better code splitting
3. **Built-in Optimization** - Automatic caching, images
4. **TypeScript First** - Strong typing throughout

### Why Drizzle ORM?

1. **Type Safety** - Full TypeScript support
2. **Schema-First** - Migrations from schema changes
3. **Lightweight** - Smaller than Prisma
4. **PostgreSQL Native** - Excellent Postgres support

### Why n8n?

1. **Visual Workflows** - Easy to understand and modify
2. **Community Nodes** - Extensive integration library
3. **Self-Hosted** - Data stays in your control
4. **JSON Export** - Version-controllable workflows

### Why Chatwoot?

1. **Open Source** - Free to use and modify
2. **WhatsApp Integration** - Official Meta integration
3. **Omnichannel** - Email, chat, WhatsApp in one
4. **Webhook System** - Flexible event handling

## Data Flow Diagram

```mermaid
flowchart TD
    subgraph "Frontend"
        A[Next.js App] --> B[Auth.ts]
        A --> C[Dashboard.tsx]
        A --> D[Appointments.tsx]
    end

    subgraph "Database"
        E[(PostgreSQL)]
    end

    subgraph "Automation"
        F[n8n Workflows]
    end

    subgraph "External"
        G[WhatsApp Cloud API]
        H[Chatwoot]
    end

    B --> E
    C --> E
    D --> E
    F --> E
    E --> F
    F --> G
    G --> H
    H --> F
```

## Security Layers

1. **Authentication** - NextAuth.js with bcrypt password hashing
2. **Authorization** - RBAC (owner, receptionist)
3. **Multi-Tenancy** - PostgreSQL Row Level Security + app checks
4. **Input Validation** - Zod schemas on all inputs
5. **Rate Limiting** - On auth endpoints and webhooks
6. **CSRF Protection** - Built-in NextAuth.js
7. **Secure Cookies** - HttpOnly, SameSite, Secure (in production)

## Deployment Architecture

```mermaid
graph LR
    A[DNS: clinicping.example.com] --> B[Caddy Reverse Proxy]
    B --> C[Next.js App]
    B --> D[n8n Editor/API]
    
    C --> E[(PostgreSQL)]
    D --> E
    
    F[Backup Cron] --> E
    G[Monitoring] --> E
```

### Production Deployment

1. **VPS Setup** - Ubuntu 22.04 LTS
2. **Docker Engine** - Container runtime
3. **Domain** - SSL certificate via Let's Encrypt (Caddy)
4. **Backup** - Daily pg_dump to cloud storage
5. **Monitoring** - Health checks via Caddy

## API Architecture

### REST API Endpoints

All endpoints require Bearer token or session authentication.

```typescript
// Internal API (n8n ↔ App)
// Routes: /api/internal/*
// Authentication: HMAC signature

interface InternalRequest {
  headers: {
    'X-Timestamp': string;
    'X-Signature': string;  // sha256_hmac(timestamp + path + body, secret)
  };
  body: any;
}

// Public API (frontend)
// Routes: /api/*
// Authentication: Session/JWT
```

### External API

WhatsApp Cloud API endpoints used:

- `POST /{phone-number-id}/messages` - Send messages
- `POST /{phone-number-id}/contacts` - Lookup contacts
- Webhooks - Receive message events

## Environment Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB | 50 GB SSD |
| PostgreSQL | 16.x | 16.x |
| Node.js | 20.x | 20.x |

## Scaling Considerations

1. **Read Replicas** - For reporting queries
2. **Redis Cache** - For session storage
3. **Load Balancer** - Multiple app instances
4. **Message Queue** - Kafka/RabbitMQ for high volume
5. **CDN** - Static assets, images