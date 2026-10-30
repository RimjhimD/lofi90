/**
 * Everything the bug report collects about the page, the picked element and what happened just before.
 * Plain DOM code, no React: selectors, readable element names, browser/OS from the user agent,
 * console + fetch + click capture (each returns its own undo), and the Markdown / JSON output.
 * Typed values are never read: form fields only ever contribute their label, never their value.
 */

export type Severity = "blocker" | "major" | "minor" | "cosmetic";
export type ItemKey = "page" | "element" | "screen" | "browser" | "time" | "console" | "network" | "breadcrumbs";
export const ITEM_KEYS: ItemKey[] = ["page", "element", "screen", "browser", "time", "console", "network", "breadcrumbs"];

export interface ConsoleEntry { level: "error" | "warn" | "rejection"; message: string; at: number }
export interface NetworkEntry { method: string; url: string; status: number; statusText: string; ms: number; at: number }
export interface Crumb { kind: "click" | "route"; label: string; at: number }
export interface Box { x: number; y: number; width: number; height: number }

export interface ReportContext {
  page?: { url: string; title: string };
  element?: { selector: string; label: string; text: string; rect: Box };
  screen?: { viewport: string; screen: string; pixelRatio: number; colorScheme: "light" | "dark" };
  browser?: { name: string; os: string; mobile: boolean; language: string; userAgent: string };
  time?: { iso: string; local: string; timeZone: string };
  console?: ConsoleEntry[];
  network?: NetworkEntry[];
  breadcrumbs?: Crumb[];
}

export interface BugReport {
  /** Local reference made when the dialog opened, e.g. "BR-K3F9QZ". */
  id: string;
  description: string;
  expected: string;
  severity: Severity;
  email?: string;
  context: ReportContext;
}

const FIELDS = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";
const clean = (s: string | null | undefined, max = 80) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
};
const quote = (v: string) => `"${v.replace(/["\\]/g, "\\$&")}"`;
// Generated ids change between builds or renders, so they make bad selectors: React useId (":r1:", "«r1»", "_R_cp975esnebbeilb_"),
// library prefixes (radix-, headlessui-, mui-…), long number runs, hex hashes and long letter+digit soup.
const GENERATED = [/[:«»]/, /^_?r_/i, /\d{4,}/, /^(radix|headlessui|mui|react-aria|rc|ember|ext-gen|yui|downshift)[-_]/i, /[a-f0-9]{8,}/i, /(?=[a-z_-]*\d)[a-z0-9]{10,}/i];
const stableId = (id: string) => !!id && !GENERATED.some((re) => re.test(id));

function unique(sel: string, doc: Document) {
  try {
    return doc.querySelectorAll(sel).length === 1;
  } catch {
    return false;
  }
}

/** Selectors that name this one element directly, best first. */
function anchors(el: Element): string[] {
  const tag = el.tagName.toLowerCase();
  const out: string[] = [];
  if (stableId(el.id)) out.push(`#${CSS.escape(el.id)}`);
  for (const a of ["data-testid", "data-test", "data-cy"]) {
    const v = el.getAttribute(a);
    if (v) out.push(`[${a}=${quote(v)}]`);
  }
  const name = el.getAttribute("aria-label");
  const role = el.getAttribute("role");
  if (name) out.push(role ? `[role=${quote(role)}][aria-label=${quote(name)}]` : `${tag}[aria-label=${quote(name)}]`);
  const field = el.getAttribute("name");
  if (field && el.matches("input, select, textarea, button")) out.push(`${tag}[name=${quote(field)}]`);
  return out;
}

