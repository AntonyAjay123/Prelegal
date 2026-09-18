from fastapi import APIRouter, Depends

from app.schemas import MutualNdaChatRequest, MutualNdaChatTurnResult
from app.services.mutual_nda_chat import ChatTurnRunner, get_mutual_nda_chat_runner

router = APIRouter()


@router.post(
    "/documents/mutual-nda/chat",
    response_model=MutualNdaChatTurnResult,
    response_model_exclude_none=True,
)
async def chat(
    request: MutualNdaChatRequest,
    run_turn: ChatTurnRunner = Depends(get_mutual_nda_chat_runner),
) -> MutualNdaChatTurnResult:
    return await run_turn(request)
