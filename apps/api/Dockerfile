FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.32.0" \
    "pydantic-settings>=2.6.0" \
    "httpx>=0.27.0"

COPY apps/api/app /app/app
COPY demo-data /demo-data

ENV DEMO_DATA_DIR=/demo-data
ENV PUBLIC_DEMO_MODE=true
ENV PYTHONPATH=/app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
