from app.services.document_chat import build_document_system_prompt


def test_prompt_lists_all_field_labels():
    prompt = build_document_system_prompt("Cloud Service Agreement", ("Customer", "Provider"), {})

    assert "Customer" in prompt
    assert "Provider" in prompt


def test_prompt_reports_missing_fields():
    prompt = build_document_system_prompt(
        "Cloud Service Agreement", ("Customer", "Provider", "Governing Law"), {"Customer": "Acme Inc"}
    )
    missing_line = prompt.split("Fields still missing:")[1]

    assert "Provider" in missing_line
    assert "Governing Law" in missing_line
    assert "Customer" not in missing_line


def test_prompt_reports_nothing_missing_once_all_fields_known():
    prompt = build_document_system_prompt(
        "Cloud Service Agreement",
        ("Customer", "Provider"),
        {"Customer": "Acme Inc", "Provider": "Widget Co"},
    )

    assert "none — every field is known" in prompt


def test_prompt_ignores_blank_known_values():
    prompt = build_document_system_prompt("Pilot Agreement", ("Customer",), {"Customer": "  "})
    missing_line = prompt.split("Fields still missing:")[1]

    assert "Customer" in missing_line
