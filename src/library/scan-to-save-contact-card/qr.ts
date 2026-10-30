/**
 * A small, complete QR Code encoder (ISO/IEC 18004, model 2) for the contact card.
 * Byte mode (UTF-8), error correction L/M/Q/H, versions 1 to 40 picked by length,
 * Reed–Solomon codewords, all eight masks scored with the standard penalty rules,
 * and format/version information. No dependencies.
 */

export type QrEcc = "L" | "M" | "Q" | "H";

export interface QrCode {
  version: number;
  size: number;
  ecc: QrEcc;
  mask: number;
  /** modules[row][col], true = dark. */
  modules: boolean[][];
}

const ECC_INDEX: Record<QrEcc, number> = { L: 0, M: 1, Q: 2, H: 3 };
/** The two format bits for each level, as they are written into the symbol. */
const ECC_FORMAT_BITS: Record<QrEcc, number> = { L: 1, M: 0, Q: 3, H: 2 };

// Index 0 is unused so the tables read by version number.
const ECC_PER_BLOCK = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];
const NUM_BLOCKS = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

/** Modules left for data and error correction once every function pattern is drawn. */
function rawDataModules(ver: number): number {
  let n = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2;
    n -= (25 * align - 10) * align - 55;
    if (ver >= 7) n -= 36;
  }
  return n;
}

const dataCodewords = (ver: number, ecc: QrEcc) =>
  Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[ECC_INDEX[ecc]][ver] * NUM_BLOCKS[ECC_INDEX[ecc]][ver];

/** Byte-mode character count field width. */
const countBits = (ver: number) => (ver <= 9 ? 8 : 16);

/** Largest UTF-8 payload, in bytes, that fits at this level within maxVersion. */
export function qrCapacity(ecc: QrEcc = "M", maxVersion = 40): number {
  return Math.floor((dataCodewords(maxVersion, ecc) * 8 - 4 - countBits(maxVersion)) / 8);
}

// ---- Reed–Solomon over GF(2^8), polynomial 0x11D ----

function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): number[] {
  const out = new Array<number>(degree).fill(0);
  out[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < out.length; j++) {
      out[j] = gfMul(out[j], root);
      if (j + 1 < out.length) out[j] ^= out[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return out;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const out = new Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (out.shift() as number);
    out.push(0);
    divisor.forEach((coef, i) => (out[i] ^= gfMul(coef, factor)));
  }
  return out;
}

// ---- Codewords ----

function utf8(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function buildCodewords(bytes: number[], ver: number, ecc: QrEcc): number[] {
  const capacity = dataCodewords(ver, ecc) * 8;
  const bits: number[] = [];
  const put = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  put(0b0100, 4); // byte mode
  put(bytes.length, countBits(ver));
  bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, capacity - bits.length)); // terminator
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) put(pad, 8);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));

  // Split into blocks, add error correction to each, then interleave.
  const numBlocks = NUM_BLOCKS[ECC_INDEX[ecc]][ver];
  const eccLen = ECC_PER_BLOCK[ECC_INDEX[ecc]][ver];
  const raw = Math.floor(rawDataModules(ver) / 8);
  const numShort = numBlocks - (raw % numBlocks);
  const shortLen = Math.floor(raw / numBlocks);
  const divisor = rsDivisor(eccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
    k += dat.length;
    const ec = rsRemainder(dat, divisor);
    if (i < numShort) dat.push(0); // placeholder so all blocks line up; skipped below
    blocks.push(dat.concat(ec));
  }
  const out: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((blk, j) => {
      if (i !== shortLen - eccLen || j >= numShort) out.push(blk[i]);
    });
  }
  return out;
}

// ---- Matrix ----

function alignmentPositions(ver: number, size: number): number[] {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const step = Math.floor((ver * 8 + n * 3 + 5) / (n * 4 - 4)) * 2;
  const out = [6];
  for (let pos = size - 7; out.length < n; pos -= step) out.splice(1, 0, pos);
  return out;
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

class Matrix {
  m: boolean[][];
  fn: boolean[][];
  constructor(public size: number) {
    this.m = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    this.fn = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  }
  /** x = column, y = row. */
  set(x: number, y: number, dark: boolean) {
    this.m[y][x] = dark;
    this.fn[y][x] = true;
  }
}

function drawFunctionPatterns(mx: Matrix, ver: number) {
  const s = mx.size;
  for (let i = 0; i < s; i++) {
    mx.set(6, i, i % 2 === 0);
    mx.set(i, 6, i % 2 === 0);
  }
  // Finder patterns with their light separators.
  for (const [cx, cy] of [[3, 3], [s - 4, 3], [3, s - 4]]) {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < s && y >= 0 && y < s) mx.set(x, y, d !== 2 && d !== 4);
      }
  }
  const pos = alignmentPositions(ver, s);
  pos.forEach((ay, i) =>
    pos.forEach((ax, j) => {
      const corner = (i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0);
      if (corner) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mx.set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }),
  );
  drawFormat(mx, "M", 0); // reserve the area; the real bits are written after masking
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) === 1;
      const a = s - 11 + (i % 3);
      const b = Math.floor(i / 3);
      mx.set(a, b, dark);
      mx.set(b, a, dark);
    }
  }
}

