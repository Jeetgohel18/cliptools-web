import { SHOW_SOCIAL_LINK_TOOLS } from "../lib/features";
import Icon, { type IconName } from "./ui/Icon";
import { SectionHeading } from "./PlatformCards";

const steps: { title: string; text: string; icon: IconName }[] = SHOW_SOCIAL_LINK_TOOLS
  ? [
      { icon: "file", title: "Paste a link", text: "Copy a link to a video, post or pin and paste it into the input at the top." },
      { icon: "check", title: "We detect it", text: "ClipTools recognises the platform and content type instantly, right in your browser." },
      { icon: "download", title: "Choose a format", text: "Pick MP4 video or MP3 audio where an authorized download option is available." },
    ]
  : [
      { icon: "upload", title: "Upload your video", text: "Drop in a video you own: MP4, MOV, WEBM, MKV, M4V or AVI." },
      { icon: "sparkles", title: "Choose quality & format", text: "Pick a resolution or an audio format, and switch on any enhancements you want." },
      { icon: "download", title: "Download", text: "Real progress while it works, then a download link. Files are deleted automatically." },
    ];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-surface/50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="How it works" title="Three simple steps" text="No sign-up, no clutter." />

        <ol className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-line bg-surface p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent-soft">
                  <Icon name={s.icon} className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-muted tabular-nums">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-semibold text-fg">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
