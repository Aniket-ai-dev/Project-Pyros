# Multi-stage production Dockerfile for NASA Fire Safety Intelligence Engine
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final runtime image
FROM python:3.12-slim

WORKDIR /app

# Create non-root user for security
RUN groupadd -r nasa && useradd -r -g nasa -d /app -s /sbin/nologin nasa

# Copy Python packages from builder
COPY --from=builder /root/.local /home/nasa/.local

# Copy source code
COPY --chown=nasa:nasa src/ ./src/
COPY --chown=nasa:nasa pytest.ini .
COPY --chown=nasa:nasa README.md .

ENV PATH=/home/nasa/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

USER nasa

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1

CMD ["sh", "-c", "uvicorn src.api:app --host 0.0.0.0 --port ${PORT}"]
