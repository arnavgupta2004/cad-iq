from fastapi import APIRouter

from services.rag_engine import query_relevant_rules

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("/test")
def test_rules():
    dummy_query = {
        "component": "injection molded mounting bracket",
        "material": "ABS",
        "wall_thickness_mm": 1.2,
        "features": ["ribs", "bosses", "mounting holes"],
    }
    return {
        "query": dummy_query,
        "top_rules": query_relevant_rules(dummy_query, top_k=5),
    }
