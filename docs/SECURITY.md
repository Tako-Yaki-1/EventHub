# Security and AI

How EventHub covers the CIA triad, accountability, tokens, admin controls, and the AI features. Each control lists where it lives and the test that proves it.

## CIA triad

| Pillar | Control | Where it lives | Test |
|---|---|---|---|
| Confidentiality | Password hashes are hidden from every response (`$hidden`) | `backend/app/Models/User.php`, `Http/Resources/UserResource.php` | `AuthTest`, `TokenSessionTest` ("...no password hashes") |
| Confidentiality | Token values are never returned after login; sessions expose only id/name/timestamps | `SessionController`, `TokenService` | `TokenSessionTest` ("sessions lists active tokens without ever returning token values") |
| Confidentiality | Students cannot read other users' data; attendee lists and users are admin-only | `routes/api.php`, `EventController::attendees`, `AdminUserController` | `AuthorizationMatrixTest`, `TokenSessionTest` |
| Confidentiality | The AI API key stays on the server; settings responses never include it | `config/ai.php`, `AdminAiController::payload`, `AppServiceProvider` | `AiAdminTest` ("...the api key is never returned") |
| Confidentiality | AI prompts exclude names, emails, student IDs, and registration data | `AssistantService`, `AnalyticsSummaryService` | `AiAssistantTest`, `AiAnalyticsSummaryTest` ("outbound payload...") |
| Confidentiality | `.env` is ignored; `.env.example` documents every variable without values | `.gitignore`, `backend/.env.example` | Manual review (no secrets in tracked files) |
| Integrity | Every write goes through a Form Request | `Http/Requests/*` | Feature tests for each endpoint |
| Integrity | Unique registration per user/event and foreign keys stay in place | `database/migrations/*registrations*` | `RegistrationTest` |
| Integrity | The audit log is append-only and hash-chained | `AuditLog`, `AuditLogger`, `audit_logs` migration | `AuditLogTest` ("cannot be updated/deleted", "tampering is detected") |
| Integrity | Registration and cancellation stay transactional | `RegisterForEvent`, `CancelRegistration` | `RegistrationTest` |
| Integrity | AI output is parsed defensively: JSON shape checked, unknown event ids dropped, raw text used when parsing fails | `AssistantService`, `AnalyticsSummaryService` | `AiAssistantTest`, `AiAnalyticsSummaryTest` |
| Integrity | Registration and event writes cannot be triggered by the model (it has no tools) | `AssistantService` (read-only prompt) | `AiAssistantTest` |
| Availability | Login, sign-up, password reset, sessions, admin views, and AI calls are rate limited | `routes/api.php`, `AiGateway::rateLimited` | `TokenSessionTest` (sessions 429), `AiAssistantTest` (AI 429) |
| Availability | Per-user daily AI token budget blocks spend before the provider call | `AiGateway::overDailyLimit`, `AiSettings` | `AiAssistantTest` ("daily token limit...") |
| Availability | AI is optional: disabled/unconfigured/error/timeout uses local fallbacks; the app never crashes | `AiGateway`, `AssistantService`, `AnalyticsSummaryService`, `NullAiDriver` | `AiAssistantTest`, `AiAnalyticsSummaryTest` |
| Availability | Indexes on audit and AI usage columns; AI-generated summaries cached for 10 minutes per data fingerprint (rule-based fallbacks are not cached, so recovering AI is immediate) | Migrations, `AnalyticsSummaryService` | Migration review, `AiAnalyticsSummaryTest` (cache test) |

## Accountability

**What is logged** (append-only `audit_logs`, written only through `AuditLogger::record`):

- `auth.login` success and failure (failure stores a masked identifier such as `j***@school.edu`)
- `auth.logout`, `auth.signup`, `auth.password_reset_requested`, `auth.password_reset_completed`
- `auth.session_revoked`, `admin.force_logout`
- `profile.updated` (field names only, not values)
- `event.created`, `event.updated`, `event.cancelled`, `event.attendees_viewed`
- `registration.created`, `registration.cancelled`
- `ai.request` (feature, status, token counts), `ai.settings_changed` (changed field names with old and new values)
- `access.denied` for every 403 by a signed-in user (method and path)
- `admin.audit_verified` when an admin runs the chain check

**What is deliberately not logged:** passwords, password confirmations, token values, API keys, full email addresses (failures are masked), prompts and answers (stored in `ai_requests.prompt` only when `AI_LOG_PROMPTS=true`), and attendee personal fields (only IDs and field names).

**How the log is protected:**

- `AuditLog` throws on `update` and `delete`; there are no audit update/delete routes.
- Each row stores `sha256(previous_hash + canonical row data)`. `POST /api/v1/admin/audit-logs/verify` re-computes the chain and reports the first broken row. A direct SQL edit breaks it (tested).
- `audit_logs.user_id` uses `restrictOnDelete`, so deleting a user cannot silently rewrite history.
- Reading the log, the users list, and AI usage is admin-only (`role:admin` middleware + `AuthorizationMatrixTest`).

**Trade-off:** `ai_requests` records usage for accountability. Prompts may contain personal data, so the prompt text is not stored by default; only a hash and character count are kept. Turn on `AI_LOG_PROMPTS=true` only when you need to debug and accept that responsibility.

## Tokens

### Login tokens (Sanctum)

