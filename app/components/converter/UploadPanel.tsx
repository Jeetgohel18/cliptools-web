"use client";

import { useState } from "react";
import { MAX_DURATION_MINUTES } from "../../lib/exportOptions";
import Icon from "../ui/Icon";
import { Button, Callout, ProgressBar } from "../ui/controls";
import { ACCEPTED_EXTENSIONS, formatBytes, panelClass } from "./types";

export interface UploadProgress {
  loaded: number;
  total: number;
}

export default function UploadPanel({
  file,
  confirmed,
  progress,
  error,
  maxUploadMb,
  onChooseFile,
  onConfirmedChange,
  onUpload,
  onCancelUpload,
}: {
  file: File | null;
  confirmed: boolean;
  progress: UploadProgress | null;
  error: string | null;
  maxUploadMb: number;
  onChooseFile: (file: File | undefined) => void;
  onConfirmedChange: (value: boolean) => void;
  onUpload: () => void;
  onCancelUpload: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const uploading = progress !== null;
  const percent = progress ? Math.round((progress.loaded / Math.max(progress.total, 1)) * 100) : 0;
  const checking = uploading && percent >= 100;

  return (
    <div className={`${panelClass} glass mx-auto max-w-3xl p-3 text-left sm:p-4`}>
      {/* Drop zone */}
      <label
        htmlFor="video-file"
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!uploading) onChooseFile(e.dataTransfer.files[0]);
        }}
        className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-6 py-12 text-center transition duration-300 sm:py-14 ${
          uploading ? "cursor-default border-line" : "cursor-pointer"
        } ${
          dragging
            ? "border-accent-soft bg-accent/[0.08] shadow-[inset_0_0_60px_rgb(124_58_237_/_0.15)]"
            : "border-line-strong/70 hover:border-accent/60 hover:bg-white/[0.015]"
        }`}
      >
        <span
          className={`grid h-14 w-14 place-items-center rounded-2xl border transition duration-300 ${
            dragging ? "bg-brand border-transparent text-white" : "border-line bg-raised text-accent-soft group-hover:border-accent/50"
          }`}
        >
          <Icon name={file ? "film" : "upload"} className="h-6 w-6" />
        </span>

        {file ? (
          <>
            <span className="mt-5 max-w-full truncate text-base font-semibold text-fg">{file.name}</span>
            <span className="mt-1 text-sm text-muted">
              {formatBytes(file.size)}
              {!uploading && " · Click or drop to choose a different file"}
            </span>
          </>
        ) : (
          <>
            <span className="mt-5 text-base font-semibold text-fg">{dragging ? "Release to add your video" : "Drop a video here"}</span>
            <span className="mt-1 text-sm text-muted">
              or <span className="font-medium text-accent-soft underline-offset-4 group-hover:underline">browse your files</span>
            </span>
          </>
        )}

        <span className="mt-6 flex flex-wrap justify-center gap-1.5 text-xs text-muted">
          {["MP4", "MOV", "WEBM", "MKV", "M4V", "AVI"].map((f) => (
            <span key={f} className="rounded-md border border-line bg-bg/60 px-1.5 py-0.5 font-medium tracking-wide">
              {f}
            </span>
          ))}
          <span className="px-1 py-0.5">
            up to {maxUploadMb} MB{MAX_DURATION_MINUTES < 60 && ` · ${MAX_DURATION_MINUTES} min`}
          </span>
        </span>

        <input
          id="video-file"
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",") + ",video/*"}
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            onChooseFile(e.target.files?.[0]);
            e.target.value = ""; // allows choosing the same file again
          }}
        />
      </label>

      <div className="space-y-4 px-1 pt-4 pb-1 sm:px-2">
        {/* Upload progress */}
        {uploading && (
          <div className="rounded-xl border border-line bg-raised/60 p-4" aria-live="polite">
            <div className="mb-2.5 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-fg">{checking ? "Checking your video…" : "Uploading…"}</span>
              <span className="tabular-nums text-muted">
                {checking ? "Reading format and tracks" : `${formatBytes(progress.loaded)} of ${formatBytes(progress.total)} · ${percent}%`}
              </span>
            </div>
            <ProgressBar value={checking ? undefined : percent} label={checking ? "Checking video" : "Upload progress"} />
          </div>
        )}

        {error && (
          <Callout tone="danger" role="alert">
            {error}
          </Callout>
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-xl px-1 text-sm leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={uploading}
            onChange={(e) => onConfirmedChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#7c3aed]"
          />
          <span>I own this video or have permission from the rights holder to download and convert it.</span>
        </label>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-muted">
            <Icon name="shield" className="h-4 w-4 text-emerald-300/80" />
            Files are processed privately and deleted automatically.
          </p>
          {uploading ? (
            <Button variant="secondary" onClick={onCancelUpload} disabled={checking}>
              Cancel upload
            </Button>
          ) : (
            <Button size="lg" onClick={onUpload} disabled={!file || !confirmed}>
              <Icon name="upload" className="h-4 w-4" />
              Upload & continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
