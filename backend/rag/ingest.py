"""
ingest.py

Loads .txt documents from data/runbooks/ and data/incidents/,
chunks them, attaches metadata, and stores them in ChromaDB.
"""

import logging
import hashlib
from pathlib import Path
from typing import List, Dict, Any

from rag.vectorstore import add_documents, get_vectorstore

logger = logging.getLogger(__name__)

DATA_ROOT = Path(__file__).resolve().parent.parent / "data"

CHUNK_SIZE = 600       # target chunk character length
CHUNK_OVERLAP = 100    # overlap between consecutive chunks


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """
    Split text into overlapping character-based chunks.

    Args:
        text:       Full document text.
        chunk_size: Maximum characters per chunk.
        overlap:    Characters shared between consecutive chunks.

    Returns:
        List of text chunks.
    """
    chunks: List[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == text_len:
            break
        start += chunk_size - overlap

    return chunks


def _load_files(directory: Path, doc_type: str) -> List[Dict[str, Any]]:
    """
    Read all .txt files in a directory and return chunked document dicts.

    Args:
        directory: Path to the folder.
        doc_type:  "runbook" or "incident".

    Returns:
        List of document dicts ready for add_documents().
    """
    documents: List[Dict[str, Any]] = []

    if not directory.exists():
        logger.warning("Directory does not exist, skipping: %s", directory)
        return documents

    txt_files = list(directory.glob("*.txt"))
    if not txt_files:
        logger.warning("No .txt files found in: %s", directory)
        return documents

    for filepath in txt_files:
        try:
            content = filepath.read_text(encoding="utf-8").strip()
        except Exception as exc:
            logger.error("Failed to read %s: %s", filepath.name, exc)
            continue

        if not content:
            logger.warning("Empty file skipped: %s", filepath.name)
            continue

        chunks = _chunk_text(content)
        logger.info("File '%s' → %d chunks", filepath.name, len(chunks))

        for idx, chunk in enumerate(chunks):
            # Deterministic ID: hash of source + chunk index
            doc_id = hashlib.md5(f"{filepath.name}::{idx}".encode()).hexdigest()
            documents.append(
                {
                    "id": doc_id,
                    "text": chunk,
                    "metadata": {
                        "source": filepath.name,
                        "type": doc_type,
                        "chunk_index": idx,
                    },
                }
            )

    return documents


def ingest_all_documents() -> int:
    """
    Ingest all runbook and incident documents into ChromaDB.

    Skips ingestion entirely if the collection already contains documents.

    Returns:
        Number of new documents added (-1 if skipped, 0 if no files found).
    """
    collection = get_vectorstore()
    existing_count = collection.count()

    if existing_count > 0:
        logger.info(
            "Collection already contains %d documents. Skipping ingestion.",
            existing_count,
        )
        return -1

    logger.info("Starting document ingestion...")

    all_docs: List[Dict[str, Any]] = []
    all_docs.extend(_load_files(DATA_ROOT / "runbooks", "runbook"))
    all_docs.extend(_load_files(DATA_ROOT / "incidents", "incident"))

    if not all_docs:
        logger.warning("No documents found to ingest.")
        return 0

    add_documents(all_docs)
    logger.info("Ingestion complete. Total chunks stored: %d", len(all_docs))
    return len(all_docs)
