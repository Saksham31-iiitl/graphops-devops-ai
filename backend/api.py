"""
api.py

FastAPI application entry point. Handles app init, middleware, and lifespan only.
All route logic lives in routes.py.
"""

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from rag.ingest import ingest_all_documents
from routes import router

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("GraphOps API starting – running document ingestion…")
    ingest_all_documents()
    logger.info("Ingestion check complete. API ready.")
    yield


app = FastAPI(title="GraphOps API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
