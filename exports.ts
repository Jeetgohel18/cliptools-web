// Server-only: turns export choices into FFmpeg commands and runs them in the background.
// Exports wait in a queue so the computer isn't overloaded, and can be cancelled.
// Progress is saved next to each output file so the browser can poll for it.

import { createHash } from "node:crypto";
import type { ChildProcess } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  AUDIO_FORMATS,
  MAX_EXPORT_HEIGHT,
  VIDEO_HEIGHTS,
  describeExport,
  exportFileSuffix,
  isEnhanced,
  type AudioFormatId,
  type AudioQuality,
  type ExportOptions,
} from "./exportOptions";
import { FFMPEG, FFMPEG_THREADS, MediaError, inputPath, jobDir, run, type Job } from "./media";

const OUTPUT_NAME = /^out-[0-9a-f]{16}\.(mp4|mp3|m4a|opus|wav|flac)$/;
const MAX_RUNNING = Number(process.env.MAX_PARALLEL_EXPORTS) || 3; // exports at once…
const MAX_RUNNING_VIDEO = 1; // …but only 1 (heavy) video export
const MAX_QUEUED = 10;
const MAX_PER_UPLOAD = 4; // waiting + running exports for one upload
const AUDIO_MUXERS: Record<AudioFormatId, string> = { mp3: "mp3", m4a: "mp4", opus: "ogg", wav: "wav", flac: "flac" };
const AUDIO_CODECS: Record<AudioFormatId, string> = { mp3: "libmp3lame", m4a: "aac", opus: "libopus", wav: "pcm_s16le", flac: "flac" };

export interface ExportStatus {
  file: string;
  label: string;
  suffix: string;
  status: "queued" | "working" | "done" | "error";
  percent: number;
  size?: number;
  message?: string;
  updatedAt: number;
}

interface Task {
  jobId: string;
  file: string;
  job: Job;
  options: ExportOptions;
  save: (s: Pick<ExportStatus, "status" | "percent" | "size" | "message">) => void;
  flush: () => Promise<void>;
  child?: ChildProcess;
  cancelled: boolean;
  done?: Promise<void>;
}

// Kept on globalThis so every API route (and hot reloads in development) share one queue.
const registry = ((globalThis as { __clipToolsExports?: { queue: Task[]; running: Task[] } }).__clipToolsExports ??= {
  queue: [],
  running: [],
});

const isTask = (jobId: string, file?: string) => (t: Task) => t.jobId === jobId && (!file || t.file === file);

// Validates untrusted JSON from the browser and returns clean options.
export function parseExportOptions(body: unknown, job: Job): ExportOptions {
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

  if (b.kind === "video") {
    const height = b.height === null || b.height === undefined ? null : Number(b.height);
    if (height !== null && (!VIDEO_HEIGHTS.includes(height) || height > MAX_EXPORT_HEIGHT)) {
      throw new MediaError("Please choose a valid video quality.", 400);
    }
    return {
      kind: "video",
      height,
      denoise: b.denoise === true,
      sharpen: b.sharpen === true,
      color: b.color === true,
      enhanceAudio: b.enhanceAudio === true && job.hasAudio,
    };
  }

  if (b.kind === "audio") {
    if (!job.hasAudio) {
      throw new MediaError("This video has no audio track, so there is no audio to export.", 422);
    }
    const format = b.format as AudioFormatId;
    if (!Object.hasOwn(AUDIO_FORMATS, format)) {
      throw new MediaError("Please choose a valid audio format.", 400);
    }
    const quality = b.quality as AudioQuality;
    if (!["high", "standard", "small"].includes(quality)) {
      throw new MediaError("Please choose a valid audio quality.", 400);
    }
    return {
      kind: "audio",
      format,
      quality: AUDIO_FORMATS[format].bitrates ? quality : "high", // lossless ignores quality
      noiseReduction: b.noiseReduction === true,
      voiceClarity: b.voiceClarity === true,
      loudness: b.loudness === true,
    };
  }

  throw new MediaError("Unknown export type.", 400);
}

// The same choices always give the same file name, so repeat requests reuse the result.
function outputName(o: ExportOptions) {
  const hash = createHash("sha256").update(JSON.stringify(o)).digest("hex").slice(0, 16);
  return `out-${hash}${o.kind === "video" ? ".mp4" : AUDIO_FORMATS[o.format].ext}`;
}

