// Geometry, number formatting and the speed/time-left estimator behind HourglassUploadLoader.

/** The glass, in a 100 x 160 box. The neck is at y = 80; each bulb is 64 units tall. */
export const GLASS = "M20 16 H80 C80 52 55 66 53 80 C55 94 80 108 80 144 H20 C20 108 45 94 47 80 C45 66 20 52 20 16 Z";
export const TOP_BULB = "M20 16 H80 C80 52 55 66 53 80 H47 C45 66 20 52 20 16 Z";
export const BOTTOM_BULB = "M47 80 H53 C55 94 80 108 80 144 H20 C20 108 45 94 47 80 Z";

const NECK = 80;
const BULB = 64;
/** A full top bulb is filled up to this distance from the neck, leaving air at the top. */
const FULL = 50;

const bez = (a: number, b: number, c: number, d: number, t: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;

/** CUM[s] = glass area between the neck and s units away from it. Built once from the bulb curve. */
const CUM: number[] = (() => {
  const half = new Array<number>(BULB + 1).fill(3);
  for (let i = 0; i <= 400; i++) {
    const t = i / 400;
    const s = Math.round(NECK - bez(80, 66, 52, 16, t));
    if (s >= 0 && s <= BULB) half[s] = bez(53, 55, 80, 80, t) - 50;
  }
  const cum = [0];
  for (let s = 1; s <= BULB; s++) cum.push(cum[s - 1] + half[s - 1] + half[s]);
  return cum;
})();

/** Distance from the neck at which the area from the neck reaches `area`. */
function reach(area: number) {
  const a = Math.max(0, Math.min(CUM[BULB], area));
  let s = 1;
  while (s < BULB && CUM[s] < a) s++;
  const lo = CUM[s - 1];
  return s - 1 + (CUM[s] === lo ? 0 : (a - lo) / (CUM[s] - lo));
}

/**
 * Sand surface heights for a progress of 0..1. The sand AREA, not its height, matches the bytes: the bulbs
 * narrow toward the neck, so equal heights would lie about how much is left.
 */
export function sandLevels(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const full = CUM[FULL];
  return {
    top: NECK - reach((1 - p) * full),
    bottom: NECK + reach(CUM[BULB] - p * full),
  };
}

export function formatBytes(n: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = Math.max(0, n);
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${i === 0 || v >= 10 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export const fill = (tpl: string, vars: Record<string, string | number>) => tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** Dark text on light colours, white on dark ones. Non-hex colours get dark text. */
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

export interface RateSnapshot {
  /** Smoothed bytes per second, or null before the first measurement. */
  speed: number | null;
  /** Smoothed seconds left, or null when unknown. */
  eta: number | null;
  /** True once there are enough samples to trust the numbers. */
  ready: boolean;
  /** True when no bytes have moved for a few seconds. */
  stalled: boolean;
}

export const EMPTY_RATE: RateSnapshot = { speed: null, eta: null, ready: false, stalled: false };

/** How fast old speed readings fade, in ms. */
const TAU = 2500;
const MIN_SAMPLES = 4;
const STALL_MS = 3000;

/**
 * Measures upload speed from (time, bytes sent) samples taken on a steady clock, smooths it with an
 * exponential moving average, and turns it into a time-left figure that counts down steadily and only
 * creeps up slowly when the line gets slower, so it never jumps around.
 */
export class RateMeter {
  private prev: { t: number; l: number } | null = null;
  private last = 0;
  private ema: number | null = null;
  private n = 0;
  private shown: number | null = null;
  private still = 0;

  private snap(): RateSnapshot {
    return { speed: this.ema, eta: this.shown, ready: this.n >= MIN_SAMPLES && !!this.ema && this.shown !== null, stalled: this.still >= STALL_MS };
  }

  reset() {
    this.prev = null;
    this.ema = null;
    this.n = 0;
    this.shown = null;
    this.still = 0;
    this.last = 0;
  }

  /** Start (or carry on) measuring. A smaller byte count than before means a fresh upload: start over. */
  resume(t: number, loaded: number) {
    if (loaded < this.last) this.reset();
    this.prev = { t, l: loaded };
    this.last = loaded;
    this.still = 0;
  }

  /** Stop measuring. The paused gap is never counted as slow. */
  pause() {
    this.prev = null;
  }

  sample(t: number, loaded: number, total: number): RateSnapshot {
    if (loaded < this.last) this.reset();
    this.last = loaded;
    if (!this.prev) {
      this.prev = { t, l: loaded };
      return this.snap();
    }
    const dt = t - this.prev.t;
    if (dt < 200) return this.snap();
    const inst = (Math.max(0, loaded - this.prev.l) / dt) * 1000;
    this.still = inst === 0 ? this.still + dt : 0;
    this.ema = this.ema === null ? inst : this.ema + (1 - Math.exp(-dt / TAU)) * (inst - this.ema);
    this.n++;
    this.prev = { t, l: loaded };
    if (total > 0 && this.ema > 0) {
      const raw = Math.max(0, total - loaded) / this.ema;
      if (this.shown === null) this.shown = raw;
      else {
        // Count down in real time, then lean toward the fresh estimate: quickly down, slowly up.
        const counted = Math.max(0, this.shown - dt / 1000);
        const gap = raw - counted;
        this.shown = gap < 0 ? counted + gap * 0.35 : counted + Math.min(gap * 0.25, Math.max(2, counted * 0.15));
      }
      if (loaded >= total) this.shown = 0;
    }
    return this.snap();
  }
}
