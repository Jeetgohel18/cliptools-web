// Small, consistent line-icon set (no icon library needed).

const PATHS = {
  upload: "M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15",
  download: "M12 4v11M7.5 10.5 12 15l4.5-4.5M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15",
  film: "M4.5 5h15v14h-15zM8 5v14M16 5v14M4.5 9H8M4.5 15H8M16 9h3.5M16 15h3.5",
  music: "M9 17.5V6l10-2v11.5M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 15.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  sparkles: "M11 3.5l1.6 4.4 4.4 1.6-4.4 1.6L11 15.5l-1.6-4.4L5 9.5l4.4-1.6zM18 14l.8 2.2 2.2.8-2.2.8L18 20l-.8-2.2-2.2-.8 2.2-.8z",
  check: "M5 12.5 9.5 17 19 7.5",
  alert: "M12 4.5 20.5 19h-17zM12 10v4M12 16.5v.01",
  info: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 11v5M12 8v.01",
  x: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  trash: "M4.5 7h15M10 11v5.5M14 11v5.5M6.5 7l.8 12h9.4l.8-12M9.5 7V4.5h5V7",
  refresh: "M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4",
  clock: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 7.5V12l3 2",
  file: "M13.5 3.5h-7v17h11v-13zM13.5 3.5v4h4",
  shield: "M12 3.5l7 2.8V12c0 4.3-3 7.3-7 8.5-4-1.2-7-4.2-7-8.5V6.3zM9 12l2 2 4-4",
  replace: "M4 7.5h12.5M13 4l3.5 3.5L13 11M20 16.5H7.5M11 13l-3.5 3.5L11 20",
  eyeOff: "M3.5 3.5l17 17M10.6 6.1A9 9 0 0 1 12 6c5 0 8.5 6 8.5 6a14 14 0 0 1-2.4 3M6.6 7.6C4.6 9 3.5 12 3.5 12s3.5 6 8.5 6a8 8 0 0 0 3.4-.8",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
