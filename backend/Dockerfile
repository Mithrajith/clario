# ==============================================================================
# Clario Enterprise Platform — Production Backend Dockerfile
# Multi-stage, secure non-root user, optimized python dependencies
# ==============================================================================

FROM python:3.11-slim-bookworm AS builder

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency installation
COPY --from=ghcr.io/astral-sh/uv:0.6.14 /uv /uvx /bin/

# Copy dependency specifications
COPY pyproject.toml requirements.txt ./

# Install dependencies into virtual environment
RUN uv venv /app/.venv && \
    uv pip install --no-cache -r requirements.txt

# ==============================================================================
# Final Production Runtime Stage
# ==============================================================================
FROM python:3.11-slim-bookworm AS runner

WORKDIR /app

# Install runtime dependencies (e.g. libpq, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root user and group
RUN groupadd -r clario && useradd -r -g clario -u 1001 -m -d /home/clario clario

# Copy virtual environment from builder stage
COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Create storage and logs directories with proper ownership
RUN mkdir -p /app/storage/documents /app/logs && \
    chown -R clario:clario /app

# Copy application source code
COPY --chown=clario:clario . /app

# Switch to non-root user
USER clario

# Expose backend service port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start production server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]

