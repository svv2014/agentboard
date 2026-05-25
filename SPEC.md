# AgentBoard — Spec

**Tagline:** Kanban task management designed for AI agents.  
**Model:** MCP-first. Web is read-only dashboard.  
**Status:** Concept / pre-build

---

## Problem

AI agents have no shared, structured place to track work. File-based queues (like jobs/queue/) are brittle. GitHub issues are overkill. Linear/Trello are built for humans clicking buttons, not agents calling tools.

## Solution

A dead-simple Kanban board where the primary actor is an AI agent via MCP. Humans log in to watch what's happening. Agents do the work.

---

## Core Concepts

### Board
A workspace. Each user has one or more boards.

### Group
A swimlane or category within a board. Each group has its own ordered list of statuses.

### Item
A task. Belongs to one group. Has:
- `title` (short)
- `description` (optional, can be long)
- `status` (one of the group's statuses)
- `created_at`, `updated_at`
- `created_by` (user or agent name)
- `metadata` (arbitrary JSON — for agents to store context)

### Status
Custom per group. Default set: `triage → todo → doing → blocked → done`.  
Items can jump to any status at any time (non-linear allowed).

---

## MCP Interface (primary)

All agent interaction happens through MCP tools:

```
create_item(group, title, description?, status?)
  → creates item in triage (or specified status)

move_item(item_id, status)
  → moves item to new status

update_item(item_id, title?, description?, metadata?)
  → updates item fields

list_board(board_id?, group?, status?)
  → returns filtered list of items

get_item(item_id)
  → full item detail

delete_item(item_id)
  → soft delete

create_group(name, statuses?)
  → creates a new group with custom statuses

list_groups()
  → returns all groups with their statuses
```

---

## Web Interface (secondary)

**Purpose:** Let the human see what agents are doing. Minimal clicks needed.

### Pages
- `/login` — email/password or magic link
- `/board` — Kanban view, grouped columns, filterable by group/status
- `/settings` — MCP key management, board settings, group/status config

### Features
- Read the board at a glance
- Drag items between statuses (nice to have, not MVP)
- MCP key: generate / revoke
- No required interaction — agents do everything

---

## Auth & MCP Keys

- User logs in → gets a personal MCP key (UUID)
- MCP key is scoped to their board(s)
- Key passed as Bearer token in MCP requests
- Keys can be revoked and regenerated

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Backend | FastAPI (Python) | Fast to build, easy MCP adapter |
| DB | PostgreSQL | Per-user data, simple schema |
| Auth | JWT + bcrypt | No OAuth complexity for MVP |
| MCP server | FastMCP or custom SSE | Plugs into Claude/OpenClaw directly |
| Frontend | Next.js (minimal) | Simple board view, static-friendly |
| Hosting | VPS / Railway / Fly.io | Simple deploy |

---

## MVP Scope

**In:**
- [ ] User registration + login
- [ ] MCP key generation
- [ ] MCP tools: create, move, update, list, get
- [ ] Default board + groups created on signup
- [ ] Web board view (read-only Kanban)
- [ ] Group + status management via MCP

**Out for now:**
- Notifications / webhooks
- Multi-user boards / sharing
- Comments on items
- File attachments
- Mobile app
- Drag-and-drop UI

---

## Data Model (simplified)

```sql
users         (id, email, password_hash, created_at)
mcp_keys      (id, user_id, key, name, created_at, revoked_at)
boards        (id, user_id, name, created_at)
groups        (id, board_id, name, statuses JSON, position, created_at)
items         (id, group_id, title, description, status, metadata JSON, 
               created_by, created_at, updated_at, deleted_at)
```

---

## MCP Connection (for Claude / OpenClaw)

```json
{
  "mcpServers": {
    "agentboard": {
      "url": "https://agentboard.app/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_KEY"
      }
    }
  }
}
```

Agent prompt addition:
```
You have access to AgentBoard via MCP. Use it to track tasks, 
move items through statuses, and maintain a backlog of ongoing work.
```

---

## Name Options
- **AgentBoard** (descriptive, clear)
- **ClawBoard** (fits OpenClaw ecosystem)
- **Backr** (short, product-y)
- **Taskraft** (task + craft)

---

## Next Steps
1. Confirm name + domain
2. Scaffold FastAPI backend + DB schema
3. Build MCP server (5 core tools)
4. Build minimal Next.js board view
5. Deploy MVP to test with OpenClaw agents
