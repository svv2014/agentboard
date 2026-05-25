# Pre-Production Checklist

Everything needed before AgentBoard goes public / multi-tenant.
Items marked ✅ are already done. Items marked ⬜ are pending.

---

## Security & Isolation

- ✅ Tenant isolation via `board.user_id` FK chain (boards → groups → items)
- ✅ Body size limit: 64KB max per request
- ✅ Input validation: title (255), description (10K), metadata (50 keys)
- ✅ Rate limiting: 120 req/min per IP (slowapi)
- ⬜ Auth: Firebase ID token verification on every request
- ⬜ MCP keys per user: `mcp_keys` table + Bearer token → user_id lookup
- ⬜ Per-user rate limit (post-auth): key-based, not IP-based
- ⬜ Per-user item cap: free tier max 500 items (soft limit, configurable)
- ⬜ Postgres row-level security (optional, belt-and-suspenders on top of app-level)

---

## Abuse Prevention

- ✅ Rate limiting (IP-based, 120/min)
- ⬜ Per-MCP-key rate limit: free=100 req/day, paid=unlimited
- ⬜ Item history limit: free tier shows last 30 days, older rows hidden (not deleted)
- ⬜ Max groups per board: 20 (free), unlimited (paid)
- ⬜ Max items per group: 200 active (free), unlimited (paid)
- ⬜ Payload abuse: strip null bytes and control characters from text fields

---

## Infrastructure

- ⬜ Move DB from local Postgres → Cloud SQL (Postgres)
- ⬜ Add pgbouncer / Cloud SQL Proxy for connection pooling
- ⬜ Deploy FastAPI → Cloud Run (set max-instances=10 to cap billing)
- ⬜ Deploy frontend → Firebase Hosting or Cloud Run static
- ⬜ Secret management: env vars via GCP Secret Manager (not .env files)
- ⬜ HTTPS everywhere (Cloud Run provides this automatically)

---

## Observability

- ⬜ Structured logging (JSON) with request IDs
- ⬜ Error tracking: Sentry (FastAPI SDK, 5 min setup)
- ⬜ Health check endpoint that also pings DB: `GET /health` → check DB connection
- ⬜ Uptime monitoring: UptimeRobot or GCP uptime checks on /health
- ⬜ Slow query logging in Postgres

---

## Auth & Multi-tenancy

- ⬜ Firebase project setup (free tier handles thousands of users)
- ⬜ Backend: `firebase-admin` token verification middleware
- ⬜ DB migration: add `users` table (firebase_uid, email, created_at)
- ⬜ DB migration: add `mcp_keys` table (user_id FK, key, name, revoked_at)
- ⬜ DB migration: add `user_id` FK to `boards` table
- ⬜ Auto-create board + default group on first login
- ⬜ Frontend: Firebase Auth UI (Google login + email/password)
- ⬜ Settings page: show MCP key, regenerate, revoke

---

## Reliability

- ⬜ Database migrations run on deploy (alembic upgrade head in startup)
- ⬜ Graceful shutdown (SIGTERM handler)
- ⬜ Async SQLAlchemy + asyncpg (swap from sync when load warrants it)
- ⬜ DB connection pool config: `pool_size=5, max_overflow=10`
- ⬜ Retry logic for transient DB errors

---

## Data & Privacy

- ⬜ Data deletion: `DELETE /users/me` wipes all user data (GDPR)
- ⬜ Export: `GET /users/me/export` returns full board as JSON
- ⬜ Privacy policy page (required for Firebase Auth + public product)
- ⬜ No PII in logs — redact email/key from log lines

---

## Nice-to-have (post-MVP)

- ⬜ Webhooks: POST to user-configured URL on item status change
- ⬜ Board sharing: read-only public link for a board
- ⬜ Drag-and-drop in web UI
- ⬜ Item comments / activity log
- ⬜ Slack / Telegram notifications on item updates
- ⬜ CLI tool: `agentboard list` / `agentboard create` for humans

---

## Deployment order (recommended)

1. Firebase auth + MCP keys (security first)
2. Cloud SQL + Cloud Run deploy
3. Rate limits per key (not IP)
4. Item/group caps per tier
5. Sentry + uptime monitoring
6. GDPR: delete + export endpoints
