/**
 * Player-facing numbers. NIST SP 811 (Guide for the Use of the SI):
 * 10.5.2 decimal marker is a dot; values < 1 get a leading 0.
 * 10.5.3 never group with a comma; 5+ digits get a thin space every three.
 * 7.2 space between a value and a unit symbol (s, %). Degree marks sit tight.
 * Counts (Credit, hull, kills) are whole numbers.
 */
export const NIST_GAP = "\u2009";

function groupInt(digits: string): string {
  if (digits.length <= 4) return digits;
  const parts: string[] = [];
  for (let i = digits.length; i > 0; i -= 3) {
    parts.unshift(digits.slice(Math.max(0, i - 3), i));
  }
  return parts.join(NIST_GAP);
}

/** Whole quantity. 9999 stays plain. 12 345 uses a thin space. */
export function fmtCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const v = Math.round(n);
  const sign = v < 0 ? "-" : "";
  return sign + groupInt(String(Math.abs(v)));
}

/** Decimal with a leading zero when |n| < 1. No comma groups. */
export function fmtFixed(n: number, frac = 1): string {
  if (!Number.isFinite(n)) return "0";
  const sign = n < 0 ? "-" : "";
  const s = Math.abs(n).toFixed(Math.max(0, frac));
  const [w, f = ""] = s.split(".");
  const whole = groupInt(w);
  if (!f || /^0+$/.test(f)) return sign + whole;
  return `${sign}${whole}.${f}`;
}

/**
 * Value plus unit symbol. Thin space before s, %, etc.
 * Plane-angle marks (°, ′, ″) take no space.
 */
export function fmtQty(n: number, unit?: string, frac = 0): string {
  const body = frac > 0 ? fmtFixed(n, frac) : fmtCount(n);
  if (!unit) return body;
  if (unit === "°" || unit === "′" || unit === "″") return `${body}${unit}`;
  return `${body}${NIST_GAP}${unit}`;
}

/** @deprecated use fmtFixed. Kept for old calls. */
export function fmtRes(n: number, maxFrac = 6): string {
  return fmtFixed(n, maxFrac);
}

export const GOLD_NAME = "Credit";
export const FLUX_NAME = "Credit";

export function fmtGold(n: number): string {
  return fmtFlux(n);
}

export function fmtFlux(n: number): string {
  const v = Math.round(n);
  return v === 1 ? "1 credit" : `${fmtCount(v)} credits`;
}

/** @deprecated gold display — currency is `fmtFlux`. */
export const flux = fmtFlux;