/** One step of a path: the tag, plus :nth-of-type when siblings share it. */
function step(el: Element) {
  const tag = el.tagName.toLowerCase();
  const same = el.parentElement ? [...el.parentElement.children].filter((c) => c.tagName === el.tagName) : [];
  return same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(el) + 1})` : tag;
}

/**
 * A CSS selector that matches only this element on the page: id, then data-testid, then aria-label/role+name,
 * then an nth-of-type path that stops at the nearest uniquely named ancestor. Each try is checked with querySelectorAll.
 */
export function selectorFor(el: Element): string {
  const doc = el.ownerDocument;
  for (const a of anchors(el)) if (unique(a, doc)) return a;
  const parts: string[] = [];
  for (let node: Element | null = el; node && node !== doc.documentElement; node = node.parentElement) {
    if (node !== el) {
      const a = anchors(node).find((s) => unique(s, doc));
      if (a) {
        parts.unshift(a);
        return parts.join(" > ");
      }
    }
    parts.unshift(step(node));
    const sel = parts.join(" > ");
    if (unique(sel, doc)) return sel;
  }
  return parts.join(" > ");
}

const ROLES: Record<string, string> = {
  A: "link", BUTTON: "button", SELECT: "dropdown", TEXTAREA: "text box", IMG: "image", NAV: "navigation", FORM: "form",
  LABEL: "label", LI: "list item", UL: "list", OL: "list", TABLE: "table", TR: "row", TD: "cell", SUMMARY: "disclosure", DIALOG: "dialog",
  H1: "heading", H2: "heading", H3: "heading", H4: "heading", H5: "heading", H6: "heading", P: "text", SECTION: "section", HEADER: "header", FOOTER: "footer",
};
const INPUT_ROLES: Record<string, string> = { checkbox: "checkbox", radio: "radio button", range: "slider", submit: "button", button: "button", reset: "button", search: "search box" };

function roleOf(el: Element) {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit;
  if (el.tagName === "INPUT") return INPUT_ROLES[(el as HTMLInputElement).type] ?? "text box";
  return ROLES[el.tagName] ?? el.tagName.toLowerCase();
}

/** Visible text with every form field (and so every typed value) removed. */
export function safeText(el: Element, max = 120): string {
  if (el.matches(FIELDS)) return "";
  const copy = el.cloneNode(true) as Element;
  copy.querySelectorAll(FIELDS).forEach((f) => f.remove());
  // A space after every element so "Go" + "Go" reads as two words, not "GoGo".
  copy.querySelectorAll("*").forEach((n) => n.append(" "));
  return clean(copy.textContent, max);
}

function nameOf(el: Element): string {
  const doc = el.ownerDocument;
  const label = el.getAttribute("aria-label");
  if (label) return clean(label, 40);
  const by = el.getAttribute("aria-labelledby");
  if (by) return clean(by.split(/\s+/).map((id) => doc.getElementById(id)?.textContent ?? "").join(" "), 40);
  if (el instanceof HTMLImageElement) return clean(el.alt, 40);
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    const own = el.labels?.[0] ? safeText(el.labels[0], 40) : "";
    return own || clean(el.getAttribute("placeholder") ?? el.getAttribute("name"), 40);
  }
  return safeText(el, 40) || clean(el.getAttribute("title"), 40);
}

/** A readable name like: button "Apply coupon". */
export function describe(el: Element): string {
  const name = nameOf(el);
  return name ? `${roleOf(el)} "${name}"` : roleOf(el);
}

/** Browser and OS in words, from the user agent. */
export function readableAgent(ua: string): { name: string; os: string; mobile: boolean } {
  const m = (re: RegExp) => re.exec(ua);
  let b: RegExpExecArray | null;
  const name = (b = m(/Edg(?:A|iOS)?\/(\d+)/))
    ? `Edge ${b[1]}`
    : (b = m(/OPR\/(\d+)/))
      ? `Opera ${b[1]}`
      : (b = m(/SamsungBrowser\/(\d+)/))
        ? `Samsung Internet ${b[1]}`
        : (b = m(/(?:Firefox|FxiOS)\/(\d+)/))
          ? `Firefox ${b[1]}`
          : (b = m(/(?:Chrome|CriOS)\/(\d+)/))
            ? `Chrome ${b[1]}`
            : (b = m(/Version\/([\d.]+).*Safari/))
              ? `Safari ${b[1]}`
              : "Unknown browser";
  let o: RegExpExecArray | null;
  const os = (o = m(/(?:iPhone|iPad|iPod).*? OS (\d+)[_.](\d+)/))
    ? `iOS ${o[1]}.${o[2]}`
    : (o = m(/Android (\d+(?:\.\d+)?)/))
      ? `Android ${o[1]}`
      : m(/Windows NT 10/)
        ? "Windows 10/11"
        : m(/Windows/)
          ? "Windows"
          : (o = m(/Mac OS X (\d+)[_.](\d+)/))
            ? `macOS ${o[1]}.${o[2]}`
            : m(/CrOS/)
              ? "ChromeOS"
              : m(/Linux/)
                ? "Linux"
                : "Unknown OS";
  return { name, os, mobile: /Mobi|Android|iPhone|iPad/.test(ua) };
}

/** Keeps query parameter names but hides their values, since API URLs often carry tokens or emails. */
export function maskUrl(raw: string): string {
  try {
    const u = new URL(raw, location.href);
    const q = [...u.searchParams.keys()].map((k) => `${k}=…`).join("&");
    const base = u.origin === location.origin ? "" : u.origin !== "null" ? u.origin : `${u.protocol}//${u.host}`;
    return `${base}${u.pathname}${q ? "?" + q : ""}`;
  } catch {
    return raw.split("?")[0];
  }
}

