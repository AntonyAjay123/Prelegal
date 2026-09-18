import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import MutualNdaChatTurnResult, MutualNdaFieldsPatch
from app.services.mutual_nda_chat import ChatServiceUnavailableError, get_mutual_nda_chat_runner


@pytest.fixture
def client():
    def use_runner(runner):
        app.dependency_overrides[get_mutual_nda_chat_runner] = lambda: runner

    with TestClient(app) as test_client:
        test_client.use_runner = use_runner
        yield test_client

    app.dependency_overrides.clear()


def test_chat_returns_reply_and_extracted_fields(client):
    async def fake_runner(request):
        return MutualNdaChatTurnResult(
            reply="Got it, Acme Inc it is.",
            fields=MutualNdaFieldsPatch(party1_company="Acme Inc"),
        )

    client.use_runner(fake_runner)
    response = client.post(
        "/api/documents/mutual-nda/chat",
        json={
            "messages": [{"role": "user", "content": "Party 1 is Acme Inc"}],
            "currentFields": {},
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "reply": "Got it, Acme Inc it is.",
        "fields": {"party1Company": "Acme Inc"},
    }


def test_chat_omits_unset_fields_from_response(client):
    async def fake_runner(request):
        return MutualNdaChatTurnResult(reply="Hi there!", fields=MutualNdaFieldsPatch())

    client.use_runner(fake_runner)
    response = client.post(
        "/api/documents/mutual-nda/chat",
        json={"messages": [], "currentFields": {}},
    )

    assert response.status_code == 200
    assert response.json() == {"reply": "Hi there!", "fields": {}}


def test_chat_returns_503_when_service_unavailable(client):
    async def failing_runner(request):
        raise ChatServiceUnavailableError("boom")

    client.use_runner(failing_runner)
    response = client.post(
        "/api/documents/mutual-nda/chat",
        json={"messages": [], "currentFields": {}},
    )

    assert response.status_code == 503
