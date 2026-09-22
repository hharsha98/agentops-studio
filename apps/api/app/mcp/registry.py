from __future__ import annotations

from typing import Any, Callable

import httpx

from ..config import settings
from ..models import McpTool
from ..rag import knowledge_index


ToolHandler = Callable[[dict[str, Any]], dict[str, Any]]


class McpRegistry:
    """MCP-style tool registry (studio sandbox).

    Tools are invokable through a uniform schema. Real private actions
    (GitHub/Gmail/Slack writes) stay sandboxed in public demo mode.
    """

    def __init__(self) -> None:
        self._tools: dict[str, McpTool] = {}
        self._handlers: dict[str, ToolHandler] = {}
        self._register_builtins()

    def _register(self, tool: McpTool, handler: ToolHandler) -> None:
        self._tools[tool.name] = tool
        self._handlers[tool.name] = handler

    def _register_builtins(self) -> None:
        self._register(
            McpTool(
                name="knowledge_search",
                description="Retrieve cited chunks from the studio RAG knowledge base.",
                category="rag",
                input_schema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "top_k": {"type": "integer", "default": 3},
                    },
                    "required": ["query"],
                },
            ),
            self._knowledge_search,
        )
        self._register(
            McpTool(
                name="web_search",
                description="Search the web via SearXNG (falls back to demo results if offline).",
                category="research",
                input_schema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "limit": {"type": "integer", "default": 3},
                    },
                    "required": ["query"],
                },
            ),
            self._web_search,
        )
        self._register(
            McpTool(
                name="run_status",
                description="Return studio runtime health and capability flags.",
                category="ops",
                input_schema={"type": "object", "properties": {}},
            ),
            self._run_status,
        )
        self._register(
            McpTool(
                name="slack_post",
                description="Sandbox Slack post — records intent only in public demo mode.",
                category="actions",
                sandbox=True,
                input_schema={
                    "type": "object",
                    "properties": {
                        "channel": {"type": "string"},
                        "message": {"type": "string"},
                    },
                    "required": ["message"],
                },
            ),
            self._slack_post,
        )
        self._register(
            McpTool(
                name="gmail_draft",
                description="Sandbox Gmail draft — never sends in public demo mode.",
                category="actions",
                sandbox=True,
                input_schema={
                    "type": "object",
                    "properties": {
                        "to": {"type": "string"},
                        "subject": {"type": "string"},
                        "body": {"type": "string"},
                    },
                    "required": ["subject", "body"],
                },
            ),
            self._gmail_draft,
        )
        self._register(
            McpTool(
                name="github_issue",
                description="Sandbox GitHub issue creation — simulated in public demo mode.",
                category="actions",
                sandbox=True,
                input_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "body": {"type": "string"},
                    },
                    "required": ["title"],
                },
            ),
            self._github_issue,
        )

    def list_tools(self) -> list[McpTool]:
        return list(self._tools.values())

    def get(self, name: str) -> McpTool | None:
        return self._tools.get(name)

    def invoke(self, name: str, arguments: dict[str, Any] | None = None) -> dict[str, Any]:
        if name not in self._handlers:
            return {"ok": False, "error": f"Unknown tool: {name}"}
        try:
            result = self._handlers[name](arguments or {})
            return {"ok": True, "tool": name, "result": result}
        except Exception as exc:  # noqa: BLE001 — surface tool errors to callers
            return {"ok": False, "tool": name, "error": str(exc)}

    def _knowledge_search(self, args: dict[str, Any]) -> dict[str, Any]:
        query = str(args.get("query", ""))
        top_k = int(args.get("top_k", 3))
        chunks = knowledge_index.retrieve(query, top_k=top_k)
        return {
            "query": query,
            "hits": [
                {
                    "id": c.id,
                    "document_id": c.document_id,
                    "title": c.title,
                    "excerpt": c.text[:280],
                    "score": c.score,
                }
                for c in chunks
            ],
        }

    def _web_search(self, args: dict[str, Any]) -> dict[str, Any]:
        query = str(args.get("query", ""))
        limit = int(args.get("limit", 3))
        live = self._searxng_search(query, limit)
        if live is not None:
            return {"query": query, "source": "searxng", "results": live}
        return {
            "query": query,
            "source": "demo-fallback",
            "results": [
                {
                    "title": "AgentOps Studio — multi-agent ops lab",
                    "url": "https://github.com/hharsha98/agentops-studio",
                    "snippet": "Portable studio for orchestration, RAG, MCP tools, and run traces.",
                },
                {
                    "title": "Agent Fleet — live Contabo demo product",
                    "url": "https://github.com/hharsha98/agentfleet",
                    "snippet": "Separate production-style multi-agent fleet product (not this repo).",
                },
                {
                    "title": f"Industry brief related to: {query}",
                    "url": "https://example.com/research",
                    "snippet": "Demo fallback citation used when SearXNG is unreachable.",
                },
            ][:limit],
        }

    def _searxng_search(self, query: str, limit: int) -> list[dict[str, str]] | None:
        try:
            with httpx.Client(timeout=3.0) as client:
                response = client.get(
                    f"{settings.searxng_url.rstrip('/')}/search",
                    params={"q": query, "format": "json"},
                )
                if response.status_code != 200:
                    return None
                data = response.json()
                results = []
                for item in data.get("results", [])[:limit]:
                    results.append(
                        {
                            "title": str(item.get("title", "Untitled")),
                            "url": str(item.get("url", "")),
                            "snippet": str(item.get("content", ""))[:240],
                        }
                    )
                return results or None
        except Exception:  # noqa: BLE001
            return None

    def _run_status(self, _args: dict[str, Any]) -> dict[str, Any]:
        return {
            "service": "agentops-api",
            "public_demo_mode": settings.public_demo_mode,
            "knowledge_documents": len(knowledge_index.documents),
            "knowledge_chunks": len(knowledge_index.chunks),
            "tools": len(self._tools),
        }

    def _slack_post(self, args: dict[str, Any]) -> dict[str, Any]:
        return {
            "mode": "sandbox",
            "posted": False,
            "channel": args.get("channel", "#ops"),
            "message_preview": str(args.get("message", ""))[:200],
            "note": "Public demo records intent only. Real Slack posts require private credentials.",
        }

    def _gmail_draft(self, args: dict[str, Any]) -> dict[str, Any]:
        return {
            "mode": "sandbox",
            "drafted": True,
            "sent": False,
            "to": args.get("to", "ops@example.com"),
            "subject": args.get("subject", ""),
            "note": "Draft-only in public demo mode.",
        }

    def _github_issue(self, args: dict[str, Any]) -> dict[str, Any]:
        return {
            "mode": "sandbox",
            "created": False,
            "simulated_number": 42,
            "title": args.get("title", ""),
            "note": "Simulated issue. Real GitHub writes require a sandbox token.",
        }


mcp_registry = McpRegistry()