/** Hides emails, JWTs, bearer tokens, key=value secrets and long random strings that pages often log. */
export function redact(s: string): string {
  return s
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]*/g, "[token]")
    .replace(/\b(bearer|basic)\s+[\w.~+/=-]+/gi, "$1 [token]")
    .replace(/\b(token|access_token|refresh_token|api[_-]?key|key|secret|password|passwd|pwd|auth|authorization|session|sid|cookie)(["']?\s*[:=]\s*["']?)[^\s"',&;}]+/gi, "$1$2[hidden]")
    .replace(/\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{24,}\b/g, "[hidden]");
}

const fmt = (args: unknown[]) =>
  redact(clean(
    args
      .map((a) => {
        if (a instanceof Error) return `${a.name}: ${a.message}`;
        if (typeof a === "string") return a.replace(/%c/g, "");
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(" "),
    400,
  ));

/** Records console.error / console.warn, uncaught errors and unhandled rejections. Returns the undo. */
export function captureConsole(push: (e: ConsoleEntry) => void): () => void {
  const orig = { error: console.error, warn: console.warn };
  let on = true;
  const wrap = (level: "error" | "warn") => {
    const original = orig[level];
    const w = (...args: unknown[]) => {
      if (on) push({ level, message: fmt(args), at: Date.now() });
      return original.apply(console, args);
    };
    console[level] = w;
    return w;
  };
  const we = wrap("error");
  const ww = wrap("warn");
  const onError = (e: ErrorEvent) => push({ level: "error", message: redact(clean(`${e.message}${e.filename ? ` (${maskUrl(e.filename)}:${e.lineno}:${e.colno})` : ""}`, 400)), at: Date.now() });
  const onReject = (e: PromiseRejectionEvent) => push({ level: "rejection", message: fmt(["Unhandled rejection:", e.reason]), at: Date.now() });
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onReject);
  return () => {
    on = false;
    // Only put the original back if nobody wrapped console after us; otherwise our wrapper just goes quiet.
    if (console.error === we) console.error = orig.error;
    if (console.warn === ww) console.warn = orig.warn;
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onReject);
  };
}

