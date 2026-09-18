# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

**Current status (PL-4 through PL-6 merged, plus a follow-up fix round):** the V1 technical foundation is built — FastAPI backend, SQLite database, Docker packaging, and start/stop scripts — gated behind a mock login screen (no real authentication yet), with a logout button to end the session. All 11 document types in `catalog.json` are supported through a single generic AI chat pipeline (PL-6): a freeform chat first identifies which document the user needs (explaining and offering the closest alternative if their request doesn't match anything supported), then collects that document's fields conversationally, asking clarifying follow-up questions when an answer is vague or incomplete rather than guessing. A collapsible "Review & edit details" panel (an auto-generated form, one input per field) lets the user correct any value directly; both paths write to the same state.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use LangChain with the OpenAI API and the gpt-5.4-mini model. Use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENAI_API_KEY in the .env file in the project root.

Implemented generically for all 11 document types (PL-6, generalizing PL-5's Mutual-NDA-only version): `backend/app/services/document_chat.py` builds a per-document system prompt and calls `ChatOpenAI(...).with_structured_output(..., method="json_schema")` on `gpt-5.4-mini`, producing both the conversational reply and any newly-extracted fields in one call. The structured-output schema isn't hand-written per document — `backend/app/services/document_fields.py` extracts a document's field labels from its template's `<span class="*_link">Label</span>` markup, and `pydantic.create_model()` builds a matching schema at runtime, so adding a 12th document type needs no new schema code as long as its template follows the same markup convention.

`backend/app/services/document_intake_chat.py` runs first: a chat that matches the user's freeform request against `catalog.json`'s descriptions, only handing off to the per-document chat once a document is confidently identified (or the user confirms a suggested alternative for an unsupported request).

The per-document system prompt tracks which fields are still missing and tells the model not to declare the document "ready" until all of them are known, and instructs it to ask a clarifying follow-up (rather than guess or apply a default) whenever the user's answer is vague, ambiguous, or incomplete.

## Technical design

The project is packaged into a single Docker container (root `Dockerfile` + `docker-compose.yml`).
The backend is in `backend/`, a uv project using FastAPI. All API routes live under `/api/*`: `/api/health`, `/api/documents` (lists the 11 supported document types), `/api/documents/chat` (intake — identifies which document the user wants), `/api/documents/{slug}/chat` (collects that document's fields), and `/api/documents/{slug}/render` (recomputes the filled document from a given field set, used by the manual-edit panel). Chat is stateless: no conversation history is persisted server-side, the frontend resends the running conversation each turn. `templates/` and `catalog.json` are read by the backend at runtime (`TEMPLATES_DIR`/`CATALOG_PATH` env vars) — the frontend no longer reads them directly; all document/template access now goes through the backend API.
The frontend is in `frontend/`, a Next.js app statically exported (`output: "export"`) and served by the backend for every non-API route.
The database uses SQLite, recreated from scratch each time the container is brought up. It currently has a `users` table (schema only — no sign up/sign in flow yet).
Access is gated by a mock login screen at `/login`: any input is accepted, no credentials are checked, and the "logged in" flag is kept in `sessionStorage` so it resets each time the browser session ends. A "Log out" button on the main page clears that flag and returns to `/login`.

Scripts are in `scripts/` for:
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

These are defined as Tailwind theme tokens in `frontend/src/app/globals.css` and used on the login page.
