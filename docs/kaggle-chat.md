# Historical Kaggle live chat connection (retired)

This records the earlier genuine Kaggle checks only. The backend no longer
targets this `message`/`response` protocol; current RunPod deployment uses the
native FastAPI `messages`/`reply` contract documented in `../ai-service/RUNPOD.md`.
The old chat URL was cleared from the local backend environment during migration.

React continues calling authenticated `POST /api/ai/chat` on Express. The backend reads the Kaggle connection exclusively from `backend/.env` (process environment can override dotenv values):

```dotenv
AI_SERVICE_URL=https://<current-tunnel-host>
AI_SERVICE_TOKEN=<matching-Kaggle-token>
AI_CHAT_API_FORMAT=kaggle
AI_CHAT_TIMEOUT_MS=135000
AI_ASR_SERVICE_URL=<existing-speech-service-root>
AI_ASR_SERVICE_TOKEN=<existing-speech-service-token>
```

Use the tunnel root URL, without `/chat`. Restart Express after changing `.env`; no frontend rebuild is needed for tunnel/token changes. The URL and token are never sent to the browser. `AI_CHAT_SERVICE_URL` is no longer used. The default API format is `kaggle`; `native` explicitly selects the repository's original `messages`/`reply` protocol without changing model/provider. There is no automatic protocol retry and no fake-response fallback.

The prior speech URL/token were copied into `AI_ASR_SERVICE_URL` and `AI_ASR_SERVICE_TOKEN` before the chat connection changed. Keep them set when chat and ASR run separately; the Kaggle API described here has no `/transcribe`. No Python model is started on the laptop. No deployment or changes to bookstore, reader, admin, JWT middleware or database schemas are required.

## Adapter

The frontend's bounded history and short language codes remain unchanged:

```json
{"language":"en","messages":[{"role":"user","content":"Hello"}]}
```

Express forwards the first turn exactly as:

```json
{"message":"Hello","language":"English"}
```

Mappings: `en` → `English`, `yo` → `Yoruba`, `ha` → `Hausa`, `ig` → `Igbo`. For follow-ups, the single `message` contains an instruction to answer the last turn and JSON-encoded prior user/assistant turns. This retains context within the existing bounded history, but it is plain-text context rather than native model role messages; its effectiveness depends on the notebook's prompt/generation code. If Kaggle rejects a long input, shorten it or start a new chat.

Kaggle must return a nonempty `response`, the exact requested language name, and `model: "NCAIR1/N-ATLaS"`. Express verifies those fields, measures the upstream round-trip time itself, and returns the existing browser envelope:

```json
{"success":true,"data":{"reply":"<actual-upstream-text>","language":"en","model":"NCAIR1/N-ATLaS","processing_time_ms":123}}
```

Only those four data fields reach React. Credentials, response headers, internal errors and arbitrary upstream metadata are excluded. Existing JWT verification, database user/status checks, per-user rate limiting, request-size validation, capacity controls and cancellation remain in force.

## Failure handling

- Network/DNS failures and unavailable/expired tunnel responses produce a safe 503, keeping the user's draft available for retry. Restart Kaggle/FastAPI/cloudflared as needed, update `AI_SERVICE_URL`, and restart Express.
- Upstream 401/403 becomes `ai_auth_failed` (503), so a Kaggle token mismatch does not incorrectly sign the website user out. Check the matching server tokens without logging them.
- Inference/proxy timeout responses, including HTTP 524, become 504. Defaults remain 120 seconds in the separately maintained native Python implementation, 135 seconds in Express and 150 seconds in React. The Kaggle notebook controls its own generation deadline; align it below Express's deadline.
- HTML tunnel pages, malformed JSON, wrong model/language and empty replies are rejected. Model-output quality must still be verified: a valid JSON response naming the model alone does not prove actual model generation.
- Requests have no automatic retry; retrying an expensive generation is always explicit. Cancelling the browser request stops waiting, but the notebook may continue generating.

No token, tunnel URL, raw Axios error or model response is printed by the new diagnostic scripts. Live browser checks do not record traces, HAR, screenshots, video or storage state.

