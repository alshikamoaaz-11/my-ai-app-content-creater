# ANB Crawl4AI Scraping Service

Standalone Python service that wraps [Crawl4AI](https://github.com/unclecode/crawl4ai)
(`AsyncWebCrawler`) and exposes a small HTTP API the Next.js app calls for
URL scraping + grounding.

## Why a separate service?

The main app is a Next.js app on **Vercel**. Vercel's serverless runtime
**cannot** run Crawl4AI, because Crawl4AI drives a real headless Chromium via
Playwright (installed by `crawl4ai-setup`). So the crawler runs here, as its own
process, and the Next.js app reaches it over HTTP. If this service is
unreachable or `CRAWLER_SERVICE_URL` is unset, the app automatically falls back
to a lightweight built-in fetch+OG-tag scraper (no JS rendering).

## Local run

```bash
cd crawler-service
python -m venv .venv && source .venv/bin/activate
pip install -U -r requirements.txt
crawl4ai-setup            # downloads the Chromium Playwright needs
uvicorn main:app --host 0.0.0.0 --port 8000
```

Test:

```bash
curl "http://localhost:8000/scrape?url=https://www.anb.com.sa"
```

## Deploy (free tiers)

Any host that runs Python + can install a headless browser works:
Render, Fly.io, Railway, a Hugging Face Space, or a small VPS. Ensure the build
runs `crawl4ai-setup` (installs Chromium). Then set, in the **Next.js / Vercel**
project:

```
CRAWLER_SERVICE_URL=https://your-crawler-host        # base URL, no trailing /scrape
CRAWLER_SECRET=<optional shared secret>              # if set here, set the same on the service
```

## Env vars (this service)

| var | default | meaning |
|-----|---------|---------|
| `CRAWLER_SECRET` | _(none)_ | if set, callers must send header `x-crawler-secret` with this value |
| `MAX_MARKDOWN_CHARS` | `8000` | truncate extracted markdown to bound prompt size |

## API

- `GET /health` → `{ "ok": true }`
- `GET /scrape?url=<url>` → `{ url, title, description, image, siteName, markdown }`
