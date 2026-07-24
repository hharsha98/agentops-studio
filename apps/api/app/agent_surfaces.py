"""Aggregated views for research, MCP, and traces pages — derived from live runs."""

from __future__ import annotations

import json
from collections import Counter

from .data_files import demo_data_path
from .knowledge_base import list_documents
from .replay_store import get_workflow, list_run_details
from .schemas import (
    McpTool,
    McpToolListResponse,
    ResearchOverviewResponse,
    ResearchPipelineStep,
    TraceSummaryBar,
    TraceSummaryEvent,
    TraceSummaryResponse,
)

MCP_TOOLS_PATH = demo_data_path("mcp-tools.json")

RESEARCH_WORKFLOW_ID = "research-report"
RESEARCH_WORKSPACE_CARDS = [
    "Search queries",
    "Extracted pages",
    "Cited findings",
    "Confidence notes",
    "Competitor reports",
    "Source audit",
]

TRACE_TYPE_LABELS = {
    "run_started": "Prompt trace",
    "task_started": "Tool call",
    "task_completed": "Tool call",
    "llm_completion": "Token estimate",
    "approval_required": "Approval",
    "approval_completed": "Approval",
    "run_completed": "Citation",
    "llm_error": "Error",
}


def _load_mcp_catalog() -> list[McpTool]:
    with MCP_TOOLS_PATH.open() as file:
        raw = json.load(file)
    return [McpTool.model_validate(item) for item in raw["tools"]]


def _research_runs():
    return [run for run in list_run_details() if run.workflow_id == RESEARCH_WORKFLOW_ID]


def build_research_overview() -> ResearchOverviewResponse:
    runs = _research_runs()
    active_run = next((run for run in runs if run.status in {"running", "approval"}), None)
    if active_run is None and runs:
        active_run = runs[0]

    workflow = get_workflow(RESEARCH_WORKFLOW_ID)
    pipeline: list[ResearchPipelineStep] = []

    if active_run is not None:
        for index, task in enumerate(active_run.tasks[:4], start=1):
            status = task.status if task.status in {"backlog", "running", "done", "approval"} else "backlog"
            pipeline.append(
                ResearchPipelineStep(
                    step=f"{index:02d}",
                    title=task.title,
                    detail=task.artifact,
                    duration="—" if task.status == "backlog" else "live",
                    status=status,
                )
            )
    elif workflow is not None:
        defaults = [
            ("Query planning", "Market, customer, and internal context"),
            ("SearXNG search", "Ranked external sources"),
            ("Firecrawl extraction", "Clean page content and metadata"),
            ("Citation audit", "Confidence notes and source map"),
        ]
        for index, (title, detail) in enumerate(defaults, start=1):
            pipeline.append(
                ResearchPipelineStep(
                    step=f"{index:02d}",
                    title=title,
                    detail=detail,
                    duration="—",
                    status="backlog",
                )
            )

    documents = list_documents().documents
    research_docs = [doc for doc in documents if "research" in doc.tags or doc.source_type == "research"]

    return ResearchOverviewResponse(
        workflow_id=RESEARCH_WORKFLOW_ID,
        active_run_id=active_run.id if active_run else None,
        runs_total=len(runs),
        documents_total=len(research_docs),
        pipeline=pipeline,
        workspace_cards=RESEARCH_WORKSPACE_CARDS,
    )


def build_mcp_tools() -> McpToolListResponse:
    tools = _load_mcp_catalog()
    trace_text = " ".join(
        f"{event.title} {event.detail}"
        for run in list_run_details()
        for event in run.trace
    ).lower()

    enriched: list[McpTool] = []
    for tool in tools:
        mentions = tool.name.lower() in trace_text or tool.id in trace_text
        status = tool.status
        if mentions and status == "sandbox":
            status = "live"
        enriched.append(tool.model_copy(update={"recent_activity": mentions, "status": status}))

    return McpToolListResponse(total=len(enriched), tools=enriched)


def build_traces_summary() -> TraceSummaryResponse:
    runs = list_run_details()
    type_counts: Counter[str] = Counter()
    events: list[TraceSummaryEvent] = []

    for run in runs:
        for event in run.trace:
            label = TRACE_TYPE_LABELS.get(event.type, event.title)
            type_counts[label] += 1
            events.append(
                TraceSummaryEvent(
                    id=event.id,
                    run_id=run.id,
                    run_title=run.title,
                    timestamp=event.timestamp,
                    type=event.type,
                    label=label,
                    title=event.title,
                    detail=event.detail,
                    agent=event.agent,
                )
            )

    events.sort(key=lambda item: item.timestamp, reverse=True)
    max_count = max(type_counts.values(), default=1)

    waterfall = [
        TraceSummaryBar(
            label=label,
            count=count,
            width_percent=max(12, round((count / max_count) * 100)),
            duration=f"{count} events",
        )
        for label, count in type_counts.most_common(6)
    ]

    total_tokens = sum(run.metrics.tokens for run in runs)
    llm_events = sum(1 for event in events if event.type == "llm_completion")

    return TraceSummaryResponse(
        runs_total=len(runs),
        events_total=len(events),
        llm_events=llm_events,
        total_tokens=total_tokens,
        waterfall=waterfall,
        recent_events=events[:12],
    )
