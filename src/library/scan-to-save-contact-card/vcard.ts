/** vCard 3.0 (RFC 2426) builder for the contact card: escaping, CRLF line ends and UTF-8 safe folding. */

export interface ContactPhone {
  number: string;
  type?: "cell" | "work" | "home";
}

export interface ContactEmail {
  address: string;
  type?: "work" | "home";
}

export interface ContactAddress {
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

export interface Contact {
  firstName: string;
  lastName?: string;
  middleName?: string;
  prefix?: string;
  suffix?: string;
  org?: string;
  title?: string;
  phones?: ContactPhone[];
  emails?: ContactEmail[];
  website?: string;
  address?: ContactAddress;
  note?: string;
  /** Public https URL of a photo. Shown on the card and added to the downloaded file. */
  photoUrl?: string;
}

/** Escape a text value: backslash, newline, comma and semicolon. */
export function escapeValue(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

const utf8Len = (ch: string) => new TextEncoder().encode(ch).length;

/**
 * Fold a content line to at most 75 octets per physical line (CRLF + one space before each continuation).
 * Splits only between whole characters, so multi-byte UTF-8 letters and emoji are never cut in half.
 */
export function foldLine(line: string, limit = 75): string {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = utf8Len(ch);
    // continuation lines start with a space, which counts toward the limit
    const max = out.length === 0 ? limit : limit - 1;
    if (bytes + n > max) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export const fullName = (c: Contact) =>
  [c.prefix, c.firstName, c.middleName, c.lastName, c.suffix].filter((p) => p && p.trim()).join(" ").trim();

export const initials = (c: Contact) =>
  ((c.firstName?.trim()[0] ?? "") + (c.lastName?.trim()[0] ?? "")).toUpperCase() || "?";

/**
 * Build a vCard 3.0 string. `includePhoto: false` leaves the photo link out, which keeps a QR code small
 * (phone cameras do not fetch it anyway).
 */
export function buildVCard(c: Contact, opts: { includePhoto?: boolean } = {}): string {
  const { includePhoto = true } = opts;
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];
  const add = (name: string, value: string | undefined, raw = false) => {
    if (value && value.trim()) lines.push(`${name}:${raw ? value.trim() : escapeValue(value.trim())}`);
  };
  const parts = (xs: (string | undefined)[]) => xs.map((x) => escapeValue((x ?? "").trim())).join(";");

  lines.push(`N:${parts([c.lastName, c.firstName, c.middleName, c.prefix, c.suffix])}`);
  add("FN", fullName(c) || c.org || "Contact");
  add("ORG", c.org);
  add("TITLE", c.title);
  c.phones?.forEach((p) => {
    const type = p.type === "work" ? "WORK,VOICE" : p.type === "home" ? "HOME,VOICE" : "CELL";
    add(`TEL;TYPE=${type}`, p.number);
  });
  c.emails?.forEach((e) => add(`EMAIL;TYPE=INTERNET${e.type === "home" ? ",HOME" : e.type === "work" ? ",WORK" : ""}`, e.address));
  add("URL", c.website, true);
  const a = c.address;
  if (a && [a.street, a.city, a.region, a.postalCode, a.country].some((x) => x && x.trim())) {
    lines.push(`ADR;TYPE=WORK:;;${parts([a.street, a.city, a.region, a.postalCode, a.country])}`);
  }
  add("NOTE", c.note);
  if (includePhoto) add("PHOTO;VALUE=URI", c.photoUrl, true);
  lines.push("END:VCARD");
  return lines.map((l) => foldLine(l)).join("\r\n") + "\r\n";
}

/** A safe file name for the download, e.g. "maya-ortiz.vcf". */
export function vcfFileName(c: Contact): string {
  const base = fullName(c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "contact"}.vcf`;
}
