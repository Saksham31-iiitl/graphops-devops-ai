"""
retriever.py

Exposes the retrieve() function for querying the RAG vector store.
"""

import logging
from typing import List, Dict, Any

from rag.vectorstore import similarity_search

logger = logging.getLogger(__name__)


def retrieve(query: str, k: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieve the top-k most relevant document chunks for a query.

    Args:
        query: Natural language incident or DevOps query.
        k:     Number of results to return (default 5).

    Returns:
        List of dicts, each containing:
            - "text"     : str   – matched chunk content
            - "metadata" : dict  – source filename, type, chunk_index
            - "score"    : float – cosine similarity score (0–1)
    """
    if not query.strip():
        logger.warning("retrieve() called with empty query.")
        return []

    logger.info("Retrieving top-%d results for query: '%s'", k, query)
    results = similarity_search(query, k=k)
    logger.info("Retrieved %d results.", len(results))
    return results
