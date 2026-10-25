import { SHOW_SOCIAL_LINK_TOOLS } from "../lib/features";
import { SectionHeading } from "./PlatformCards";

const steps = SHOW_SOCIAL_LINK_TOOLS
  ? [
      { title: "Paste a link", text: "Copy a link to a video, post or pin and paste it into the input at the top." },
      { title: "We detect it", text: "ClipTools recognises the platform and content type instantly, right in your browser." },
      { title: "Choose a format", text: "Pick MP4 video or MP3 audio where an authorized download option is available." },
    ]
  : [
      { title: "Upload your video", text: "Drop in a video you own: MP4, MOV, WEBM, MKV, M4V or AVI." },
      { title: "Choose quality & format", text: "Pick a video resolution or an audio format, and turn on any enhancements you want." },
      { title: "Download", text: "Your files are ready in seconds and deleted automatically after 30 minutes." },
    ];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-slate-200 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="How it works" title="Three simple steps" text="No sign-up, no clutter." />

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
              <span className="bg-brand grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-5 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
