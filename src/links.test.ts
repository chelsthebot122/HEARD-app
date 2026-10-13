import { cleanUrl } from "./links";
import { LIBRARY } from "./data/library";

let bad = 0;
const t = (n: string, ok: boolean) => { if (!ok) bad++; console.log(`${ok ? "ok  " : "FAIL"} ${n}`); };

t("empty is rejected", !cleanUrl("").ok);
t("text with spaces is rejected", !cleanUrl("this is not a link").ok);
t("javascript: is rejected", !cleanUrl("javascript:alert(1)").ok);
t("ftp is rejected", !cleanUrl("ftp://example.com/x").ok);
t("credentials in url are rejected", !cleanUrl("https://user:pw@example.com/x").ok);
t("bare word is rejected", !cleanUrl("localhost").ok);
t("scheme is added", cleanUrl("nimh.nih.gov/health").url === "https://nimh.nih.gov/health");
t("tracking params are stripped", cleanUrl("https://example.com/a?utm_source=x&id=7&fbclid=abc").url === "https://example.com/a?id=7");
t("fragment is stripped", !cleanUrl("https://example.com/a#section").url.includes("#"));
t("www is dropped from host", cleanUrl("https://www.example.com/a").host === "example.com");
t("reddit is flagged social", cleanUrl("https://www.reddit.com/r/x/comments/1/abc").social);
t("old reddit subdomain is flagged social", cleanUrl("https://old.reddit.com/r/x").social);
t("tiktok is flagged social", cleanUrl("https://vm.tiktok.com/abc").social);
t("nimh is not social", !cleanUrl("https://www.nimh.nih.gov/x").social);

// Every library entry has to link out and name its publisher and reuse position.
for (const s of LIBRARY) t(`library ${s.id} has url, publisher, terms`, !!s.url && !!s.publisher && !!s.terms && cleanUrl(s.url!).ok);
t("library ids are unique", new Set(LIBRARY.map((s) => s.id)).size === LIBRARY.length);

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
