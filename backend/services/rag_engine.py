from __future__ import annotations

import json
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1]
KNOWLEDGE_BASE_PATH = BASE_DIR / "knowledge_base" / "design_rules.txt"

_rules_cache: list[str] | None = None


def _load_rules() -> list[str]:
    global _rules_cache

    if _rules_cache is None:
        if not KNOWLEDGE_BASE_PATH.exists():
            raise FileNotFoundError(
                f"Knowledge base file not found: {KNOWLEDGE_BASE_PATH}"
            )

        _rules_cache = [
            line.strip()
            for line in KNOWLEDGE_BASE_PATH.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]

    return _rules_cache


def initialize_knowledge_base() -> None:
    _load_rules()


def query_relevant_rules(design_metadata: dict[str, Any], top_k: int = 5) -> list[str]:
    rules = _load_rules()

    query_text = json.dumps(design_metadata, sort_keys=True).lower()
    query_words = set(query_text.split())

    scored_rules = []

    for rule in rules:
        rule_lower = rule.lower()
        score = sum(1 for word in query_words if word in rule_lower)

        scored_rules.append((score, rule))

    scored_rules.sort(key=lambda x: x[0], reverse=True)

    return [rule for score, rule in scored_rules[:top_k] if score > 0]
