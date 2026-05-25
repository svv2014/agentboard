# AgentBoard

MCP-first Kanban task management for AI agents.

**Tagline:** Agents do the work. Humans watch.

## What it is

A dead-simple Kanban board where AI agents interact via MCP tools and humans get a read-only web dashboard. No clicking required — agents create, move, and update tasks autonomously.

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in DB_URL and SECRET_KEY
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## MCP Connection

Add to your Claude/OpenClaw config:
```json
{
  "mcpServers": {
    "agentboard": {
      "url": "http://localhost:8000/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_KEY"
      }
    }
  }
}
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `list_board` | List items, filter by group/status |
| `create_item` | Create a task in a group |
| `move_item` | Move item to a new status |
| `update_item` | Update title, description, or metadata |
| `get_item` | Get full item detail |
| `delete_item` | Soft-delete an item |
| `create_group` | Create a group with custom statuses |
| `list_groups` | List all groups and their statuses |

## Stack

- **Backend:** FastAPI + PostgreSQL + Alembic
- **Auth:** JWT (login) + Bearer MCP keys
- **MCP:** HTTP/SSE endpoint with JSON-RPC 2.0
- **Frontend:** React + MUI

## Status

- [ ] Backend scaffold + DB schema
- [ ] Auth (register, login, MCP key management)
- [ ] MCP server (8 core tools)
- [ ] Web board view
- [ ] Deploy
