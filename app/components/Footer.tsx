import { SHOW_SOCIAL_LINK_TOOLS } from "../lib/features";
import { Logo } from "./Navbar";

export default function Footer() {
  const product = [
    SHOW_SOCIAL_LINK_TOOLS ? { href: "#tools", label: "Tools" } : { href: "#top", label: "Converter" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#assets", label: "Creative assets" },
  ];

  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            A clean, modern toolkit for converting and enhancing your own media, built responsibly.
          </p>
        </div>

        <div className="flex gap-16 text-sm">
          <div className="space-y-3">
            <p className="font-semibold text-fg">Product</p>
            {product.map((l) => (
              <a key={l.href} href={l.href} className="block text-muted transition hover:text-fg">
                {l.label}
              </a>
            ))}
          </div>
          <div className="space-y-3">
            <p className="font-semibold text-fg">Help</p>
            <a href="#faq" className="block text-muted transition hover:text-fg">
              FAQ
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted sm:px-6">
          © 2026 ClipTools. Not affiliated with YouTube, Instagram, X or Pinterest. All trademarks belong to their owners.
        </p>
      </div>
    </footer>
  );
}
