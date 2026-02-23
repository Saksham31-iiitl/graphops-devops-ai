"""
main.py

GraphOps RAG CLI – entry point for document ingestion and retrieval queries.

Usage:
    python main.py
"""

import sys
import logging
from pathlib import Path

# Ensure graphops_backend package root is on sys.path when run directly
sys.path.insert(0, str(Path(__file__).resolve().parent))

from rag.ingest import ingest_all_documents
from rag.retriever import retrieve

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
# Silence noisy third-party loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("huggingface_hub").setLevel(logging.WARNING)
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)

logger = logging.getLogger("graphops.main")


def run_cli() -> None:
    """Run the interactive CLI query loop."""
    print("\n" + "=" * 55)
    print("  GraphOps – AI-Driven DevOps Orchestrator (Phase 1)")
    print("=" * 55)

    # Ingest documents if the collection is empty
    added = ingest_all_documents()
    if added > 0:
        print(f"\n[+] Ingested {added} document chunks into the vector store.\n")
    elif added == -1:
        print("\n[*] Vector store already populated. Skipping ingestion.\n")
    else:
        print("\n[!] No .txt files found in data/runbooks/ or data/incidents/.")
        print("    Add .txt files to those folders and restart.\n")

    print("Type your incident or DevOps query below.")
    print("Press Ctrl+C or type 'exit' to quit.\n")

    while True:
        try:
            query = input("Enter incident query:\n> ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting GraphOps. Goodbye.")
            break

        if not query:
            print("  [!] Empty query. Please enter a valid question.\n")
            continue

        if query.lower() in {"exit", "quit", "q"}:
            print("Exiting GraphOps. Goodbye.")
            break

        results = retrieve(query)

        if not results:
            print("\n  No matching documents found.\n")
            continue

        print(f"\nTop Matches for: \"{query}\"\n" + "-" * 50)
        for rank, result in enumerate(results, start=1):
            source = result["metadata"].get("source", "unknown")
            doc_type = result["metadata"].get("type", "unknown")
            chunk_idx = result["metadata"].get("chunk_index", 0)
            score = result["score"]
            text_preview = result["text"][:300].replace("\n", " ")

            print(f"{rank}) Source     : {source}")
            print(f"   Type       : {doc_type}  |  Chunk: {chunk_idx}")
            print(f"   Score      : {score:.4f}")
            print(f"   Text       : {text_preview}...")
            print()

        print("-" * 50 + "\n")


if __name__ == "__main__":
    run_cli()
