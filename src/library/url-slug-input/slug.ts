/** Pure helpers that turn text into a clean web address. No React here, so they are easy to test and reuse. */

/** Small words that "Remove small words" drops from a slug. */
export const DEFAULT_STOP_WORDS = ["a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "for", "with", "by", "from", "is", "are"];

/** Letters that don't split into "plain letter + accent", spelled out by hand. */
const SPELLED: Record<string, string> = { ß: "ss", æ: "ae", œ: "oe", ø: "o", đ: "d", ð: "d", þ: "th", ł: "l", ı: "i", ħ: "h", ŋ: "n" };

export interface SlugOptions {
  /** Word that replaces "&", e.g. "and" or "et". */
  and: string;
  removeStopWords: boolean;
  stopWords: string[];
  maxLength: number;
}

/** Lower-case, plain letters and digits joined by single dashes. Edge dashes are kept, so it also works mid-typing. */
export function toSlugChars(text: string, and: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ` ${and.toLowerCase()} `)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[ßæœøđðþłıħŋ]/g, (c) => SPELLED[c] ?? "")
    .replace(/['’ʼ`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-");
}

export const trimDashes = (s: string) => s.replace(/^-+|-+$/g, "");

/** Cut to `max` characters at a dash, never in the middle of a word (unless one word alone is longer than max). */
export function cutAtWord(slug: string, max: number): string {
  if (slug.length <= max) return slug;
  const i = slug.slice(0, max + 1).lastIndexOf("-");
  return i > 0 ? slug.slice(0, i) : slug.slice(0, max);
}

/** Drop small words, unless that would leave nothing. */
function dropStopWords(slug: string, stopWords: string[]): string {
  const stop = new Set(stopWords);
  const kept = slug.split("-").filter((w) => !stop.has(w));
  return kept.length ? kept.join("-") : slug;
}

/** The full title-to-slug pipeline. */
export function slugify(text: string, o: SlugOptions): string {
  let s = trimDashes(toSlugChars(text, o.and));
  if (o.removeStopWords) s = dropStopWords(s, o.stopWords);
  return trimDashes(cutAtWord(s, o.maxLength));
}

/** What the slug box accepts while someone types in it: same clean-up, but a trailing dash may stay until they leave the box. */
export function sanitizeTyping(raw: string, and: string, max: number): string {
  return toSlugChars(raw, and).replace(/^-+/, "").slice(0, max);
}

/** Append a suffix without going over max: the base is shortened at a word break first. */
function withSuffix(base: string, suffix: string | number, max: number): string {
  const sfx = String(suffix);
  return `${trimDashes(cutAtWord(base, Math.max(1, max - sfx.length - 1)))}-${sfx}`;
}

/** Free-address ideas for a taken slug: add the year, a shorter version without small words, then -2 and -3. */
export function defaultSuggestions(slug: string, o: { year: number; stopWords: string[]; maxLength: number }): string[] {
  const out: string[] = [];
  if (!/(^|-)\d{4}$/.test(slug)) out.push(withSuffix(slug, o.year, o.maxLength));
  const words = slug.split("-");
  const short = dropStopWords(slug, o.stopWords);
  if (short !== slug) out.push(short);
  else if (words.length > 2) out.push(words.slice(0, -1).join("-"));
  const m = slug.match(/^(.+)-(\d{1,2})$/);
  const base = m ? m[1] : slug;
  const n = m ? Number(m[2]) + 1 : 2;
  out.push(withSuffix(base, n, o.maxLength), withSuffix(base, n + 1, o.maxLength));
  return out;
}

/** Tidy a list of ideas: clean each one, cap its length, drop blanks, repeats and the slug itself. */
export function cleanSuggestions(list: string[], slug: string, and: string, max: number): string[] {
  const seen = new Set([slug]);
  const out: string[] = [];
  for (const raw of list) {
    const s = trimDashes(cutAtWord(trimDashes(toSlugChars(raw, and)), max));
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}
