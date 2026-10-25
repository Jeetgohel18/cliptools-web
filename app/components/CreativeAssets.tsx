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

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
    <path d="M8 16 16 8M9 8h7v7" />
  </svg>
);

export default function CreativeAssets() {
  return (
    <section id="assets" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="Creative assets"
        title="Free, licensed resources"
        text="Official sources for stock media and platform logos, straight from the people who own them."
      />

      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {libraries.map((l) => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-line-strong hover:bg-raised"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-fg">{l.name}</h3>
                <span className="text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-soft">
                  <Arrow />
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted">{l.text}</p>
            </a>
          ))}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="font-semibold text-fg">Official brand kits</h3>
          <p className="mt-1.5 text-sm text-muted">Logos and usage rules, straight from each platform.</p>
          <ul className="mt-4 divide-y divide-line">
            {brandKits.map((b) => (
              <li key={b.name}>
                <a
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-3 text-sm text-muted transition hover:text-fg"
                >
                  {b.name}
                  <Arrow />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted">External sites open in a new tab. Always check the licence before using any asset.</p>
    </section>
  );
}
