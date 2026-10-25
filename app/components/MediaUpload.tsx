"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioExportOptions, ExportOptions, VideoExportOptions } from "../lib/exportOptions";
import ExportList from "./converter/ExportList";
import SettingsPanel from "./converter/SettingsPanel";
import SourcePanel from "./converter/SourcePanel";
import UploadPanel, { type UploadProgress } from "./converter/UploadPanel";
import { ACCEPTED_EXTENSIONS, type ExportItem, type UploadedFile } from "./converter/types";
import { SectionHeading } from "./PlatformCards";

const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 200;

// The full upload → choose → export → download workspace.
export function MediaConverter() {
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
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
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`“${f.name}” isn't a supported video. Please choose an MP4, MOV, WEBM, MKV, M4V or AVI file.`);
      return;
    }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`This file is too large. The maximum size is ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    // A local link to the file on your computer, used only for the preview player
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
    setFile(f);
  }

  function upload() {
    if (!file || !confirmed) return;
    setError(null);
    setProgress({ loaded: 0, total: file.size });

    // XMLHttpRequest (instead of fetch) lets us show upload progress.
    // The raw file is sent so the server can stream it straight to disk.
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/media");
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.setRequestHeader("X-Rights-Confirmed", "yes");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress({ loaded: e.loaded, total: e.total });
    };
    xhr.onload = () => {
      xhrRef.current = null;
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
      xhrRef.current = null;
      setProgress(null);
      setError("Network error. Please check your connection and try again.");
    };
    xhr.onabort = () => {
      xhrRef.current = null;
      setProgress(null);
      setError("Upload cancelled.");
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploaded(null);
    setFile(null);
    setConfirmed(false);
    setExports([]);
    setError(null);
    setVideoError(null);
    setAudioError(null);
  }

  if (!uploaded) {
    return (
      <UploadPanel
        file={file}
        confirmed={confirmed}
        progress={progress}
        error={error}
        maxUploadMb={MAX_UPLOAD_MB}
        onChooseFile={chooseFile}
        onConfirmedChange={setConfirmed}
        onUpload={upload}
        onCancelUpload={() => xhrRef.current?.abort()}
      />
    );
  }

  const inProgress = (o: ExportOptions) => active.some((e) => JSON.stringify(e.options) === JSON.stringify(o));

  return (
    // Desktop: preview + exports on the left, settings on the right.
    // Mobile: preview → settings → exports.
    <div className="animate-fade-up mx-auto grid max-w-6xl gap-5 text-left [grid-template-areas:'source'_'settings'_'exports'] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'source_settings'_'exports_settings']">
      <div className="[grid-area:source]">
        <SourcePanel uploaded={uploaded} previewUrl={previewUrl} onReplace={reset} onDelete={reset} />
      </div>
      <div className="[grid-area:settings]">
        <SettingsPanel
          uploaded={uploaded}
          video={video}
          audio={audio}
          onVideoChange={setVideo}
          onAudioChange={setAudio}
          onExport={startExport}
          isInProgress={inProgress}
          videoError={videoError}
          audioError={audioError}
        />
      </div>
      <div className="[grid-area:exports]">
        <ExportList items={exports} onCancel={cancelExport} onRetry={(item) => startExport(item.options)} />
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
