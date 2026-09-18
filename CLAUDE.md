# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

**Current status (PL-4, PL-5 merged, plus a follow-up fix round):** the V1 technical foundation is built — FastAPI backend, SQLite database, Docker packaging, and start/stop scripts — gated behind a mock login screen (no real authentication yet), with a logout button to end the session. Only the Mutual Non-Disclosure Agreement is implemented. It's driven by a freeform AI chat (not a manual form) that asks about the deal, asks clarifying follow-up questions when an answer is vague or incomplete rather than guessing, and populates the fields from the conversation; the original form still exists as a collapsible "Review & edit details" panel for direct corrections, and both paths write to the same state. The other 10 document types are not yet built.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use LangChain with the OpenAI API and the gpt-5.4-mini model. Use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENAI_API_KEY in the .env file in the project root.

Implemented for the Mutual NDA chat (PL-5): `backend/app/services/mutual_nda_chat.py` builds the system prompt and calls `ChatOpenAI(...).with_structured_output(..., method="json_schema")` on `gpt-5.4-mini`, producing both the conversational reply and any newly-extracted document fields in one call. Apply the same pattern (LangChain + Structured Outputs, one call per turn) when adding chat support for the other document types.

The system prompt tracks which required fields are still missing and tells the model not to declare the document "ready" until all of them are known, and instructs it to ask a clarifying follow-up (rather than guess or apply a default) whenever the user's answer is vague, ambiguous, or incomplete.

## Technical design

The project is packaged into a single Docker container (root `Dockerfile` + `docker-compose.yml`).
The backend is in `backend/`, a uv project using FastAPI. All API routes live under `/api/*` (e.g. `/api/health`, `/api/documents/mutual-nda/chat` — chat endpoints are namespaced by document slug so future document types don't need a URL redesign). The chat endpoint is stateless: no conversation history is persisted server-side, the frontend resends the running conversation each turn.
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
