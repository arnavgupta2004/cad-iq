from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import chromadb
import google.generativeai as genai

BASE_DIR = Path(__file__).resolve().parents[1]
KNOWLEDGE_BASE_PATH = BASE_DIR / "knowledge_base" / "design_rules.txt"
CHROMA_DB_PATH = Path(os.environ.get("CHROMA_DB_PATH", str(BASE_DIR / "chroma_db")))
COLLECTION_NAME = "design_rules"

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

_collection = None


def get_embedding(text: str):
    response = genai.embed_content(model="models/text-embedding-004", content=text)
    return response["embedding"]


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=str(CHROMA_DB_PATH))
        _collection = client.get_or_create_collection(name=COLLECTION_NAME)
    return _collection


def _load_rules() -> list[str]:
    if not KNOWLEDGE_BASE_PATH.exists():
        raise FileNotFoundError(f"Knowledge base file not found: {KNOWLEDGE_BASE_PATH}")
    return [
        line.strip()
        for line in KNOWLEDGE_BASE_PATH.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def initialize_knowledge_base() -> None:
    rules = _load_rules()
    collection = _get_collection()

    if collection.count() > 0:
        return

    embeddings = [get_embedding(rule) for rule in rules]
    ids = [f"rule-{i}" for i in range(1, len(rules) + 1)]
    metadatas = [{"rule_number": i} for i in range(1, len(rules) + 1)]

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
    query_embedding = get_embedding(query_text)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )

    return results.get("documents", [[]])[0]
