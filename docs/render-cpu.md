# N-ATLaS: preparation and CPU inference entirely on Render

## Status

Implementation prepared on 12 October 2026. **Docker builds, conversion and real N-ATLaS inference have not been verified on Render. No service has been deployed or purchased.** There is no Docker executable or prepared GGUF in this workspace. Unit tests are not evidence of inference. Follow the verification gates below before connecting the website.

Validation here: the full Python suite passed 63 tests; a final focused run passed 21 tests including two added resource/success-path checks. All 42 backend tests and Python compilation checks passed. Test doubles exist only in unit tests; the preparation job calls the actual model smoke script.

The active backend chat tunnel URL has been cleared and the chat protocol set to `native`. Until you supply a verified Render URL and restart Express, chat is unconfigured. No running external service has been stopped or changed. There is no automatic Kaggle fallback. Existing speech code/configuration remains separate; this Render service is for N-ATLaS text chat only.

For free-tier testing, use the separate [remote inference guide](render-free.md). This CPU workflow is preserved for a future paid deployment and cannot run within 512 MB.

## Why preparation is a separate phase

Full download, conversion and quantization may take tens of minutes to hours. A web deploy that waits for model readiness must pass Render's checks within 15 minutes. Treat doing all preparation behind `/health` in that window as **blocked**, not as a reliable first-start design. [Render health checks](https://render.com/docs/health-checks).

Render builds, pre-deploy commands and built-in One-Off Jobs cannot access the web service's persistent disk. A separate worker also cannot share that disk. This implementation therefore runs a finite, supervised **preparation subprocess on the disk-owning Docker Web Service**, in an explicit preparation phase. It is not a Render One-Off Job product. [Render disk restrictions](https://render.com/docs/disks).

In preparation mode, the HTTP supervisor starts immediately and `/live` reports only that the supervisor is alive. Render can mark that preparation service deployed while the model job continues. `/health` remains **503**, and authenticated `/chat` remains **503**, throughout preparation and after it finishes. A green Render deploy at this stage does **not** mean inference is ready. Once the genuine preparation smoke test passes, manually switch the same service to inference mode and use `/health` as Render's health check. No second service, external conversion machine, external artifact repository or tunnel is required.

If your deployment policy requires `/health` model readiness from the very first deploy and forbids this preparation phase, this workflow cannot meet that requirement; a separately designed artifact-transfer workflow would be needed. Do not select `/health` for the initial preparation deploy.

## What runs

`ai-service/Dockerfile` builds the CPU converter and llama-cpp-python runtime. CPU-only torch and Transformers are included solely for the preparation subprocess; they are not used to serve chat. No CUDA, bitsandbytes, Kaggle, Cloudflare Tunnel or remote inference provider is used by this path. Do not select the historical `Dockerfile.chat` or standalone `Dockerfile.convert` in Render.

