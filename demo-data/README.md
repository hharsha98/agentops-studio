# Demo data

Fixtures that power the AgentOps Studio local demo.

## Layout

- `knowledge/` — markdown sources indexed by the RAG layer at API startup
- `workflows/` — optional replay metadata for documentation

## Safety

- Synthetic content only — no real customer data
- Public demo mode keeps GitHub / Gmail / Slack tools sandboxed
- Do not commit secrets; use `.env.example` for configuration templates
