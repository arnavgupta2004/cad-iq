from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import chromadb
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).resolve().parents[1]
KNOWLEDGE_BASE_PATH = BASE_DIR / "knowledge_base" / "design_rules.txt"
CHROMA_DB_PATH = BASE_DIR / "chroma_db"
COLLECTION_NAME = "design_rules"
MODEL_NAME = "all-MiniLM-L6-v2"

_model: SentenceTransformer | None = None
_collection = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=str(CHROMA_DB_PATH))
        _collection = client.get_or_create_collection(name=COLLECTION_NAME)
    return _collection


def _load_rules() -> list[str]:
    if not KNOWLEDGE_BASE_PATH.exists():
        raise FileNotFoundError(f"Knowledge base file not found: {KNOWLEDGE_BASE_PATH}")
    return [line.strip() for line in KNOWLEDGE_BASE_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]


def _chunk_rules(rules: list[str]) -> list[str]:
    return rules


def initialize_knowledge_base() -> None:
    rules = _chunk_rules(_load_rules())
    collection = _get_collection()

    existing_count = collection.count()
    if existing_count > 0:
        return

    embeddings = _get_model().encode(rules).tolist()
    ids = [f"rule-{index}" for index in range(1, len(rules) + 1)]
    metadatas = [{"rule_number": index} for index in range(1, len(rules) + 1)]

    collection.add(
        ids=ids,
        documents=rules,
        embeddings=embeddings,
        metadatas=metadatas,
    )


def query_relevant_rules(design_metadata: dict[str, Any], top_k: int = 5) -> list[str]:
    collection = _get_collection()
    if collection.count() == 0:
        initialize_knowledge_base()

    query_text = json.dumps(design_metadata, sort_keys=True)
    query_embedding = _get_model().encode([query_text]).tolist()[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )
    return results.get("documents", [[]])[0]
