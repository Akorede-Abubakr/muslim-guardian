# LightBridge AI text chat

React continues to call the authenticated Express route `POST /api/ai/chat`.
Express retains JWT/user checks, language and history validation, per-user rate
limits, and its server-only Bearer credential. It forwards the existing
`{language, messages}` request to the RunPod FastAPI `POST /chat` route. Book
assistant retrieval, citations, history, access control, frontend, and speech
are unchanged.

The reused inference implementation in `ai-service/app/chat.py` loads only
`NCAIR1/N-ATLaS` from Hugging Face with the existing Transformers and
bitsandbytes NF4 configuration. It retains `device_map="auto"`,
`tokenizer.apply_chat_template()` and `model.generate()`. Deployment settings,
RunPod persistent storage, and the four-language plus book-grounded live smoke
are in [ai-service/RUNPOD.md](../ai-service/RUNPOD.md).

Configure these values only in the Node backend environment after the RunPod
model has loaded and genuine inference has passed:

```dotenv
AI_SERVICE_URL=https://<POD_ID>-10000.proxy.runpod.net
AI_SERVICE_TOKEN=<same secret as the FastAPI Pod>
AI_CHAT_API_FORMAT=native
AI_CHAT_TIMEOUT_MS=135000
```

The Pod separately receives `HF_TOKEN` for gated model download and
`AI_SERVICE_TOKEN` for the existing Bearer API authentication. Never put either
credential or the inference URL in a `VITE_*` variable. Leave
`AI_ASR_SERVICE_URL` and `AI_ASR_SERVICE_TOKEN` pointed at the current NCAIR
speech service. Historical Kaggle connection results remain in
[docs/kaggle-chat.md](kaggle-chat.md); they do not verify a RunPod deployment.

**Current status:** no RunPod Pod, model generation, or RunPod URL is available
to this workspace. The configuration and smoke harness are prepared, but do
not share a live endpoint until the smoke in `ai-service/RUNPOD.md` passes.
