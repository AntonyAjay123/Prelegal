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

    assert "party1Name" not in prompt.split("Fields already known:")[1]
    assert "'purpose':" in prompt or '"purpose":' in prompt.split("Fields already known:")[1]
