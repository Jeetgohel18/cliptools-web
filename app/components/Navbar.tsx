"use client";

import { useState } from "react";
import { SHOW_SOCIAL_LINK_TOOLS } from "../lib/features";
import { buttonClass } from "./ui/controls";

const links = [
  ...(SHOW_SOCIAL_LINK_TOOLS ? [{ href: "#tools", label: "Tools" }] : []),
  { href: "#how-it-works", label: "How it works" },
  { href: "#assets", label: "Creative assets" },
  { href: "#faq", label: "FAQ" },
];

export function Logo() {
  return (
    <a
      href="#top"
      className="flex items-center gap-2.5 rounded-lg font-semibold tracking-tight text-fg focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none"
    >
      <span className="bg-brand grid h-8 w-8 place-items-center rounded-[10px] shadow-lg shadow-accent/25">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden="true">
          <path d="M8 5.5v13l10.5-6.5z" />
        </svg>
      </span>
      ClipTools
    </a>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-50 border-b border-line/70">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-fg">
              {l.label}
            </a>
          ))}
          <a href="#top" className={buttonClass("primary", "sm", "ml-3 rounded-full px-4")}>
            {SHOW_SOCIAL_LINK_TOOLS ? "Paste a link" : "Upload a video"}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-fg md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-line px-4 py-3 md:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-muted hover:bg-white/5 hover:text-fg">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
