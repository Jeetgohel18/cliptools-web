// Everything ClipTools knows about each supported platform,
// plus the function that recognises which platform a link belongs to.
// Recognising a link happens entirely in the browser: it never fetches the media.

export type PlatformId = "youtube" | "instagram" | "x" | "pinterest";

export interface Platform {
  id: PlatformId;
  name: string;
  badge: string; // short text shown in the coloured square
  badgeClass: string; // Tailwind classes for the coloured square
  description: string;
  linkTypes: string[];
  download: {
    status: "unavailable" | "not-configured";
    label: string;
    reason: string;
    officialOption: string;
  };
}

export const PLATFORMS: Platform[] = [
  {
    id: "youtube",
    name: "YouTube",
    badge: "YT",
    badgeClass: "bg-red-500/15 text-red-300",
    description: "Videos, Shorts and live replays.",
    linkTypes: ["youtube.com/watch", "youtu.be", "Shorts"],
    download: {
      status: "unavailable",
      label: "Not available",
      reason:
        "YouTube's Terms of Service and API Developer Policies don't allow third-party apps to download videos or extract their audio without YouTube's written approval.",
      officialOption:
        "Use YouTube Premium for offline viewing, or download videos you uploaded yourself from YouTube Studio.",
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    badge: "IG",
    badgeClass: "bg-pink-500/15 text-pink-300",
    description: "Reels, posts and IGTV videos.",
    linkTypes: ["Reels", "Posts", "IGTV"],
    download: {
      status: "not-configured",
      label: "Not configured",
      reason:
        "Instagram only gives apps media access through its official API, for professional (Business or Creator) accounts that log in and grant permission. This needs a Meta developer app and app review, and videos with licensed music can be withheld.",
      officialOption: "If this is your own post, upload the original video file below.",
    },
  },
  {
    id: "x",
    name: "X",
    badge: "X",
    badgeClass: "bg-white/10 text-fg",
    description: "Videos and GIFs from posts.",
    linkTypes: ["x.com", "twitter.com"],
    download: {
      status: "not-configured",
      label: "Not configured",
      reason:
        "X's official API needs a paid (pay-per-use) developer account, and any use must follow X's Developer Agreement and Policy. No X API credentials are configured.",
      officialOption: "If you posted this video, upload the original file below.",
    },
  },
  {
    id: "pinterest",
    name: "Pinterest",
    badge: "P",
    badgeClass: "bg-rose-500/15 text-rose-300",
    description: "Image and video pins.",
    linkTypes: ["Pins", "pin.it short links"],
    download: {
      status: "not-configured",
      label: "Not configured",
      reason:
        "Pinterest's API needs an approved developer app with user login (OAuth). Trial access only covers the app owner's own account, and scraping Pinterest is prohibited.",
      officialOption: "If this is your own Pin, upload the original video file below.",
    },
  },
];

export type DetectionResult =
  | {
      status: "recognized";
      platform: Platform;
      contentType: string;
      idLabel: string;
      contentId: string;
      singleItem: boolean; // false for profiles, channels, playlists and boards
      url: string;
    }
  | { status: "invalid"; message: string; platform?: Platform }
  | { status: "unsupported"; message: string };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const IG_CODE = /^[A-Za-z0-9_-]{5,64}$/;
const IG_USER = /^[A-Za-z0-9._]{1,30}$/;
const X_POST_ID = /^\d{1,20}$/;
const X_USER = /^[A-Za-z0-9_]{1,15}$/;
const PIN_ID = /^(?:.*--)?(\d{5,20})$/;
const PIN_SHORT = /^[A-Za-z0-9]{3,20}$/;

const YT_VIDEO_PATHS = new Map([
  ["shorts", "Short"],
  ["live", "Live stream"],
  ["embed", "Video"],
  ["v", "Video"],
]);
const IG_TYPES = new Map([
  ["p", "Post"],
  ["reel", "Reel"],
  ["reels", "Reel"],
  ["tv", "IGTV video"],
]);
const IG_RESERVED = new Set(["explore", "accounts", "direct", "stories", "about", "developer", "legal", "p", "reel", "reels", "tv"]);
const X_RESERVED = new Set(["home", "explore", "search", "notifications", "messages", "settings", "i", "compose", "login", "signup", "tos", "privacy", "hashtag"]);
const PIN_RESERVED = new Set(["search", "ideas", "today", "settings", "business", "pin", "_"]);

function isHost(host: string, domain: string) {
  return host === domain || host.endsWith("." + domain);
}

function getPlatform(id: PlatformId): Platform {
  return PLATFORMS.find((p) => p.id === id)!;
}

export function detectPlatform(input: string): DetectionResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { status: "invalid", message: "Please paste a link first." };
  }

  let url: URL;
  try {
    // Accept links pasted without "https://"
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return { status: "invalid", message: "That doesn't look like a valid link." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { status: "invalid", message: "Only web links (starting with https://) are supported." };
  }

  const host = url.hostname.toLowerCase();
  if (!host.includes(".")) {
    return { status: "invalid", message: "That doesn't look like a valid link." };
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const href = url.toString();
  const ok = (platform: Platform, contentType: string, idLabel: string, contentId: string, singleItem: boolean): DetectionResult => ({
    status: "recognized",
    platform,
    contentType,
    idLabel,
    contentId,
    singleItem,
    url: href,
  });

  // ---------- YouTube ----------
  if (isHost(host, "youtu.be") || isHost(host, "youtube.com") || isHost(host, "youtube-nocookie.com")) {
    const yt = getPlatform("youtube");
    const shortLink = isHost(host, "youtu.be");

    if (shortLink || parts[0] === "watch" || YT_VIDEO_PATHS.has(parts[0])) {
      const id = shortLink ? parts[0] : parts[0] === "watch" ? url.searchParams.get("v") : parts[1];
      const type = shortLink || parts[0] === "watch" ? "Video" : YT_VIDEO_PATHS.get(parts[0])!;
      if (!id || !YT_ID.test(id)) {
        return { status: "invalid", platform: yt, message: "This YouTube link doesn't contain a valid 11-character video ID." };
      }
      return ok(yt, type, "Video ID", id, true);
    }
    const list = url.searchParams.get("list");
    if (parts[0] === "playlist" && list) {
      return ok(yt, "Playlist", "Playlist ID", list, false);
    }
    if (parts[0]?.startsWith("@") && parts[0].length > 1) {
      return ok(yt, "Channel", "Handle", parts[0], false);
    }
    if (parts[0] === "channel" && parts[1]) {
      return ok(yt, "Channel", "Channel ID", parts[1], false);
    }
    return { status: "invalid", platform: yt, message: "This is a YouTube page, but not a link to a specific video, Short, playlist or channel." };
  }

  // ---------- Instagram ----------
  if (isHost(host, "instagram.com")) {
    const ig = getPlatform("instagram");
    // Supports /reel/CODE and /username/reel/CODE
    const typeIndex = IG_TYPES.has(parts[0]) ? 0 : IG_TYPES.has(parts[1]) ? 1 : -1;
    if (typeIndex >= 0) {
      const code = parts[typeIndex + 1];
      if (!code || !IG_CODE.test(code)) {
        return { status: "invalid", platform: ig, message: "This Instagram link is missing a valid post code." };
      }
      return ok(ig, IG_TYPES.get(parts[typeIndex])!, "Shortcode", code, true);
    }
    if (parts[0] === "stories") {
      return { status: "invalid", platform: ig, message: "Instagram Stories links aren't supported. Paste a link to a Reel or post." };
    }
    if (parts.length === 1 && IG_USER.test(parts[0]) && !IG_RESERVED.has(parts[0].toLowerCase())) {
      return ok(ig, "Profile", "Username", "@" + parts[0], false);
    }
    return { status: "invalid", platform: ig, message: "Paste a link to a specific Instagram Reel, post or profile." };
  }

  // ---------- X (Twitter) ----------
  if (isHost(host, "x.com") || isHost(host, "twitter.com")) {
    const x = getPlatform("x");
    // Supports /user/status/ID, /i/status/ID and /i/web/status/ID
    const statusIndex = parts.indexOf("status");
    if (statusIndex >= 0) {
      const id = parts[statusIndex + 1];
      if (!id || !X_POST_ID.test(id)) {
        return { status: "invalid", platform: x, message: "This X link doesn't contain a valid post ID." };
      }
      return ok(x, "Post", "Post ID", id, true);
    }
    if (parts.length === 1 && X_USER.test(parts[0]) && !X_RESERVED.has(parts[0].toLowerCase())) {
      return ok(x, "Profile", "Username", "@" + parts[0], false);
    }
    return { status: "invalid", platform: x, message: "Paste a link to a specific post or profile on X." };
  }

  // ---------- Pinterest ----------
  if (isHost(host, "pin.it")) {
    const pin = getPlatform("pinterest");
    if (!parts[0] || !PIN_SHORT.test(parts[0])) {
      return { status: "invalid", platform: pin, message: "This pin.it short link looks incomplete." };
    }
    return ok(pin, "Short link (not expanded)", "Short code", parts[0], true);
  }
  if (/(^|\.)pinterest\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host)) {
    const pin = getPlatform("pinterest");
    if (parts[0] === "pin") {
      const match = PIN_ID.exec(parts[1] ?? "");
      if (!match) {
        return { status: "invalid", platform: pin, message: "This Pinterest link doesn't contain a valid Pin ID." };
      }
      return ok(pin, "Pin", "Pin ID", match[1], true);
    }
    if (parts.length >= 1 && parts.length <= 2 && !PIN_RESERVED.has(parts[0].toLowerCase())) {
      return parts.length === 1
        ? ok(pin, "Profile", "Username", parts[0], false)
        : ok(pin, "Board", "Board", `${parts[0]}/${parts[1]}`, false);
    }
    return { status: "invalid", platform: pin, message: "Paste a link to a specific Pin, board or profile." };
  }

  return {
    status: "unsupported",
    message: `${host} isn't supported. ClipTools recognises YouTube, Instagram, X and Pinterest links.`,
  };
}