function audioFilters(noiseReduction: boolean, voiceClarity: boolean, loudness: boolean) {
  const filters: string[] = [];
  if (noiseReduction) filters.push("afftdn=nf=-25");
  if (voiceClarity) {
    filters.push("highpass=f=80", "equalizer=f=3000:t=q:w=1.5:g=3", "acompressor=threshold=-20dB:ratio=3:attack=10:release=200");
  }
  if (loudness) filters.push("loudnorm=I=-14:TP=-1.5:LRA=11");
  return filters;
}

function buildArgs(job: Job, o: ExportOptions, output: string) {
  const args = ["-hide_banner", "-nostdin", "-y", "-i", inputPath(job)];

  if (o.kind === "video") {
    const portrait = (job.height ?? 0) > (job.width ?? 0);
    const sourceShortSide = Math.min(job.width ?? Infinity, job.height ?? Infinity);
    const upscaling = o.height !== null && o.height > sourceShortSide;

    const scale = o.height
      ? portrait
        ? `scale=${o.height}:-2:flags=lanczos`
        : `scale=-2:${o.height}:flags=lanczos`
      : "scale=trunc(iw/2)*2:trunc(ih/2)*2";
    const detail: string[] = [];
    if (o.sharpen) detail.push("unsharp=5:5:0.8:5:5:0");
    if (o.color) detail.push("eq=contrast=1.05:saturation=1.15");

    // Do the expensive work on the smaller picture: before upscaling, after downscaling
    const vf = [
      ...(o.denoise ? ["hqdn3d=1.5:1.5:6:6"] : []),
      ...(upscaling ? [...detail, scale] : [scale, ...detail]),
      "format=yuv420p",
    ];

    const af = o.enhanceAudio ? audioFilters(true, false, true) : [];
    args.push("-map", "0:v:0", "-map", "0:a:0?", "-vf", vf.join(","));
    args.push("-c:v", "libx264", "-preset", (o.height ?? 0) > 1080 ? "veryfast" : "faster");
    args.push("-crf", isEnhanced(o) || o.height ? "18" : "20");
    args.push("-c:a", "aac", "-b:a", "192k");
    if (af.length) args.push("-af", af.join(","), "-ar", "48000");
    args.push("-movflags", "+faststart", "-f", "mp4");
  } else {
    const format = AUDIO_FORMATS[o.format];
    const af = audioFilters(o.noiseReduction, o.voiceClarity, o.loudness);
    args.push("-map", "0:a:0", "-vn");
    if (af.length) args.push("-af", af.join(","));
    if (o.loudness) args.push("-ar", "48000");
    args.push("-c:a", AUDIO_CODECS[o.format]);
    if (format.bitrates) args.push("-b:a", `${format.bitrates[o.quality]}k`);
    if (o.format === "m4a") args.push("-movflags", "+faststart");
    args.push("-f", AUDIO_MUXERS[o.format]);
  }

  if (FFMPEG_THREADS > 0) args.push("-threads", String(FFMPEG_THREADS));
  args.push("-progress", "pipe:1", "-nostats", output);
  return args;
}

function statusPath(jobId: string, file: string) {
  if (!OUTPUT_NAME.test(file)) {
    throw new MediaError("File not found.", 404);
  }
  return path.join(jobDir(jobId), file + ".json");
}

export function outputPath(jobId: string, file: string) {
  statusPath(jobId, file); // validates the name
  return path.join(jobDir(jobId), file);
}