## Run checks (local only, no deployment)

```powershell
npm.cmd --prefix backend run test:ai
npm.cmd --prefix frontend run build
$env:PLAYWRIGHT_CHANNEL='msedge'
npm.cmd --prefix frontend run test:speech

# Connectivity only; server-side .env provides URL/token.
npm.cmd --prefix backend run check:chat
# Explicit short generation; logs only status/model/language/count/timing.
node backend/scripts/check-chat-connection.cjs --infer

# Real browser → production Express → configured Kaggle API.
npm.cmd --prefix backend run test:chat:live
```

The live browser script requires Edge (or `PLAYWRIGHT_CHANNEL`), frontend development dependencies, free localhost ports 5102/5194, access to the configured MongoDB, and a running Kaggle tunnel. It starts the production Express entry point and a local Vite server, creates one unique temporary account through the real registration endpoint, signs in through the actual React form, sends four language checks and a follow-up, and removes that exact temporary account in `finally`. It never uses fake inference or authentication. It stops its own servers and writes only sanitized results to ignored `.cache/chat-live-result.json`. It does not modify existing users, books or orders. An abrupt process/host termination can interrupt cleanup; normal failures run cleanup and report its outcome.

`test:ai` and `test:speech` remain isolated regression tests with explicit test doubles. Their mock successes must not be presented as live Kaggle inference.

## Results recorded on 11 October 2026

The configured Cloudflare tunnel returned HTTP 200 from `/health`. The final live browser run passed with **real React sign-in, the production Express entry point, the configured MongoDB, and the configured HTTPS Kaggle endpoint**. There were no inference or authentication mocks in that run.

| Live request | Reply characters | Express-measured upstream time | Rendered in React |
| --- | ---: | ---: | --- |
| English | 6 | 1,369 ms | Yes |
| Yoruba | 32 | 1,772 ms | Yes |
| Hausa | 17 | 1,139 ms | Yes |
| Igbo | 5 | 795 ms | Yes |
| English follow-up with previous exchange | 167 | 3,776 ms | Yes |

All replies contained text and passed response-contract checks; first-turn responses identified `NCAIR1/N-ATLaS` and the requested language. This confirms live integration with the provided endpoint, not a comprehensive assessment of linguistic quality or an independent audit of the notebook's loaded weights. Anonymous Express chat requests returned 401. The browser never requested the tunnel directly. The temporary test account was deleted and both temporary application servers were stopped. Earlier live-test startup/origin configuration failures also cleaned up their temporary accounts; the final run passed.

Regression validation: 42 backend tests passed; all 14 chat/speech browser tests passed; frontend and backend builds passed. The frontend retains its non-blocking bundle-size warning. A scan of 67 frontend source/build files found no configured tunnel URL or service token. No local model loading or deployment was performed.

These results are a point-in-time check. Kaggle and cloudflared must keep running; when the temporary tunnel changes, update the server environment and restart Express.

## Files changed for the Kaggle adapter

- `backend/src/config/env.ts`: Kaggle configuration plus separate ASR settings.
- `backend/src/services/chat.service.ts`: request/history/language translation, response normalization and safe tunnel/auth/timeout errors.
- `backend/.env`: preserved prior ASR URL/token; Kaggle settings supplied by the user. Ignored and never printed.
- `backend/.env.example`: new server-only settings and protocol selection.
- `backend/scripts/check-chat-connection.cjs`: redacted live connectivity/generation check.
- `backend/scripts/smoke-chat-live.cjs`: actual browser/Express/Kaggle verification and temporary-account cleanup.
- `backend/package.json`: diagnostic/live-test commands.
- `backend/tests/chat.test.cjs`: Kaggle format, native compatibility and failure coverage.
- `frontend/tests/fixtures/backend.cjs`: explicitly retains native mocked ASR/chat regression configuration.
- `README.md`, `docs/lightbridge-chat.md`, `docs/kaggle-chat.md`: current integration/setup documentation.

Production React source, authentication/authorization middleware and Python model-loading code did not need changes. Builds regenerate ignored artifacts.
