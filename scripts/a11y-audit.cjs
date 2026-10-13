// A small accessibility audit that runs in a real browser (Playwright). It is NOT axe-core:
// it checks the same kinds of things (names, labels, contrast, ids, headings, landmarks, tap size)
// so problems show up even without internet. Also run the official axe DevTools or Lighthouse before launch.
//
// usage: node scripts/a11y-audit.cjs http://localhost:5173/ [outDir]
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:5173/";

/** Runs inside the page. Returns a list of {rule, where, detail}. */
function inPage() {
  const out = [];
  const add = (rule, el, detail) => out.push({ rule, where: describe(el), detail });
  const describe = (el) => {
    if (!el || !el.tagName) return "?";
    const t = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}${t ? ` "${t}"` : ""}`;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return false;
      if (e.getAttribute("aria-hidden") === "true") return false;
    }
    return true;
  };
  const text = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
  const nameOf = (el) => {
    const al = el.getAttribute("aria-label"); if (al && al.trim()) return al.trim();
    const lb = el.getAttribute("aria-labelledby");
    if (lb) { const t = lb.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean).map(text).join(" ").trim(); if (t) return t; }
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l && text(l)) return text(l); }
    const wrap = el.closest("label"); if (wrap && text(wrap)) return text(wrap);
    const imgs = [...el.querySelectorAll("svg[aria-label],img[alt]")].map((i) => i.getAttribute("aria-label") || i.getAttribute("alt")).join(" ").trim();
    const t = text(el).replace(/\s+/g, " ");
    if (t) return t;
    if (imgs) return imgs;
    const title = el.getAttribute("title"); if (title) return title;
    return "";
  };

  // --- document
  if (!document.documentElement.lang) add("html-lang", document.documentElement, "missing lang");
  if (!document.title.trim()) add("document-title", document.documentElement, "empty title");
  const mains = [...document.querySelectorAll("main,[role=main]")].filter(visible);
  if (mains.length !== 1) add("landmark-one-main", document.body, `${mains.length} main landmarks`);
  const h1s = [...document.querySelectorAll("h1")].filter(visible);
  if (h1s.length !== 1) add("page-has-one-h1", document.body, `${h1s.length} h1`);

  // --- names
  for (const el of document.querySelectorAll("button,[role=button]")) if (visible(el) && !nameOf(el)) add("button-name", el, "no accessible name");
  for (const el of document.querySelectorAll("a[href]")) if (visible(el) && !nameOf(el)) add("link-name", el, "no accessible name");
  for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea")) if (visible(el) && !nameOf(el) && !el.getAttribute("placeholder")) add("label", el, "form field has no label");
  for (const el of document.querySelectorAll("input,select,textarea")) if (visible(el) && !nameOf(el) && el.getAttribute("placeholder")) add("label-placeholder-only", el, "only a placeholder names this field");
  for (const el of document.querySelectorAll("svg[role=img]")) if (visible(el) && !el.getAttribute("aria-label")) add("svg-img-alt", el, "role=img without a label");
  for (const el of document.querySelectorAll("img")) if (visible(el) && !el.hasAttribute("alt")) add("image-alt", el, "missing alt");
  for (const el of document.querySelectorAll('[role=switch],[role=checkbox],[role=tab],[role=radio]')) if (visible(el) && !nameOf(el)) add("aria-role-name", el, "no name");

  // --- aria validity
  const ids = new Map();
  for (const el of document.querySelectorAll("[id]")) ids.set(el.id, (ids.get(el.id) || 0) + 1);
  for (const [id, n] of ids) if (n > 1) add("duplicate-id", document.getElementById(id), `id "${id}" used ${n} times`);
  for (const el of document.querySelectorAll("[aria-labelledby],[aria-describedby],[aria-controls]")) for (const a of ["aria-labelledby", "aria-describedby", "aria-controls"]) { const v = el.getAttribute(a); if (v) for (const id of v.split(/\s+/)) if (!document.getElementById(id)) add("aria-valid-attr-value", el, `${a} → missing #${id}`); }
  for (const el of document.querySelectorAll("[tabindex]")) if (Number(el.getAttribute("tabindex")) > 0) add("tabindex", el, "positive tabindex");
  for (const el of document.querySelectorAll("button *,a[href] *")) { const p = el.closest("button,a[href]"); if (el !== p && el.matches("button,a[href],[role=button],input,select,textarea") ) add("nested-interactive", el, "interactive inside interactive"); }
  for (const el of document.querySelectorAll("[role=button]")) if (el.closest("button,a[href]")) add("nested-interactive", el, "role=button inside a button or link");
  for (const el of document.querySelectorAll("[aria-hidden=true]")) if (el.querySelector("button,a[href],input,select,textarea,[tabindex]:not([tabindex='-1'])") && visible(el.parentElement || el)) { const f = [...el.querySelectorAll("button,a[href],input,select,textarea,[tabindex]")].find((x) => x.getAttribute("tabindex") !== "-1" && !x.disabled && getComputedStyle(x).visibility !== "hidden"); if (f) add("aria-hidden-focus", f, "focusable inside aria-hidden"); }

  // --- headings order
  let last = 0;
  for (const h of [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible)) { const l = Number(h.tagName[1]); if (last && l > last + 1) add("heading-order", h, `h${last} → h${l}`); last = l; }

  // --- target size (WCAG 2.5.8: 24px minimum) for controls that are not inline text links
  for (const el of document.querySelectorAll("button,[role=button],input:not([type=hidden]),select,[role=switch],summary")) {
    if (!visible(el) || el.disabled) continue;
    if (el.matches("input") && el.closest("label")) continue; // the whole label is the tap target
    const r = el.getBoundingClientRect(); if (r.width < 24 || r.height < 24) add("target-size", el, `${Math.round(r.width)}×${Math.round(r.height)}px`);
  }

  // --- colour contrast (text only; flags gradients/images as "manual")
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined || isNaN(p[3]) ? 1 : p[3] }; };
  const over = (top, bot) => { const a = top.a + bot.a * (1 - top.a); if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }; return { r: (top.r * top.a + bot.r * bot.a * (1 - top.a)) / a, g: (top.g * top.a + bot.g * bot.a * (1 - top.a)) / a, b: (top.b * top.a + bot.b * bot.a * (1 - top.a)) / a, a }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const bgOf = (el) => {
    let acc = { r: 0, g: 0, b: 0, a: 0 }; const chain = [];
    for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage && cs.backgroundImage !== "none") return null; const c = parse(cs.backgroundColor); if (c && c.a > 0) { chain.push(c); if (c.a >= 1) break; } }
    for (let i = chain.length - 1; i >= 0; i--) acc = over(chain[i], acc.a === 0 ? { r: 255, g: 255, b: 255, a: 1 } : acc);
    if (acc.a === 0) acc = { r: 255, g: 255, b: 255, a: 1 };
    return acc;
  };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!el || seen.has(el) || !visible(el)) continue; seen.add(el);
    if (el.closest("[disabled],[aria-disabled=true],script,style")) continue;
    const cs = getComputedStyle(el);
    let fg = parse(cs.color); if (!fg) continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
    if (op < 0.9) continue; // still fading in
    const bg = bgOf(el); if (!bg) { out.push({ rule: "color-contrast-manual", where: describe(el), detail: "background image or gradient" }); continue; }
    fg = over({ ...fg, a: fg.a * op }, bg);
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700; const large = px >= 24 || (px >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (ratio < need) add("color-contrast", el, `${ratio.toFixed(2)}:1, needs ${need}:1 (${px.toFixed(0)}px)`);
  }
  return out;
}

