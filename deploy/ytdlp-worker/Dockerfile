FROM python:3.12-slim-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && pip install --no-cache-dir -U yt-dlp flask gunicorn

WORKDIR /app
COPY app.py /app/app.py

ENV PORT=8000
EXPOSE 8000

# 2C4G: one worker process, one extract at a time
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "1", "--timeout", "200", "app:app"]
