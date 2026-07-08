# Crawl4AI ships an official image with Chromium preinstalled.
FROM unclecode/crawl4ai:latest

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -U -r requirements.txt
# base image already ran the browser install; run setup defensively (no-op if done)
RUN crawl4ai-setup || true

COPY main.py .

ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
