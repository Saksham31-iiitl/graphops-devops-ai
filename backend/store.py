"""
store.py

In-memory incident store. Acts as a lightweight DB for the current server session.
All data is lost on server restart — replace with a real DB in a future phase.
"""

from typing import Optional
from models import IncidentRecord

_incidents: list[IncidentRecord] = []


def add_incident(record: IncidentRecord) -> None:
    _incidents.append(record)


def get_all(q: Optional[str] = None) -> list[IncidentRecord]:
    if q:
        q_lower = q.lower()
        return [r for r in _incidents if q_lower in r.title.lower()]
    return list(_incidents)


def get_by_id(incident_id: str) -> Optional[IncidentRecord]:
    for r in _incidents:
        if r.id == incident_id:
            return r
    return None


def update_status(incident_id: str, status: str) -> Optional[IncidentRecord]:
    for r in _incidents:
        if r.id == incident_id:
            r.status = status
            return r
    return None
