# Phase 1: existing application and integration plan

Inspected 2026-10-09 before implementation. The supplied workspace contains three independent npm projects, no root package.json/README or Git metadata, and no repository AGENTS.md. Existing source branding is Muslim Guardian, Living in the light of Allah, and BrightMind; this integration preserves it. LightBridge AI names only the new speech service/documentation.

| Area | Existing implementation | Integration decision |
| --- | --- | --- |
| Customer app | React 18, TypeScript, Vite 6, React Router BrowserRouter, TanStack Query, Axios; home/about, books/details, reader, dashboard/library, blog, auth, mock checkout | Preserve all routes and components; later add an authenticated speech page |
| Reader | ReaderHeader/Footer/Sidebar, settings, bookmarks, progress, preview interruptions | Leave reading/access-control behavior intact |
| Admin | Separate React/Vite app; protected layout, overview, books, chapter/page editor, categories, orders, users, reviews, blogs | Preserve workflows and role checks |
| Design | Tailwind, DM Sans/Lora, emerald #077432, gold #C6A15B, ivory #F8F5ED, charcoal #202522; dark mode; shared button/modal/badge patterns | Future recorder should reuse these tokens/components |
| Express | Controllers/routes/services, Mongoose models; `/api/auth`, books, categories, chapters, pages, reader, orders, library, progress, bookmarks, reviews, blogs, admin | Phase 3: isolated AI router/service, using existing `protect` middleware |
| Authentication | bcrypt passwords, signed JWT, HTTP-only cookie and browser bearer tokens, database-backed user check, disabled-user check, `adminOnly` | Preserve token keys and user/admin checks; new Python token authenticates Express, not individual users |
| Data/storage | MongoDB, local image uploads, Paystack real/mock payment service; preview and purchased-access enforcement | No schema/data migration or payment changes |
| Configuration | `backend/src/config/env.ts` uses dotenv; Vite proxies localhost API and uploads; Axios clients originally hardcode `/api`; admin has localhost storefront links | Add public build-time URL variables; preserve local defaults and existing `.env` |
| Hosting issue | Express CORS originally allows every origin; `/uploads` references would hit the wrong domain when hosted separately | Exact production HTTPS origin allowlist; resolve returned upload paths against backend origin |
| Install issue | Both browser manifests reference `muslim-guardian-root: file:..`, but that root package is absent and no source imports it | Remove stale local dependency and its lock entries for standalone installs |
| Existing verification | Build scripts in each app; `backend/src/scripts/test-e2e.ts` uses live services, demo accounts and mutates data | Run builds; do not run that script against existing local data |

## Delivery boundaries

Phase 2 adds an independently deployable FastAPI service under `ai-service`, without MongoDB coupling or changes to bookstore flows. Yoruba and Nigerian English are enabled; Hausa and Igbo are registered but disabled by default. No external inference API is invented: Hugging Face Transformers loads the official pinned checkpoints locally.

The requested Cloudflare groundwork is included now: environment-configurable browser API/media/storefront URLs, Pages native SPA fallback, Workers static asset configurations, production CORS and setup docs. No resources are deployed.

Phase 3 was completed on 2026-10-10: `backend/src/routes/ai.routes.ts` and `services/ai.service.ts` add the authenticated Express multipart proxy, per-user rate limiting, bounded uploads/concurrency, safe upstream errors and cold-start-aware timeouts. The existing JWT middleware is preserved and `AI_SERVICE_TOKEN` stays server-side.

Phase 4 was completed on 2026-10-10: the protected `/transcribe` page and navigation link provide recording, MIME negotiation, timer, preview, transcript/copy/retry and lifecycle cleanup. Browsers without a supported recorder format get a clear message and a WAV/WebM/OGG file-upload fallback. MP4/AAC support was not added to the Python contract.

Phase 5 now includes Python regression tests, Express HTTP tests and Playwright tests through the existing FastAPI factory with actual FFmpeg and mocked inference. Real checkpoint validation remains dependent on authorized Hugging Face access. See [current results](validation.md) and the [complete integration guide](speech-to-text.md). Docker and Cloudflare instructions cover deployment preparation only.

## Verified model access and dependencies

The public [official organization](https://huggingface.co/NCAIR1/models), model cards and Hub metadata identify all four repositories as gated. Public metadata confirms file inventories and commit hashes; successful authenticated weight access has not been verified without the user's token. Yoruba and English cards document Whisper Small and 16 kHz inputs. The repositories expose `pytorch_model.bin`, not safetensors; use modern PyTorch's `weights_only` loading, without remote repository code. Only model/tokenizer files are loaded, not optimizer/training state.

See `ai-service/app/registry.py` for pinned revisions and `ai-service/README.md` for access checks, attribution and model-card terms. Dependency versions were checked against PyPI before implementation. FFmpeg performs decoding/resampling, avoiding optional librosa/torchaudio/torchcodec dependencies. Real checkpoint quality and GPU behavior still require manual validation on authorized infrastructure.
