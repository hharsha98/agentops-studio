from __future__ import annotations

import math
import re
from collections import Counter
from pathlib import Path

from ..config import settings
from ..models import Citation, KnowledgeChunk, KnowledgeDocument


_TOKEN = re.compile(r"[a-z0-9]{2,}")


def _tokenize(text: str) -> list[str]:
    return _TOKEN.findall(text.lower())


def _chunk_text(text: str, size: int = 500, overlap: int = 80) -> list[str]:
    words = text.split()
    if not words:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = min(len(words), start + size // 5)
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(words):
            break
        start = max(end - overlap // 5, start + 1)
    return chunks


class KnowledgeIndex:
    """Lightweight RAG index: chunked docs + TF-IDF style retrieval.

    Uses demo-data markdown files. No paid embedding API required.
    Postgres/pgvector is available in Compose for future vector upgrades;
    this studio path is deterministic and offline-friendly.
    """

    def __init__(self) -> None:
        self.documents: list[KnowledgeDocument] = []
        self.chunks: list[KnowledgeChunk] = []
        self._df: Counter[str] = Counter()
        self._chunk_tf: list[Counter[str]] = []

    def load(self, demo_dir: Path | None = None) -> None:
        root = Path(demo_dir or settings.demo_data_dir)
        knowledge_dir = root / "knowledge"
        self.documents.clear()
        self.chunks.clear()
        self._df.clear()
        self._chunk_tf.clear()

        if not knowledge_dir.exists():
            return

        for path in sorted(knowledge_dir.glob("**/*")):
            if path.suffix.lower() not in {".md", ".txt"}:
                continue
            text = path.read_text(encoding="utf-8")
            rel = str(path.relative_to(root))
            doc_id = path.stem
            title = path.stem.replace("-", " ").replace("_", " ").title()
            pieces = _chunk_text(text)
            for i, piece in enumerate(pieces):
                chunk = KnowledgeChunk(
                    id=f"{doc_id}-{i}",
                    document_id=doc_id,
                    title=title,
                    text=piece,
                )
                tokens = _tokenize(piece)
                tf = Counter(tokens)
                self._chunk_tf.append(tf)
                for term in tf:
                    self._df[term] += 1
                self.chunks.append(chunk)
            self.documents.append(
                KnowledgeDocument(
                    id=doc_id,
                    title=title,
                    path=rel,
                    source_type=path.suffix.lstrip(".").upper(),
                    chunk_count=len(pieces),
                    preview=text[:240].strip(),
                )
            )

    def retrieve(self, query: str, top_k: int = 3) -> list[KnowledgeChunk]:
        if not self.chunks:
            return []
        q_tokens = _tokenize(query)
        if not q_tokens:
            return []
        q_tf = Counter(q_tokens)
        n_docs = len(self.chunks)
        scored: list[tuple[float, KnowledgeChunk]] = []
        for idx, chunk in enumerate(self.chunks):
            tf = self._chunk_tf[idx]
            score = 0.0
            for term, qf in q_tf.items():
                if term not in tf:
                    continue
                idf = math.log((1 + n_docs) / (1 + self._df[term])) + 1.0
                score += (qf * tf[term]) * idf
            if score > 0:
                scored.append((score, chunk.model_copy(update={"score": round(score, 4)})))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [chunk for _, chunk in scored[:top_k]]

    def citations_for(self, query: str, top_k: int = 3) -> list[Citation]:
        return [
            Citation(
                source_id=chunk.document_id,
                title=chunk.title,
                excerpt=chunk.text[:220],
                score=chunk.score,
            )
            for chunk in self.retrieve(query, top_k=top_k)
        ]


knowledge_index = KnowledgeIndex()
