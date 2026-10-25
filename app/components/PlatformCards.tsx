import { PLATFORMS } from "../lib/platforms";

export default function PlatformCards() {
  return (
    <section id="tools" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Tools"
        title="Built for the platforms you use"
        text="One input that understands links from four major platforms."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((p) => (
          <a
            key={p.id}
            href="#top"
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10"
          >
            <span className={`grid h-11 w-11 place-items-center rounded-xl text-sm font-bold ${p.badgeClass}`}>
              {p.badge}
            </span>
            <h3 className="mt-5 font-semibold text-slate-900">{p.name}</h3>
            <p className="mt-1.5 text-sm text-slate-600">{p.description}</p>

            <ul className="mt-4 space-y-1 text-xs text-slate-500">
              {p.linkTypes.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Link detection
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                Downloads: {p.download.label.toLowerCase()}
              </span>
            </div>

            <p className="mt-5 text-sm font-medium text-indigo-600 transition group-hover:translate-x-1">
              Paste a {p.name} link →
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-3 text-slate-600">{text}</p>
    </div>
  );
}
