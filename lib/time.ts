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
