# ClipTools container: Node.js + FFmpeg. Used by Render (or any Docker host).
FROM node:22-bookworm-slim

# FFmpeg does all the video and audio processing
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# Run as the built-in non-root "node" user
USER node
WORKDIR /home/node/app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

# Limits for a small free server (0.1 CPU, 512 MB RAM). Raise them on a bigger server.
# NEXT_PUBLIC_ values are built into the page, so change them here and redeploy.
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_MAX_UPLOAD_MB=50 \
    NEXT_PUBLIC_MAX_DURATION_MINUTES=3 \
    NEXT_PUBLIC_MAX_EXPORT_HEIGHT=720 \
    MAX_PARALLEL_EXPORTS=2 \
    FFMPEG_THREADS=1 \
    UPLOADS_PER_HOUR=20 \
    FILE_TTL_MINUTES=30

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
# Render tells the app which port to use through $PORT
CMD ["sh", "-c", "node_modules/.bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
