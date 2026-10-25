import { SectionHeading } from "./PlatformCards";

// Official, free-to-use resources. Always check each site's licence before use.
const libraries = [
  { name: "Pexels", text: "Free stock photos and videos.", href: "https://www.pexels.com/" },
  { name: "Unsplash", text: "High-quality free photos.", href: "https://unsplash.com/" },
  { name: "Pixabay", text: "Free images, videos and music.", href: "https://pixabay.com/" },
  { name: "YouTube Audio Library", text: "Free music for creators, in YouTube Studio.", href: "https://studio.youtube.com/" },
];

const brandKits = [
  { name: "YouTube brand resources", href: "https://www.youtube.com/howyoutubeworks/resources/brand-resources/" },
  { name: "Instagram brand resources", href: "https://about.meta.com/brand/resources/instagram/instagram-brand/" },
  { name: "X brand toolkit", href: "https://about.x.com/en/who-we-are/brand-toolkit" },
  { name: "Pinterest brand guidelines", href: "https://business.pinterest.com/brand-guidelines/" },
];

export default function CreativeAssets() {
  return (
    <section id="assets" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Creative assets"
        title="Free, licensed resources"
        text="Official sources for stock media and platform logos — downloaded directly from the people who own them."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {libraries.map((l) => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{l.name}</h3>
                <span className="text-slate-400 transition group-hover:text-indigo-600">↗</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-600">{l.text}</p>
            </a>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Official brand kits</h3>
          <p className="mt-1.5 text-sm text-slate-600">Logos and usage rules, straight from each platform.</p>
          <ul className="mt-4 divide-y divide-slate-100">
            {brandKits.map((b) => (
              <li key={b.name}>
                <a
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-3 text-sm text-slate-700 hover:text-indigo-600"
                >
                  {b.name}
                  <span aria-hidden>↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        External sites open in a new tab. Always check the licence before using any asset.
      </p>
    </section>
  );
}