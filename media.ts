// Server-only helpers for the "convert a video you own" workflow.
// Uploaded files live in a temporary folder and are deleted automatically.

import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 200;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const TTL_MINUTES = Number(process.env.FILE_TTL_MINUTES) || 30;
const TTL_MS = TTL_MINUTES * 60 * 1000;
export const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
export const FFMPEG_THREADS = Number(process.env.FFMPEG_THREADS) || 0; // 0 = use every CPU core
const UPLOADS_PER_HOUR = Number(process.env.UPLOADS_PER_HOUR) || 30;
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";
const ROOT = path.join(os.tmpdir(), "cliptools-media");
const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"];

export const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".opus": "audio/ogg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
};

// An error whose message is safe to show to the user.
export class MediaError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface Job {
  id: string;
  originalName: string;
  ext: string;
  size: number;
  createdAt: number;
  durationSec: number | null;
  width: number | null; // as displayed, after any phone rotation
  height: number | null;
  videoCodec: string | null;
  hasAudio: boolean;
}

// Simple per-visitor upload limit so a public server can't be overloaded.
const uploadLog = ((globalThis as { __clipToolsUploads?: Map<string, number[]> }).__clipToolsUploads ??= new Map<string, number[]>());

export function checkUploadRate(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const recent = (uploadLog.get(ip) ?? []).filter((t) => t > hourAgo);
  if (recent.length >= UPLOADS_PER_HOUR) {
    throw new MediaError("You've reached the upload limit for now. Please try again in an hour.", 429);
  }
  recent.push(Date.now());
  uploadLog.set(ip, recent);
}

export function errorResponse(error: unknown) {
  if (error instanceof MediaError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[ClipTools media]", error);
  return Response.json({ error: "Something went wrong while processing your file." }, { status: 500 });
}

export function jobDir(id: string) {
  if (!JOB_ID.test(id)) {
    throw new MediaError("File not found.", 404);
  }
  return path.join(ROOT, id);
}

export function inputPath(job: Job) {
  return path.join(jobDir(job.id), "input" + job.ext);
}

export async function createJobDir() {
  const id = randomUUID();
  const dir = jobDir(id);
  await fs.mkdir(dir, { recursive: true });
  return { id, dir };
}

export async function saveJob(job: Job) {
  await fs.writeFile(path.join(jobDir(job.id), "job.json"), JSON.stringify(job));
}

export async function readJob(id: string): Promise<Job> {
  const dir = jobDir(id);
  let job: Job;
  try {
    job = JSON.parse(await fs.readFile(path.join(dir, "job.json"), "utf8"));
  } catch {
    throw new MediaError("This file has expired or was deleted. Please upload it again.", 404);
  }
  if (Date.now() - job.createdAt > TTL_MS) {
    await deleteJob(id);
    throw new MediaError("This file has expired and was deleted. Please upload it again.", 404);
  }
  return job;
}

// Best effort: on Windows a file that is still being written can't be removed yet.
// Anything left behind is removed later by cleanupExpired().
export async function deleteJob(id: string) {
  try {
    await fs.rm(jobDir(id), { recursive: true, force: true, maxRetries: 3 });
  } catch (error) {
    console.warn("[ClipTools media] Could not fully delete", id, error);
  }
}

// Removes every job folder older than FILE_TTL_MINUTES. Runs on each API request.
export async function cleanupExpired() {
  let entries: string[];
  try {
    entries = await fs.readdir(ROOT);
  } catch {
    return; // folder doesn't exist yet
  }
  await Promise.all(
    entries.map(async (name) => {
      const dir = path.join(ROOT, name);
      try {
        const { mtimeMs } = await fs.stat(dir);
        if (Date.now() - mtimeMs > TTL_MS) {
          await fs.rm(dir, { recursive: true, force: true });
        }
      } catch {
        // already removed, or still in use
      }
    }),
  );
}

// Runs FFmpeg/FFprobe without a shell, so file names can never be run as commands.
// onLine receives each line FFmpeg writes to stdout (used for progress).
// onSpawn receives the running process (used to cancel it).
export function run(
  command: string,
  args: string[],
  timeoutMs: number,
  onLine?: (line: string) => void,
  onSpawn?: (child: ChildProcess) => void,
) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    onSpawn?.(child);
    let stdout = "";
    let stderr = "";
    let pending = "";
    child.stdout.on("data", (d) => {
      if (!onLine) {
        stdout += d;
        return;
      }
      pending += d;
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? "";
      lines.forEach(onLine);
    });
    child.stderr.on("data", (d) => (stderr = (stderr + d).slice(-4000)));

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new MediaError("Processing took too long and was stopped.", 504));
    }, timeoutMs);

    child.on("error", (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(
        err.code === "ENOENT"
          ? new MediaError(
              `Media processing isn't set up: "${command}" was not found. Install FFmpeg, then restart the dev server.`,
              500,
            )
          : err,
      );
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

interface ProbeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  disposition?: { attached_pic?: number };
  tags?: { rotate?: string };
  side_data_list?: { rotation?: number }[];
}

interface ProbeOutput {
  streams?: ProbeStream[];
  format?: { duration?: string };
}

// Uses FFprobe to confirm the upload really is a playable video.
export async function probeVideo(file: string) {
  const { code, stdout } = await run(
    FFPROBE,
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file],
    60_000,
  );
  if (code !== 0) {
    throw new MediaError("This file couldn't be read as a video. It may be damaged or not a real video file.", 422);
  }

  const data: ProbeOutput = JSON.parse(stdout);
  const streams = data.streams ?? [];
  const video = streams.find((s) => s.codec_type === "video" && !s.disposition?.attached_pic);
  if (!video) {
    throw new MediaError("This file doesn't contain a video track.", 422);
  }

  // Phones often store portrait video as landscape plus a "rotate 90°" flag
  const rotation = Number(video.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? video.tags?.rotate ?? 0);
  const sideways = Math.abs(rotation) % 180 === 90;
  const duration = Number(data.format?.duration);

  return {
    durationSec: Number.isFinite(duration) ? duration : null,
    width: (sideways ? video.height : video.width) ?? null,
    height: (sideways ? video.width : video.height) ?? null,
    videoCodec: video.codec_name ?? null,
    hasAudio: streams.some((s) => s.codec_type === "audio"),
  };
}

export function publicJob(job: Job) {
  return {
    id: job.id,
    fileName: job.originalName,
    format: job.ext.slice(1).toUpperCase(),
    size: job.size,
    durationSec: job.durationSec,
    width: job.width,
    height: job.height,
    videoCodec: job.videoCodec,
    hasAudio: job.hasAudio,
    originalUrl: `/api/media/${job.id}/download?type=original`,
    expiresInMinutes: TTL_MINUTES,
  };
}
