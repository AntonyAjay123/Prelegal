from fastapi import APIRouter, Depends, HTTPException

from app.document_registry import get_document_type, list_document_types
from app.schemas import (
    DocumentChatRequest,
    DocumentChatResponse,
    DocumentTypeSummary,
    IntakeChatRequest,
    IntakeChatResponse,
    RenderRequest,
    RenderResponse,
)
from app.services.document_chat import (
    ChatTurnRunner,
    DocumentNotFoundError,
    get_document_chat_runner,
    get_document_field_labels,
    render_document,
)
from app.services.document_intake_chat import IntakeTurnRunner, get_intake_chat_runner

router = APIRouter()


@router.get("/documents", response_model=list[DocumentTypeSummary])
def list_documents() -> list[DocumentTypeSummary]:
    return [
        DocumentTypeSummary(slug=doc.slug, name=doc.name, description=doc.description)
        for doc in list_document_types()
    ]


@router.post("/documents/chat", response_model=IntakeChatResponse)
async def intake_chat(
    request: IntakeChatRequest, run_turn: IntakeTurnRunner = Depends(get_intake_chat_runner)
) -> IntakeChatResponse:
    reply, matched_slug = await run_turn(request.messages)
    document_name = None
    if matched_slug:
        doc = get_document_type(matched_slug)
        document_name = doc.name if doc else None
        matched_slug = doc.slug if doc else None
    return IntakeChatResponse(reply=reply, matched_slug=matched_slug, document_name=document_name)


def get_document_chat_runner_dependency(slug: str) -> ChatTurnRunner:
    try:
        return get_document_chat_runner(slug)
    except DocumentNotFoundError:
        raise HTTPException(status_code=404, detail=f"Unknown document type: {slug}")


@router.post("/documents/{slug}/chat", response_model=DocumentChatResponse)
async def document_chat(
    slug: str,
    request: DocumentChatRequest,
    run_turn: ChatTurnRunner = Depends(get_document_chat_runner_dependency),
) -> DocumentChatResponse:
    reply, extracted = await run_turn(request.messages, request.current_fields)
    merged = {**request.current_fields, **extracted}
    content = render_document(slug, merged)
    all_fields = list(get_document_field_labels(slug))
    return DocumentChatResponse(reply=reply, fields=extracted, all_fields=all_fields, content=content)


@router.post("/documents/{slug}/render", response_model=RenderResponse)
def render(slug: str, request: RenderRequest) -> RenderResponse:
    try:
        content = render_document(slug, request.fields)
    except DocumentNotFoundError:
        raise HTTPException(status_code=404, detail=f"Unknown document type: {slug}")
    return RenderResponse(content=content)