export async function readExportStatus(jobId: string, file: string): Promise<ExportStatus> {
  const statusFile = statusPath(jobId, file);
  let status: ExportStatus | undefined;
  for (let attempt = 0; !status; attempt++) {
    try {
      status = JSON.parse(await fs.readFile(statusFile, "utf8"));
    } catch (error) {
      // Missing file, or (rarely) caught mid-update: try again briefly before giving up
      if (attempt >= 3) throw new MediaError("This export was not found. It may have expired.", 404);
      if ((error as NodeJS.ErrnoException).code === "ENOENT" && attempt >= 1) {
        throw new MediaError("This export was not found. It may have expired.", 404);
      }
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  // "queued"/"working" but nothing is actually running it (e.g. the server restarted)
  const alive = [...registry.queue, ...registry.running].some(isTask(jobId, file));
  if ((status.status === "queued" || status.status === "working") && !alive) {
    return { ...status, status: "error", message: "Processing stopped unexpectedly. Please try again." };
  }
  return status;
}

function canStart(task: Task) {
  const runningVideo = registry.running.filter((t) => t.options.kind === "video").length;
  return registry.running.length < MAX_RUNNING && (task.options.kind === "audio" || runningVideo < MAX_RUNNING_VIDEO);
}

// Starts every queued export that has a free slot. Audio goes first: it takes seconds,
// so it shouldn't wait behind a video that takes minutes.
function startQueued() {
  const audioFirst = [...registry.queue].sort((a, b) => Number(a.options.kind === "video") - Number(b.options.kind === "video"));
  for (const task of audioFirst) {
    if (canStart(task)) {
      registry.queue.splice(registry.queue.indexOf(task), 1);
      runTask(task);
    }
  }
}

function runTask(task: Task) {
  registry.running.push(task);
  task.save({ status: "working", percent: 0 });

  const output = outputPath(task.jobId, task.file);
  const partial = output + ".part";
  const totalUs = (task.job.durationSec ?? 0) * 1_000_000;
  let percent = 0;
  let lastSave = 0;

  task.done = run(
    FFMPEG,
    buildArgs(task.job, task.options, partial),
    60 * 60_000,
    (line) => {
      if (line.startsWith("out_time_us=") && totalUs > 0) {
        const us = Number(line.slice("out_time_us=".length));
        if (Number.isFinite(us)) percent = Math.min(99, Math.max(0, Math.round((us / totalUs) * 100)));
      } else if (line.startsWith("progress=") && Date.now() - lastSave > 700) {
        lastSave = Date.now();
        task.save({ status: "working", percent });
      }
    },
    (child) => {
      task.child = child;
    },
  )
    .then(async ({ code, stderr }) => {
      if (task.cancelled) throw new MediaError("Cancelled.", 499);
      if (code !== 0) {
        console.error("[ClipTools export] ffmpeg failed:", stderr);
        throw new MediaError("This conversion failed. Try different settings.", 500);
      }
      await fs.rename(partial, output);
      const { size } = await fs.stat(output);
      task.save({ status: "done", percent: 100, size });
    })
    .catch(async (error) => {
      await fs.rm(partial, { force: true }).catch(() => {});
      if (!task.cancelled) {
        task.save({ status: "error", percent, message: error instanceof MediaError ? error.message : "This conversion failed." });
      }
    })
    .finally(async () => {
      await task.flush();
      registry.running.splice(registry.running.indexOf(task), 1);
      startQueued();
    });
}

export async function startExport(job: Job, options: ExportOptions): Promise<ExportStatus> {
  const file = outputName(options);
  const statusFile = statusPath(job.id, file);

  const existing = await readExportStatus(job.id, file).catch(() => null);
  if (existing && existing.status !== "error") {
    return existing; // already done, running or waiting
  }
  if (registry.queue.length >= MAX_QUEUED) {
    throw new MediaError("Too many files are waiting. Please try again in a minute.", 429);
  }
  if ([...registry.queue, ...registry.running].filter(isTask(job.id)).length >= MAX_PER_UPLOAD) {
    throw new MediaError(`You can have up to ${MAX_PER_UPLOAD} files processing at once. Please wait for one to finish.`, 429);
  }

  const base = { file, label: describeExport(options), suffix: exportFileSuffix(options) };
  // Writes run one after another so an old progress update can never overwrite "done".
  // Each write goes to a temporary file that then replaces the real one in a single step,
  // so a progress check can never read a half-written file.
  let writes = Promise.resolve();
  const task: Task = {
    jobId: job.id,
    file,
    job,
    options,
    cancelled: false,
    save: (s) => {
      const data: ExportStatus = { ...base, ...s, updatedAt: Date.now() };
      writes = writes
        .then(() => fs.writeFile(statusFile + ".tmp", JSON.stringify(data)))
        .then(() => fs.rename(statusFile + ".tmp", statusFile))
        .catch(() => {});
    },
    flush: () => writes,
  };

  task.save({ status: "queued", percent: 0 });
  registry.queue.push(task);
  startQueued();
  await task.flush();
  return readExportStatus(job.id, file);
}

// Stops running exports and removes waiting ones: one file, or every export of a job.
export async function cancelExports(jobId: string, file?: string) {
  const matches = isTask(jobId, file);

  for (const task of registry.queue.filter(matches)) {
    registry.queue.splice(registry.queue.indexOf(task), 1);
    await task.flush();
    await fs.rm(statusPath(jobId, task.file), { force: true }).catch(() => {});
  }

  const running = registry.running.filter(matches);
  for (const task of running) {
    task.cancelled = true;
    task.child?.kill();
  }
  await Promise.all(running.map((t) => t.done)); // wait so Windows can delete the files afterwards
  for (const task of running) {
    await fs.rm(statusPath(jobId, task.file), { force: true }).catch(() => {});
  }
}
