import os
from collections.abc import Awaitable, Callable
from functools import lru_cache

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, ConfigDict, Field, create_model

from app.document_registry import get_document_type, load_template
from app.schemas import ChatMessage
from app.services.document_fields import extract_fields, fill_template

MODEL_NAME = "gpt-5.4-mini"


class ChatServiceUnavailableError(Exception):
    """Raised when the AI chat backend cannot currently serve a request
    (missing configuration, upstream API error, etc.) — kept HTTP-agnostic so
    this module has no FastAPI dependency."""


class DocumentNotFoundError(Exception):
    """Raised when a slug doesn't match any known document type."""


class _DynamicBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


@lru_cache
def get_document_field_labels(slug: str) -> tuple[str, ...]:
    doc = get_document_type(slug)
    if doc is None:
        raise DocumentNotFoundError(slug)
    return tuple(extract_fields(load_template(doc.filename)))


@lru_cache
def _build_fields_model(slug: str) -> type[BaseModel]:
    labels = get_document_field_labels(slug)
    fields = {
        f"field_{i}": (str | None, Field(default=None, alias=label))
        for i, label in enumerate(labels)
    }
    return create_model(f"Fields_{slug.replace('-', '_')}", __base__=_DynamicBase, **fields)


@lru_cache
def _build_turn_result_model(slug: str) -> type[BaseModel]:
    fields_model = _build_fields_model(slug)
    return create_model(
        f"TurnResult_{slug.replace('-', '_')}",
        __base__=_DynamicBase,
        reply=(str, ...),
        fields=(fields_model, ...),
    )


def build_document_system_prompt(
    document_name: str, labels: tuple[str, ...], known: dict[str, str]
) -> str:
    known = {key: value for key, value in known.items() if value and value.strip()}
    missing = [label for label in labels if label not in known]
    missing_text = ", ".join(missing) if missing else "none — every field is known"
    return (
        f"You are a legal-intake assistant helping a user complete a {document_name}. "
        "Collect the following fields through natural conversation:\n"
        f"{', '.join(labels)}\n\n"
        "Rules:\n"
        "- Ask about one or two missing fields per turn, conversationally. "
        "Don't re-ask about fields already known (see below).\n"
        "- Only populate a fields.* value when the user's latest message "
        "actually provides or confirms it. Never restate already-known "
        "values — leave them absent so we don't clobber prior state.\n"
        "- Some field labels are grammatical variants of each other (e.g. a "
        "singular/plural pair like 'Subscription Period' and 'Subscription "
        "Periods', or near-duplicate wording for the same concept). If the "
        "user's answer clearly applies to more than one such label, fill in "
        "all of them from that one answer rather than asking again.\n"
        "- If the user's answer is vague, ambiguous, or incomplete, do NOT "
        "guess a value — ask a specific clarifying follow-up question "
        "instead, and leave that field out of `fields` until you have a "
        "confident, unambiguous answer.\n"
        "- If the user asks to change a previously given value, populate "
        "that field with the new value.\n"
        "- Before telling the user the document is ready to review, check "
        "the 'Fields still missing' list below (accounting for anything "
        "you're populating in `fields` this turn). If anything is still "
        "missing, keep asking about it instead of claiming completion.\n\n"
        f"Fields already known: {known or 'none yet'}.\n"
        f"Fields still missing: {missing_text}."
    )


def _to_langchain_messages(messages: list[ChatMessage]) -> list[BaseMessage]:
    return [
        HumanMessage(content=m.content) if m.role == "user" else AIMessage(content=m.content)
        for m in messages
    ]


ChatTurnRunner = Callable[[list[ChatMessage], dict[str, str]], Awaitable[tuple[str, dict[str, str]]]]


@lru_cache
def get_document_chat_runner(slug: str) -> ChatTurnRunner:
    """FastAPI dependency factory for the real implementation. Cached per
    document slug so the ChatOpenAI client + dynamic schema are built once
    per process. Tests override this dependency wholesale rather than faking
    LangChain internals."""
    doc = get_document_type(slug)
    if doc is None:
        raise DocumentNotFoundError(slug)

    labels = get_document_field_labels(slug)
    turn_result_model = _build_turn_result_model(slug)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ChatServiceUnavailableError("OPENAI_API_KEY is not configured")

    llm = ChatOpenAI(model=MODEL_NAME, api_key=api_key)
    structured_llm = llm.with_structured_output(turn_result_model, method="json_schema")

    async def run(messages: list[ChatMessage], current_fields: dict[str, str]) -> tuple[str, dict[str, str]]:
        system = SystemMessage(content=build_document_system_prompt(doc.name, labels, current_fields))
        try:
            result = await structured_llm.ainvoke([system, *_to_langchain_messages(messages)])
        except Exception as exc:
            raise ChatServiceUnavailableError(str(exc)) from exc
        fields_dict: dict[str, str] = result.fields.model_dump(exclude_none=True, by_alias=True)  # type: ignore[attr-defined]
        return result.reply, fields_dict  # type: ignore[attr-defined]

    return run


def render_document(slug: str, fields: dict[str, str]) -> str:
    doc = get_document_type(slug)
    if doc is None:
        raise DocumentNotFoundError(slug)
    return fill_template(load_template(doc.filename), fields)
