# Speech to Text — Phases 3 and 4

The customer website now has **Speech to Text** in its desktop and mobile navigation. Its protected page is **http://localhost:5173/transcribe**. Sign in with an existing account; unauthenticated visits return to this page after login.

The flow is React MediaRecorder/file upload → authenticated Express `POST /api/ai/transcribe` → existing FastAPI `POST /transcribe` → official NCAIR model → transcript displayed in React. The page reuses the existing typography, emerald/ivory palette, dark mode, Button component, routing and Axios authentication. Bookstore, reader and admin routes remain intact.

## Local setup

Run from the repository root:

```powershell
npm --prefix backend ci
npm --prefix frontend ci
```

The existing `.env` files were preserved. Check these server-only backend values:

```dotenv
AI_SERVICE_URL=http://127.0.0.1:8000
AI_SERVICE_TOKEN=<same value as ai-service/.env, at least 32 characters>
AI_SERVICE_TIMEOUT_MS=780000
AI_UPLOAD_TIMEOUT_MS=30000
AI_MAX_UPLOAD_BYTES=10485760
AI_RATE_LIMIT_WINDOW_MS=900000
AI_RATE_LIMIT_MAX=5
AI_MAX_CONCURRENT_REQUESTS=2
```

In `ai-service/.env`, configure the matching `AI_SERVICE_TOKEN` and an `HF_TOKEN` authorized for both `NCAIR1/Yoruba-ASR` and `NCAIR1/NigerianAccentedEnglish`. Accept each model repository's access terms using the account that owns the token. Do not paste secrets into chat, commit them, or create `VITE_*` copies.

The diagnosis on 2026-10-10 confirmed that the configured HF token is valid (identity endpoint HTTP 200), but both pinned model repositories return HTTP 403 `GatedRepo`: the token's account is not on their authorized-access lists. Sign in as that account and request/accept access on both [Yoruba-ASR](https://huggingface.co/NCAIR1/Yoruba-ASR) and [NigerianAccentedEnglish](https://huggingface.co/NCAIR1/NigerianAccentedEnglish). Wait for approval if required. Creating a token alone does not grant repository access. Health checks alone do not verify model access. Validate access with:

```powershell
cd ai-service
.venv\Scripts\python.exe scripts/check_models.py
```

`app/config.py` now resolves `.env` relative to `ai-service/`, including when a script or Uvicorn starts from another directory. Process environment variables still override `.env`; restart Python after token changes. `app/inference.py` already passes the configured token explicitly to both `WhisperProcessor.from_pretrained` and `WhisperForConditionalGeneration.from_pretrained`, with the registered model IDs and pinned revisions unchanged.

The follow-up access check after approval passed for both pinned repositories. The Nigerian English weights were subsequently downloaded and loaded successfully. A real inference request using the existing synthesized spoken English WAV, through the actual Express `AiService` and running FastAPI, returned "good morning from nigeria. this is a speech to text integration test." in approximately 67 seconds. This verifies real checkpoint inference; browser login was not exercised by that diagnostic. Yoruba repository access is confirmed, but its weights and real transcription still require verification.

For a slow connection, download and load weights before submitting a browser request (run from `ai-service/`):

```powershell
.venv\Scripts\python.exe scripts/check_models.py --download-weights --language en-NG
.venv\Scripts\python.exe scripts/check_models.py --download-weights --language yo
```

Wait for `READY` for each language. This uses the existing NCAIR loader and cache, with no substitute model. It resumes partial Hub downloads and runs outside the API's 600-second cold-load deadline. Without `--download-weights`, the command still checks only small configuration files. A completed download persists across Python restarts; the API loads those files into its own inference worker on the next request.

The environment now includes the pinned Hugging Face `hf-xet` downloader in `requirements.txt`; it was missing from this Windows installation. The English HTTP download completed after retries; Xet is available for subsequent downloads. `pip check` reports no broken requirements.

Stop your previous Python development server in its terminal, then start the existing application factory using the new local helper:

```powershell
# From ai-service/
.venv\Scripts\python.exe scripts/start_local.py
```

This runs **`app.main:create_app` with `factory=True`**, one worker and no reload, on `127.0.0.1:8000`. It first uses system/configured FFmpeg, or the dev-only imageio-ffmpeg executable if installed through `requirements-dev.txt`. It does not replace the FastAPI app, decoder, model cache or checkpoint registry.

**Windows: do not add `--reload` or multiple Uvicorn workers.** The installed Uvicorn version selects SelectorEventLoop in those modes, which cannot execute the service's asynchronous FFmpeg subprocess. The existing live server was using `--reload` and returned `internal_error` on audio despite a successful health check. The helper selects the normal compatible single-worker startup. For a standard setup with FFmpeg on PATH, the equivalent command is:

```powershell
.venv\Scripts\python.exe -m uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 --workers 1 --no-access-log
```

