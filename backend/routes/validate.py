from typing import Any

from fastapi import APIRouter, HTTPException

from services.design_metadata import MetadataError, ensure_stl_metadata
from services.gemini_service import ValidationError, validate_design
from services.rag_engine import query_relevant_rules

router = APIRouter(prefix="", tags=["validation"])


@router.post("/validate")
def validate_endpoint(design_metadata: dict[str, Any]):
    try:
        design_metadata = ensure_stl_metadata(design_metadata)
        relevant_rules = query_relevant_rules(design_metadata)
        validation_result = validate_design(design_metadata, relevant_rules)
        return {
            "design_metadata": design_metadata,
            "relevant_rules": relevant_rules,
            "validation": validation_result,
        }
    except MetadataError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except ValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unexpected server error while validating design") from exc
