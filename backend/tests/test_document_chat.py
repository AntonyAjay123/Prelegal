import pytest
from fastapi.testclient import TestClient

from app.api.document_chat import get_document_chat_runner_dependency
from app.main import app
from app.services.document_chat import ChatServiceUnavailableError
from app.services.document_intake_chat import get_intake_chat_runner


@pytest.fixture
def client():
    def use_intake_runner(runner):
        app.dependency_overrides[get_intake_chat_runner] = lambda: runner

    def use_document_runner(runner):
        app.dependency_overrides[get_document_chat_runner_dependency] = lambda: runner

    with TestClient(app) as test_client:
        test_client.use_intake_runner = use_intake_runner
        test_client.use_document_runner = use_document_runner
        yield test_client

    app.dependency_overrides.clear()


def test_list_documents_excludes_the_nda_coverpage(client):
    response = client.get("/api/documents")

    assert response.status_code == 200
    slugs = {doc["slug"] for doc in response.json()}
    assert "mutual-nda" in slugs
    assert "mutual-nda-coverpage" not in slugs


def test_intake_chat_returns_reply_and_matched_slug(client):
    async def fake_runner(messages):
        return "Sure, drafting a Mutual NDA.", "mutual-nda"

    client.use_intake_runner(fake_runner)
    response = client.post(
        "/api/documents/chat",
        json={"messages": [{"role": "user", "content": "I need an NDA"}]},
    )

    assert response.status_code == 200
    assert response.json() == {
        "reply": "Sure, drafting a Mutual NDA.",
        "matchedSlug": "mutual-nda",
        "documentName": "Mutual Non-Disclosure Agreement",
    }


def test_intake_chat_ignores_hallucinated_slug(client):
    async def fake_runner(messages):
        return "Let's do that.", "not-a-real-document"

    client.use_intake_runner(fake_runner)
    response = client.post("/api/documents/chat", json={"messages": []})

    assert response.status_code == 200
    body = response.json()
    assert body["matchedSlug"] is None
    assert body["documentName"] is None


def test_document_chat_returns_reply_fields_and_rendered_content(client):
    async def fake_runner(messages, current_fields):
        return "Got it.", {"Purpose": "evaluating a partnership"}

    client.use_document_runner(fake_runner)
    response = client.post(
        "/api/documents/mutual-nda/chat",
        json={"messages": [{"role": "user", "content": "the purpose is a partnership"}], "currentFields": {}},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "Got it."
    assert body["fields"] == {"Purpose": "evaluating a partnership"}
    assert set(body["allFields"]) == {
        "Purpose",
        "Effective Date",
        "MNDA Term",
        "Term of Confidentiality",
        "Governing Law",
        "Jurisdiction",
    }
    assert "evaluating a partnership" in body["content"]
    assert "[Governing Law not provided]" in body["content"]


def test_document_chat_returns_404_for_unknown_slug(client):
    response = client.post(
        "/api/documents/not-a-real-document/chat",
        json={"messages": [], "currentFields": {}},
    )

    assert response.status_code == 404


def test_document_chat_returns_503_when_service_unavailable(client):
    async def failing_runner(messages, current_fields):
        raise ChatServiceUnavailableError("boom")

    client.use_document_runner(failing_runner)
    response = client.post(
        "/api/documents/mutual-nda/chat",
        json={"messages": [], "currentFields": {}},
    )

    assert response.status_code == 503


def test_render_endpoint_fills_in_given_fields(client):
    response = client.post(
        "/api/documents/mutual-nda/render",
        json={"fields": {"Purpose": "testing", "Governing Law": "Delaware"}},
    )

    assert response.status_code == 200
    content = response.json()["content"]
    assert "testing" in content
    assert "Delaware" in content


def test_render_endpoint_returns_404_for_unknown_slug(client):
    response = client.post("/api/documents/not-a-real-document/render", json={"fields": {}})

    assert response.status_code == 404
