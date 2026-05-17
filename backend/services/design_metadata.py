from __future__ import annotations

from typing import Any


class MetadataError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


_REQUIRED_FIELDS = (
    "type",
    "filename",
    "bounding_box",
    "volume",
    "surface_area",
    "faces",
    "vertices",
    "edge_lengths",
    "watertight",
)


def ensure_stl_metadata(design_metadata: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(design_metadata, dict):
        raise MetadataError("design_metadata must be an object", status_code=400)

    if design_metadata.get("type") != "stl":
        raise MetadataError(
            "Only STL geometry metadata can be validated. Upload an STL file first.",
            status_code=400,
        )

    missing = [field for field in _REQUIRED_FIELDS if field not in design_metadata]
    if missing:
        raise MetadataError(
            f"Invalid STL metadata. Missing fields: {', '.join(missing)}",
            status_code=400,
        )

    bounding_box = design_metadata.get("bounding_box")
    if not isinstance(bounding_box, dict) or not all(axis in bounding_box for axis in ("x", "y", "z")):
        raise MetadataError("bounding_box must include x, y, and z dimensions.", status_code=400)

    edge_lengths = design_metadata.get("edge_lengths")
    if not isinstance(edge_lengths, dict) or not all(key in edge_lengths for key in ("min", "max")):
        raise MetadataError("edge_lengths must include min and max values.", status_code=400)

    return design_metadata
