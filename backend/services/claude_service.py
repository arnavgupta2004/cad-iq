from __future__ import annotations

import json
import os
from typing import Any

import google.generativeai as genai


genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

MODEL_NAME = "gemini-1.5-pro"
PROMPT_TEMPLATE = """You are a senior automotive design validation engineer with 20 years of experience.
       
       Analyze the following CAD design metadata against the provided design standards and rules.
       
       CAD Design Metadata:
       {design_metadata}
       
       Relevant Design Rules:
       {relevant_rules}
       
       You must return ONLY a valid JSON object with no extra text, markdown, or code fences, in this exact format:
       {{
         'compliance_score': <integer 0-100>,
         'summary': '<one sentence overall assessment>',
         'violations': [
           {{
             'id': 1,
             'rule': '<rule that was violated>',
             'severity': '<Critical|Major|Minor>',
             'finding': '<what specifically is wrong in this design>',
             'recommendation': '<how to fix it>'
           }}
         ]
       }}
       If no violations found, return an empty violations array and score of 100."""


class ValidationError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def validate_design(design_metadata: dict[str, Any], relevant_rules: list[str]) -> dict[str, Any]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValidationError("GEMINI_API_KEY is not set", status_code=500)

    prompt = PROMPT_TEMPLATE.format(
        design_metadata=json.dumps(design_metadata, indent=2, sort_keys=True),
        relevant_rules=json.dumps(relevant_rules, indent=2),
    )

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "response_mime_type": "application/json",
            },
        )
    except Exception as exc:
        raise ValidationError("Failed to get response from Gemini API", status_code=502) from exc

    raw_text = getattr(response, "text", "")
    if not raw_text:
        raise ValidationError("Gemini API returned an empty response", status_code=502)

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValidationError("Gemini API returned invalid JSON", status_code=502) from exc

    return parsed
