"""
models.py

All Pydantic request/response models for the GraphOps API.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Shared
# ---------------------------------------------------------------------------

class Reference(BaseModel):
    text: str
    source: str
    type: str        # "runbook" | "incident"
    score: float


# ---------------------------------------------------------------------------
# POST /incident
# ---------------------------------------------------------------------------

class IncidentRequest(BaseModel):
    incident: str
    logs: str
    severity: Literal["P1", "P2", "P3", "P4"]
    environment: str
    region: str


class IncidentResponse(BaseModel):
    id: str
    suggested_fix: str
    references: list[Reference]
    confidence_score: float


# ---------------------------------------------------------------------------
# In-memory record (full stored object)
# ---------------------------------------------------------------------------

class IncidentRecord(BaseModel):
    id: str
    title: str
    severity: Literal["P1", "P2", "P3", "P4"]
    environment: str
    region: str
    status: Literal["Investigating", "Resolved"]
    created_at: datetime
    suggested_fix: str
    references: list[Reference]
    confidence_score: float


# ---------------------------------------------------------------------------
# GET /incidents
# ---------------------------------------------------------------------------

class IncidentSummary(BaseModel):
    id: str
    title: str
    severity: str
    status: Literal["Investigating", "Resolved"]
    created_at: datetime


# ---------------------------------------------------------------------------
# PATCH /incidents/{id}/status
# ---------------------------------------------------------------------------

class StatusUpdate(BaseModel):
    status: Literal["Investigating", "Resolved"]


class StatusUpdateResponse(BaseModel):
    id: str
    status: str
