"""MCP server — JSON-RPC 2.0 over HTTP, Bearer token auth."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.board import Board
from app.models.group import Group
from app.models.item import Item
from app.api.deps import get_user_from_mcp_key

router = APIRouter(prefix="/mcp", tags=["mcp"])

TOOLS = [
    {
        "name": "list_board",
        "description": "List items on the board, optionally filtered by group or status.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "group_id": {"type": "integer", "description": "Filter by group ID"},
                "status": {"type": "string", "description": "Filter by status"},
            },
        },
    },
    {
        "name": "create_item",
        "description": "Create a new task item in a group.",
        "inputSchema": {
            "type": "object",
            "required": ["group_id", "title"],
            "properties": {
                "group_id": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "status": {"type": "string", "default": "triage"},
                "created_by": {"type": "string"},
            },
        },
    },
    {
        "name": "move_item",
        "description": "Move an item to a new status.",
        "inputSchema": {
            "type": "object",
            "required": ["item_id", "status"],
            "properties": {
                "item_id": {"type": "integer"},
                "status": {"type": "string"},
            },
        },
    },
    {
        "name": "update_item",
        "description": "Update an item's title, description, or metadata.",
        "inputSchema": {
            "type": "object",
            "required": ["item_id"],
            "properties": {
                "item_id": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "metadata": {"type": "object"},
            },
        },
    },
    {
        "name": "get_item",
        "description": "Get full detail for a single item.",
        "inputSchema": {
            "type": "object",
            "required": ["item_id"],
            "properties": {"item_id": {"type": "integer"}},
        },
    },
    {
        "name": "delete_item",
        "description": "Soft-delete an item.",
        "inputSchema": {
            "type": "object",
            "required": ["item_id"],
            "properties": {"item_id": {"type": "integer"}},
        },
    },
    {
        "name": "create_group",
        "description": "Create a new group with optional custom statuses.",
        "inputSchema": {
            "type": "object",
            "required": ["name"],
            "properties": {
                "name": {"type": "string"},
                "statuses": {"type": "array", "items": {"type": "string"}},
            },
        },
    },
    {
        "name": "list_groups",
        "description": "List all groups and their statuses.",
        "inputSchema": {"type": "object", "properties": {}},
    },
]


def _item_dict(item: Item) -> dict:
    return {
        "id": item.id,
        "group_id": item.group_id,
        "title": item.title,
        "description": item.description,
        "status": item.status,
        "metadata": item.metadata_,
        "created_by": item.created_by,
        "created_at": item.created_at.isoformat(),
        "updated_at": item.updated_at.isoformat(),
    }


def _get_board(user: User, db: Session) -> Board:
    board = db.query(Board).filter(Board.user_id == user.id).first()
    if not board:
        raise ValueError("No board found for user")
    return board


def _get_group(group_id: int, board: Board, db: Session) -> Group:
    group = db.query(Group).filter(Group.id == group_id, Group.board_id == board.id).first()
    if not group:
        raise ValueError(f"Group {group_id} not found")
    return group


def _get_item(item_id: int, board: Board, db: Session) -> Item:
    item = (
        db.query(Item)
        .join(Group)
        .filter(Item.id == item_id, Group.board_id == board.id, Item.deleted_at.is_(None))
        .first()
    )
    if not item:
        raise ValueError(f"Item {item_id} not found")
    return item


def handle_tool(name: str, params: dict, user: User, db: Session) -> dict:
    board = _get_board(user, db)

    if name == "list_groups":
        groups = db.query(Group).filter(Group.board_id == board.id).order_by(Group.position).all()
        return {"groups": [{"id": g.id, "name": g.name, "statuses": g.statuses, "position": g.position} for g in groups]}

    if name == "create_group":
        from app.models.group import DEFAULT_STATUSES
        pos = db.query(Group).filter(Group.board_id == board.id).count()
        group = Group(
            board_id=board.id,
            name=params["name"],
            statuses=params.get("statuses", DEFAULT_STATUSES.copy()),
            position=pos,
        )
        db.add(group)
        db.commit()
        return {"id": group.id, "name": group.name, "statuses": group.statuses}

    if name == "list_board":
        query = db.query(Item).join(Group).filter(Group.board_id == board.id, Item.deleted_at.is_(None))
        if "group_id" in params:
            query = query.filter(Item.group_id == params["group_id"])
        if "status" in params:
            query = query.filter(Item.status == params["status"])
        items = query.order_by(Item.created_at.desc()).all()
        return {"items": [_item_dict(i) for i in items]}

    if name == "create_item":
        group = _get_group(params["group_id"], board, db)
        status = params.get("status", group.statuses[0] if group.statuses else "triage")
        if status not in group.statuses:
            raise ValueError(f"Status '{status}' not in group statuses: {group.statuses}")
        item = Item(
            group_id=group.id,
            title=params["title"],
            description=params.get("description"),
            status=status,
            created_by=params.get("created_by", "agent"),
        )
        db.add(item)
        db.commit()
        return _item_dict(item)

    if name == "move_item":
        item = _get_item(params["item_id"], board, db)
        group = db.get(Group, item.group_id)
        if params["status"] not in group.statuses:
            raise ValueError(f"Status '{params['status']}' not in group statuses: {group.statuses}")
        item.status = params["status"]
        item.updated_at = datetime.now(timezone.utc)
        db.commit()
        return _item_dict(item)

    if name == "update_item":
        item = _get_item(params["item_id"], board, db)
        if "title" in params:
            item.title = params["title"]
        if "description" in params:
            item.description = params["description"]
        if "metadata" in params:
            item.metadata_ = params["metadata"]
        item.updated_at = datetime.now(timezone.utc)
        db.commit()
        return _item_dict(item)

    if name == "get_item":
        return _item_dict(_get_item(params["item_id"], board, db))

    if name == "delete_item":
        item = _get_item(params["item_id"], board, db)
        item.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return {"deleted": True, "id": item.id}

    raise ValueError(f"Unknown tool: {name}")


@router.post("/")
async def mcp_endpoint(
    request: Request,
    user: User = Depends(get_user_from_mcp_key),
    db: Session = Depends(get_db),
):
    body = await request.json()
    rpc_id = body.get("id")

    if body.get("method") == "tools/list":
        return JSONResponse({"jsonrpc": "2.0", "id": rpc_id, "result": {"tools": TOOLS}})

    if body.get("method") == "tools/call":
        tool_name = body["params"]["name"]
        tool_params = body["params"].get("arguments", {})
        try:
            result = handle_tool(tool_name, tool_params, user, db)
            return JSONResponse({"jsonrpc": "2.0", "id": rpc_id, "result": {"content": [{"type": "text", "text": str(result)}], "data": result}})
        except ValueError as e:
            return JSONResponse({"jsonrpc": "2.0", "id": rpc_id, "error": {"code": -32602, "message": str(e)}})
        except Exception as e:
            return JSONResponse({"jsonrpc": "2.0", "id": rpc_id, "error": {"code": -32603, "message": str(e)}}, status_code=500)

    return JSONResponse({"jsonrpc": "2.0", "id": rpc_id, "error": {"code": -32601, "message": "Method not found"}})