/** Wraps window.fetch and records responses that are not ok, plus network failures. Returns the undo. */
export function captureFetch(push: (e: NetworkEntry) => void): () => void {
  const orig = window.fetch;
  let on = true;
  const w: typeof fetch = async (input, init) => {
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const url = maskUrl(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const t0 = performance.now();
    try {
      const res = await orig.call(window, input, init);
      if (on && !res.ok) push({ method, url, status: res.status, statusText: res.statusText, ms: Math.round(performance.now() - t0), at: Date.now() });
      return res;
    } catch (err) {
      if (on && !(err instanceof DOMException && err.name === "AbortError")) push({ method, url, status: 0, statusText: "Network error", ms: Math.round(performance.now() - t0), at: Date.now() });
      throw err;
    }
  };
  window.fetch = w;
  return () => {
    on = false;
    if (window.fetch === w) window.fetch = orig;
  };
}

/** Records clicks inside `scope` and route changes (checked once a second and on back/forward). Returns the undo. */
export function captureTrail(scope: () => Element, ignore: () => Element | null, push: (c: Crumb) => void): () => void {
  let href = location.href;
  const route = () => {
    if (location.href === href) return;
    href = location.href;
    push({ kind: "route", label: maskUrl(href), at: Date.now() });
  };
  const onClick = (e: MouseEvent) => {
    const t = e.target;
    if (!(t instanceof Element) || !scope().contains(t) || ignore()?.contains(t)) return;
    push({ kind: "click", label: describe(t.closest("a, button, input, select, textarea, label, summary, [role], [data-testid]") ?? t), at: Date.now() });
  };
  document.addEventListener("click", onClick, true);
  window.addEventListener("popstate", route);
  window.addEventListener("hashchange", route);
  const id = window.setInterval(route, 1000);
  return () => {
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("popstate", route);
    window.removeEventListener("hashchange", route);
    clearInterval(id);
  };
}

/** Everything the report can carry, read at the moment the dialog opens. */
export function collect(el: Element | null, logs: { console: ConsoleEntry[]; network: NetworkEntry[]; breadcrumbs: Crumb[] }, fullUrl = false): ReportContext {
  const ua = navigator.userAgent;
  const r = el?.getBoundingClientRect();
  const now = new Date();
  return {
    // Query values are hidden unless asked for: page URLs often carry tokens, emails or reset codes.
    page: { url: fullUrl ? location.href : location.origin + maskUrl(location.href), title: document.title },
    element: el && r ? { selector: selectorFor(el), label: describe(el), text: safeText(el), rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } } : undefined,
    screen: {
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      screen: `${screen.width}×${screen.height}`,
      pixelRatio: Math.round(window.devicePixelRatio * 100) / 100,
      colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    },
    browser: { ...readableAgent(ua), language: navigator.language, userAgent: ua },
    time: { iso: now.toISOString(), local: now.toLocaleString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    console: logs.console.slice(-20),
    network: logs.network.slice(-10),
    breadcrumbs: logs.breadcrumbs.slice(-15),
  };
}

const hhmmss = (at: number) => new Date(at).toTimeString().slice(0, 8);

/** GitHub-issue-ready Markdown. `names` are the section titles (the item labels). */
export function toMarkdown(r: BugReport, names: Record<ItemKey, string> & { severity: string; environment: string; expected: string; happened: string }): string {
  const c = r.context;
  const out = [`## ${clean(r.description.split("\n")[0], 72) || "Bug report"}`, "", `**${names.severity}:** ${r.severity} · **Ref:** ${r.id}${r.email ? ` · **Reporter:** ${r.email}` : ""}`, "", `### ${names.happened}`, r.description.trim()];
  if (r.expected.trim()) out.push("", `### ${names.expected}`, r.expected.trim());
  if (c.element) {
    const e = c.element;
    out.push("", `### ${names.element}`, `- Selector: \`${e.selector}\``, `- Element: ${e.label}`);
    if (e.text) out.push(`- Text: ${e.text}`);
    out.push(`- Box: ${e.rect.width}×${e.rect.height} at (${e.rect.x}, ${e.rect.y})`);
  }
  const env: [string, string][] = [];
  if (c.page) env.push([names.page, `${c.page.url}${c.page.title ? ` (${c.page.title})` : ""}`]);
  if (c.browser) env.push([names.browser, `${c.browser.name} on ${c.browser.os}${c.browser.mobile ? " (mobile)" : ""}, ${c.browser.language}`]);
  if (c.screen) env.push([names.screen, `viewport ${c.screen.viewport}, screen ${c.screen.screen} @${c.screen.pixelRatio}x, ${c.screen.colorScheme} mode`]);
  if (c.time) env.push([names.time, `${c.time.local} (${c.time.timeZone}) · ${c.time.iso}`]);
  if (env.length) out.push("", `### ${names.environment}`, "| | |", "|---|---|", ...env.map(([k, v]) => `| ${k} | ${v.replace(/\|/g, "\\|")} |`));
  if (c.console?.length) out.push("", `### ${names.console} (${c.console.length})`, "```", ...c.console.map((e) => `${hhmmss(e.at)} [${e.level}] ${e.message}`), "```");
  if (c.network?.length) out.push("", `### ${names.network}`, ...c.network.map((n) => `- \`${n.method} ${n.url}\` → ${n.status || "failed"} ${n.statusText} (${n.ms} ms)`));
  if (c.breadcrumbs?.length) out.push("", `### ${names.breadcrumbs}`, ...c.breadcrumbs.map((b, i) => `${i + 1}. ${hhmmss(b.at)} ${b.kind === "route" ? "went to" : "clicked"} ${b.label}`));
  if (c.browser) out.push("", `<sub>${c.browser.userAgent}</sub>`);
  return out.join("\n");
}

/** Dark text on light colours, white on dark ones, so any hex accent stays readable. */
export function textOn(hex: string): string {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3,4}$/i.test(h)) h = [...h.slice(0, 3)].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(h)) return "#0B0D0C";
  const n = parseInt(h.slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.25 ? "#0B0D0C" : "#FFFFFF";
}

