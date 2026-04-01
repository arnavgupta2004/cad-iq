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
CHAT_SYSTEM_PROMPT = "You are CAD-IQ, an expert automotive design assistant. You have already analyzed the user's CAD design and found the following results: {validation_result}. The design metadata is: {design_metadata}. Answer the engineer's questions helpfully and concisely. Always refer to specific findings from the validation report when relevant."


class ValidationError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _ensure_api_key() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValidationError("GEMINI_API_KEY is not set", status_code=500)
    genai.configure(api_key=api_key)


def validate_design(design_metadata: dict[str, Any], relevant_rules: list[str]) -> dict[str, Any]:
    _ensure_api_key()

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


def chat_with_context(
    message: str,
    design_metadata: dict[str, Any],
    validation_result: dict[str, Any],
    conversation_history: list[dict[str, str]],
) -> tuple[str, list[dict[str, str]]]:
    _ensure_api_key()

    system_prompt = CHAT_SYSTEM_PROMPT.format(
        validation_result=json.dumps(validation_result, sort_keys=True),
        design_metadata=json.dumps(design_metadata, sort_keys=True),
    )

    contents = []
    updated_history: list[dict[str, str]] = []
    for item in conversation_history:
        role = item.get("role")
        text = item.get("content")
        if role not in {"user", "model"} or not isinstance(text, str) or not text.strip():
            continue
        contents.append({"role": role, "parts": [text]})
        updated_history.append({"role": role, "content": text})

    contents.append({"role": "user", "parts": [message]})
    updated_history.append({"role": "user", "content": message})

    try:
        model = genai.GenerativeModel(MODEL_NAME, system_instruction=system_prompt)
        response = model.generate_content(contents)
    except Exception as exc:
        raise ValidationError("Failed to get chat response from Gemini API", status_code=502) from exc

    reply = getattr(response, "text", "").strip()
    if not reply:
        raise ValidationError("Gemini API returned an empty chat response", status_code=502)

    updated_history.append({"role": "model", "content": reply})
    return reply, updated_history
