"""File upload helpers for route handlers."""

from __future__ import annotations

import os
from uuid import uuid4

from flask import current_app
from werkzeug.utils import secure_filename


# Default allowed extensions for document uploads
DOCUMENT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

# Default allowed extensions for menu uploads  
MENU_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}


def save_uploaded_file(
    upload,
    allowed_extensions: set[str] | None = None,
    upload_folder: str | None = None,
) -> tuple[str, str]:
    """
    Save an uploaded file to the upload folder with a UUID-prefixed filename.

    Args:
        upload: The werkzeug FileStorage object from request.files
        allowed_extensions: Set of allowed file extensions including the dot
                            e.g. {".pdf", ".png"}. Defaults to DOCUMENT_EXTENSIONS.
        upload_folder: Absolute path to save directory.
                      Defaults to app config UPLOAD_FOLDER.

    Returns:
        A tuple of (stored_absolute_path, relative_path)
        where relative_path is suitable for storing in the database
        e.g. "uploads/abc123_document.pdf"

    Raises:
        ValueError: If filename is invalid or extension is not allowed.
    """
    if allowed_extensions is None:
        allowed_extensions = DOCUMENT_EXTENSIONS

    filename = secure_filename(upload.filename or "")
    if not filename:
        raise ValueError("Uploaded file name is invalid.")

    extension = os.path.splitext(filename)[1].lower()
    if extension not in allowed_extensions:
        allowed = ", ".join(sorted(allowed_extensions))
        raise ValueError(f"Unsupported file type. Allowed: {allowed}")

    if upload_folder is None:
        upload_folder = current_app.config.get("UPLOAD_FOLDER", "")

    os.makedirs(upload_folder, exist_ok=True)

    unique_filename = f"{uuid4().hex}_{filename}"
    stored_path = os.path.join(upload_folder, unique_filename)
    upload.save(stored_path)

    relative_path = os.path.join("uploads", unique_filename).replace("\\", "/")
    return stored_path, relative_path
