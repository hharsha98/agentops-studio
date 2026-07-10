import json
import re
from pathlib import Path

from .schemas import (
    KnowledgeDocument,
    KnowledgeDocumentListResponse,
    KnowledgeDocumentSummary,
    KnowledgeSearchResponse,
    KnowledgeSearchResult,
)


DATA_PATH = Path(__file__).resolve().parents[3] / "demo-data" / "knowledge-base.json"


def _load_documents() -> list[KnowledgeDocument]:
    with DATA_PATH.open() as file:
        raw = json.load(file)
    return [KnowledgeDocument.model_validate(document) for document in raw["documents"]]


DOCUMENTS = _load_documents()


def _tokens(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9]+", text.lower()) if len(token) > 2}


def list_documents() -> KnowledgeDocumentListResponse:
    summaries = []
    for document in DOCUMENTS:
        tags = sorted({tag for chunk in document.chunks for tag in chunk.tags})
        summaries.append(
            KnowledgeDocumentSummary(
                id=document.id,
                title=document.title,
                source_type=document.source_type,
                owner=document.owner,
                chunks_total=len(document.chunks),
                tags=tags,
            )
        )

    return KnowledgeDocumentListResponse(total=len(summaries), documents=summaries)


def search_knowledge(query: str, *, limit: int = 5) -> KnowledgeSearchResponse:
    query_tokens = _tokens(query)
    results: list[KnowledgeSearchResult] = []

    for document in DOCUMENTS:
        for chunk in document.chunks:
            searchable = " ".join([document.title, chunk.heading, chunk.content, " ".join(chunk.tags)])
            score = len(query_tokens & _tokens(searchable))
            if score == 0:
                continue

            results.append(
                KnowledgeSearchResult(
                    chunk_id=chunk.id,
                    document_id=document.id,
                    document_title=document.title,
                    heading=chunk.heading,
                    content=chunk.content,
                    citation=f"{document.title} / {chunk.heading}",
                    score=score,
                    tags=chunk.tags,
                )
            )

    ranked = sorted(results, key=lambda result: (-result.score, result.document_title, result.heading))[:limit]
    return KnowledgeSearchResponse(query=query, total=len(ranked), results=ranked)
