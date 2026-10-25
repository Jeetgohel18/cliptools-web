"use client";

import { useState } from "react";
import { SHOW_SOCIAL_LINK_TOOLS } from "../lib/features";

const links = [
  ...(SHOW_SOCIAL_LINK_TOOLS ? [{ href: "#tools", label: "Tools" }] : []),
  { href: "#how-it-works", label: "How it works" },
  { href: "#assets", label: "Creative assets" },
  { href: "#faq", label: "FAQ" },
];

export function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight text-slate-900">
      <span className="bg-brand grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white shadow-sm">
        C
      </span>
      ClipTools
    </a>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-slate-600 transition-colors hover:text-slate-900">
              {l.label}
            </a>
          ))}
          <a
            href="#top"
            className="bg-brand rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            {SHOW_SOCIAL_LINK_TOOLS ? "Paste a link" : "Upload a video"}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
