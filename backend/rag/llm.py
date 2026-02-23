"""
llm.py

Wraps the Groq API to generate suggested fixes for incidents.
Free tier – no credit card required. Get a key at https://console.groq.com
"""

import os
import logging
from typing import List, Dict, Any

from groq import Groq

logger = logging.getLogger(__name__)

# llama-3.3-70b-versatile is fast, free, and highly capable on Groq
_MODEL = os.environ.get("GRAPHOPS_LLM_MODEL", "llama-3.3-70b-versatile")

_SYSTEM_PROMPT = (
    "You are GraphOps, an AI DevOps assistant. "
    "Given an incident description, relevant logs, and retrieved runbook/incident context, "
    "provide a concise, actionable suggested fix. Be specific. Use bullet points."
)


def _build_user_prompt(incident: str, logs: str, context: List[Dict[str, Any]]) -> str:
    context_lines: List[str] = []
    for i, chunk in enumerate(context, start=1):
        meta = chunk.get("metadata", {})
        source = meta.get("source", "unknown")
        doc_type = meta.get("type", "unknown")
        score = chunk.get("score", 0.0)
        text = chunk.get("text", "")
        context_lines.append(
            f"[{i}] Source: {source} ({doc_type}, score: {score:.2f})\n{text}"
        )

    context_block = "\n\n".join(context_lines) if context_lines else "No context retrieved."

    return (
        f"## Incident\n{incident}\n\n"
        f"## Logs\n{logs}\n\n"
        f"## Retrieved Context\n{context_block}\n\n"
        "Based on the above, provide a suggested fix."
    )


def generate_fix(incident: str, logs: str, context: List[Dict[str, Any]]) -> str:
    """
    Call the Groq API to generate a suggested fix.

    Args:
        incident: Incident description.
        logs:     Relevant log output.
        context:  List of retrieved RAG chunks (each with text, metadata, score).

    Returns:
        Suggested fix as a plain string.

    Raises:
        EnvironmentError: If GROQ_API_KEY is not set.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GROQ_API_KEY environment variable is not set. "
            "Get a free key at https://console.groq.com and export it before starting the server."
        )

    client = Groq(api_key=api_key)
    user_prompt = _build_user_prompt(incident, logs, context)

    logger.info("Calling Groq model '%s' for fix generation.", _MODEL)

    response = client.chat.completions.create(
        model=_MODEL,
        max_tokens=1024,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    fix = response.choices[0].message.content
    logger.info("Fix generated (%d chars).", len(fix))
    return fix
