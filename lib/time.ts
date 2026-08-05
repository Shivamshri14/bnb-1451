import { format, parse } from "date-fns";

/** Convert stored "HH:mm" / "H:mm" / "HH:mm:ss" to "h:mm a" (e.g. 10:00 AM). */
export function formatTimeAmPm(time?: string | null): string {
  if (!time || !String(time).trim()) return "—";
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
  return `${formatTimeAmPm(start)} → ${formatTimeAmPm(end)}`;
}