/** Does this keydown match a shortcut like "Alt+Shift+B"? */
export function matchesShortcut(e: KeyboardEvent, spec: string) {
  const parts = spec.toLowerCase().split("+").map((p) => p.trim());
  const key = parts.pop();
  if (!key) return false;
  if (e.altKey !== parts.includes("alt") || e.shiftKey !== parts.includes("shift") || e.ctrlKey !== (parts.includes("ctrl") || parts.includes("control")) || e.metaKey !== (parts.includes("meta") || parts.includes("cmd"))) return false;
  // e.code survives Alt/Option, which changes e.key on macOS.
  if (/^[a-z]$/.test(key)) return e.code === `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return e.code === `Digit${key}`;
  return e.key.toLowerCase() === key;
}

export const makeId = () => `BR-${Date.now().toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

/** Short lines that preview one attached item in the dialog. */
export function previewLines(c: ReportContext, k: ItemKey): string[] {
  if (k === "page") return [c.page!.url];
  if (k === "element") return [c.element!.label, c.element!.selector];
  if (k === "screen") return [`${c.screen!.viewport} · screen ${c.screen!.screen} @${c.screen!.pixelRatio}x · ${c.screen!.colorScheme}`];
  if (k === "browser") return [`${c.browser!.name} · ${c.browser!.os}${c.browser!.mobile ? " · mobile" : ""}`];
  if (k === "time") return [`${c.time!.local} (${c.time!.timeZone})`];
  if (k === "console") return c.console!.slice(-3).map((e) => `[${e.level}] ${e.message}`);
  if (k === "network") return c.network!.slice(-3).map((n) => `${n.method} ${n.url} → ${n.status || "failed"}`);
  return c.breadcrumbs!.slice(-4).map((b) => (b.kind === "route" ? `→ ${b.label}` : `• ${b.label}`));
}

/** A believable report for previews and docs, so the states grid never reads the real page. */
export const SAMPLE_CONTEXT: ReportContext = {
  page: { url: "https://staging.shop.example/checkout", title: "Checkout" },
  element: { selector: '[data-testid="apply-coupon"]', label: 'button "Apply coupon"', text: "Apply coupon", rect: { x: 312, y: 418, width: 132, height: 40 } },
  screen: { viewport: "1280×720", screen: "1920×1080", pixelRatio: 2, colorScheme: "dark" },
  browser: { name: "Chrome 141", os: "macOS 15.1", mobile: false, language: "en-US", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36" },
  time: { iso: "2026-10-29T09:14:02.000Z", local: "29/10/2026, 15:14:02", timeZone: "Asia/Dhaka" },
  console: [{ level: "error", message: "TypeError: Cannot read properties of undefined (reading 'discount')", at: 1793265240000 }],
  network: [{ method: "POST", url: "/api/coupons/apply", status: 500, statusText: "Internal Server Error", ms: 212, at: 1793265241000 }],
  breadcrumbs: [
    { kind: "route", label: "/checkout", at: 1793265200000 },
    { kind: "click", label: 'text box "Coupon code"', at: 1793265230000 },
    { kind: "click", label: 'button "Apply coupon"', at: 1793265240000 },
  ],
};
