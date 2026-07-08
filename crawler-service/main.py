"""
Crawl4AI scraping micro-service for the ANB Content Agent.

Runs as a standalone Python service (NOT on Vercel — Vercel's Next.js runtime
cannot host Playwright/Chromium). Deploy on any free-tier Python host
(Render, Fly.io, a Hugging Face Space, or a small VPS) and point the Next.js
app at it via the CRAWLER_SERVICE_URL env var.

Endpoints:
  GET /health                -> {"ok": true}
  GET /scrape?url=<url>       -> {url, title, description, image, markdown}

Auth: optional shared secret. If CRAWLER_SECRET is set, callers must send
it in the `x-crawler-secret` header.
"""

import os
from urllib.parse import urljoin, urlparse

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.responses import JSONResponse

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

app = FastAPI(title="ANB Crawl4AI Service", version="1.0.0")

CRAWLER_SECRET = os.environ.get("CRAWLER_SECRET", "").strip()
MAX_MARKDOWN_CHARS = int(os.environ.get("MAX_MARKDOWN_CHARS", "8000"))


@app.get("/health")
async def health():
    return {"ok": True}


def _check_secret(provided: str | None) -> None:
    if CRAWLER_SECRET and provided != CRAWLER_SECRET:
        raise HTTPException(status_code=401, detail="unauthorized")


def _pick_meta(metadata: dict, *keys: str) -> str | None:
    for key in keys:
        val = metadata.get(key)
        if val:
            return val
    return None


@app.get("/scrape")
async def scrape(
    url: str = Query(..., min_length=4),
    x_crawler_secret: str | None = Header(default=None),
):
    _check_secret(x_crawler_secret)

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise HTTPException(status_code=400, detail="invalid url")

    browser_config = BrowserConfig(headless=True, verbose=False)
    run_config = CrawlerRunConfig(
        page_timeout=15000,
        wait_until="domcontentloaded",
    )

    try:
        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=url, config=run_config)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"crawl failed: {exc}") from exc

    if not result or not getattr(result, "success", False):
        raise HTTPException(status_code=502, detail="crawl unsuccessful")

    metadata = result.metadata or {}

    # markdown can be a str or a MarkdownGenerationResult depending on version
    md = result.markdown
    markdown = getattr(md, "raw_markdown", None) or (md if isinstance(md, str) else "")
    markdown = markdown.strip()[:MAX_MARKDOWN_CHARS]

    image = _pick_meta(metadata, "og:image", "twitter:image", "image")
    if image:
        image = urljoin(url, image)  # resolve relative image URLs

    payload = {
        "url": url,
        "title": _pick_meta(metadata, "og:title", "twitter:title", "title") or parsed.netloc,
        "description": _pick_meta(
            metadata, "og:description", "twitter:description", "description"
        )
        or "",
        "image": image,
        "siteName": _pick_meta(metadata, "og:site_name") or parsed.netloc,
        "markdown": markdown,
    }
    return JSONResponse(payload)
