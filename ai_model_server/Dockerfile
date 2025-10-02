# ai_model_server/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system deps for transformers and sentencepiece
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy model and app
COPY model ./model
COPY app.py ./app.py

EXPOSE 5000

CMD ["python", "app.py"]
