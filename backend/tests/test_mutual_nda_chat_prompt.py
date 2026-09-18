from app.schemas import MutualNdaFieldsPatch
from app.services.mutual_nda_chat import build_system_prompt


def test_prompt_lists_required_fields():
    prompt = build_system_prompt(MutualNdaFieldsPatch())

    for field in ["party1Name", "party2Name", "purpose", "effectiveDate", "governingLaw", "jurisdiction"]:
        assert field in prompt


def test_prompt_never_mentions_modifications():
    prompt = build_system_prompt(MutualNdaFieldsPatch())

    assert "odifications" not in prompt


def test_prompt_echoes_known_fields():
    prompt = build_system_prompt(MutualNdaFieldsPatch(party1_name="Acme Inc"))

    assert "Acme Inc" in prompt


def test_prompt_reports_no_known_fields_when_empty():
    prompt = build_system_prompt(MutualNdaFieldsPatch())

    assert "none yet" in prompt


def test_prompt_does_not_treat_default_form_state_as_known():
    """The frontend always sends the full NdaFormData (not a sparse patch),
    so unanswered required fields arrive as "" rather than absent. These
    must not be reported as "known" or the assistant will skip asking for
    them from turn one."""
    current_fields = MutualNdaFieldsPatch(
        party1_name="",
        party2_name="",
        effective_date="",
        governing_law="",
        jurisdiction="",
        purpose="evaluating a potential business relationship between the parties",
        mnda_term_type="expires",
        mnda_term_years=1,
    )

    prompt = build_system_prompt(current_fields)
    known_line = prompt.split("Fields already known:")[1].split("\n")[0]

    assert "party1Name" not in known_line
    assert "'purpose':" in known_line or '"purpose":' in known_line


def test_prompt_lists_still_missing_required_fields():
    current_fields = MutualNdaFieldsPatch(party1_name="Jane Doe", governing_law="Delaware")

    prompt = build_system_prompt(current_fields)
    missing_line = prompt.split("Required fields still missing:")[1]

    assert "party2Name" in missing_line
    assert "effectiveDate" in missing_line
    assert "jurisdiction" in missing_line
    assert "party1Name" not in missing_line
    assert "governingLaw" not in missing_line


def test_prompt_reports_nothing_missing_once_all_required_fields_known():
    current_fields = MutualNdaFieldsPatch(
        party1_name="Jane Doe",
        party2_name="Acme Corp",
        purpose="evaluating a potential business relationship between the parties",
        effective_date="2026-01-15",
        governing_law="Delaware",
        jurisdiction="New Castle, DE",
    )

    prompt = build_system_prompt(current_fields)

    assert "none — every required field is known" in prompt
