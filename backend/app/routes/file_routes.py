"""File serving endpoint for database-stored blobs."""

from __future__ import annotations

from http import HTTPStatus

from flask import Blueprint, Response, jsonify

from ..extensions import db
from ..models import FileBlob

file_bp = Blueprint("files", __name__, url_prefix="/api/files")


@file_bp.route("/<int:blob_id>", methods=["GET"])
def serve_file(blob_id: int) -> Response:
    """Serve a file stored as a database blob."""
    blob = db.session.get(FileBlob, blob_id)
    if not blob:
        return jsonify({"error": "File not found."}), HTTPStatus.NOT_FOUND

    return Response(
        blob.file_data,
        mimetype=blob.mime_type,
        headers={
            "Content-Disposition": f'inline; filename="{blob.original_filename}"',
            "Content-Length": str(blob.file_size),
            "Cache-Control": "public, max-age=31536000",
        },
    )
