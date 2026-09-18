import os
from collections.abc import Awaitable, Callable
from functools import lru_cache

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.schemas import ChatMessage, MutualNdaChatRequest, MutualNdaChatTurnResult, MutualNdaFieldsPatch

MUTUAL_NDA_CHAT_MODEL = "gpt-5.4-mini"


class ChatServiceUnavailableError(Exception):
    """Raised when the AI chat backend cannot currently serve a request
    (missing configuration, upstream API error, etc.) — kept HTTP-agnostic so
    this module has no FastAPI dependency."""


def build_system_prompt(current_fields: MutualNdaFieldsPatch) -> str:
    # The frontend always sends the full NdaFormData, not a sparse patch, so
    # an unanswered text field arrives as "" rather than absent/None —
    # exclude_none alone would report it as "already known" to the model.
    known = {
        key: value
        for key, value in current_fields.model_dump(exclude_none=True, by_alias=True).items()
        if value != ""
    }
    return (
        "You are a legal-intake assistant helping a user complete a Mutual "
        "Non-Disclosure Agreement (Mutual NDA) through conversation.\n\n"
        "REQUIRED fields (must be collected before the document is complete):\n"
        "- party1Name, party2Name: the two parties' names (the individual or "
        "entity signing the agreement)\n"
        "- purpose: how confidential information may be used "
        '(default if the user has no preference: "evaluating a potential '
        'business relationship between the parties" — offer this, don\'t force it)\n'
        "- effectiveDate: ISO yyyy-mm-dd\n"
        "- governingLaw: a US state\n"
        "- jurisdiction: city/county and state, e.g. 'New Castle, DE'\n\n"
        "OPTIONAL fields (ask, but proceed with sensible defaults if the user "
        "doesn't care): party1Company, party2Company (the party's employer/"
        "organization, separate from party1Name/party2Name — leave blank if "
        "the party is signing as an individual, or if they only gave one name "
        "and it's unclear whether it's a person or a company; don't copy the "
        "same value into both party1Name and party1Company). "
        "IMPORTANT: party1* and party2* fields belong to two different, "
        "unrelated parties — never copy or infer a value for one party's "
        "field from the other party's name or answer. If the user says 'no' "
        "or 'not needed' about a company name, that only clears the company "
        "field for the party being discussed in that turn, and must never be "
        "used to fill in the other party's fields.\n\n"
        "mndaTermType ('expires' default with mndaTermYears=1, or 'continues'), "
        "confidentialityTermType ('years' default with confidentialityTermYears=1, "
        "or 'perpetuity').\n\n"
        "Rules:\n"
        "- Ask about one or two missing fields per turn, conversationally. "
        "Don't re-ask about fields already known (see below).\n"
        "- Only populate a fields.* value when the user's latest message actually "
        "provides or confirms it (including accepting an offered default). Never "
        "restate already-known values in `fields` — leave them absent so we don't "
        "clobber prior state.\n"
        "- If the user asks to change a previously given value, populate that "
        "field with the new value.\n"
        "- Once all required fields are known, tell the user the document is "
        "ready to review in the preview pane.\n"
        "- Stay strictly on the Mutual NDA. If asked about anything else, say "
        "you can only help with the Mutual NDA right now.\n\n"
        f"Fields already known: {known or 'none yet'}."
    )


def _to_langchain_messages(messages: list[ChatMessage]) -> list[BaseMessage]:
    return [
        HumanMessage(content=m.content) if m.role == "user" else AIMessage(content=m.content)
        for m in messages
    ]


ChatTurnRunner = Callable[[MutualNdaChatRequest], Awaitable[MutualNdaChatTurnResult]]


@lru_cache
def get_mutual_nda_chat_runner() -> ChatTurnRunner:
    """FastAPI dependency factory for the real implementation. Cached so the
    ChatOpenAI client is built once per process (mirrors the engine caching
    in app/db.py). Tests override this dependency wholesale rather than
    faking LangChain internals."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ChatServiceUnavailableError("OPENAI_API_KEY is not configured")

    llm = ChatOpenAI(model=MUTUAL_NDA_CHAT_MODEL, api_key=api_key)
    structured_llm = llm.with_structured_output(MutualNdaChatTurnResult, method="json_schema")

    async def run(request: MutualNdaChatRequest) -> MutualNdaChatTurnResult:
        messages: list[BaseMessage] = [
            SystemMessage(content=build_system_prompt(request.current_fields)),
            *_to_langchain_messages(request.messages),
        ]
        try:
            result = await structured_llm.ainvoke(messages)
        except Exception as exc:
            raise ChatServiceUnavailableError(str(exc)) from exc
        return result  # type: ignore[return-value]

    return run
