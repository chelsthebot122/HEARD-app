import type { Source } from "./data/library";
import type { UserLink } from "./types";

const SOCIAL = ["reddit.com", "x.com", "twitter.com", "instagram.com", "tiktok.com", "facebook.com", "threads.net", "youtube.com", "youtu.be", "tumblr.com", "snapchat.com", "discord.com", "bsky.app"];
const TRACKING = /^(utm_.+|fbclid|gclid|igshid|igsh|si|ref|ref_src|ref_url|share_id|mc_.+)$/i;

export const NOTE_MAX = 400;

export interface Cleaned {
  ok: boolean;
  url: string;
  host: string;
  social: boolean;
  error?: string;
}

/** Accepts anything a person might paste and returns a tidy https link, or says why not. */
export function cleanUrl(raw: string): Cleaned {
  const bad = (error: string): Cleaned => ({ ok: false, url: "", host: "", social: false, error });
  let t = raw.trim();
  if (!t) return bad("Paste a link first.");
  if (/\s/.test(t)) return bad("That looks like text, not a link. Paste just the address.");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) t = `https://${t}`;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return bad("That doesn't look like a web address.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return bad("Only web links (http or https) can be saved.");
  if (!u.hostname.includes(".")) return bad("That doesn't look like a web address.");
  if (u.username || u.password) return bad("Links with a username or password in them can't be saved.");
  for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
  u.hash = "";
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const social = SOCIAL.some((s) => host === s || host.endsWith(`.${s}`));
  return { ok: true, url: u.toString(), host, social };
}

export function linkToSource(l: UserLink): Source {
  return {
    id: `u-${l.id}`,
    type: l.kind,
    title: l.title,
    by: `Saved by you · ${l.host}`,
    publisher: l.host,
    url: l.url,
    topics: l.topics,
    minutes: 0,
    added: l.at.slice(0, 10),
    excerpt: l.note || "Your link.",
    body: l.note ? [l.note] : [],
    terms: "Only the link and your own note are kept here. The page itself stays where it was published, so it may change or disappear.",
    mine: true,
  };
}
