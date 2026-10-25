"use client";

import Icon from "../ui/Icon";
import { Badge, Button, ProgressBar, Spinner, buttonClass } from "../ui/controls";
import { formatBytes, panelClass, type ExportItem } from "./types";

export default function ExportList({
  items,
  onCancel,
  onRetry,
}: {
  items: ExportItem[];
  onCancel: (item: ExportItem) => void;
  onRetry: (item: ExportItem) => void;
}) {
  return (
    <section aria-label="Your exports" className={panelClass}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold text-fg">Exports</h2>
        {items.length > 0 && <span className="text-xs text-muted tabular-nums">{items.length} file{items.length > 1 ? "s" : ""}</span>}
      </div>

      <ul aria-live="polite" className="divide-y divide-line">
        {items.length === 0 && (
          <li className="flex flex-col items-center px-6 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-dashed border-line-strong text-muted">
              <Icon name="download" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-fg">No exports yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">Choose your settings and press Export. Finished files appear here.</p>
          </li>
        )}

        {items.map((item) => {
          const video = item.options.kind === "video";
          return (
            <li key={item.file} className="animate-fade-up px-5 py-4">
              <div className="flex items-center gap-3.5">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
                    video ? "border-accent/30 bg-accent/10 text-accent-soft" : "border-audio/25 bg-audio/10 text-audio"
                  }`}
                >
                  <Icon name={video ? "film" : "music"} className="h-[18px] w-[18px]" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{item.label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    {item.status === "queued" && (
                      <Badge>
                        <Icon name="clock" className="h-3 w-3" /> Waiting for a free slot
                      </Badge>
                    )}
                    {item.status === "working" && (
                      <Badge tone="accent">
                        <Spinner className="h-3 w-3" /> Processing · <span className="tabular-nums">{item.percent}%</span>
                      </Badge>
                    )}
                    {item.status === "done" && (
                      <>
                        <Badge tone="success">
                          <Icon name="check" className="h-3 w-3" /> Ready
                        </Badge>
                        {item.size !== undefined && <span className="tabular-nums">Actual size {formatBytes(item.size)}</span>}
                      </>
                    )}
                    {item.status === "error" && (
                      <Badge tone="danger">
                        <Icon name="alert" className="h-3 w-3" /> Failed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {item.status === "done" && item.downloadUrl && (
                    <a href={item.downloadUrl} download className={buttonClass("primary", "sm")}>
                      <Icon name="download" className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  )}
                  {(item.status === "queued" || item.status === "working") && (
                    <Button variant="danger" size="sm" onClick={() => onCancel(item)} aria-label={`Cancel ${item.label}`}>
                      <Icon name="x" className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                  )}
                  {item.status === "error" && (
                    <Button variant="secondary" size="sm" onClick={() => onRetry(item)}>
                      <Icon name="refresh" className="h-4 w-4" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>

              {item.status === "working" && <ProgressBar value={item.percent} label={`${item.label} progress`} className="mt-3" />}
              {item.status === "queued" && <p className="mt-2 text-xs text-muted">Starts automatically when the current file finishes.</p>}
              {item.status === "error" && item.message && <p className="mt-2 text-xs text-rose-300">{item.message}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
