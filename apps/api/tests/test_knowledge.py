from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_list_knowledge_documents_returns_seeded_sources() -> None:
    response = client.get("/knowledge/documents")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 3
    document_ids = {document["id"] for document in body["documents"]}
    assert {"support-policy", "executive-brief-runbook", "research-method"}.issubset(document_ids)


def test_knowledge_search_returns_ranked_chunks_with_citations() -> None:
    response = client.get("/knowledge/search", params={"query": "support approval customer message"})

    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "support approval customer message"
    assert body["total"] >= 1
    assert body["results"][0]["document_id"] == "support-policy"
    assert body["results"][0]["score"] > 0
    assert body["results"][0]["citation"].startswith("Support Escalation Policy / ")


def test_knowledge_search_requires_query() -> None:
    response = client.get("/knowledge/search", params={"query": "   "})

    assert response.status_code == 422
