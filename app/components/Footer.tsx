import { SHOW_SOCIAL_LINK_TOOLS } from "../lib/features";
import { Logo } from "./Navbar";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-slate-600">
            A clean, modern toolkit for converting and enhancing your own media — built responsibly.
          </p>
        </div>

        <div className="flex gap-12 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-slate-900">Product</p>
            {SHOW_SOCIAL_LINK_TOOLS ? (
              <a href="#tools" className="block text-slate-600 hover:text-slate-900">Tools</a>
            ) : (
              <a href="#top" className="block text-slate-600 hover:text-slate-900">Converter</a>
            )}
            <a href="#how-it-works" className="block text-slate-600 hover:text-slate-900">How it works</a>
            <a href="#assets" className="block text-slate-600 hover:text-slate-900">Creative assets</a>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-slate-900">Help</p>
            <a href="#faq" className="block text-slate-600 hover:text-slate-900">FAQ</a>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500 sm:px-6">
          © 2026 ClipTools. Not affiliated with YouTube, Instagram, X or Pinterest. All
          trademarks belong to their owners.
        </p>
      </div>
    </footer>
  );
}