Only the official `NCAIR1/N-ATLaS` snapshot `e294476928aca9030e924ca27bb8e085e8581273` is downloaded. Previous authenticated metadata inspection confirmed `LlamaForCausalLM`, Llama 3 RoPE and a 128256-token vocabulary. The converter supports that architecture; successful full conversion still needs to be demonstrated. [Official model](https://huggingface.co/NCAIR1/N-ATLaS).

Conversion and llama-cpp-python 0.3.16 use llama.cpp revision `4227c9be4268ac844921b90f31595f81236bd317`. The job creates F16 GGUF, quantizes it to **Q4_K_M**, and compares token IDs and the embedded chat template against the original tokenizer using all four API languages. No other language model or third-party GGUF is substituted. Direct dependencies/model revisions are pinned; base image and transitive dependency updates mean rebuilds are not guaranteed byte-identical.

Preparation writes these files on the attached disk:

| Path | Purpose |
| --- | --- |
| `/data/natlas/work/source/` | Resumable official Hugging Face download |
| `/data/natlas/work/natlas-f16.gguf` | Intermediate conversion, with checksum checkpoint |
| `/data/natlas/work/status.json` | Safe progress stage/error code, no secrets |
| `/data/natlas/model/natlas-q4_k_m.gguf` | Final CPU weights |
| `/data/natlas/model/natlas-manifest.json` | Source/tool revisions, size and weight hash |
| `/data/natlas/model/prepared.json` | Manifest hash, committed last after successful conversion |
| `/data/natlas/model/smoke-report.jsonl` | Actual four-language replies, timings and final inference result |

A Linux file lock prevents simultaneous converters. Temporary files never count as completion. Downloads reuse cached shards; a completed F16 stage is reused only when its hash and source/tool revisions match. Once the final commit exists, restarts validate the model and bypass download/conversion entirely. A corrupt committed model fails closed rather than silently re-downloading. The disk and pinned preparation code are the provenance trust boundary: do not manually install third-party files or forge the commit/report. An optional `NATLAS_MANIFEST_SHA256` can independently pin the recorded digest.

The preparation supervisor kills the subprocess group on shutdown or its six-hour deadline. A killed subprocess never marks preparation successful. It runs the real `smoke_cpu.py` in a fresh subprocess after conversion so conversion allocations are released before inference. The serving mode requires a successful smoke report matching the committed artifact, then rechecks weight integrity and loads the actual model. It never starts conversion on the smaller serving instance.

## Resources: preparation versus serving

These are planning estimates, not measurements from Render:

| Resource | First preparation | Normal serving |
| --- | --- | --- |
| Suggested starting compute | `4c-32g`: 4 CPUs, 32 GB RAM | `4c-16g`: 4 CPUs, 16 GB RAM |
| Approximate model working memory | Conversion may need 16-32+ GB; 32 GB is a starting budget, not a guarantee | Approximately 6-8 GiB at 2048 context; 16 GB provides headroom |
| Persistent disk to provision | **80 GB mounted at `/data`** | Keep the **same 80 GB disk** |
| Expected occupied disk | About 16 GB original + 16 GB F16 + 5 GB quantized, plus checkpoints/partial retries and HF metadata; allow 50-60+ GiB | About 5 GB final model plus reports if intermediate files are later removed |
| Time | Tens of minutes to hours; job deadline is six hours | Hashing/loading may take tens of seconds to minutes, then CPU generation per request |

These plan IDs/specifications are in [Render's compute-plan documentation](https://render.com/docs/compute-plans). Confirm the current price before manually creating or resizing anything. If conversion runs out of memory, stop/review the failure and choose a larger available plan; no automatic resource upgrade is implemented.

The job checks for at least 40 GiB free space before beginning/resuming uncommitted preparation and a memory limit of at least 28 GiB (to allow unit differences on a nominal 32 GB plan). These checks are lower bounds, not peak guarantees. Use the 80 GB disk budget, and keep both temporary and final weights under `/data`; do not rely on ephemeral disk capacity. The container image/build cache also consumes separate platform storage and includes the CPU preparation libraries.

**Render disks cannot shrink.** Temporary files can eventually be removed, but the allocated 80 GB disk and its billing remain. This is the cost tradeoff of preparing and serving on the same persistent disk without an external artifact store. No automatic cleanup deletes your source/intermediates. Retaining them helps resume failures. A disk also limits the service to one instance and causes downtime during redeploys. [Persistent disk behavior](https://render.com/docs/disks).

Q4_K_M uses mixed tensor precision; actual size comes from the generated manifest. F16 KV cache for this model at 2048 tokens is about 256 MiB, plus weights and scratch buffers. Memory mapping still needs RAM for accessed weight pages. Run exactly one Uvicorn worker.

No tokens/second promise is made. CPU memory bandwidth, prompt length and language tokenization determine latency. Defaults are 2048 total context, 1920 input tokens including the system/template, 128 new tokens, and one in-flight generation. Long input returns 422; concurrent requests return 429. Inference has a 120-second deadline, Express 135 seconds, frontend 150 seconds. Reduce token budgets if the selected CPU cannot meet that chain; review output quality in English, Yoruba, Hausa and Igbo. A timed-out native evaluation may need to finish its current step before releasing the worker.

## Phase 1: exact manual Render setup

Do this only when you choose to incur the charges. No provisioning command is run by the repository scripts.

1. In Hugging Face, accept access requirements for the official gated model. Create a read token authorized for `NCAIR1/N-ATLaS`. No write/upload token is needed.
2. In Render, create a **Web Service**, connect the repository/branch containing this implementation, and use:

   | Setting | Value |
   | --- | --- |
   | Name | `muslim-guardian-natlas` (or another available name) |
   | Runtime | Docker |
   | Root Directory | `ai-service` |
   | Dockerfile Path | `./Dockerfile` |
   | Docker Build Context | `.` |
   | Docker Command | Leave blank; image CMD runs `python scripts/serve.py` |
   | Build / Pre-deploy commands | None |
   | Compute | `4c-32g` |
   | Instances | 1 |
   | Persistent disk | 80 GB, mount path `/data` |
   | Health Check Path | **`/live` during preparation only** |
   | Auto-Deploy | Off |
   | Region | Select the same region as your Express backend where possible |

   If leaving Root Directory blank instead, use Dockerfile `ai-service/Dockerfile` and context `ai-service`. Do not mix the two path conventions.

3. Add the following environment values through Render's environment settings, using `ai-service/render.env.example` as the template. Secrets are server-only, never `VITE_*` variables:

   ```dotenv
   AI_SERVICE_TOKEN=<unique secret of at least 32 characters; match Express>
   HF_TOKEN=<read token with official N-ATLaS access>
   NATLAS_SETUP_MODE=prepare
   NATLAS_ENABLED=true
   NATLAS_BACKEND=gguf
   NATLAS_MANAGED_ARTIFACT=true
   NATLAS_ARTIFACT_DIR=/data/natlas/model
   NATLAS_PREPARE_WORK_DIR=/data/natlas/work
   NATLAS_PREPARE_TIMEOUT_SECONDS=21600
   HF_HOME=/data/huggingface
   HF_HUB_DISABLE_TELEMETRY=1
   HF_HUB_DISABLE_PROGRESS_BARS=1
   HF_LOCAL_FILES_ONLY=true
   NATLAS_CONTEXT_SIZE=2048
   NATLAS_MAX_INPUT_TOKENS=1920
   NATLAS_MAX_NEW_TOKENS=128
   NATLAS_THREADS=4
   NATLAS_BATCH_SIZE=128
   NATLAS_TIMEOUT_SECONDS=120
   REQUEST_TIMEOUT_SECONDS=30
   PORT=10000
   ```

   `HF_LOCAL_FILES_ONLY=true` applies to inference. The preparation subprocess explicitly downloads the pinned source using `HF_TOKEN`; no GGUF repository, external manifest hash or upload is required. The Render factory enforces GGUF and managed local artifacts. The service binds `0.0.0.0:$PORT` with one worker. The image has no weights, `.env` files or credentials in its layers. Its default UID initializes the mounted disk; custom nonroot execution requires provisioning that UID's disk permissions first.

4. Manually create/deploy the service. The image builds without HF credentials being used by any build command. At runtime the supervisor starts the preparation job automatically. Do not route website chat to it yet.
5. Watch `/live`: `model_state` goes from `preparing` to `verifying`, then `prepared`, or to `preparation_failed`. During conversion, inspect safe progress through the **Render service Shell**, not a One-Off Job:

   ```sh
   cat /data/natlas/work/status.json
   cat /data/natlas/model/smoke-report.jsonl
   ```

   The second file appears only after conversion. Successful final output contains `"inference_passed": true` and the artifact hash. It is preceded by **actual generated responses** in the four languages. Inspect those replies; automated nonempty-text checks do not prove linguistic accuracy. `/health` deliberately still returns 503 in preparation mode. A `converted` stage by itself is not enough.

## Phase 2: serve from the same disk

After `/live` reports `prepared` and you have reviewed the real smoke report:

1. Save `NATLAS_SETUP_MODE=serve` and change Render's Health Check Path to `/health`. Apply these changes together for the next manual deploy where the UI permits. If changes trigger separate deploys, keep `/live` until serve mode reaches real `/health` readiness, then change the check path. Never set `/health` while still running preparation mode.
2. Keep the same service, disk, mount and artifact directory. Serving reads `prepared.json`, checks the matching successful inference report and all model bytes, then loads the local GGUF. It does not contact Hugging Face or re-run conversion. `/health` becomes 200 with `status=ready`, `runtime=gguf-cpu` and `artifact_sha256`; until then it is 503.
3. Manually change compute to `4c-16g` and re-verify after that deployment. Changing compute causes a deployment; disk-backed services have downtime. Keep `NATLAS_THREADS=4`. Measure memory/latency before choosing any smaller plan.
4. Once serving works, remove `HF_TOKEN` from this service if desired. Keep the service bearer token. Restarts in serve mode need no HF access. Re-add HF access only for a deliberate future preparation job.
5. From the Render service Shell, run the actual HTTP smoke test against the **running** process (this avoids loading a second model into RAM):

   ```sh
   python scripts/smoke_cpu.py --url http://127.0.0.1:10000
   ```

   It checks real CPU/artifact readiness, rejects unauthenticated `/chat`, then obtains four actual generated replies. Save the output, image/source revision and observed memory/latency. Do not use the no-URL local-loading version alongside the running inference process on the smaller instance.
6. Restart the Render service once and repeat the HTTP smoke check. Confirm no conversion/download stages run. The service still must load within Render's 15-minute readiness limit. If it cannot, deployment is blocked until the cause is measured and resolved; do not leave `/live` as production inference readiness.

For an external smoke client, install `requirements-api.txt`, supply matching `AI_SERVICE_TOKEN`, `NATLAS_MANIFEST_SHA256` from the disk's record, and `NATLAS_MANAGED_ARTIFACT=false` (the client has no local disk). Run `python ai-service/scripts/smoke_cpu.py --url https://YOUR-SERVICE.onrender.com`. The actual Render service must perform the generation. HTTPS is required except on localhost; redirects and environment proxies are disabled for credential-bearing checks.

## Connect Express without changing the frontend API

Set these server-only backend values after Render passes real inference tests:

```dotenv
AI_SERVICE_URL=https://YOUR-SERVICE.onrender.com
AI_SERVICE_TOKEN=<same private token as the Render service>
AI_CHAT_API_FORMAT=native
AI_CHAT_TIMEOUT_MS=135000
AI_MAX_CONCURRENT_REQUESTS=1
```

Use the root URL without `/chat`. Restart/redeploy Express after applying it. `POST /api/ai/chat` and the frontend request/response contract stay unchanged. Express calls authenticated `POST /chat` on Render; the model runs there. The default chat protocol is now native, and an empty URL fails as unconfigured instead of trying a fallback service. `backend/render.env.example` contains the template. Existing ASR settings remain independent.

Check authenticated website conversations in all four languages and a follow-up using previous history. The existing backend live browser test is available as an additional integration check; it creates/removes a temporary account in the configured database. Never use a unit-test response or green `/live` check as inference verification. Historical Kaggle/GPU files are not part of these deployment settings and no rollback to a tunnel is configured.

## Failures and remaining blockers

- **No Docker build or actual conversion/inference has been run here.** The first authorized Render build/deploy must establish compatibility and performance. Model/config support is not proof that the full workflow completes.
- `preparation_failed`: inspect `work/status.json` for the last failed stage, exception type and safe code. Missing/denied HF access, insufficient RAM/disk, incompatible tensors/tokenizer, subprocess failure or a six-hour deadline blocks progress. The supervisor stays alive for inspection; `/health` and `/chat` never falsely succeed. Fix the cause, then manually restart in preparation mode. There is no unlimited retry loop or automatic spending.
- If the converter exits after publishing the model but before smoke success, a restart reuses the model and reruns the real smoke test. The serving instance will not automatically allocate resources or download another model.
- In serve mode, `verified_preparation_required` means the commit/report is missing or mismatched. Restore the valid prepared directory or return to the explicitly resourced preparation phase. The serving instance will not automatically allocate resources or download another model.
- Conversion intermediates are retained. If disk space needs reclaiming later, review the exact work directory and remove it only after verified serving; no automatic recursive deletion is provided. The final model/report/commit must remain. Allocated disk size still cannot shrink.
- Build/tooling failures must be resolved before deployment claims. Inference latency and language quality must be measured after deployment. Neither `/live` nor a successful image build alone proves real N-ATLaS inference.

The official model has custom attribution and usage terms; confirm that your production use is covered. [Model terms](https://huggingface.co/NCAIR1/N-ATLaS#terms-of-use-for-n-atlas).