- Lifetime comes from `TOKEN_TTL_MINUTES` (default 480 minutes) via `config/security.php`, passed to `createToken()` by `TokenService`. Expired tokens get `401` (tested).
- Names are derived from the user agent, e.g. `web (Chrome on Windows)`.
- `GET /api/v1/auth/sessions` lists the caller's active tokens (id, name, created/last used/expires, `is_current`) and never token values.
- `DELETE /api/v1/auth/sessions/{id}` revokes one of your own tokens; another user's id returns `404`.
- A password reset or a password change revokes **all** of the user's tokens.
- `DELETE /api/v1/admin/users/{user}/tokens` force-logs-out a user; it is audited.
- The frontend stores the token in `localStorage`; a `401` clears it and lands on `/login` with a short message.

### AI token accounting

- Every attempt writes `ai_requests`: feature, driver, model, input/output/total tokens, `tokens_estimated`, latency, status (`success`, `error`, `blocked`, `rate_limited`, `fallback`), error code, prompt length/hash, and `created_at`.
- Missing provider usage is estimated with `characters / 4` and flagged as estimated.
- Limits are enforced in `AiGateway` before the provider call:
  1. Feature disabled or unconfigured → fallback, no provider call.
  2. Per user, 10 requests per minute → `429`, recorded as `rate_limited`.
  3. Per user, daily `total_tokens` budget (default 20,000, editable in `/admin/ai`). The request estimate is prompt chars / 4 plus the output ceiling; over budget → `429`, recorded as `blocked`.
- `/admin/ai` shows tokens per day, requests by status, and the top users; each AI attempt also writes an `ai.request` audit entry.

## Admin role matrix

| Capability | Guest | Student | Admin |
|---|---|---|---|
| Register / log in / reset password | yes | yes | yes |
| Browse published upcoming events, register, cancel own registration | no | yes | no (students only) |
| View own sessions, revoke own session, update profile | no | yes | yes |
| Create / edit / cancel events, view attendee lists | no | no | yes |
| Analytics endpoints | no | no | yes |
| Audit log and "Verify log" | no | no | yes |
| Users list and force logout | no | no | yes |
| AI settings and AI usage | no | no | yes |
| AI analytics summary | no | no | yes |
| Ask the assistant | no | yes | yes (API; the page is in the student shell) |

`AuthorizationMatrixTest` walks every admin-only and student-only route for guests, students, and admins.

## AI risks and mitigations

| Risk | Mitigation |
|---|---|
| Prompt injection inside an event description or question | The system prompt states the data is untrusted and must not change the rules; event data sits in a delimited `<events>` block; the model has no tools and cannot write anything. Output handling drops unknown event ids. |
| Personal data leaving the server | The assistant sees only upcoming published events (id, title, description truncated to 300 chars, organizer, location, times, slots left). It never sees the asking user or any registration. The analytics summary sees only aggregates (KPIs, per-event fill and cancellation counts and rates, insight titles, per-day totals). |
| Cost abuse | 10 requests/minute per user, a daily token budget per user, a 10-minute cache on AI-generated summaries per data fingerprint, and admin switches that disable a feature. |
| Hallucinated answers or event ids | Answers are plain text with a visible "AI-generated. It can be wrong" label; event ids are intersected with the exact list sent; if JSON parsing fails the raw text is shown with no events. |
| Provider outage or a bad key | A timeout plus one retry, then a fallback: the assistant returns keyword-matched events (`source: fallback`) and the analytics card returns the rule-based summary (`source: rules`). |
| XSS through model output | AI text is rendered as React text, never with `dangerouslySetInnerHTML` (frontend test asserts a `<script>` string stays text). |
| Secret leakage | The key is read with `config()` server-side only, never returned by an endpoint, and never placed in the frontend bundle. Settings updates log field names and values but not the key. |
| Deleting a user to hide activity | Audit rows are immutable and the user foreign key is `restrictOnDelete`; AI usage rows keep their totals. |

## Known limits

- The login token is in `localStorage`, not an httpOnly cookie. An XSS bug on the site would expose it. Fixing that needs a same-site cookie session design.
- Local development runs over plain HTTP; production needs HTTPS and HSTS.
- Rate limiting and AI limits use the cache store. A multi-server deployment needs a shared store (Redis/database) and atomic counters.
- Provider token estimates are approximate when a provider omits usage; the record is flagged `tokens_estimated`.
- The audit hash chain detects accidental or direct-SQL edits but does not prevent an attacker with full database and code access from rebuilding the chain. Ship the log to external storage if you need stronger guarantees.
- The `fake` AI driver exists for tests only and is selected only with `AI_DRIVER=fake`.
- AI answers are advisory; the event page is the source of truth for dates, capacity, and registration state.

## Configuration

| Variable | Purpose | Default |
|---|---|---|
| `TOKEN_TTL_MINUTES` | Login token lifetime in minutes | `480` |
| `AI_DRIVER` | `openai`, `anthropic`, or `fake` (tests) | `openai` |
| `AI_API_KEY` | Provider key; set it only in `backend/.env` | empty |
| `AI_BASE_URL` | OpenAI-compatible base URL (OpenRouter default) | `https://openrouter.ai/api/v1` |
| `AI_MODEL` | Provider-specific model id | empty |
| `AI_TIMEOUT_SECONDS` | HTTP timeout | `15` |
| `AI_MAX_OUTPUT_TOKENS` | Output ceiling per request | `500` |
| `AI_LOG_PROMPTS` | Store prompt text in `ai_requests` | `false` |

Runtime AI switches (`ai.enabled`, `ai.assistant_enabled`, `ai.summary_enabled`, `ai.daily_token_limit`, `ai.question_max_length`) live in the `settings` table and are edited on `/admin/ai`.
