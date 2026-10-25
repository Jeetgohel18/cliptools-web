"use client";

import { useEffect, useRef, useState } from "react";
import {
  AUDIO_ENHANCEMENTS,
  AUDIO_FORMATS,
  AUDIO_QUALITY_LABELS,
  MAX_DURATION_MINUTES,
  MAX_EXPORT_HEIGHT,
  VIDEO_ENHANCEMENTS,
  videoQualityChoices,
  type AudioExportOptions,
  type AudioFormatId,
  type AudioQuality,
  type ExportOptions,
  type VideoExportOptions,
} from "../lib/exportOptions";
import { SectionHeading } from "./PlatformCards";

const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 200;
const ACCEPTED = [".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"];

interface UploadedFile {
  id: string;
  fileName: string;
  format: string;
  size: number;
  durationSec: number | null;
  width: number | null;
  height: number | null;
  videoCodec: string | null;
  hasAudio: boolean;
  originalUrl: string;
  expiresInMinutes: number;
}

interface ExportItem {
  file: string;
  label: string;
  status: "queued" | "working" | "done" | "error";
  percent: number;
  size?: number;
  message?: string;
  downloadUrl: string | null;
  options: ExportOptions;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const selectClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15 focus:outline-none";

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      title={hint}
      className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-indigo-200 has-checked:border-indigo-300 has-checked:bg-indigo-50"
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  );
}

