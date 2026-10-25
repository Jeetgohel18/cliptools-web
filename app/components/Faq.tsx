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
    <section id="faq" className="scroll-mt-20 border-t border-slate-200 bg-white py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Questions & answers" text="Everything you need to know." />

        <div className="mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {faqs.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900">
                {f.q}
                <span className="text-xl text-indigo-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
