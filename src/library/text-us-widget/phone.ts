/** Phone number helpers for the Text-Us Widget: a small country list, live formatting, validation and E.164. */

export interface Country {
  /** ISO 3166 code, e.g. "US". */
  code: string;
  name: string;
  flag: string;
  /** Dial code without the plus, e.g. "44". */
  dial: string;
  /** Prefix dialled before a national number ("0" in most countries, "1" in North America). */
  trunk?: string;
  /** How the national number (without trunk prefix) is grouped, e.g. [4, 6]. */
  groups: number[];
  /** North American style: (201) 555-0123. */
  nanp?: boolean;
  /** What a valid mobile number looks like, national number only. */
  pattern: RegExp;
  /** A sample national number, used as the placeholder and in the error message. */
  example: string;
}

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", dial: "1", trunk: "1", groups: [3, 3, 4], nanp: true, pattern: /^[2-9]\d{2}[2-9]\d{6}$/, example: "2015550123" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "1", trunk: "1", groups: [3, 3, 4], nanp: true, pattern: /^[2-9]\d{2}[2-9]\d{6}$/, example: "4165550123" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "44", trunk: "0", groups: [4, 6], pattern: /^7\d{9}$/, example: "7700900123" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", dial: "353", trunk: "0", groups: [2, 3, 4], pattern: /^8[3-9]\d{7}$/, example: "831234567" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "61", trunk: "0", groups: [3, 3, 3], pattern: /^4\d{8}$/, example: "412345678" },
  { code: "IN", name: "India", flag: "🇮🇳", dial: "91", trunk: "0", groups: [5, 5], pattern: /^[6-9]\d{9}$/, example: "9876543210" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", dial: "880", trunk: "0", groups: [4, 6], pattern: /^1[3-9]\d{8}$/, example: "1712345678" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dial: "971", trunk: "0", groups: [2, 3, 4], pattern: /^5\d{8}$/, example: "501234567" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", dial: "63", trunk: "0", groups: [3, 3, 4], pattern: /^9\d{9}$/, example: "9171234567" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dial: "27", trunk: "0", groups: [2, 3, 4], pattern: /^[6-8]\d{8}$/, example: "821234567" },
];

export interface ParsedPhone {
  country: Country;
  /** National significant number: digits only, no trunk prefix, no dial code. */
  nsn: string;
  /** What the input should show: formatted as typed (national, or international if it started with +). */
  display: string;
  valid: boolean;
  /** "+447700900123" */
  e164: string;
  /** Readable international form, "+44 7700 900123". */
  pretty: string;
}

const dialable = (s: string) => s.replace(/[^\d+]/g, "");
/** How many digits (and a leading +) sit in this string. Used to put the caret back after formatting. */
export const countDialable = (s: string) => dialable(s).length;
export const sameDigits = (a: string, b: string) => dialable(a) === dialable(b);

/** Index just after the n-th digit (or +) in the formatted string. */
export function caretAt(display: string, n: number): number {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < display.length; i++) {
    if (/[\d+]/.test(display[i]) && ++seen === n) return i + 1;
  }
  return display.length;
}

/** Split digits into the country's groups; the last group takes anything left over. */
function grouped(nsn: string, c: Country, national: boolean): string {
  if (national && c.nanp) {
    if (nsn.length <= 3) return nsn;
    const rest = nsn.slice(6);
    return `(${nsn.slice(0, 3)}) ${nsn.slice(3, 6)}${rest ? `-${rest}` : ""}`;
  }
  const out: string[] = [];
  let i = 0;
  c.groups.forEach((g, k) => {
    const part = k === c.groups.length - 1 ? nsn.slice(i) : nsn.slice(i, i + g);
    if (part) out.push(part);
    i += g;
  });
  return out.join(" ");
}

const maxLen = (c: Country) => c.groups.reduce((a, b) => a + b, 0);

/**
 * Read whatever the visitor typed or pasted. A leading + switches to the matching country
 * (staying on the current one when it shares the dial code, like US and Canada).
 */
export function parsePhone(input: string, current: Country, list: Country[]): ParsedPhone {
  let digits = input.replace(/\D/g, "");
  let country = current;
  let display: string;
  let nsn: string;
  if (input.trim().startsWith("+")) {
    const match = digits.startsWith(current.dial) ? current : [...list].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial));
    if (!match) {
      const head = `+${digits.slice(0, 3)}`;
      return { country, nsn: "", display: head, valid: false, e164: "", pretty: head };
    }
    country = match;
    nsn = digits.slice(match.dial.length, match.dial.length + maxLen(match));
    display = `+${match.dial}${nsn ? ` ${grouped(nsn, match, false)}` : ""}`;
  } else {
    let trunk = "";
    if (country.trunk && digits.startsWith(country.trunk)) {
      trunk = country.trunk;
      digits = digits.slice(trunk.length);
    }
    nsn = digits.slice(0, maxLen(country));
    const body = grouped(nsn, country, true);
    display = trunk + (trunk && (country.nanp || trunk.length > 1) && body ? " " : "") + body;
  }
  return {
    country,
    nsn,
    display,
    valid: country.pattern.test(nsn),
    e164: nsn ? `+${country.dial}${nsn}` : "",
    pretty: `+${country.dial} ${grouped(nsn, country, false)}`.trim(),
  };
}

/** The example number in national format, e.g. "07700 900123". */
export function exampleFor(c: Country): string {
  return parsePhone((c.nanp ? "" : (c.trunk ?? "")) + c.example, c, [c]).display;
}

/** Dark text on light colours, white on dark ones, so any hex accent stays readable. Other colours get dark text. */
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
