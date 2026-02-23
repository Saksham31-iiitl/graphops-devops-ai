"""
vectorstore.py

Manages ChromaDB persistent vector store with sentence-transformers embeddings.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Dict, Any

import os
import chromadb
from sentence_transformers import SentenceTransformer

# Disable ChromaDB telemetry without importing Settings (avoids Pydantic V1 issues)
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

logger = logging.getLogger(__name__)

COLLECTION_NAME = "graphops_incidents"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
DB_PATH = Path(__file__).resolve().parent.parent / "chroma_db"

_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None
_embedder: SentenceTransformer | None = None


def _get_embedder() -> SentenceTransformer:
    """Lazy-load the sentence-transformers model."""
    global _embedder
    if _embedder is None:
        logger.info("Loading embedding model: %s", EMBED_MODEL_NAME)
        _embedder = SentenceTransformer(EMBED_MODEL_NAME)
    return _embedder


def get_vectorstore() -> chromadb.Collection:
    """
    Initialize and return the persistent ChromaDB collection.

    Returns:
        chromadb.Collection: The GraphOps incidents collection.
    """
    global _client, _collection
    if _collection is None:
        DB_PATH.mkdir(parents=True, exist_ok=True)
        logger.info("Initializing ChromaDB at: %s", DB_PATH)
        _client = chromadb.PersistentClient(path=str(DB_PATH))
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            "Collection '%s' ready. Documents: %d",
            COLLECTION_NAME,
            _collection.count(),
        )
    return _collection


def add_documents(documents: List[Dict[str, Any]]) -> None:
    """
    Embed and store documents in ChromaDB.

    Args:
        documents: List of dicts with keys:
                   - "text"     : str  – chunk content
                   - "metadata" : dict – source, type, chunk_index
                   - "id"       : str  – unique document ID
    """
    if not documents:
        logger.warning("add_documents called with empty list.")
        return

    collection = get_vectorstore()
    embedder = _get_embedder()

    texts = [doc["text"] for doc in documents]
    metadatas = [doc["metadata"] for doc in documents]
    ids = [doc["id"] for doc in documents]

    logger.info("Generating embeddings for %d chunks...", len(texts))
    embeddings = embedder.encode(texts, show_progress_bar=False).tolist()

    collection.add(
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )
    logger.info("Stored %d documents in collection.", len(documents))


def similarity_search(query: str, k: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieve the top-k most similar chunks for a given query.

    Args:
        query: Natural language query string.
        k:     Number of results to return (default 5).

    Returns:
        List of dicts with keys: text, metadata, score.
    """
    collection = get_vectorstore()
    embedder = _get_embedder()

    query_embedding = embedder.encode([query], show_progress_bar=False).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    output: List[Dict[str, Any]] = []
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    for text, metadata, distance in zip(documents, metadatas, distances):
        # ChromaDB cosine distance → similarity score (1 - distance)
        score = round(1.0 - distance, 4)
        output.append({"text": text, "metadata": metadata, "score": score})

    return output
