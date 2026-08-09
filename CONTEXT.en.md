# CONTEXT.en.md — Product and architecture context (English mirror)

> Canonical version in Spanish: `CONTEXT.md`.
> Operational instructions for agents: see `AGENTS.en.md`.

## What Canectt is

**Canectt** converts any document (PDF, Word, Excel, Markdown) or manual input into a drag-and-drop editable routine/schedule, exportable to documents (PDF/Word/Excel/Markdown) and directly to Google Calendar, iOS and Android.

The one-line pitch: _"Convert any document into an editable schedule and take it straight to your calendar, without copying and pasting anything by hand."_

## Who it serves

Anyone who has their routine/schedule written in a document (a gym PDF, a study-plan Word, a shifts Excel, a personal Markdown) and wants to turn it into something editable and finish it in their calendar without manual copy-paste.

## Why it exists

Copying a schedule from a document to a calendar is tedious and error-prone (wrong times, forgotten recurrences, unintended overlapping events). Canectt automates schedule recognition inside the document, brings it to a visual editor where blocks can be dragged around, and exports it both to files and to the calendar —including recurrences (RRULE) and handling of nested/overlapping events—.

## Architecture decisions (and their reason)

### Node.js + React stack

Explicitly requested by the user. Each library was chosen for being the proven standard in its category in 2026, not for being the newest.

### Monorepo with pnpm workspaces

Frontend, backend and shared packages (`schema`, `recognition-engine`, `export-engine`, `design-tokens`) live together so the Zod schema is a single source of truth shared between frontend and backend —zero validation duplication—.

### Single canonical schema (`packages/schema`)

Every import parser and the manual editor produce/consume the same `Schedule`/`Block` shape. This prevents each format from having its own incompatible logic.

### Recognition tree (`packages/recognition-engine`)

A single entry point detects format by magic bytes (not extension) and routes to the corresponding parser. The four parsers (PDF/Word/Excel/Markdown) converge on a shared normalizer that recognizes time patterns from `config/time-patterns.json` —adding a new time format requires touching config, not code—.

### No database in the MVP

The original request does not mention user accounts or saving schedules. The MVP is a single-session flow: import/create → edit → export. Google login is used **only** to authorize writing to Google Calendar, not as a general account system. Saving schedules/history is an optional Phase 2 extension (PostgreSQL via Prisma).

### Universal calendar via .ics + Google Calendar API

- **.ics** (iCalendar standard, RFC 5545) covers Apple Calendar, Outlook and generic Android with a single file.
- **Google Calendar API** (OAuth 2.0) covers Google and, indirectly, Android (Android's native calendar is almost always backed by Google Calendar).
- There is no public Apple API for a website to create iOS calendar events without user intervention: covered with .ics. This is a real platform limitation, not an avoidable design choice.
- **Recurrences**: translated to RRULE (RFC 5545) in both .ics and Google Calendar —"the 7-8am gym routine, Monday to Friday" becomes ONE recurring event, not five separate ones—.

### Why not `add-to-calendar-button`

Its license (Elastic License 2.0) explicitly forbids using it inside a product that offers the same functionality as a service —which is exactly Canectt's case—. The feature is built in-house over `ics` + Google Calendar API.

### Why not `xlsx` (SheetJS)

Known unpatched security vulnerabilities in the free version (ReDoS, prototype pollution). We use `exceljs` (actively maintained, reads and writes).

### Why not `react-beautiful-dnd`

Officially discontinued by Atlassian. We use `@dnd-kit` (2026 de facto standard, natively keyboard-accessible, supports touch sensors).

### Why `unpdf` for PDF

Modern wrapper over pdf.js (Mozilla's engine) that works in Node and serverless without native dependencies. `pdf-parse` pulls in `canvas` which breaks serverless builds. Real limitation: no parser reads scanned PDFs (image without text layer); if extraction returns <50 chars/page, the manual flow is offered instead of failing silently. OCR with `tesseract.js` is a future extension.

### Google/Gemini visual identity

Neutral, spacious surfaces, Google Sans typography, rounded corners (Material 3), soft shadows, discreet motion. The brand gradient is reserved as a punctual accent (logo, primary button), never as a dominant background. Google Sans is self-hosted (no external CDN) so the web does not depend on third parties.

### Repo governance

Patterns taken from `VECTORG99/Artemisa` and `os-santiago/homedir`: `AGENTS.md` + `CONTEXT.md` as central files for agents; full contribution file package (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `GOVERNANCE.md`); multiple specialized CI workflows instead of one giant job; `.coderabbit.yaml` for AI-assisted review; `.gitleaks.toml` for secret scanning (critical due to Google OAuth credentials); commitlint with Conventional Commits; `.devcontainer/` for a reproducible environment; release stage gates (Alpha → Beta → RC → GA).

### Language

- UI: Spanish (centralized dictionary in `apps/web/src/i18n/es.ts`, ready for future i18n).
- Technical docs: Spanish canonical + English mirror —consistent with the product being in Spanish—.

## Key assumptions

1. **MVP without accounts or database**: single-session flow. Flag it if saving schedules is needed from day one.
2. **Android is covered via Google Calendar** (no separate public Android API).
3. **iOS is covered via .ics** (no public Apple API to create events without user intervention).
4. **The "Examples" button** assumes the team prepares real templates in `examples/templates/`. The spec cannot generate those images itself.
5. **The gradient and palette** are a starting point consistent with Gemini/Google, not a final immutable brand.
6. **The governance section** was adapted from Artemisa and homedir; no specific content was copied (e.g. homedir's "Bounty Hunters" program is out of scope as it was not requested).

## Current status

See `PLAN.md` for the detailed roadmap and `CHANGELOG.md` for the version history.
