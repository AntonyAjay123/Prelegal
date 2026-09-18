from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    """Base for API models whose JSON wire format is camelCase."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ChatMessage(_CamelModel):
    role: Literal["user", "assistant"]
    content: str


class DocumentTypeSummary(_CamelModel):
    slug: str
    name: str
    description: str


class IntakeChatRequest(_CamelModel):
    messages: list[ChatMessage]


class IntakeChatResponse(_CamelModel):
    reply: str
    matched_slug: str | None = None
    document_name: str | None = None


class DocumentChatRequest(_CamelModel):
    messages: list[ChatMessage]
    current_fields: dict[str, str] = {}


class DocumentChatResponse(_CamelModel):
    reply: str
    fields: dict[str, str]
    all_fields: list[str]
    content: str


class RenderRequest(_CamelModel):
    fields: dict[str, str] = {}


class RenderResponse(_CamelModel):
    content: str
