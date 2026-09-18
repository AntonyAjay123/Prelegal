import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

DEFAULT_CATALOG_PATH = Path(__file__).resolve().parent.parent.parent / "catalog.json"
DEFAULT_TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"

# mutual-nda-coverpage.md is a companion piece of the Mutual NDA, not an
# independently selectable document type.
EXCLUDED_FILENAMES = {"mutual-nda-coverpage.md"}


def get_catalog_path() -> Path:
    return Path(os.environ.get("CATALOG_PATH", str(DEFAULT_CATALOG_PATH)))


def get_templates_dir() -> Path:
    return Path(os.environ.get("TEMPLATES_DIR", str(DEFAULT_TEMPLATES_DIR)))


@dataclass(frozen=True)
class DocumentType:
    slug: str
    name: str
    description: str
    filename: str


def _slugify(filename: str) -> str:
    return filename.removesuffix(".md")


@lru_cache
def list_document_types() -> tuple[DocumentType, ...]:
    catalog = json.loads(get_catalog_path().read_text(encoding="utf-8"))
    return tuple(
        DocumentType(
            slug=_slugify(entry["filename"]),
            name=entry["name"],
            description=entry["description"],
            filename=entry["filename"],
        )
        for entry in catalog
        if entry["filename"] not in EXCLUDED_FILENAMES
    )


def get_document_type(slug: str) -> DocumentType | None:
    return next((doc for doc in list_document_types() if doc.slug == slug), None)


@lru_cache
def load_template(filename: str) -> str:
    return (get_templates_dir() / filename).read_text(encoding="utf-8")
