import { SHOW_SOCIAL_LINK_TOOLS } from "../lib/features";
import { MediaConverter } from "./MediaUpload";
import UrlInput from "./UrlInput";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-4xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
        <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-700">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          {SHOW_SOCIAL_LINK_TOOLS ? "Link detection · Convert your own videos" : "Free · No sign-up · Files auto-delete"}
        </span>

        <h1 className="animate-fade-up anim-delay-1 mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          {SHOW_SOCIAL_LINK_TOOLS ? "One link." : "Your videos."} <span className="text-brand">Every format.</span>
        </h1>

        <p className="animate-fade-up anim-delay-2 mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          {SHOW_SOCIAL_LINK_TOOLS
            ? "Paste a YouTube, Instagram, X or Pinterest link to identify it instantly, or upload a video you own to download it and extract its audio as MP3."
            : "Upload a video you own and export it in the quality you need, convert its audio to MP3, M4A, Opus, WAV or FLAC, and enhance the picture and sound."}
        </p>

        <div className="animate-fade-up anim-delay-3 mt-10">{SHOW_SOCIAL_LINK_TOOLS ? <UrlInput /> : <MediaConverter />}</div>
      </div>
    </section>
  );
}
