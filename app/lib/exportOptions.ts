// Export choices shared by the browser and the server.
// The server re-checks every value, so the browser can't request anything else.

export type AudioFormatId = "mp3" | "m4a" | "opus" | "wav" | "flac";
export type AudioQuality = "high" | "standard" | "small";

export interface AudioFormat {
  label: string;
  ext: string;
  bitrates: Record<AudioQuality, number> | null; // null = lossless
  note: string;
}

export const AUDIO_FORMATS: Record<AudioFormatId, AudioFormat> = {
  mp3: { label: "MP3", ext: ".mp3", bitrates: { high: 320, standard: 192, small: 128 }, note: "Plays everywhere" },
  m4a: { label: "M4A (AAC)", ext: ".m4a", bitrates: { high: 256, standard: 192, small: 128 }, note: "Great for Apple devices" },
  opus: { label: "Opus", ext: ".opus", bitrates: { high: 160, standard: 128, small: 96 }, note: "Smallest files" },
  wav: { label: "WAV", ext: ".wav", bitrates: null, note: "Lossless, large files" },
  flac: { label: "FLAC", ext: ".flac", bitrates: null, note: "Lossless, compressed" },
};

export const AUDIO_QUALITY_LABELS: Record<AudioQuality, string> = {
  high: "High",
  standard: "Standard",
  small: "Small file",
};

// Short-side resolutions: 1080 means 1920×1080 landscape or 1080×1920 portrait.
export const VIDEO_HEIGHTS = [2160, 1440, 1080, 720, 480, 360];

// Hosting limits. Defaults suit your own computer; the Dockerfile sets smaller ones for free hosting.
export const MAX_EXPORT_HEIGHT = Number(process.env.NEXT_PUBLIC_MAX_EXPORT_HEIGHT) || 2160;
export const MAX_DURATION_MINUTES = Number(process.env.NEXT_PUBLIC_MAX_DURATION_MINUTES) || 60;

export interface VideoExportOptions {
  kind: "video";
  height: number | null; // null = keep the source resolution
  denoise: boolean;
  sharpen: boolean;
  color: boolean;
  enhanceAudio: boolean;
}

export interface AudioExportOptions {
  kind: "audio";
  format: AudioFormatId;
  quality: AudioQuality;
  noiseReduction: boolean;
  voiceClarity: boolean;
  loudness: boolean;
}

export type ExportOptions = VideoExportOptions | AudioExportOptions;

export const VIDEO_ENHANCEMENTS = [
  { key: "denoise", label: "Reduce grain", hint: "Smooths noise in low-light footage" },
  { key: "sharpen", label: "Sharpen", hint: "Crisper edges and detail" },
  { key: "color", label: "Boost colour", hint: "Slightly more contrast and saturation" },
  { key: "enhanceAudio", label: "Clean up audio", hint: "Reduces hiss and evens out volume" },
] as const;

export const AUDIO_ENHANCEMENTS = [
  { key: "noiseReduction", label: "Reduce noise", hint: "Removes steady background hiss and hum" },
  { key: "voiceClarity", label: "Voice clarity", hint: "Clearer, more present speech" },
  { key: "loudness", label: "Normalize loudness", hint: "Consistent volume at streaming level (−14 LUFS)" },
] as const;

export function videoQualityChoices(width: number | null, height: number | null) {
  const source = width && height ? Math.min(width, height) : null;
  const choices: { value: number | null; label: string }[] = [
    { value: null, label: source ? `Same as source (${source}p)` : "Same as source" },
  ];
  for (const h of VIDEO_HEIGHTS) {
    if (h === source || h > MAX_EXPORT_HEIGHT) continue;
    choices.push({ value: h, label: source && h > source ? `${h}p · upscale` : `${h}p` });
  }
  return choices;
}

export function isEnhanced(o: ExportOptions) {
  return o.kind === "video"
    ? o.denoise || o.sharpen || o.color || o.enhanceAudio
    : o.noiseReduction || o.voiceClarity || o.loudness;
}

// Human-readable name, e.g. "720p MP4 · Enhanced" or "MP3 · 320 kbps"
export function describeExport(o: ExportOptions) {
  let label: string;
  if (o.kind === "video") {
    label = `${o.height ? `${o.height}p` : "Source resolution"} MP4`;
  } else {
    const format = AUDIO_FORMATS[o.format];
    label = format.bitrates ? `${format.label} · ${format.bitrates[o.quality]} kbps` : `${format.label} · Lossless`;
  }
  return isEnhanced(o) ? `${label} · Enhanced` : label;
}

// Short text added to the downloaded file name, e.g. "720p-enhanced" or "mp3-320k"
export function exportFileSuffix(o: ExportOptions) {
  let suffix: string;
  if (o.kind === "video") {
    suffix = o.height ? `${o.height}p` : "converted";
  } else {
    const format = AUDIO_FORMATS[o.format];
    suffix = format.bitrates ? `${o.format}-${format.bitrates[o.quality]}k` : o.format;
  }
  return isEnhanced(o) ? `${suffix}-enhanced` : suffix;
}
