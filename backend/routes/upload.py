from fastapi import APIRouter, File, HTTPException, UploadFile

from services.cad_parser import ParseError, handle_upload

router = APIRouter(prefix="", tags=["upload"])


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        return await handle_upload(file)
    except ParseError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unexpected server error while processing upload") from exc
