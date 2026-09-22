from __future__ import annotations

import uuid
from typing import Any

from ..mcp import mcp_registry
from ..models import (
    AgentStepResult,
    Citation,
    RunRecord,
    RunStatus,
    SpanKind,
    TraceSpan,
    WorkflowDefinition,
)
from ..rag import knowledge_index
from ..store import store, utcnow
from .workflows import DEFAULT_GOALS, get_workflow


def _span(
    run_id: str,
    name: str,
    kind: SpanKind,
    *,
    parent_id: str | None = None,
    input_data: dict[str, Any] | None = None,
    output_data: dict[str, Any] | None = None,
    status: str = "ok",
    metadata: dict[str, Any] | None = None,
) -> TraceSpan:
    started = utcnow()
    ended = utcnow()
    span = TraceSpan(
        id=str(uuid.uuid4()),
        run_id=run_id,
        parent_id=parent_id,
        name=name,
        kind=kind,
        status=status,
        started_at=started,
        ended_at=ended,
        duration_ms=max(int((ended - started).total_seconds() * 1000), 1),
        input=input_data or {},
        output=output_data or {},
        metadata=metadata or {},
    )
    store.add_span(span)
    return span


class OrchestrationEngine:
    """Deterministic multi-agent DAG runner for the studio demo path.

    Agents call the MCP tool registry and RAG index. Optional live model
    enrichment is skipped unless configured — hiring-manager demos work offline.
    """

    def start_run(self, workflow_id: str, goal: str | None = None) -> RunRecord:
        workflow = get_workflow(workflow_id)
        if workflow is None:
            raise ValueError(f"Unknown workflow: {workflow_id}")

        now = utcnow()
        run = RunRecord(
            id=str(uuid.uuid4()),
            workflow_id=workflow.id,
            workflow_title=workflow.title,
            goal=goal or DEFAULT_GOALS.get(workflow.id, workflow.description),
            status=RunStatus.running,
            created_at=now,
            updated_at=now,
            mode="deterministic",
        )
        store.upsert_run(run)
        try:
            return self._execute(run, workflow)
        except Exception as exc:  # noqa: BLE001
            run.status = RunStatus.failed
            run.error = str(exc)
            run.updated_at = utcnow()
            store.upsert_run(run)
            _span(
                run.id,
                "run.failed",
                SpanKind.orchestrator,
                output_data={"error": str(exc)},
                status="error",
            )
            return run

    def _execute(self, run: RunRecord, workflow: WorkflowDefinition) -> RunRecord:
        root = _span(
            run.id,
            "orchestrator.plan",
            SpanKind.orchestrator,
            input_data={"goal": run.goal, "workflow": workflow.id},
            output_data={"agents": workflow.agents},
        )

        steps: list[AgentStepResult] = []
        citations: list[Citation] = []
        context: dict[str, Any] = {"goal": run.goal}

        for agent in workflow.agents:
            step = self._run_agent(run, agent, context, parent_id=root.id)
            steps.append(step)
            citations.extend(step.citations)
            context[agent] = step.summary
            if step.artifact:
                context["artifact"] = step.artifact

        # Deduplicate citations by source_id
        unique: dict[str, Citation] = {}
        for cite in citations:
            unique[cite.source_id] = cite

        run.steps = steps
        run.citations = list(unique.values())
        run.artifact = str(context.get("artifact") or steps[-1].summary)
        run.updated_at = utcnow()

        if workflow.requires_approval:
            run.status = RunStatus.approval
            _span(
                run.id,
                "approval.gate",
                SpanKind.approval,
                parent_id=root.id,
                input_data={"artifact_preview": run.artifact[:240]},
                output_data={"state": "awaiting_human_approval"},
            )
        else:
            run.status = RunStatus.done

        _span(
            run.id,
            "orchestrator.complete",
            SpanKind.artifact,
            parent_id=root.id,
            output_data={
                "status": run.status.value,
                "step_count": len(steps),
                "citation_count": len(run.citations),
            },
        )
        store.upsert_run(run)
        return run

    def approve_run(self, run_id: str) -> RunRecord:
        run = store.get_run(run_id)
        if run is None:
            raise ValueError("Run not found")
        if run.status != RunStatus.approval:
            raise ValueError(f"Run is not awaiting approval (status={run.status})")

        tool = mcp_registry.invoke(
            "slack_post",
            {"channel": "#exec-brief", "message": run.artifact or ""},
        )
        _span(
            run.id,
            "tool.slack_post",
            SpanKind.tool,
            input_data={"channel": "#exec-brief"},
            output_data=tool,
        )
        run.status = RunStatus.done
        run.updated_at = utcnow()
        store.upsert_run(run)
        _span(
            run.id,
            "approval.granted",
            SpanKind.approval,
            output_data={"status": "done", "action": "sandbox_slack_post"},
        )
        return run

    def _run_agent(
        self,
        run: RunRecord,
        agent: str,
        context: dict[str, Any],
        *,
        parent_id: str,
    ) -> AgentStepResult:
        goal = str(context.get("goal", ""))

        if agent == "orchestrator":
            summary = (
                f"Planned run for '{run.workflow_title}'. "
                f"Delegating specialist agents against goal: {goal[:160]}"
            )
            _span(
                run.id,
                "agent.orchestrator",
                SpanKind.agent,
                parent_id=parent_id,
                input_data={"goal": goal},
                output_data={"summary": summary},
            )
            return AgentStepResult(
                agent=agent,
                role="Plan and route",
                summary=summary,
            )

        if agent == "knowledge-analyst":
            tool = mcp_registry.invoke("knowledge_search", {"query": goal, "top_k": 3})
            _span(
                run.id,
                "tool.knowledge_search",
                SpanKind.tool,
                parent_id=parent_id,
                input_data={"query": goal},
                output_data=tool,
            )
            cites = knowledge_index.citations_for(goal, top_k=3)
            _span(
                run.id,
                "rag.retrieve",
                SpanKind.rag,
                parent_id=parent_id,
                output_data={"hits": len(cites)},
            )
            if cites:
                bullets = "\n".join(f"- [{c.title}] {c.excerpt[:120]}…" for c in cites)
                summary = f"Retrieved {len(cites)} knowledge hits:\n{bullets}"
            else:
                summary = "No knowledge hits for this query; continuing with research-only context."
            return AgentStepResult(
                agent=agent,
                role="RAG retrieval",
                summary=summary,
                citations=cites,
                tool_calls=["knowledge_search"],
            )

        if agent == "deep-research":
            tool = mcp_registry.invoke("web_search", {"query": goal, "limit": 3})
            _span(
                run.id,
                "tool.web_search",
                SpanKind.tool,
                parent_id=parent_id,
                input_data={"query": goal},
                output_data=tool,
            )
            results = (tool.get("result") or {}).get("results", [])
            source = (tool.get("result") or {}).get("source", "unknown")
            lines = [
                f"- {item.get('title')}: {item.get('snippet', '')[:140]}"
                for item in results
            ]
            summary = f"Web research via {source}:\n" + ("\n".join(lines) or "- No results")
            return AgentStepResult(
                agent=agent,
                role="Web research",
                summary=summary,
                tool_calls=["web_search"],
            )

        if agent == "compliance-reviewer":
            cites = knowledge_index.citations_for(
                "policy approval PII refund privacy slack",
                top_k=2,
            )
            _span(
                run.id,
                "agent.compliance",
                SpanKind.agent,
                parent_id=parent_id,
                output_data={"citations": [c.model_dump() for c in cites]},
            )
            risk = "medium" if "PII" in goal.upper() or "pii" in goal.lower() else "low"
            summary = (
                f"Compliance review complete. Residual risk: {risk}. "
                "External actions remain gated; drafts only until approval."
            )
            return AgentStepResult(
                agent=agent,
                role="Policy check",
                summary=summary,
                citations=cites,
            )

        if agent == "tool-operator":
            draft = self._compose_artifact(run, context)
            gmail = mcp_registry.invoke(
                "gmail_draft",
                {
                    "to": "exec@example.com",
                    "subject": f"[AgentOps Studio] {run.workflow_title}",
                    "body": draft,
                },
            )
            _span(
                run.id,
                "tool.gmail_draft",
                SpanKind.tool,
                parent_id=parent_id,
                output_data=gmail,
            )
            return AgentStepResult(
                agent=agent,
                role="Sandbox actions",
                summary="Prepared sandbox Gmail draft and Slack-ready brief (not sent).",
                tool_calls=["gmail_draft"],
                artifact=draft,
            )

        if agent == "workflow-evaluator":
            summary = (
                "Evaluator scorecard — completeness: pass, citations: "
                f"{'pass' if knowledge_index.documents else 'warn'}, "
                "latency: demo-deterministic, cost: $0 (offline studio mode)."
            )
            _span(
                run.id,
                "agent.evaluator",
                SpanKind.agent,
                parent_id=parent_id,
                output_data={"summary": summary},
            )
            artifact = self._compose_artifact(run, context)
            return AgentStepResult(
                agent=agent,
                role="Benchmark scorecard",
                summary=summary,
                artifact=artifact,
            )

        summary = f"Agent '{agent}' acknowledged goal and produced a placeholder note."
        _span(
            run.id,
            f"agent.{agent}",
            SpanKind.agent,
            parent_id=parent_id,
            output_data={"summary": summary},
        )
        return AgentStepResult(agent=agent, role="Specialist", summary=summary)

    def _compose_artifact(self, run: RunRecord, context: dict[str, Any]) -> str:
        knowledge = context.get("knowledge-analyst", "No knowledge step.")
        research = context.get("deep-research", "No research step.")
        compliance = context.get("compliance-reviewer", "No compliance step.")
        return (
            f"# {run.workflow_title}\n\n"
            f"**Goal:** {run.goal}\n\n"
            f"## Knowledge\n{knowledge}\n\n"
            f"## Research\n{research}\n\n"
            f"## Compliance\n{compliance}\n\n"
            "## Next action\n"
            "Await human approval before any external write (Slack/GitHub).\n"
        )


engine = OrchestrationEngine()