The live failure was reproduced with the existing spoken WAV: FastAPI returned HTTP 500 `internal_error`, and the actual Express `AiService` mapped that to HTTP 503 `ai_unavailable` ("Speech to Text is temporarily unavailable. Please retry."). Decoding the same file under SelectorEventLoop raised `NotImplementedError`; ProactorEventLoop decoded it successfully. The required Whisper imports succeed, the Express/Python service tokens match, and the failure happens before the configured load/inference deadlines. Correct startup removes this decoder failure; Hugging Face repository authorization is a separate prerequisite for a real transcript.

Before repository approval, restarting with `scripts/start_local.py` allowed the same WAV through the real Express `AiService` to reach the NCAIR loader, which returned HTTP 503 `model_access_denied` in approximately 14 seconds. This was a real model-loading attempt, with no substitute model or fake transcript. Python regression checks passed (44 tests). The subsequent approved-access English transcription result is recorded above. The proxy-client diagnostic did not exercise browser login; use the authenticated website or the manual Express smoke script below for the full request flow.

In separate terminals from the repository root:

```powershell
npm --prefix backend run dev
npm --prefix frontend run dev
```

Keep MongoDB accessible using your existing backend configuration. Restart Express after changing `.env`. If the services are already running, reuse them; avoid duplicate servers on the same port.

Frontend public settings are optional for local use:

```dotenv
VITE_API_BASE_URL=/api
DEV_API_PROXY_TARGET=http://localhost:5000
VITE_SPEECH_MAX_SECONDS=59
VITE_SPEECH_MAX_BYTES=10485760
VITE_SPEECH_TIMEOUT_MS=810000
```

The default 59-second recording cap leaves room for codec padding under Python's 60-second limit. File duration is verified by FastAPI/FFmpeg. Keep frontend limits at or below backend/Python limits when customizing them. The browser deadline allows for the existing 600-second cold model load, 120-second inference window and upload/decode overhead. Prewarm models for a faster first production request.

The AI proxy and manual Express smoke script use the existing Axios HTTP adapter with a total AbortSignal deadline. Node's built-in fetch has an additional 300-second response-header timeout that previously caused `ai_unavailable` during a cold download despite the configured 780-second deadline. The proxy retains its 64 KiB response cap, disabled redirects, cancellation, and safe error mapping. Backend regression checks passed (24 tests).

## Try it in the website

1. Visit `http://localhost:5173`, sign in, and click **Speech to Text**.
2. Select **Yoruba** or **Nigerian English**.
3. Click **Start recording**, allow microphone access, speak a short sentence, then click **Stop recording**. The recording stops automatically at the displayed limit.
4. Use the audio player to listen. Choose **Record again** if needed.
5. Click **Transcribe audio**. The page shows processing status, then the transcript.
6. Click **Copy transcript**. On an API failure, **Retry transcription** reuses the same recording.
7. Alternatively, choose a WAV, WebM or OGG file. MP3/MP4/AAC are intentionally not accepted by the existing Python contract. Browsers without supported MediaRecorder output receive a clear message and can use file upload.

Browser microphone access requires localhost or HTTPS. Tracks stop immediately when recording ends or the page unmounts; late permission responses are also cleaned up. Object URLs, preview playback, timers and pending browser HTTP requests are cleaned up on navigation/reset. Submitted audio/transcripts are not added to MongoDB or the user's library. Inference already in progress may continue until the Python deadline if the browser disconnects.

## API and operational behavior

`POST /api/ai/transcribe` uses the existing JWT/cookie `protect` middleware, including disabled-user checks. Send multipart fields **`audio`** (one file) and **`language`** (`yo` or `en-NG`). Do not manually invent a multipart boundary. Express sends **`Authorization: Bearer <AI_SERVICE_TOKEN>`** to FastAPI; the user's JWT is never substituted for that credential.

Successful browser response:

```json
{
  "success": true,
  "data": {
    "transcript": "Ẹ káàárọ̀",
    "language": "yo",
    "model": "NCAIR1/Yoruba-ASR",
    "processing_time_ms": 1250.5
  }
}
```

Validation includes MIME and container signature checks, file size, total request bytes, fields/counts and language; Python remains authoritative for actual decoding and duration. Files stay in bounded memory. Authentication precedes upload parsing. The default limit is five requests per authenticated user per 15 minutes, one active request per user and two total active uploads/proxy requests per Express instance. Busy/rate-limited responses use 429 and Retry-After. Rate counters are process-local; use a shared rate-limit store before scaling Express across instances.

Error responses use `{success:false,message,error:{code},request_id}` (existing authentication failures retain their original format). Upload timeouts are 408; size failures 413; unsupported formats 415; invalid language/audio/duration 422; service configuration/access/unavailability 503; upstream timeouts 504. Upstream service-auth failures map to 503 so they cannot masquerade as an expired user session. Backend responses/logs never include raw upstream errors, audio, transcripts, service tokens or HF tokens. A related existing database failure log was also changed to avoid printing MongoDB connection strings/raw driver errors.

## Automated tests

