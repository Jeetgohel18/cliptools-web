import type { ExportOptions } from "../../lib/exportOptions";

// What the server tells us about an uploaded video
export interface UploadedFile {
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

// One requested export and its live status from the server
export interface ExportItem {
  file: string;
  label: string;
  status: "queued" | "working" | "done" | "error";
  percent: number;
  size?: number; // actual size of the finished file, measured by the server
  message?: string;
  downloadUrl: string | null;
  options: ExportOptions;
}

export const ACCEPTED_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"];

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const panelClass = "rounded-2xl border border-line bg-surface shadow-[0_1px_0_rgb(255_255_255_/_0.03)_inset,0_20px_50px_-20px_rgb(0_0_0_/_0.6)]";
