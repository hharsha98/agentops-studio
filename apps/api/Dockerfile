FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEMO_DATA_DIR=/workspace/demo-data

WORKDIR /workspace/apps/api

COPY apps/api/pyproject.toml ./
COPY apps/api/app ./app
COPY demo-data /workspace/demo-data

RUN pip install --no-cache-dir .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