async function auditPage(page, label, all) {
  const res = await page.evaluate(inPage);
  for (const r of res) all.push({ label, ...r });
}

(async () => {
  const b = await chromium.launch();
  const all = [];
  const sizes = [[1440, 900, false], [390, 800, true]];
  for (const scheme of ["light", "dark"]) for (const [w, h, mobile] of sizes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, hasTouch: mobile, isMobile: mobile });
    await ctx.route(/fonts\./, (r) => r.abort());
    const page = await ctx.newPage(); page.on("pageerror", (e) => console.log("PAGEERR", e.message));
    const tag = `${scheme} ${w}px`;
    await page.goto(BASE); await page.waitForTimeout(500);
    for (let y = 0; y <= 9000; y += 600) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(120); }
    await page.waitForTimeout(900);
    await auditPage(page, `${tag} landing`, all);
    await page.goto(BASE + "#talk"); await page.reload(); await page.waitForTimeout(400);
    await auditPage(page, `${tag} welcome`, all);
    await page.getByRole("button", { name: /18 or older/ }).click(); await page.waitForTimeout(300);
    await auditPage(page, `${tag} talk`, all);
    await page.getByRole("button", { name: "Best friend went quiet" }).click(); await page.getByRole("button", { name: "Send" }).click(); await page.waitForTimeout(1800);
    await auditPage(page, `${tag} talk results`, all);
    await page.getByRole("button", { name: /Who to tell/ }).click(); await page.waitForTimeout(250); await auditPage(page, `${tag} talk who`, all);
    await page.getByRole("button", { name: /Words to use/ }).click(); await page.waitForTimeout(250); await auditPage(page, `${tag} talk words`, all);
    for (const t of ["library", "notes", "people", "plan", "help", "settings"]) { await page.evaluate((t) => { location.hash = t; }, t); await page.reload(); await page.waitForTimeout(450); await auditPage(page, `${tag} ${t}`, all); }
    // people: open a person, then the draft (a pop-up on phones)
    await page.evaluate(() => { location.hash = "people"; }); await page.reload(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Marisol/ }).first().click(); await page.waitForTimeout(500); await auditPage(page, `${tag} person`, all);
    await page.getByRole("button", { name: /Write to Marisol/ }).click(); await page.waitForTimeout(500); await auditPage(page, `${tag} draft`, all);
    await ctx.close();
  }
  await b.close();
  // collapse duplicates across views
  const byKey = new Map();
  for (const r of all) { const k = `${r.rule}|${r.where}|${r.detail}`; (byKey.get(k) || byKey.set(k, { ...r, labels: new Set() }).get(k)).labels.add(r.label); }
  const rows = [...byKey.values()].sort((a, b) => a.rule.localeCompare(b.rule));
  const byRule = {};
  for (const r of rows) (byRule[r.rule] ||= []).push(r);
  for (const [rule, list] of Object.entries(byRule)) { console.log(`\n## ${rule} (${list.length})`); for (const r of list.slice(0, 14)) console.log(`  ${r.where} — ${r.detail}  [${[...r.labels].slice(0, 3).join("; ")}${r.labels.size > 3 ? "; +" + (r.labels.size - 3) : ""}]`); if (list.length > 14) console.log(`  … ${list.length - 14} more`); }
  console.log(rows.length ? `\n${rows.length} distinct findings` : "\nno findings");
})();
