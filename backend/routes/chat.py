from typing import Any

from fastapi import APIRouter, HTTPException

from services.claude_service import ValidationError, chat_with_context

router = APIRouter(prefix="", tags=["chat"])


@router.post("/chat")
def chat_endpoint(payload: dict[str, Any]):
    try:
        message = payload.get("message", "")
        design_metadata = payload.get("design_metadata", {})
        validation_result = payload.get("validation_result", {})
        conversation_history = payload.get("conversation_history", [])

        if not isinstance(message, str) or not message.strip():
            raise ValidationError("message must be a non-empty string", status_code=400)
        if not isinstance(design_metadata, dict):
            raise ValidationError("design_metadata must be an object", status_code=400)
        if not isinstance(validation_result, dict):
            raise ValidationError("validation_result must be an object", status_code=400)
        if not isinstance(conversation_history, list):
            raise ValidationError("conversation_history must be an array", status_code=400)

        reply, updated_history = chat_with_context(
            message=message,
            design_metadata=design_metadata,
            validation_result=validation_result,
            conversation_history=conversation_history,
        )
        return {"reply": reply, "conversation_history": updated_history}
    except ValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unexpected server error while processing chat") from exc
