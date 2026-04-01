from __future__ import annotations

import math
from pathlib import Path
from typing import Any
from uuid import uuid4

import trimesh
from fastapi import UploadFile

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
STL_EXTENSIONS = {".stl"}
CAD_EXTENSIONS = {".step", ".stp", ".iges", ".igs"}


class ParseError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def ensure_upload_dir() -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


def sanitize_filename(filename: str | None) -> str:
    original = Path(filename or "upload.bin").name
    stem = Path(original).stem or "upload"
    suffix = Path(original).suffix.lower()
    safe_stem = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in stem)
    return f"{safe_stem}_{uuid4().hex[:8]}{suffix}"


async def save_upload_file(file: UploadFile) -> Path:
    destination = ensure_upload_dir() / sanitize_filename(file.filename)
    content = await file.read()
    if not content:
        raise ParseError("Uploaded file is empty", status_code=400)
    destination.write_bytes(content)
    await file.close()
    return destination


async def handle_upload(file: UploadFile) -> dict[str, Any]:
    saved_path = await save_upload_file(file)
    suffix = saved_path.suffix.lower()

    if suffix in STL_EXTENSIONS:
        return parse_stl(saved_path)
    if suffix in IMAGE_EXTENSIONS:
        return parse_image(saved_path)
    if suffix in CAD_EXTENSIONS:
        return parse_step_or_iges(saved_path)

    saved_path.unlink(missing_ok=True)
    raise ParseError(
        "Unsupported file format. Please upload STL, STEP, IGES, PNG, or JPG files.",
        status_code=415,
    )


def parse_image(path: Path) -> dict[str, Any]:
    return {
        "type": "image",
        "filename": path.name,
        "stored_path": str(path),
    }


def parse_step_or_iges(path: Path) -> dict[str, Any]:
    return {
        "type": "step",
        "filename": path.name,
        "stored_path": str(path),
        "note": "geometry extraction pending",
    }


def parse_stl(path: Path) -> dict[str, Any]:
    try:
        mesh = trimesh.load_mesh(path, force="mesh")
    except Exception as exc:
        path.unlink(missing_ok=True)
        raise ParseError("Failed to read STL file. The file may be corrupt.", status_code=400) from exc

    if mesh is None or mesh.is_empty:
        path.unlink(missing_ok=True)
        raise ParseError("Failed to parse STL geometry. The mesh is empty.", status_code=400)

    if isinstance(mesh, trimesh.Scene):
        combined = trimesh.util.concatenate(tuple(g for g in mesh.geometry.values()))
        mesh = combined

    try:
        edges = mesh.edges_unique_length
        extents = mesh.bounding_box.extents.tolist()
        min_edge = float(edges.min()) if len(edges) else 0.0
        max_edge = float(edges.max()) if len(edges) else 0.0

        return {
            "type": "stl",
            "filename": path.name,
            "stored_path": str(path),
            "bounding_box": {
                "x": round(float(extents[0]), 6),
                "y": round(float(extents[1]), 6),
                "z": round(float(extents[2]), 6),
            },
            "volume": round(_finite(mesh.volume), 6),
            "surface_area": round(_finite(mesh.area), 6),
            "faces": int(len(mesh.faces)),
            "vertices": int(len(mesh.vertices)),
            "edge_lengths": {
                "min": round(_finite(min_edge), 6),
                "max": round(_finite(max_edge), 6),
            },
            "watertight": bool(mesh.is_watertight),
        }
    except Exception as exc:
        raise ParseError("Failed to extract STL metadata.", status_code=400) from exc


def _finite(value: Any) -> float:
    numeric = float(value)
    return numeric if math.isfinite(numeric) else 0.0
