import { SHOW_SOCIAL_LINK_TOOLS } from "../lib/features";
import { MediaConverter } from "./MediaUpload";
import UrlInput from "./UrlInput";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153)]" />
            {SHOW_SOCIAL_LINK_TOOLS ? "Link detection · Convert your own videos" : "Free · No sign-up · Files auto-delete"}
          </span>

          <h1 className="animate-fade-up anim-delay-1 mt-6 text-[2.5rem] leading-[1.08] font-semibold tracking-[-0.03em] text-fg sm:text-6xl">
            {SHOW_SOCIAL_LINK_TOOLS ? "One link." : "Your videos."} <span className="text-brand">Every format.</span>
          </h1>

          <p className="animate-fade-up anim-delay-2 mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {SHOW_SOCIAL_LINK_TOOLS
              ? "Paste a YouTube, Instagram, X or Pinterest link to identify it instantly, or upload a video you own to download it and extract its audio as MP3."
              : "Export your own videos in the resolution you need, turn their sound into MP3, M4A, Opus, WAV or FLAC, and clean up picture and audio."}
          </p>
        </div>

        <div className="animate-fade-up anim-delay-3 mt-12">{SHOW_SOCIAL_LINK_TOOLS ? <UrlInput /> : <MediaConverter />}</div>
      </div>
    </section>
  );
}