function drawFormat(mx: Matrix, ecc: QrEcc, mask: number) {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const bit = (i: number) => ((bits >>> i) & 1) === 1;
  const s = mx.size;
  for (let i = 0; i <= 5; i++) mx.set(8, i, bit(i));
  mx.set(8, 7, bit(6));
  mx.set(8, 8, bit(7));
  mx.set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) mx.set(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) mx.set(s - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) mx.set(8, s - 15 + i, bit(i));
  mx.set(8, s - 8, true); // the dark module
}

function drawCodewords(mx: Matrix, data: number[]) {
  const s = mx.size;
  let i = 0;
  for (let right = s - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip the vertical timing column
    for (let v = 0; v < s; v++)
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? s - 1 - v : v;
        if (!mx.fn[y][x] && i < data.length * 8) {
          mx.m[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
  }
}

function applyMask(mx: Matrix, mask: number) {
  const f = MASKS[mask];
  for (let y = 0; y < mx.size; y++) for (let x = 0; x < mx.size; x++) if (!mx.fn[y][x] && f(x, y)) mx.m[y][x] = !mx.m[y][x];
}

const FINDER_LIKE = [
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
];

/** The four standard penalty rules; the mask with the lowest score is used. */
export function penalty(m: boolean[][]): number {
  const s = m.length;
  let score = 0;
  const lines: boolean[][] = [];
  for (let i = 0; i < s; i++) {
    lines.push(m[i]);
    lines.push(m.map((row) => row[i]));
  }
  for (const line of lines) {
    // Rule 1: five or more in a row of the same colour.
    let run = 1;
    for (let i = 1; i <= s; i++) {
      if (i < s && line[i] === line[i - 1]) run++;
      else {
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }
    }
    // Rule 3: patterns that look like a finder.
    for (let i = 0; i + 11 <= s; i++)
      for (const p of FINDER_LIKE) if (p.every((v, k) => (v === 1) === line[i + k])) score += 40;
  }
  // Rule 2: 2x2 blocks of one colour.
  for (let y = 0; y < s - 1; y++)
    for (let x = 0; x < s - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
    }
  // Rule 4: balance of dark and light.
  const dark = m.reduce((a, row) => a + row.filter(Boolean).length, 0);
  score += Math.floor(Math.abs((dark * 100) / (s * s) - 50) / 5) * 10;
  return score;
}

export class QrTooLongError extends Error {
  constructor(public bytes: number, public max: number) {
    super(`Text is ${bytes} bytes; the most a QR code can hold at this level is ${max}.`);
    this.name = "QrTooLongError";
  }
}

/**
 * Encode text (UTF-8, byte mode) as a QR code. The smallest version that fits is chosen.
 * Pass `mask` to force one of the eight masks; by default all are tried and the lowest penalty wins.
 */
export function encodeQr(text: string, opts: { ecc?: QrEcc; minVersion?: number; maxVersion?: number; mask?: number } = {}): QrCode {
  const { ecc = "M", minVersion = 1, maxVersion = 40, mask } = opts;
  const bytes = utf8(text);
  let ver = minVersion;
  for (; ; ver++) {
    if (ver > maxVersion) throw new QrTooLongError(bytes.length, qrCapacity(ecc, maxVersion));
    if (4 + countBits(ver) + bytes.length * 8 <= dataCodewords(ver, ecc) * 8) break;
  }
  const size = ver * 4 + 17;
  const codewords = buildCodewords(bytes, ver, ecc);
  const base = new Matrix(size);
  drawFunctionPatterns(base, ver);
  drawCodewords(base, codewords);

  let best: { mask: number; m: boolean[][]; score: number } | null = null;
  for (let k = 0; k < 8; k++) {
    if (mask !== undefined && k !== mask) continue;
    const mx = new Matrix(size);
    mx.m = base.m.map((r) => r.slice());
    mx.fn = base.fn;
    applyMask(mx, k);
    drawFormat(mx, ecc, k);
    const score = mask !== undefined ? 0 : penalty(mx.m);
    if (!best || score < best.score) best = { mask: k, m: mx.m, score };
  }
  const chosen = best as { mask: number; m: boolean[][] };
  return { version: ver, size, ecc, mask: chosen.mask, modules: chosen.m };
}

/** One SVG path for every dark module, offset by the quiet zone. Render with shape-rendering="crispEdges". */
export function qrPath(qr: QrCode, quiet = 4): string {
  let d = "";
  qr.modules.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }),
  );
  return d;
}
