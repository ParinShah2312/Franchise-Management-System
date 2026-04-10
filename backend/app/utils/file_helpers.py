"""File upload helpers — stores files as binary blobs in the database."""

from __future__ import annotations

import os
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

DOCUMENT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
# Currently identical to DOCUMENT_EXTENSIONS, but kept separate for future divergence 
# (e.g. allowing video/higher-res files specifically for menus).
MENU_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

MIME_MAP = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def save_file_to_db(
    upload: FileStorage,
    allowed_extensions: set[str] | None = None,
) -> "FileBlob":
    """
    Read an uploaded file and create a FileBlob ORM object.

    Does NOT add to session or commit — caller is responsible.

    Args:
        upload: werkzeug FileStorage from request.files
        allowed_extensions: set of allowed extensions e.g. {".pdf", ".png"}

    Returns:
        Unsaved FileBlob instance

    Raises:
        ValueError: if filename is invalid or extension not allowed
    """
    from ..models import FileBlob

    if allowed_extensions is None:
        allowed_extensions = DOCUMENT_EXTENSIONS

    filename = secure_filename(upload.filename or "")
    if not filename:
        raise ValueError("Uploaded file name is invalid.")

    extension = os.path.splitext(filename)[1].lower()
    if extension not in allowed_extensions:
        allowed = ", ".join(sorted(allowed_extensions))
        raise ValueError(f"Unsupported file type. Allowed: {allowed}")

    file_data = upload.read()
    if not file_data:
        raise ValueError("Uploaded file is empty.")

    mime_type = MIME_MAP.get(extension, "application/octet-stream")

    return FileBlob(
        original_filename=filename,
        mime_type=mime_type,
        file_data=file_data,
        file_size=len(file_data),
    )
