"use client";

import { useState } from "react";
import { detectPlatform, PLATFORMS, type DetectionResult } from "../lib/platforms";

const EXAMPLES = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.instagram.com/reel/C0abcDEFghi/",
  "https://x.com/NASA/status/1234567890123456789",
  "https://www.pinterest.com/pin/123456789012345678/",
];

export default function UrlInput() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);

  // Live detection while typing (only shown once something is typed)
  const live = value.trim() ? detectPlatform(value) : null;

  function analyze(link: string) {
    setResult(detectPlatform(link));
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setValue(text);
      analyze(text);
    } catch {
      setResult({ status: "invalid", message: "Clipboard access was blocked. Please paste with Ctrl+V / Cmd+V." });
    }
  }

  return (
    <div className="mx-auto max-w-2xl text-left">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          analyze(value);
        }}
        className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-2 shadow-xl shadow-indigo-500/10 transition focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-indigo-500/15 sm:flex-row"
      >
        <div className="relative flex-1">
          <label htmlFor="url" className="sr-only">
            Media link
          </label>
          <input
            id="url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste a YouTube, Instagram, X or Pinterest link…"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setResult(null);
            }}
            className="h-12 w-full rounded-xl bg-transparent px-4 pr-28 text-fg placeholder:text-muted/70 focus:outline-none"
          />
          {live?.status === "recognized" && (
            <span
              className={`absolute top-1/2 right-3 -translate-y-1/2 rounded-full px-2.5 py-1 text-xs font-semibold ${live.platform.badgeClass}`}
            >
              {live.platform.name}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={pasteFromClipboard}
            className="h-12 flex-1 rounded-xl border border-line px-4 text-sm font-medium text-muted transition hover:bg-raised sm:flex-none"
          >
            Paste
          </button>
          <button
            type="submit"
            className="bg-brand h-12 flex-1 rounded-xl px-6 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:opacity-90 active:scale-[0.98] sm:flex-none"
          >
            Analyze link
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
        <span>Try an example:</span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setValue(ex);
              analyze(ex);
            }}
            className="rounded-full border border-line bg-surface px-2.5 py-1 transition hover:border-accent/50 hover:text-fg"
          >
            {PLATFORMS[i].name}
          </button>
        ))}
      </div>

      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }: { result: DetectionResult }) {
  if (result.status === "invalid") {
    return (
      <div role="alert" className="animate-fade-up mt-6 rounded-2xl border border-rose-400/25 bg-rose-500/[0.08] p-4 text-sm text-rose-200">
        {result.message}
      </div>
    );
  }

  if (result.status === "unsupported") {
    return (
      <div role="alert" className="animate-fade-up mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4 text-sm text-amber-100">
        {result.message}
      </div>
    );
  }

  const { platform, contentType, idLabel, contentId, singleItem, url } = result;

  return (
    <div className="animate-fade-up mt-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg shadow-black/30">
      <div className="flex items-center justify-between border-b border-line bg-emerald-400/10 px-5 py-2.5">
        <span className="text-xs font-semibold tracking-wide text-emerald-300 uppercase">Link recognised</span>
        <span className="text-xs text-emerald-300">No media was fetched</span>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-bold ${platform.badgeClass}`}>
            {platform.badge}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-fg">
              {platform.name} · {contentType}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {idLabel}: {contentId}
            </p>
            <p className="mt-1 truncate text-xs text-muted">{url}</p>
          </div>
        </div>

        {!singleItem && (
          <p className="mt-4 rounded-xl bg-raised px-4 py-3 text-sm text-muted">
            This links to a {contentType.toLowerCase()}, not a single video, post or pin.
          </p>
        )}

        <div className="mt-4 rounded-xl border border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-fg">Download from {platform.name}</p>
            <span className="rounded-full bg-raised px-2.5 py-0.5 text-xs font-medium text-muted">
              {platform.download.label}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{platform.download.reason}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{platform.download.officialOption}</p>
        </div>

        <a
          href="#convert"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-soft transition hover:translate-x-0.5"
        >
          Convert a video you own →
        </a>
      </div>
    </div>
  );
}
