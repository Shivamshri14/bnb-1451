import { format, parse, parseISO } from "date-fns";

/** dd-MM-yyyy */
export function formatDateDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr || !String(dateStr).trim()) return "";
  try {
    const d = parseISO(String(dateStr).slice(0, 10));
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return format(d, "dd-MM-yyyy");
  } catch {
    return String(dateStr);
  }
}

/** Convert stored "HH:mm" / "H:mm" / "HH:mm:ss" to "h:mm a" (e.g. 10:00 AM). */
export function formatTimeAmPm(time?: string | null): string {
  if (!time || !String(time).trim()) return "";
  const raw = String(time).trim();

  // Already has AM/PM
  if (/\b(am|pm)\b/i.test(raw)) return raw;

  const normalized = raw.length === 5 ? raw : raw.slice(0, 5);
  try {
    const d = parse(normalized, "HH:mm", new Date());
    if (Number.isNaN(d.getTime())) return raw;
    return format(d, "h:mm a");
  } catch {
    return raw;
  }
}

export function formatSlotAmPm(start?: string | null, end?: string | null): string {
  const s = formatTimeAmPm(start);
  const e = formatTimeAmPm(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} → ${e}`;
}

export function formatDateTimeAmPm(dateStr?: string | null, timeStr?: string | null): string {
  const d = formatDateDDMMYYYY(dateStr);
  const t = formatTimeAmPm(timeStr);
  if (d && t) return `${d} ${t}`;
  return d || t;
}

/** Parse user input date string to yyyy-MM-dd.
 * Supports:
 * - DD-MM-YYYY (e.g. 13-08-2026)
 * - DD/MM/YYYY (e.g. 13/08/2026)
 * - DDMMYYYY (e.g. 13082026)
 * - YYYY-MM-DD (standard HTML date input)
 */
export function normalizeDateInput(val: string): string {
  if (!val) return "";
  const cleaned = val.replace(/\s+/g, "").trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const separatorMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (separatorMatch) {
    const [, d, m, y] = separatorMatch;
    const day = d.padStart(2, "0");
    const month = m.padStart(2, "0");
    return `${y}-${month}-${day}`;
  }

  // DDMMYYYY (8 digits)
  if (/^\d{8}$/.test(cleaned)) {
    const day = cleaned.slice(0, 2);
    const month = cleaned.slice(2, 4);
    const year = cleaned.slice(4, 8);
    return `${year}-${month}-${day}`;
  }

  return val;
}

