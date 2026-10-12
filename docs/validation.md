# Local validation — 2026-10-10

Completed for the existing Python service, Phase 3 Express integration, Phase 4 website interface and Cloudflare configuration groundwork:

| Check | Result |
| --- | --- |
| Python API, real audio decoding, mocked inference, auth, bounds, timeouts and worker lifecycle | 42 tests passed |
| Express proxy, JWT auth, upload bounds, limits, errors, timeouts, image-upload compatibility, CORS and database-log redaction | 22 tests passed |
| Browser recording → Express → existing FastAPI factory with real FFmpeg and mocked inference | 9 tests passed |
| Frontend/admin URL configuration, upload-path round trips and native SPA fallback configuration | 6 tests passed |
| Frontend production TypeScript/Vite build | Passed |
| Admin production TypeScript/Vite build | Passed |
| Express TypeScript build | Passed |
| Configured server secrets absent from frontend/admin production assets | Passed |
| Frontend/admin standalone npm lockfile dry runs | Passed; stale root-package dependency removed |
| Python scripts/module compilation | Passed |
| Python dependency consistency | `pip check` passed |
| Real Whisper library compatibility | CPU feature extraction + forward pass passed with tiny randomly initialized weights; no checkpoint download |
| Local helper using `app.main:create_app`, one worker, no reload | Startup passed on a temporary port |
| Actual Hugging Face checkpoint preflight | Both models returned `model_access_denied`; authorized access still required |

Browser coverage includes protected routing/navigation, both languages, direct refresh, microphone permission failures, supported MIME negotiation, recording/preview/transcription/copy, automatic stop, late permission cleanup, unmount cleanup, retries, processing state, expired authentication, invalid file selection and mobile layout. Only model inference and database lookup are mocked in the isolated browser services; multipart HTTP, JWT verification, the production Express route, existing FastAPI factory and FFmpeg execute normally. Tests do not download checkpoints or use the user's microphone. Playwright used installed Microsoft Edge.

The standalone lockfile, Python compilation/dependency consistency and tiny Whisper checks above were performed during Phase 1–2. They establish library compatibility, not access to the official checkpoints.

Local runtime: Windows, Node.js 22.19.0, Python 3.14.8, PyTorch 2.9.1+cpu, Transformers 4.57.6. CUDA was unavailable. Codec tests used the development-only FFmpeg binary bundled with imageio-ffmpeg; production Docker uses system FFmpeg.

Known non-fatal diagnostics: the customer bundle retains Vite's existing >500 kB chunk warning; Starlette's test client reports an upstream AnyIO deprecation warning.

## Live checkpoint limitation

The actual running backend accepted existing user authentication but transcription did not succeed. Direct audio submission to the existing Python process returned `internal_error`. Its command uses `app.main:create_app --factory --reload`; the installed Uvicorn selects Windows SelectorEventLoop with reload, which cannot launch asynchronous FFmpeg subprocesses. The new `scripts/start_local.py` helper preserves the factory and runs with one worker and no reload. Restart the existing Python server using that helper.

Separately, the real Hub preflight returned `model_access_denied` for both `NCAIR1/Yoruba-ASR` and `NCAIR1/NigerianAccentedEnglish` with the current configuration. Configure an authorized server-side `HF_TOKEN`, complete model access requirements, rerun the preflight, and follow the [manual checkpoint test](speech-to-text.md#manual-checkpoint-integration-test). A healthy `/health` response does not prove checkpoint access. No successful real-checkpoint transcript or model accuracy is claimed.

Not exercised: GPU execution, Docker build (Docker unavailable), hosted Cloudflare routing, or successful official-checkpoint downloads/inference.

No cloud resources were deployed. Existing database data was not seeded/reset, and the existing mutating bookstore end-to-end script was not run. Builds provide compilation coverage, not an assertion that every existing bookstore workflow received a browser test.

An existing database startup failure log exposed its connection string during validation. That logging was removed and a regression test now verifies that neither the URI nor raw driver errors are printed. Rotate the exposed MongoDB password; changing the logger does not invalidate an already exposed credential.

See [Speech to Text setup and file manifest](speech-to-text.md) for local commands, configuration and implementation details.

## Speech removal undone — 12 October 2026

Restored the speech UI, navigation, Express/FastAPI routes, services, configuration, dependencies, tests and documentation. Existing Kaggle chat credentials and integration remain intact. Subsequent CPU deployment changes are preserved; the restored speech container definition is `ai-service/Dockerfile.speech`, leaving the newer CPU `Dockerfile` in place.

Verification: frontend, admin and backend builds passed; 42 backend tests, 57 Python tests and 6 hosting checks passed. Browser coverage passed all 14 cases across the initial run and an isolated rerun: the initial run passed 13 cases, while the chat cancellation case raced its simulated response and passed when rerun after the builds. Tests use isolated inference fixtures, not real model generation.

The removed ASR model cache and generated speech smoke-test artifacts were not recovered. No model weights were downloaded or loaded, no real inference was rerun, and nothing was deployed during the undo.
