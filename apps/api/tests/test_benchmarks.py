from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_benchmark_report_returns_scored_runs_and_categories() -> None:
    response = client.get("/benchmarks")

    assert response.status_code == 200
    body = response.json()
    assert body["scenario_count"] == 50
    assert body["runs_evaluated"] >= 3
    assert 0 <= body["average_overall_score"] <= 100
    assert {"workflow_success", "citation_quality", "approval_safety", "cost_control", "traceability"}.issubset(
        {category["id"] for category in body["categories"]}
    )
    assert body["run_scores"][0]["overall_score"] >= 0


def test_benchmark_report_scores_approved_run_as_successful() -> None:
    create_response = client.post(
        "/runs/replay",
        json={
            "workflow_id": "executive-daily-brief",
            "goal": "Complete a run for benchmark scoring",
        },
    )
    run_id = create_response.json()["id"]
    client.post(f"/runs/{run_id}/advance")
    client.post(f"/runs/{run_id}/advance")
    client.post(f"/runs/{run_id}/advance")
    client.post(f"/runs/{run_id}/approve")

    response = client.get("/benchmarks")

    assert response.status_code == 200
    body = response.json()
    scored_run = next(score for score in body["run_scores"] if score["run_id"] == run_id)
    assert scored_run["status"] == "done"
    assert scored_run["workflow_success"] == 100
    assert scored_run["approval_safety"] == 100
    assert scored_run["overall_score"] >= 80
