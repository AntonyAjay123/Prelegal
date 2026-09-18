from app.document_registry import get_document_type, list_document_types


def test_lists_all_catalog_entries_except_the_nda_coverpage():
    slugs = {doc.slug for doc in list_document_types()}

    assert "mutual-nda" in slugs
    assert "csa" in slugs
    assert "mutual-nda-coverpage" not in slugs


def test_returns_exactly_eleven_document_types():
    assert len(list_document_types()) == 11


def test_get_document_type_resolves_by_slug():
    doc = get_document_type("mutual-nda")

    assert doc is not None
    assert doc.filename == "mutual-nda.md"
    assert doc.name == "Mutual Non-Disclosure Agreement"


def test_get_document_type_returns_none_for_unknown_slug():
    assert get_document_type("not-a-real-document") is None
