import os
from collections.abc import Awaitable, Callable
from functools import lru_cache

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, ConfigDict

from app.document_registry import list_document_types
from app.schemas import ChatMessage
from app.services.document_chat import ChatServiceUnavailableError

MODEL_NAME = "gpt-5.4-mini"


class _IntakeResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    reply: str
    matched_slug: str | None = None


def build_intake_system_prompt() -> str:
    catalog_text = "\n".join(
        f"- {doc.slug}: {doc.name} — {doc.description}" for doc in list_document_types()
    )
    return (
        "You are a legal-intake assistant helping a user figure out which "
        "legal document they need before drafting it. You can only generate "
        "the following document types:\n"
        f"{catalog_text}\n\n"
        "Rules:\n"
        "- Always refer to document types by their plain-English name (e.g. "
        "\"Partnership Agreement\") when talking to the user — never mention "
        "the slug, it's an internal identifier only.\n"
        "- If the user's request clearly matches one of these document "
        "types, set matchedSlug to its exact slug and briefly confirm which "
        "document you're now drafting, by name.\n"
        "- If the user's request doesn't match any of these well, explain "
        "that you can't generate that document, and suggest the closest "
        "supported document type by name. Leave matchedSlug unset until the "
        "user confirms they want to proceed with that suggestion (or "
        "otherwise names a supported document).\n"
        "- If the request is too vague to match confidently yet (e.g. just "
        "\"I need a contract\"), ask a clarifying question instead of "
        "guessing.\n"
        "- Stay focused on identifying the right document; don't start "
        "collecting its specific details yet."
    )


IntakeTurnRunner = Callable[[list[ChatMessage]], Awaitable[tuple[str, str | None]]]


@lru_cache
def get_intake_chat_runner() -> IntakeTurnRunner:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ChatServiceUnavailableError("OPENAI_API_KEY is not configured")

    llm = ChatOpenAI(model=MODEL_NAME, api_key=api_key)
    structured_llm = llm.with_structured_output(_IntakeResult, method="json_schema")
    valid_slugs = {doc.slug for doc in list_document_types()}

    async def run(messages: list[ChatMessage]) -> tuple[str, str | None]:
        system = SystemMessage(content=build_intake_system_prompt())
        history: list[BaseMessage] = [
            HumanMessage(content=m.content) if m.role == "user" else AIMessage(content=m.content)
            for m in messages
        ]
        try:
            result = await structured_llm.ainvoke([system, *history])
        except Exception as exc:
            raise ChatServiceUnavailableError(str(exc)) from exc
        matched_slug = result.matched_slug if result.matched_slug in valid_slugs else None
        return result.reply, matched_slug

    return run
