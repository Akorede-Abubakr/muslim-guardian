# LightBridge AI integration — existing publishing platform

**Text chat:** Sign in and open `/chat` (LightBridge AI in the navigation). English, Yoruba, Hausa and Igbo chat use only `NCAIR1/N-ATLaS` on a separately hosted GPU service. Local text-model loading is disabled by default. See [chat deployment, tests and changed files](docs/lightbridge-chat.md).

The current Express adapter connects to the Kaggle `message`/`response` API through server-only environment settings. See [Kaggle setup and actual live browser test results](docs/kaggle-chat.md); no deployment was performed.

This workspace retains its customer bookstore/reader (`frontend`), publisher dashboard (`admin`), Express API (`backend`) and MongoDB. The new private Python service (`ai-service`) runs the official NCAIR/Awarri speech checkpoints locally. Existing application branding and workflows are preserved.

**Phases 1–4 are implemented, with local integration tests and Cloudflare configuration groundwork.** Sign in and open `/transcribe`, or use **Speech to Text** in the navigation. Express forwards authenticated uploads to the existing FastAPI service. Real checkpoint use requires authorized Hugging Face access. Nothing has been deployed.

- [Repository analysis and next-phase integration points](docs/project-analysis.md)
- [Python setup, API contract, model access, tests and Docker](ai-service/README.md)
- [Existing bookstore/backend documentation](backend/README.md)
- [Local validation results and limitations](docs/validation.md)
- [Speech to Text: local setup, testing, troubleshooting and changed files](docs/speech-to-text.md)

## Local development

Use Node.js 22, MongoDB and Python 3.12 (the Docker baseline). Install each npm project independently:

```sh
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix admin ci
```

Copy each `.env.example` to `.env` only if the target file does not already exist. Preserve the existing backend credentials/database configuration. Configure a unique `JWT_SECRET`; local defaults point at ports 5000, 5173 and 5174.

In separate terminals:

```sh
npm --prefix backend run dev
npm --prefix frontend run dev
npm --prefix admin run dev
```

Follow [ai-service/README.md](ai-service/README.md) for Python setup and gated-model access. Do not seed or reset an existing MongoDB database to test speech recognition.

## Cloudflare preparation — no deployment performed

Host the customer app and admin app as **two separate Cloudflare Pages projects**, or as **two Workers serving static assets**. Both are Vite builds; neither executes Node, Python or PyTorch. The Express API remains on an independent Node-compatible host with MongoDB and persistent uploads. Python runs on separate CPU/GPU-compatible infrastructure, accessible privately from Express.

```text
Browser → Cloudflare static React app → HTTPS Express API → private FastAPI ASR
                                             ↓                  ↓
                                           MongoDB       persistent HF cache
```

The browser sends multipart audio to `POST /api/ai/transcribe`. Express validates the authenticated request and calls private FastAPI `/transcribe` with its server-only bearer token. The Python endpoint is never called directly by the browser.

### Build-time public variables

| Variable | Frontend | Admin | Production example |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Required for separate API hosting | Required | `https://api.example.com/api` |
| `VITE_MEDIA_BASE_URL` | Optional | Optional | `https://api.example.com` or a CDN origin |
| `VITE_FRONTEND_URL` | — | Required | `https://app.example.com` |
| `DEV_API_PROXY_TARGET` | Local Vite only | Local Vite only | `http://localhost:5000` |

`VITE_API_BASE_URL=/api` is the local default. Cloudflare does not run Vite's development proxy: set the absolute API URL **before building**. Rebuild to change these values. Returned `/uploads/...` references resolve against the API origin, or the optional media origin; app-owned `/images/...` assets remain on Cloudflare.

Every `VITE_*` value is public JavaScript. **Never set `VITE_HF_TOKEN`, `VITE_AI_SERVICE_TOKEN`, database credentials or any secret in either frontend project.** `HF_TOKEN` belongs only to Python. `AI_SERVICE_TOKEN` belongs only to Python and Express.

### Cloudflare Pages

When deployment is later approved, create one Pages project with root directory `frontend`, build command `npm run build`, output `dist`; create another with root directory `admin`, the same build command/output. Set Node.js 22 and each app's public variables in its build environment. Their independent lockfiles support `npm ci`; an obsolete reference to the missing root npm package has been removed.

Pages uses its [native SPA fallback](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering) because neither app provides a top-level `404.html`. This lets BrowserRouter handle direct visits/refreshes such as `/books/123`, `/read/123`, `/dashboard` and admin `/content-editor`, while existing static assets retain normal routing. Keep the generated root `index.html` and do not add a root `404.html`. No catch-all `_redirects` rewrite or Pages Functions are required.

Use [Cloudflare's Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/). Preview domains must be explicitly approved in backend configuration before authenticated API use; do not allow every `*.pages.dev` origin.

### Workers static assets alternative

Each browser app includes `wrangler.jsonc` with `assets.directory=./dist` and `not_found_handling=single-page-application`, following [Cloudflare's SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/). Use a current Wrangler CLI from within the app folder to preview its build locally (`npx wrangler dev`). These configs have no Python or Node server entry point. Wrangler is not needed for Pages builds. No publish/deploy command has been executed.

### Independent backend settings

Set these on the Node host, not Cloudflare's browser build:

```dotenv
NODE_ENV=production
FRONTEND_URL=https://app.example.com
ADMIN_URL=https://admin.example.com
JWT_SECRET=<unique random value of at least 32 characters>
MONGODB_URI=<your private database URI>
```

Production CORS now accepts only the two exact HTTPS origins, without trailing slashes. Unknown origins receive 403; localhost is excluded. Requests without Origin remain allowed for native/service clients and still pass normal route authentication. If using preview apps, explicitly configure their exact approved origins for a staging backend. Keep HTTPS enabled; existing bearer authentication works across frontend/API origins, with the existing secure cookie behavior retained. Use a persistent volume or existing supported storage integration for uploads; Cloudflare's static files do not store backend uploads.

## Verification

```sh
npm --prefix frontend run build
npm --prefix admin run build
npm --prefix backend run build
node --test backend/tests/cors.test.cjs
node --test tests/hosting.test.cjs
npm --prefix backend run test:ai
npm --prefix frontend run test:speech
cd ai-service
python -m pytest -q
```

Install `ai-service/requirements-dev.txt` for Python tests. Browser tests require Playwright's Chromium (`cd frontend && npx playwright install chromium`) or an installed browser channel, such as `$env:PLAYWRIGHT_CHANNEL='msedge'` in PowerShell. They launch isolated services on ports 5193/5101/8101 and exercise the real React recorder, Express route, existing FastAPI factory and FFmpeg, with only model inference and the database user lookup mocked. No model weights are downloaded by automated tests. The existing mutating bookstore `test:e2e` script is not needed; actual checkpoint verification uses `backend/scripts/smoke-ai.cjs` or the manual procedure in the [speech guide](docs/speech-to-text.md).
