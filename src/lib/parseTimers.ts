export interface ParsedTimer {
  durationSeconds: number;
  label: string;
}

/**
 * Parse Hebrew time expressions from instruction text.
 * Handles patterns like: "5 דקות", "רבע שעה", "חצי שעה", "10 דקות", "שעה", "דקה"
 */
export function parseTimersFromText(text: string): ParsedTimer[] {
  const timers: ParsedTimer[] = [];
  const seen = new Set<number>();

  // Number + דקות/דקה
  const minuteRegex = /(\d+)\s*דקו?ת/g;
  let match: RegExpExecArray | null;
  while ((match = minuteRegex.exec(text)) !== null) {
    const mins = parseInt(match[1], 10);
    if (mins > 0 && mins <= 180 && !seen.has(mins * 60)) {
      seen.add(mins * 60);
      timers.push({ durationSeconds: mins * 60, label: `${mins} דקות` });
    }
  }

  // Number + שעות/שעה
  const hourRegex = /(\d+)\s*שעו?ת/g;
  while ((match = hourRegex.exec(text)) !== null) {
    const hrs = parseInt(match[1], 10);
    const secs = hrs * 3600;
    if (hrs > 0 && hrs <= 5 && !seen.has(secs)) {
      seen.add(secs);
      timers.push({ durationSeconds: secs, label: `${hrs} שעות` });
    }
  }

  // "רבע שעה"
  if (/רבע\s*שעה/.test(text) && !seen.has(900)) {
    seen.add(900);
    timers.push({ durationSeconds: 900, label: "רבע שעה" });
  }

  // "חצי שעה"
  if (/חצי\s*שעה/.test(text) && !seen.has(1800)) {
    seen.add(1800);
    timers.push({ durationSeconds: 1800, label: "חצי שעה" });
  }

  // Standalone "שעה" (not preceded by a number or חצי/רבע)
  if (/(?<![\dרבעחצי]\s?)שעה(?!\s*ו)/.test(text) && !seen.has(3600)) {
    seen.add(3600);
    timers.push({ durationSeconds: 3600, label: "שעה" });
  }

  // Standalone "דקה" (not preceded by a number)
  if (/(?<!\d\s?)דקה(?!\s*ו)/.test(text) && !seen.has(60)) {
    seen.add(60);
    timers.push({ durationSeconds: 60, label: "דקה" });
  }

  return timers;
}
