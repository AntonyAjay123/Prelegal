import re

# Matches any inline <span ...>...</span>, regardless of attribute order
# (some templates put `id` before `class`, some after, some spans have no
# class at all and are pure anchors for deep-linking).
_SPAN_RE = re.compile(r"<span\s+([^>]*)>([^<]*)</span>")
_LINK_CLASS_RE = re.compile(r'class="(\w+_link)"')

# Catches any remaining span (with or without attributes) after field
# substitution, e.g. `<span class="header_2" id="1">Service</span>` or the
# empty anchor form `<span id="1.1"></span>`.
_ANY_SPAN_RE = re.compile(r"<span\b([^>]*)>([^<]*)</span>")
_HEADING_CLASS_RE = re.compile(r'class="header_[23]"')

# A label sometimes carries a possessive suffix inline (e.g. "Customer's" or
# the curly-quote "Customer’s") — both styles appear across the templates,
# inconsistently between documents but consistently within one. Stripping
# these treats "Customer" and "Customer's" as the same underlying field.
_POSSESSIVE_SUFFIXES = ("’s", "'s")


def _split_possessive(label: str) -> tuple[str, str]:
    """Returns (base_label, possessive_suffix_or_empty)."""
    for suffix in _POSSESSIVE_SUFFIXES:
        if label.endswith(suffix):
            return label[: -len(suffix)], suffix
    return label, ""


def extract_fields(template_text: str) -> list[str]:
    """Distinct, ordered field labels found in `<span class="*_link">Label</span>`
    placeholders. Possessive suffixes are normalized away so "Customer" and
    "Customer's" collapse into one field; spans with no `*_link` class (plain
    anchors used for deep-linking) are ignored."""
    seen: dict[str, None] = {}
    for attrs, inner in _SPAN_RE.findall(template_text):
        if not _LINK_CLASS_RE.search(attrs):
            continue
        inner = inner.strip()
        if not inner:
            continue
        label, _ = _split_possessive(inner)
        seen.setdefault(label, None)
    return list(seen.keys())


def fill_template(template_text: str, values: dict[str, str]) -> str:
    """Replaces every `<span class="*_link">Label</span>` occurrence with its
    value (preserving a possessive suffix from that specific occurrence, if
    any), stripping the span markup. Occurrences with no known value fall
    back to a bracketed placeholder, e.g. "[Customer not provided]"."""

    def replace(match: re.Match[str]) -> str:
        attrs, inner = match.group(1), match.group(2)
        if not _LINK_CLASS_RE.search(attrs):
            return match.group(0)
        stripped_inner = inner.strip()
        if not stripped_inner:
            return match.group(0)
        label, suffix = _split_possessive(stripped_inner)
        value = values.get(label, "").strip()
        if not value:
            return f"[{label} not provided]"
        return f"{value}{suffix}"

    filled = _SPAN_RE.sub(replace, template_text)

    # Most templates also use non-field spans for section-heading markup
    # (`header_2`/`header_3`) and empty deep-linking anchors (`<span
    # id="1.1"></span>`). Markdown renderers don't execute raw HTML by
    # default, so any left over would show up as literal broken tags —
    # unwrap them to their inner text (bolding headings, to match how
    # mutual-nda.md marks up its own section titles), or remove them if empty.
    def unwrap(match: re.Match[str]) -> str:
        attrs, inner = match.group(1), match.group(2)
        if inner and _HEADING_CLASS_RE.search(attrs):
            return f"**{inner}**"
        return inner

    return _ANY_SPAN_RE.sub(unwrap, filled)
