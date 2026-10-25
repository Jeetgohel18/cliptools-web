"use client";

import { useState } from "react";
import Icon from "../ui/Icon";
import { Badge, buttonClass } from "../ui/controls";
import { formatBytes, formatDuration, panelClass, type UploadedFile } from "./types";

// Shows the uploaded video (played locally from your own file) and its details.
export default function SourcePanel({
  uploaded,
  previewUrl,
  onReplace,
  onDelete,
}: {
  uploaded: UploadedFile;
  previewUrl: string | null;
  onReplace: () => void;
  onDelete: () => void;
}) {
  const [playable, setPlayable] = useState(true);
  const portrait = (uploaded.height ?? 0) > (uploaded.width ?? 0);

  const details: [string, string][] = [
    ["Format", uploaded.format],
    ["Size", formatBytes(uploaded.size)],
    ["Duration", uploaded.durationSec !== null ? formatDuration(uploaded.durationSec) : "Unknown"],
    ["Resolution", uploaded.width && uploaded.height ? `${uploaded.width} × ${uploaded.height}` : "Unknown"],
    ["Video codec", uploaded.videoCodec?.toUpperCase() ?? "Unknown"],
    ["Audio", uploaded.hasAudio ? "Yes" : "No audio track"],
  ];

  return (
    <section aria-label="Source video" className={`${panelClass} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Badge tone="success">
            <Icon name="check" className="h-3.5 w-3.5" />
            Uploaded
          </Badge>
          <h2 className="truncate text-sm font-semibold text-fg" title={uploaded.fileName}>
            {uploaded.fileName}
          </h2>
        </div>
      </div>

      {/* Preview */}
      <div className={`relative bg-black ${portrait ? "aspect-video lg:aspect-[4/3]" : "aspect-video"}`}>
        {previewUrl && playable ? (
          <video
            src={previewUrl}
            controls
            playsInline
            preload="metadata"
            onError={() => setPlayable(false)}
            className="h-full w-full object-contain"
          >
            <track kind="captions" />
          </video>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <Icon name="eyeOff" className="h-6 w-6 text-muted" />
            <p className="text-sm font-medium text-fg">Preview not available</p>
            <p className="max-w-xs text-xs leading-relaxed text-muted">
              Your browser can&apos;t play this format. Processing still works normally.
            </p>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm sm:grid-cols-3">
        {details.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-0.5 truncate font-medium text-fg tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
        <a href={uploaded.originalUrl} download className={buttonClass("secondary", "sm")}>
          <Icon name="download" className="h-4 w-4" />
          Original
        </a>
        <button type="button" onClick={onReplace} className={buttonClass("ghost", "sm")}>
          <Icon name="replace" className="h-4 w-4" />
          New video
        </button>
        <button type="button" onClick={onDelete} className={buttonClass("danger", "sm", "ml-auto")}>
          <Icon name="trash" className="h-4 w-4" />
          Delete files
        </button>
      </div>
      <p className="flex items-center gap-1.5 border-t border-line px-5 py-2.5 text-xs text-muted">
        <Icon name="clock" className="h-3.5 w-3.5" />
        Files are deleted automatically after {uploaded.expiresInMinutes} minutes or when you leave this page.
      </p>
    </section>
  );
}
