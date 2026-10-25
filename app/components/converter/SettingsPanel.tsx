"use client";

import { useState } from "react";
import {
  AUDIO_ENHANCEMENTS,
  AUDIO_FORMATS,
  AUDIO_QUALITY_LABELS,
  MAX_EXPORT_HEIGHT,
  VIDEO_ENHANCEMENTS,
  describeExport,
  videoQualityChoices,
  type AudioExportOptions,
  type AudioFormatId,
  type AudioQuality,
  type ExportOptions,
  type VideoExportOptions,
} from "../../lib/exportOptions";
import Icon from "../ui/Icon";
import { Button, Callout, ChoiceGroup, Spinner, Switch } from "../ui/controls";
import { panelClass, type UploadedFile } from "./types";

type Tab = "video" | "audio";

export default function SettingsPanel({
  uploaded,
  video,
  audio,
  onVideoChange,
  onAudioChange,
  onExport,
  isInProgress,
  videoError,
  audioError,
}: {
  uploaded: UploadedFile;
  video: VideoExportOptions;
  audio: AudioExportOptions;
  onVideoChange: (v: VideoExportOptions) => void;
  onAudioChange: (a: AudioExportOptions) => void;
  onExport: (o: ExportOptions) => void;
  isInProgress: (o: ExportOptions) => boolean;
  videoError: string | null;
  audioError: string | null;
}) {
  const [tab, setTab] = useState<Tab>("video");

  return (
    <section aria-label="Export settings" className={`${panelClass} flex flex-col`}>
      {/* Output type switcher (radio group: arrow keys work) */}
      <div className="border-b border-line p-3">
        <div role="radiogroup" aria-label="Output type" className="grid grid-cols-2 gap-1 rounded-xl bg-bg/70 p-1">
          {(
            [
              { id: "video", label: "Video", sub: "MP4", icon: "film", tint: "text-accent-soft" },
              { id: "audio", label: "Audio", sub: "MP3 · M4A · Opus · WAV · FLAC", icon: "music", tint: "text-audio" },
            ] as const
          ).map((t) => (
            <label key={t.id} className="cursor-pointer">
              <input
                type="radio"
                name="output-type"
                className="peer sr-only"
                checked={tab === t.id}
                onChange={() => setTab(t.id)}
              />
              <span className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition peer-checked:bg-raised peer-checked:text-fg peer-checked:shadow-[0_1px_0_rgb(255_255_255_/_0.05)_inset,0_4px_14px_-4px_rgb(0_0_0_/_0.6)] peer-focus-visible:ring-2 peer-focus-visible:ring-accent-soft hover:text-fg">
                <Icon name={t.icon} className={`h-4 w-4 ${tab === t.id ? t.tint : ""}`} />
                {t.label}
                <span className="hidden text-xs font-normal text-muted sm:inline">· {t.sub}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex-1 p-5 sm:p-6">
        {tab === "video" ? (
          <VideoSettings uploaded={uploaded} video={video} onChange={onVideoChange} />
        ) : (
          <AudioSettings uploaded={uploaded} audio={audio} onChange={onAudioChange} />
        )}
      </div>

      {/* Action bar */}
      <div className="space-y-3 border-t border-line p-5 sm:px-6">
        {tab === "video" && videoError && (
          <Callout tone="danger" role="alert">
            {videoError}
          </Callout>
        )}
        {tab === "audio" && audioError && (
          <Callout tone="danger" role="alert">
            {audioError}
          </Callout>
        )}
        {(tab === "video" || uploaded.hasAudio) && (
          <ExportButton options={tab === "video" ? video : audio} busy={isInProgress(tab === "video" ? video : audio)} onExport={onExport} />
        )}
      </div>
    </section>
  );
}

function ExportButton({ options, busy, onExport }: { options: ExportOptions; busy: boolean; onExport: (o: ExportOptions) => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        Output: <span className="font-medium text-fg">{describeExport(options)}</span>
      </p>
      <Button size="lg" onClick={() => onExport(options)} disabled={busy} className="sm:min-w-44">
        {busy ? (
          <>
            <Spinner /> In progress…
          </>
        ) : (
          <>
            <Icon name={options.kind === "video" ? "film" : "music"} className="h-4 w-4" />
            Export {options.kind === "video" ? "video" : "audio"}
          </>
        )}
      </Button>
    </div>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 flex items-center gap-2 px-3 text-xs font-semibold tracking-[0.08em] text-muted uppercase">{children}</h3>;
}

function VideoSettings({ uploaded, video, onChange }: { uploaded: UploadedFile; video: VideoExportOptions; onChange: (v: VideoExportOptions) => void }) {
  const sourceShortSide = uploaded.width && uploaded.height ? Math.min(uploaded.width, uploaded.height) : null;
  const upscaling = video.height !== null && sourceShortSide !== null && video.height > sourceShortSide;
  const choices = videoQualityChoices(uploaded.width, uploaded.height).map((c) => ({
    value: c.value === null ? "source" : String(c.value),
    label: c.value === null ? "Original" : `${c.value}p`,
    sub: c.value === null ? (sourceShortSide ? `${sourceShortSide}p · no resize` : "No resize") : c.label.includes("upscale") ? "Upscale" : "Smaller file",
  }));

  return (
    <div className="space-y-6">
      <ChoiceGroup
        legend="Resolution"
        name="video-quality"
        value={video.height === null ? "source" : String(video.height)}
        options={choices}
        onChange={(v) => onChange({ ...video, height: v === "source" ? null : Number(v) })}
        columns="grid-cols-2 sm:grid-cols-3"
        tip="Resolution of the shorter side. 1080p means 1920×1080 for landscape or 1080×1920 for portrait video."
      />

      {upscaling && (
        <Callout tone="warning">
          Upscaling makes the picture larger and smoother, but it can&apos;t restore detail the camera never recorded.
          {(video.height ?? 0) > 1080 && " Large upscales can take several minutes."}
        </Callout>
      )}
      {MAX_EXPORT_HEIGHT < 2160 && <Callout tone="info">This server exports video up to {MAX_EXPORT_HEIGHT}p.</Callout>}

      <div>
        <GroupTitle>
          <Icon name="sparkles" className="h-3.5 w-3.5 text-accent-soft" /> Enhance
        </GroupTitle>
        <div className="divide-y divide-line/60 rounded-xl border border-line bg-raised/40">
          {VIDEO_ENHANCEMENTS.filter((x) => x.key !== "enhanceAudio" || uploaded.hasAudio).map((x) => (
            <Switch key={x.key} label={x.label} hint={x.hint} checked={video[x.key]} onChange={(v) => onChange({ ...video, [x.key]: v })} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AudioSettings({ uploaded, audio, onChange }: { uploaded: UploadedFile; audio: AudioExportOptions; onChange: (a: AudioExportOptions) => void }) {
  if (!uploaded.hasAudio) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-raised text-muted">
          <Icon name="music" className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-semibold text-fg">No audio track in this video</p>
        <p className="mt-1 max-w-xs text-sm text-muted">There&apos;s no sound to export. You can still export the video.</p>
      </div>
    );
  }

  const format = AUDIO_FORMATS[audio.format];
  return (
    <div className="space-y-6">
      <ChoiceGroup
        legend="Format"
        name="audio-format"
        value={audio.format}
        options={(Object.keys(AUDIO_FORMATS) as AudioFormatId[]).map((id) => ({ value: id, label: AUDIO_FORMATS[id].label, sub: AUDIO_FORMATS[id].note }))}
        onChange={(v) => onChange({ ...audio, format: v as AudioFormatId })}
        columns="grid-cols-2 sm:grid-cols-3"
      />

      {format.bitrates ? (
        <ChoiceGroup
          legend="Quality"
          name="audio-quality"
          value={audio.quality}
          options={(Object.keys(AUDIO_QUALITY_LABELS) as AudioQuality[]).map((q) => ({
            value: q,
            label: `${format.bitrates![q]} kbps`,
            sub: AUDIO_QUALITY_LABELS[q],
          }))}
          onChange={(v) => onChange({ ...audio, quality: v as AudioQuality })}
          tip="Higher bitrates sound better and make larger files. 192 kbps is transparent for most listeners."
        />
      ) : (
        <Callout tone="info">{format.label} is lossless: it keeps every detail of the original audio, so there&apos;s no quality setting.</Callout>
      )}

      <div>
        <GroupTitle>
          <Icon name="sparkles" className="h-3.5 w-3.5 text-audio" /> Enhance
        </GroupTitle>
        <div className="divide-y divide-line/60 rounded-xl border border-line bg-raised/40">
          {AUDIO_ENHANCEMENTS.map((x) => (
            <Switch key={x.key} label={x.label} hint={x.hint} checked={audio[x.key]} onChange={(v) => onChange({ ...audio, [x.key]: v })} />
          ))}
        </div>
      </div>
    </div>
  );
}
