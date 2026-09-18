from app.services.document_fields import extract_fields, fill_template


def test_extract_fields_dedupes_plain_and_possessive_forms():
    text = (
        '<span class="coverpage_link">Customer</span> agrees. '
        '<span class="coverpage_link">Customer’s</span> data. '
        "<span class=\"coverpage_link\">Customer's</span> account."
    )

    assert extract_fields(text) == ["Customer"]


def test_extract_fields_ignores_spans_without_link_class():
    text = (
        '<span class="header_2" id="1">Service</span> '
        '<span id="1.1"></span> '
        '<span class="coverpage_link">Provider</span>'
    )

    assert extract_fields(text) == ["Provider"]


def test_extract_fields_preserves_first_seen_order():
    text = (
        '<span class="orderform_link">Term</span> '
        '<span class="keyterms_link">Governing Law</span> '
        '<span class="orderform_link">Term</span>'
    )

    assert extract_fields(text) == ["Term", "Governing Law"]


def test_fill_template_substitutes_plain_and_possessive_occurrences():
    text = (
        '<span class="coverpage_link">Customer</span> may use the product. '
        '<span class="coverpage_link">Customer’s</span> data is protected.'
    )

    result = fill_template(text, {"Customer": "Acme Inc"})

    assert result == "Acme Inc may use the product. Acme Inc’s data is protected."


def test_fill_template_falls_back_to_placeholder_when_value_missing():
    text = '<span class="coverpage_link">Provider</span> will comply.'

    result = fill_template(text, {})

    assert result == "[Provider not provided] will comply."


def test_fill_template_ignores_blank_values():
    text = '<span class="coverpage_link">Provider</span>'

    result = fill_template(text, {"Provider": "   "})

    assert result == "[Provider not provided]"


def test_fill_template_bolds_heading_spans_and_removes_empty_anchors():
    text = '<span class="header_2" id="1">Service</span> and <span id="1.1"></span>more'

    assert fill_template(text, {}) == "**Service** and more"
