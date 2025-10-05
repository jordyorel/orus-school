"""Compatibility layer exposing the backend FastAPI app under the ``app`` package.

This allows running ``uvicorn app.main:app`` from the project root, as suggested in
the README, without restructuring the existing backend package layout.
"""

from backend.app.main import app  # pragma: no cover

__all__ = ["app"]
