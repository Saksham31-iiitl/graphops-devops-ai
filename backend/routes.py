"""
routes.py

All API route handlers for the GraphOps API.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException

from models import (
    IncidentRequest,
    IncidentResponse,
    IncidentRecord,
    IncidentSummary,
    Reference,
    StatusUpdate,
    StatusUpdateResponse,
)
from store import add_incident, get_all, get_by_id, update_status
from rag.retriever import retrieve
from rag.llm import generate_fix

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# POST /incident
# ---------------------------------------------------------------------------

@router.post("/incident", response_model=IncidentResponse)
def handle_incident(request: IncidentRequest) -> IncidentResponse:
    query = f"{request.incident} {request.logs}"

    references_raw = retrieve(query, k=5)

    suggested_fix = generate_fix(request.incident, request.logs, references_raw)

    references = [
        Reference(
            text=r["text"],
            source=r["metadata"].get("source", "unknown"),
            type=r["metadata"].get("type", "unknown"),
            score=r["score"],
        )
        for r in references_raw
    ]

    confidence_score = round(
        (sum(r.score for r in references) / len(references) * 100) if references else 0.0,
        2,
    )

    incident_id = str(uuid.uuid4())

    record = IncidentRecord(
        id=incident_id,
        title=request.incident,
        severity=request.severity,
        environment=request.environment,
        region=request.region,
        status="Investigating",
        created_at=datetime.now(timezone.utc),
        suggested_fix=suggested_fix,
        references=references,
        confidence_score=confidence_score,
    )
    add_incident(record)

    logger.info("Incident %s saved (severity=%s, env=%s, region=%s, confidence=%.2f)",
                incident_id, request.severity, request.environment,
                request.region, confidence_score)

    return IncidentResponse(
        id=incident_id,
        suggested_fix=suggested_fix,
        references=references,
        confidence_score=confidence_score,
    )


# ---------------------------------------------------------------------------
# GET /incidents
# ---------------------------------------------------------------------------

@router.get("/incidents", response_model=list[IncidentSummary])
def list_incidents(q: Optional[str] = None) -> list[IncidentSummary]:
    records = get_all(q)
    return [
        IncidentSummary(
            id=r.id,
            title=r.title,
            severity=r.severity,
            status=r.status,
            created_at=r.created_at,
        )
        for r in records
    ]


# ---------------------------------------------------------------------------
# PATCH /incidents/{id}/status
# ---------------------------------------------------------------------------

@router.patch("/incidents/{incident_id}/status", response_model=StatusUpdateResponse)
def patch_status(incident_id: str, body: StatusUpdate) -> StatusUpdateResponse:
    record = update_status(incident_id, body.status)
    if not record:
        raise HTTPException(status_code=404, detail="Incident not found")
    logger.info("Incident %s status updated to '%s'", incident_id, body.status)
    return StatusUpdateResponse(id=record.id, status=record.status)
