from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    """Base for API models whose JSON wire format is camelCase, matching the
    frontend's NdaFormData field names 1:1 with no translation layer."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ChatMessage(_CamelModel):
    role: Literal["user", "assistant"]
    content: str


class MutualNdaFieldsPatch(_CamelModel):
    party1_name: str | None = None
    party1_company: str | None = None
    party2_name: str | None = None
    party2_company: str | None = None
    purpose: str | None = None
    effective_date: str | None = None
    mnda_term_type: Literal["expires", "continues"] | None = None
    mnda_term_years: int | None = None
    confidentiality_term_type: Literal["years", "perpetuity"] | None = None
    confidentiality_term_years: int | None = None
    governing_law: str | None = None
    jurisdiction: str | None = None


class MutualNdaChatRequest(_CamelModel):
    messages: list[ChatMessage]
    current_fields: MutualNdaFieldsPatch


class MutualNdaChatTurnResult(_CamelModel):
    reply: str
    fields: MutualNdaFieldsPatch
