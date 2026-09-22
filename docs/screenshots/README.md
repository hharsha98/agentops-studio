# Screenshots

Captured from the **native** demo path (no Docker) on 2026-09-22:

| File | Page |
|---|---|
| [dashboard.png](./dashboard.png) | Live multi-agent run with citations / approval |
| [traces.png](./traces.png) | Internal run spans |
| [knowledge.png](./knowledge.png) | Seeded RAG documents |
| [mcp.png](./mcp.png) | MCP tool registry |

Reproduce:

```bash
bash scripts/dev-api.sh
npm run dev:web
# open http://localhost:3000/dashboard → Start multi-agent run
```
