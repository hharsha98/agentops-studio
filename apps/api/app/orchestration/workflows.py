from __future__ import annotations

from ..models import WorkflowDefinition


WORKFLOWS: dict[str, WorkflowDefinition] = {
    "executive-daily-brief": WorkflowDefinition(
        id="executive-daily-brief",
        title="Executive daily brief",
        description="Summarize ops activity from knowledge + research, draft a Slack brief, gate on approval.",
        agents=["orchestrator", "knowledge-analyst", "deep-research", "compliance-reviewer", "tool-operator"],
        outcome="Cited executive brief ready for Slack approval",
        requires_approval=True,
    ),
    "support-triage": WorkflowDefinition(
        id="support-triage",
        title="Support triage",
        description="Classify a support goal, retrieve policy answers, and draft a safe reply.",
        agents=["orchestrator", "knowledge-analyst", "compliance-reviewer", "tool-operator"],
        outcome="Policy-cited support draft",
        requires_approval=True,
    ),
    "product-research": WorkflowDefinition(
        id="product-research",
        title="Product research",
        description="Combine RAG playbooks with web research into a cited product memo.",
        agents=["orchestrator", "knowledge-analyst", "deep-research", "workflow-evaluator"],
        outcome="Cited product research memo",
        requires_approval=False,
    ),
    "compliance-review": WorkflowDefinition(
        id="compliance-review",
        title="Compliance review",
        description="Check a proposed action against policy docs and produce a risk note.",
        agents=["orchestrator", "knowledge-analyst", "compliance-reviewer"],
        outcome="Policy risk note with citations",
        requires_approval=False,
    ),
}


DEFAULT_GOALS: dict[str, str] = {
    "executive-daily-brief": (
        "Prepare today's executive brief covering support SLA risk, hiring pipeline, "
        "and product research priorities. Cite internal policy and include a Slack draft."
    ),
    "support-triage": (
        "A customer asked for a refund outside the 14-day window after a partial outage. "
        "Retrieve the support policy and draft a careful reply."
    ),
    "product-research": (
        "Compare our multi-agent ops studio positioning against a live fleet product. "
        "Cite internal playbooks and public research signals."
    ),
    "compliance-review": (
        "Review whether posting customer PII into a public Slack channel violates policy."
    ),
}


def list_workflows() -> list[WorkflowDefinition]:
    return list(WORKFLOWS.values())


def get_workflow(workflow_id: str) -> WorkflowDefinition | None:
    return WORKFLOWS.get(workflow_id)
