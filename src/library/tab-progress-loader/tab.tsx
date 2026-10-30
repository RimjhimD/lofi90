/**
 * The browser-tab side of the Tab Progress Loader: what the tab should show (title + icon), drawing that icon
 * on a canvas for the real favicon, the same icon as SVG for on-page previews, and saving / restoring the
 * page's own title and favicon. Nothing here touches the document at import time.
 */

export type TabIcon = { kind: "ring"; p: number } | { kind: "spin"; angle: number } | { kind: "wait" } | { kind: "done" } | { kind: "error" };

export interface TabColors {
  accent: string;
  done: string;
  error: string;
}

const DISC = "#121614";
const TRACK = "rgba(233,237,232,.24)";

/** Draw one icon on a 2D context sized `s` × `s`. */
function paint(ctx: CanvasRenderingContext2D, icon: TabIcon, c: TabColors, s: number) {
  const k = s / 32;
  ctx.clearRect(0, 0, s, s);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const disc = (fill: string) => {
    ctx.beginPath();
    ctx.arc(16 * k, 16 * k, 15 * k, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  if (icon.kind === "done") {
    disc(c.done);
    ctx.beginPath();
    ctx.moveTo(9.5 * k, 16.5 * k);
    ctx.lineTo(14 * k, 21 * k);
    ctx.lineTo(22.5 * k, 11.5 * k);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3.6 * k;
    ctx.stroke();
    return;
  }
  if (icon.kind === "error") {
    disc(c.error);
    ctx.beginPath();
    ctx.moveTo(16 * k, 9 * k);
    ctx.lineTo(16 * k, 17.5 * k);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3.8 * k;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(16 * k, 23 * k, 2.2 * k, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    return;
  }
  disc(DISC);
  ctx.beginPath();
  ctx.arc(16 * k, 16 * k, 10 * k, 0, Math.PI * 2);
  ctx.strokeStyle = TRACK;
  ctx.lineWidth = 5 * k;
  ctx.stroke();
  ctx.strokeStyle = c.accent;
  if (icon.kind === "ring" && icon.p > 0) {
    const start = -Math.PI / 2;
    ctx.beginPath();
    ctx.arc(16 * k, 16 * k, 10 * k, start, start + (Math.PI * 2 * Math.min(100, icon.p)) / 100);
    ctx.stroke();
  } else if (icon.kind === "spin") {
    const a = (icon.angle * Math.PI) / 180 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(16 * k, 16 * k, 10 * k, a, a + Math.PI * 0.6);
    ctx.stroke();
  } else if (icon.kind === "wait") {
    ctx.fillStyle = c.accent;
    for (const x of [10.5, 16, 21.5]) {
      ctx.beginPath();
      ctx.arc(x * k, 16 * k, 1.9 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

let canvas: HTMLCanvasElement | null = null;

/** The icon as a PNG data URL, drawn at 64 px so it stays sharp on high-density screens. */
export function iconDataUrl(icon: TabIcon, colors: TabColors): string {
  canvas ??= document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  paint(ctx, icon, colors, 64);
  return canvas.toDataURL("image/png");
}

/** The same icon as SVG, for the on-page mock tab. Mirrors `paint` shape for shape. */
export function TabIconSvg({ icon, colors, className = "" }: { icon: TabIcon | null; colors: TabColors; className?: string }) {
  const arc = (from: number, sweep: number) => {
    const p = (deg: number) => [16 + 10 * Math.cos(((deg - 90) * Math.PI) / 180), 16 + 10 * Math.sin(((deg - 90) * Math.PI) / 180)];
    const [x1, y1] = p(from);
    const [x2, y2] = p(from + Math.min(sweep, 359.9));
    return `M${x1} ${y1}A10 10 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`size-4 shrink-0 ${className}`}>
      {!icon ? (
        <rect x="4" y="4" width="24" height="24" rx="7" fill="var(--k-mute,#8A938D)" opacity=".55" />
      ) : icon.kind === "done" ? (
        <>
          <circle cx="16" cy="16" r="15" fill={colors.done} />
          <path d="M9.5 16.5 14 21l8.5-9.5" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : icon.kind === "error" ? (
        <>
          <circle cx="16" cy="16" r="15" fill={colors.error} />
          <path d="M16 9v8.5" stroke="#fff" strokeWidth="3.8" strokeLinecap="round" />
          <circle cx="16" cy="23" r="2.2" fill="#fff" />
        </>
      ) : (
        <>
          <circle cx="16" cy="16" r="15" fill={DISC} />
          <circle cx="16" cy="16" r="10" fill="none" stroke={TRACK} strokeWidth="5" />
          {icon.kind === "ring" && icon.p > 0 && <path d={arc(0, (360 * Math.min(100, icon.p)) / 100)} fill="none" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />}
          {icon.kind === "spin" && <path d={arc(icon.angle, 108)} fill="none" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />}
          {icon.kind === "wait" && [10.5, 16, 21.5].map((x) => <circle key={x} cx={x} cy="16" r="1.9" fill={colors.accent} />)}
        </>
      )}
    </svg>
  );
}

/* ---------- the real tab: save once, write, restore ---------- */

let saved: { title: string; links: { el: HTMLLinkElement; href: string }[]; added: HTMLLinkElement | null } | null = null;
let owner: symbol | null = null;

/** The page's own title, even while a loader has replaced it. */
export function pageTitle(): string {
  return saved?.title ?? document.title;
}

/** Show `title` and `iconHref` in the real browser tab. The page's own title and icons are saved the first time. */
export function writeTab(id: symbol, title: string, iconHref: string) {
  if (!saved) {
    const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')].map((el) => ({ el, href: el.getAttribute("href") ?? "" }));
    let added: HTMLLinkElement | null = null;
    if (!links.length) {
      added = document.createElement("link");
      added.rel = "icon";
      document.head.appendChild(added);
    }
    saved = { title: document.title, links, added };
  }
  owner = id;
  if (document.title !== title) document.title = title;
  if (!iconHref) return;
  for (const { el } of saved.links) if (el.isConnected) el.href = iconHref;
  if (saved.added) saved.added.href = iconHref;
}

/** Put the page's own title and icons back. Only the loader that wrote last may restore. */
export function restoreTab(id: symbol) {
  if (!saved || owner !== id) return;
  document.title = saved.title;
  for (const { el, href } of saved.links) if (el.isConnected) el.setAttribute("href", href);
  saved.added?.remove();
  saved = null;
  owner = null;
}

/* ---------- optional extras ---------- */

export const notifySupported = () => typeof window !== "undefined" && "Notification" in window;

/** Ask for notification permission. Call it from a click or key press: browsers ignore it otherwise. */
export async function askTabNotifications(): Promise<NotificationPermission | "unsupported"> {
  if (!notifySupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Show a system notification; clicking it brings this tab to the front. Fails quietly. */
export function notifyNow(title: string, body: string) {
  if (!notifySupported() || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, tag: "tab-progress-loader" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // Some mobile browsers only allow notifications from a service worker. The tab still shows ✓.
  }
}

/** A short, quiet two-note chime. Fails quietly when audio isn't allowed. */
export function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.14;
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.4);
    });
    window.setTimeout(() => void ctx.close(), 900);
  } catch {
    // no sound, no problem
  }
}
