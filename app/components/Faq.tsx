import { SHOW_SOCIAL_LINK_TOOLS } from "../lib/features";
import { SectionHeading } from "./PlatformCards";

const socialFaqs = [
  {
    q: "Which platforms are supported?",
    a: "YouTube, Instagram, X and Pinterest. Paste a link to a single video, post or pin and ClipTools detects it automatically.",
  },
  {
    q: "Why can't I download from a pasted link?",
    a: "Recognising a link is not the same as having permission to download it. YouTube doesn't allow third-party downloads, and Instagram, X and Pinterest only allow media access through their official APIs, which need approved developer accounts. Those integrations aren't configured yet, so ClipTools tells you honestly instead of pretending.",
  },
];

const faqs = [
  {
    q: "Is ClipTools free?",
    a: "Yes. ClipTools is free to use while it is in development.",
  },
  ...(SHOW_SOCIAL_LINK_TOOLS ? socialFaqs : []),
  {
    q: "What can I convert?",
    a: "Videos you own or have permission to use. Upload an MP4, MOV, WEBM, MKV, M4V or AVI file, then export it as MP4 in resolutions from 360p to 4K, or export its audio as MP3, M4A, Opus, WAV or FLAC.",
  },
  {
    q: "Can enhancement turn a low-quality video into HD?",
    a: "Not truly. Enhancement can reduce grain, sharpen edges, lift colour and clean up audio, which often looks and sounds noticeably better. Upscaling makes the picture bigger and smoother, but no tool can recover detail the camera never recorded.",
  },
  {
    q: "Which audio format should I choose?",
    a: "MP3 plays everywhere. M4A is great on Apple devices. Opus gives the smallest files at good quality. WAV and FLAC are lossless: choose them for editing or archiving.",
  },
  {
    q: "Can I download private, paid or members-only content?",
    a: "No. ClipTools will never bypass logins, paywalls, DRM or privacy settings.",
  },
  {
    q: "Do you store my files?",
    a: "Uploaded videos and the files you create are stored temporarily for processing and deleted automatically after 30 minutes, or immediately when you click “Delete my files now”.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line bg-surface/50 py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Questions & answers" text="Everything you need to know." />

        <div className="mt-12 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {faqs.map((f) => (
            <details key={f.q} className="group px-6 py-5 open:bg-raised/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-medium text-fg focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45 group-open:border-accent/40 group-open:text-accent-soft">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 6v12M6 12h12" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 pr-10 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