```powershell
# Root: backend proxy/auth/upload/error tests and existing CORS checks
npm --prefix backend run test:ai
node --test tests/hosting.test.cjs

# Python regression tests (no checkpoints)
cd ai-service
.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.venv\Scripts\python.exe -m pytest -q
cd ..

# Browser suite: choose installed Edge on this Windows machine
$env:PLAYWRIGHT_CHANNEL='msedge'
npm --prefix frontend run test:speech
```

For bundled Chromium instead, run `npx playwright install chromium` inside `frontend` and leave `PLAYWRIGHT_CHANNEL` unset. The Python interpreter defaults to `ai-service/.venv`; `AI_TEST_PYTHON` can override it. Build the backend first (`npm --prefix backend run build`, also done by `test:ai`) because browser fixtures import its compiled router/auth middleware.

Playwright starts isolated React/Express/FastAPI test services on ports **5193 / 5101 / 8101**. It uses real browser recording, multipart HTTP, existing JWT authentication logic and FFmpeg. Only the database lookup and model inference are mocked. The fake token endpoint exists solely in `frontend/tests/fixtures/backend.cjs`, never in production routes. Tests cover permissions, format negotiation, recording/auto-stop, preview, late permission cleanup, unmount cleanup, both languages, successful transcript/copy, retries, auth errors, file fallback and mobile layout. They do not use your microphone or download model weights.

If an interrupted Windows run leaves test processes alive, stop only those fixture processes before rerunning; the config intentionally refuses to reuse unknown servers on these ports.

## Manual checkpoint integration test

After configuring authorized model access and restarting Python correctly, test through the actual Express endpoint using an existing local account and a short spoken recording. Supply credentials in environment variables or use an existing user JWT in `SPEECH_TEST_USER_TOKEN`:

```powershell
$env:SPEECH_TEST_EMAIL='your-account-email'
$env:SPEECH_TEST_PASSWORD='your-account-password'
node backend/scripts/smoke-ai.cjs path/to/recording.wav en-NG
# Or: node backend/scripts/smoke-ai.cjs path/to/yoruba.webm yo
Remove-Item Env:SPEECH_TEST_EMAIL,Env:SPEECH_TEST_PASSWORD
```

The script logs in using the real auth API, forwards audio through Express, and checks the response's official model ID/language/non-empty transcript. It logs only a pass/error summary, never credentials or transcript text. `SPEECH_TEST_API_BASE_URL` overrides the default `http://127.0.0.1:5000/api`. Review language accuracy, names and Yoruba diacritics in the website. Automated success does not establish real checkpoint accuracy or access.

## Files created or modified in this delivery

| Created | Purpose |
| --- | --- |
| `backend/src/services/ai.service.ts` | Validated private FastAPI client and safe response/error mapping |
| `backend/src/routes/ai.routes.ts` | Authenticated upload route, limits and admission control |
| `backend/tests/ai.test.cjs` | HTTP proxy/auth/upload/timeout tests and image-upload regression |
| `backend/tests/db-logging.test.cjs` | Credential-redaction regression |
| `backend/scripts/smoke-ai.cjs` | Explicit real-checkpoint manual test through Express |
| `frontend/src/api/ai.api.ts` | Typed authenticated transcription client and public limits |
| `frontend/src/hooks/useAudioRecorder.ts` | Recorder, MIME negotiation and resource lifecycle |
| `frontend/src/pages/TranscribePage.tsx` | Responsive recording/transcript UI |
| `frontend/playwright.config.ts` | Isolated browser-test orchestration |
| `frontend/tests/transcribe.spec.ts` | Browser integration/lifecycle coverage |
| `frontend/tests/fixtures/backend.cjs` | Test Express server with production AI router/auth |
| `frontend/tests/fixtures/mock_asr.py` | Existing FastAPI factory with mocked model only |
| `ai-service/scripts/start_local.py` | Local launcher for the existing factory, compatible with Windows FFmpeg |
| `docs/speech-to-text.md` | This guide and source-file manifest |

| Modified | Purpose |
| --- | --- |
| `backend/src/config/env.ts` | Server-only AI settings |
| `backend/src/config/db.ts` | Remove connection-string/raw-error logging |
| `backend/src/routes/index.ts` | Mount `/api/ai` |
| `backend/.env.example` | AI configuration examples |
| `backend/package.json`, `backend/package-lock.json` | Multer 2.2.0 and test command |
| `frontend/src/App.tsx` | Protected `/transcribe` route |
| `frontend/src/components/common/Navbar.tsx` | Desktop/mobile Speech to Text navigation |
| `frontend/.env.example` | Public recording limits/deadline |
| `frontend/package.json`, `frontend/package-lock.json` | Test-only Playwright and test command |
| `ai-service/.env.example`, `ai-service/README.md` | Current integration/startup instructions |
| `.gitignore` | Ignore Playwright reports/results |
| `README.md`, `docs/project-analysis.md`, `docs/validation.md` | Current implementation scope and verification |

Build-generated `backend/dist`, `frontend/dist`, `admin/dist` and TypeScript build metadata were regenerated; test results and the synthetic local smoke WAV are ignored artifacts. Existing private `.env` files and all files under `ai-service/app/` were left unchanged. No deployment was performed.