// The full upload → choose → download experience, without a section heading.
export function MediaConverter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [exports, setExports] = useState<ExportItem[]>([]);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [video, setVideo] = useState<VideoExportOptions>({
    kind: "video",
    height: null,
    denoise: false,
    sharpen: false,
    color: false,
    enhanceAudio: false,
  });
  const [audio, setAudio] = useState<AudioExportOptions>({
    kind: "audio",
    format: "mp3",
    quality: "high",
    noiseReduction: false,
    voiceClarity: false,
    loudness: false,
  });

  // Poll the server once a second while any export is waiting or processing
  const active = exports.filter((e) => e.status === "queued" || e.status === "working");
  const activeKey = active.map((e) => e.file).join(",");
  useEffect(() => {
    if (!uploaded || !activeKey) return;
    const timer = setInterval(async () => {
      for (const name of activeKey.split(",")) {
        try {
          const res = await fetch(`/api/media/${uploaded.id}/export?file=${name}`);
          const data = await res.json();
          setExports((list) =>
            list.map((item) =>
              item.file !== name
                ? item
                : res.ok
                  ? { ...item, ...data }
                  : { ...item, status: "error", message: data.error ?? "Lost track of this export." },
            ),
          );
        } catch {
          // temporary network hiccup: try again on the next tick
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [uploaded, activeKey]);

  // Leaving or refreshing the page stops this upload's exports and deletes its files,
  // so abandoned work doesn't keep the computer busy.
  useEffect(() => {
    if (!uploaded) return;
    const onLeave = () => {
      fetch(`/api/media/${uploaded.id}`, { method: "DELETE", keepalive: true }).catch(() => {});
    };
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, [uploaded]);

  function chooseFile(f: File | undefined) {
    setError(null);
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setError(`Unsupported file type. Please choose one of: ${ACCEPTED.join(", ")}.`);
      return;
    }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`This file is too large. The maximum size is ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    setFile(f);
  }

  function upload() {
    if (!file || !confirmed) return;
    setError(null);
    setProgress(0);

    // XMLHttpRequest (instead of fetch) lets us show upload progress.
    // The raw file is sent so the server can stream it straight to disk.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media");
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.setRequestHeader("X-Rights-Confirmed", "yes");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      let data: { error?: string } & Partial<UploadedFile> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // handled below
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.id) {
        setUploaded(data as UploadedFile);
        setExports([]);
      } else {
        setError(data.error ?? `Upload failed (error ${xhr.status}).`);
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Network error. Is the development server running?");
    };
    xhr.send(file);
  }

  async function startExport(options: ExportOptions) {
    if (!uploaded) return;
    const setPanelError = options.kind === "video" ? setVideoError : setAudioError;
    setPanelError(null);
    try {
      const res = await fetch(`/api/media/${uploaded.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start this export.");
      const item: ExportItem = { ...data, options };
      setExports((list) => [item, ...list.filter((e) => e.file !== item.file)]);
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Couldn't start this export.");
    }
  }

  async function cancelExport(item: ExportItem) {
    if (!uploaded) return;
    setExports((list) => list.filter((e) => e.file !== item.file));
    await fetch(`/api/media/${uploaded.id}/export?file=${item.file}`, { method: "DELETE" }).catch(() => {});
  }

  // Stops any exports and deletes the upload and its files from the server
  async function reset() {
    if (uploaded) {
      await fetch(`/api/media/${uploaded.id}`, { method: "DELETE" }).catch(() => {});
    }
    setUploaded(null);
    setFile(null);
    setConfirmed(false);
    setExports([]);
    setError(null);
    setVideoError(null);
    setAudioError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const uploading = progress !== null;

  if (!uploaded) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-xl shadow-indigo-500/10">
        <label
          htmlFor="video-file"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            chooseFile(e.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
          }`}
        >
          <span className="bg-brand grid h-12 w-12 place-items-center rounded-xl text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
            </svg>
          </span>
          {file ? (
            <>
              <span className="mt-4 font-semibold text-slate-900">{file.name}</span>
              <span className="mt-1 text-sm text-slate-500">{formatBytes(file.size)} · click to choose another</span>
            </>
          ) : (
            <>
              <span className="mt-4 font-semibold text-slate-900">Drop a video here or click to browse</span>
              <span className="mt-1 text-sm text-slate-500">
                MP4, MOV, WEBM, MKV, M4V or AVI · up to {MAX_UPLOAD_MB} MB
                {MAX_DURATION_MINUTES < 60 && ` and ${MAX_DURATION_MINUTES} minutes`}
              </span>
            </>
          )}
          <input
            ref={inputRef}
            id="video-file"
            type="file"
            accept={ACCEPTED.join(",") + ",video/*"}
            className="sr-only"
            onChange={(e) => chooseFile(e.target.files?.[0])}
            disabled={uploading}
          />
        </label>

        <label className="mt-5 flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-indigo-600"
          />
          I own this video or have permission from the rights holder to download and convert it.
        </label>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {uploading && (
          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="bg-brand h-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Spinner />
              {progress < 100 ? `Uploading… ${progress}%` : "Checking your video…"}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={upload}
          disabled={!file || !confirmed || uploading}
          className="bg-brand mt-5 h-12 w-full rounded-xl text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? "Uploading…" : "Upload video"}
        </button>
      </div>
    );
  }

  const qualityChoices = videoQualityChoices(uploaded.width, uploaded.height);
  const sourceShortSide = uploaded.width && uploaded.height ? Math.min(uploaded.width, uploaded.height) : null;
  const upscaling = video.height !== null && sourceShortSide !== null && video.height > sourceShortSide;
  const audioFormat = AUDIO_FORMATS[audio.format];
  const isWorking = (o: ExportOptions) => active.some((e) => JSON.stringify(e.options) === JSON.stringify(o));

  return (
    <div className="animate-fade-up mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xl shadow-indigo-500/10">
      <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-50 px-5 py-2.5">
        <span className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">Ready</span>
        <span className="text-xs text-emerald-700">Files auto-delete after {uploaded.expiresInMinutes} minutes</span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{uploaded.fileName}</p>
            <p className="mt-1 text-sm text-slate-500">
              {[
                uploaded.format,
                formatBytes(uploaded.size),
                uploaded.durationSec !== null && formatDuration(uploaded.durationSec),
                uploaded.width && uploaded.height && `${uploaded.width}×${uploaded.height}`,
                uploaded.hasAudio ? "with audio" : "no audio track",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <a
            href={uploaded.originalUrl}
            download
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50"
          >
            Download original
          </a>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* ---------- Video export ---------- */}
          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900">Video · MP4</h3>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Quality
              <select
                className={selectClass}
                value={video.height ?? ""}
                onChange={(e) => setVideo({ ...video, height: e.target.value ? Number(e.target.value) : null })}
              >
                {qualityChoices.map((c) => (
                  <option key={c.label} value={c.value ?? ""}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            {MAX_EXPORT_HEIGHT < 2160 && (
              <p className="mt-2 text-xs text-slate-500">This server exports video up to {MAX_EXPORT_HEIGHT}p.</p>
            )}
            {upscaling && (
              <p className="mt-2 text-xs text-amber-700">
                Upscaling makes the picture bigger and smoother, but it can&apos;t add detail the camera didn&apos;t record.
                {(video.height ?? 0) > 1080 && " Large upscales can take several minutes."}
              </p>
            )}

            <p className="mt-4 text-sm font-medium text-slate-700">Enhance</p>
            <div className="mt-1.5 grid gap-2">
              {VIDEO_ENHANCEMENTS.filter((x) => x.key !== "enhanceAudio" || uploaded.hasAudio).map((x) => (
                <Toggle key={x.key} label={x.label} hint={x.hint} checked={video[x.key]} onChange={(v) => setVideo({ ...video, [x.key]: v })} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => startExport(video)}
              disabled={isWorking(video)}
              className="bg-brand mt-5 h-11 w-full rounded-xl text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
            >
              {isWorking(video) ? "In progress…" : "Create video"}
            </button>
            {videoError && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {videoError}
              </p>
            )}
          </div>

          {/* ---------- Audio export ---------- */}
          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900">Audio</h3>
            {!uploaded.hasAudio ? (
              <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">This video has no audio track to export.</p>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Format
                    <select
                      className={selectClass}
                      value={audio.format}
                      onChange={(e) => setAudio({ ...audio, format: e.target.value as AudioFormatId })}
                    >
                      {Object.entries(AUDIO_FORMATS).map(([id, f]) => (
                        <option key={id} value={id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Quality
                    <select
                      className={selectClass}
                      value={audioFormat.bitrates ? audio.quality : "high"}
                      disabled={!audioFormat.bitrates}
                      onChange={(e) => setAudio({ ...audio, quality: e.target.value as AudioQuality })}
                    >
                      {audioFormat.bitrates ? (
                        (Object.keys(AUDIO_QUALITY_LABELS) as AudioQuality[]).map((q) => (
                          <option key={q} value={q}>
                            {AUDIO_QUALITY_LABELS[q]} · {audioFormat.bitrates![q]}k
                          </option>
                        ))
                      ) : (
                        <option value="high">Lossless</option>
                      )}
                    </select>
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">{audioFormat.note}</p>

                <p className="mt-4 text-sm font-medium text-slate-700">Enhance</p>
                <div className="mt-1.5 grid gap-2">
                  {AUDIO_ENHANCEMENTS.map((x) => (
                    <Toggle key={x.key} label={x.label} hint={x.hint} checked={audio[x.key]} onChange={(v) => setAudio({ ...audio, [x.key]: v })} />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => startExport(audio)}
                  disabled={isWorking(audio)}
                  className="bg-brand mt-5 h-11 w-full rounded-xl text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
                >
                  {isWorking(audio) ? "In progress…" : "Create audio"}
                </button>
              </>
            )}
            {audioError && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {audioError}
              </p>
            )}
          </div>
        </div>

        {/* ---------- Results ---------- */}
        {exports.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">Your files</h3>
            <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {exports.map((item) => (
                <li key={item.file} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-medium text-slate-800">{item.label}</span>
                    {item.status === "done" && item.downloadUrl ? (
                      <a href={item.downloadUrl} download className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                        Download{item.size ? ` · ${formatBytes(item.size)}` : ""}
                      </a>
                    ) : item.status === "working" || item.status === "queued" ? (
                      <span className="flex shrink-0 items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                          <Spinner /> {item.status === "queued" ? "Waiting…" : `${item.percent}%`}
                        </span>
                        <button type="button" onClick={() => cancelExport(item)} className="font-medium text-slate-400 hover:text-red-600">
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startExport(item.options)}
                        className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                  {item.status === "queued" && (
                    <p className="mt-1 text-xs text-slate-500">Starts automatically when the current file finishes.</p>
                  )}
                  {item.status === "working" && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="bg-brand h-full transition-all" style={{ width: `${Math.max(item.percent, 3)}%` }} />
                    </div>
                  )}
                  {item.status === "error" && <p className="mt-1 text-xs text-red-600">{item.message}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <button type="button" onClick={reset} className="font-medium text-indigo-600 hover:text-indigo-700">
            Upload another video
          </button>
          <button type="button" onClick={reset} className="font-medium text-slate-500 hover:text-red-600">
            Delete my files now
          </button>
        </div>
      </div>
    </div>
  );
}

// Section version, used when the social link tools are shown in the hero.
export default function MediaUpload() {
  return (
    <section id="convert" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-4 pb-20 sm:px-6">
      <SectionHeading
        eyebrow="Convert"
        title="Convert a video you own"
        text="Export your own video in different qualities and audio formats, with optional enhancement."
      />
      <div className="mt-10">
        <MediaConverter />
      </div>
    </section>
  );
}
