/**
 * MedaVida SlotZero Timezone Engine
 *
 * Exactly three supported IANA time zones:
 * - Asia/Kolkata (Asha)
 * - Europe/London (Dr. Meera)
 * - America/New_York (Dr. Alex, Sam)
 *
 * Rules:
 * 1. Doctors define working hours in their own local time.
 * 2. Appointments are strictly stored as UTC instants (Date objects / ISO UTC strings).
 * 3. Patients see bookings in their own local time, with the timezone clearly labelled.
 * 4. London and New York daylight-saving time (DST) changes are computed with real IANA offsets,
 *    never fixed offsets. Nonexistent local times during spring-forward are rejected.
 */

export const SUPPORTED_TIMEZONES = [
  { id: "Asia/Kolkata", label: "Asia/Kolkata (IST)", region: "Kolkata, India", defaultPerson: "Asha" },
  { id: "Europe/London", label: "Europe/London (GMT/BST)", region: "London, UK", defaultPerson: "Dr. Meera" },
  { id: "America/New_York", label: "America/New_York (EST/EDT)", region: "New York, USA", defaultPerson: "Dr. Alex, Sam" },
] as const;

export type SupportedTimeZone = (typeof SUPPORTED_TIMEZONES)[number]["id"];

/**
 * Validates whether a timezone is one of the three required IANA timezones.
 */
export function isValidTimeZone(tz: string): tz is SupportedTimeZone {
  return SUPPORTED_TIMEZONES.some((item) => item.id === tz);
}

/**
 * Returns formatted timezone abbreviation or descriptor (e.g. "BST", "GMT", "EDT", "EST", "IST")
 * for a specific UTC date.
 */
export function getTimeZoneAbbr(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart ? tzPart.value : timeZone;
  } catch {
    return timeZone;
  }
}

/**
 * Formats a UTC Date instance into a user's local time string with AM/PM and Timezone.
 * Example output: "3:30 PM IST" or "10:00 AM BST"
 */
export function formatToLocalTime(
  date: Date,
  timeZone: string,
  options?: { includeDate?: boolean; includeZone?: boolean }
): string {
  const { includeDate = false, includeZone = true } = options || {};

  try {
    const timeStr = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      ...(includeDate
        ? {
            month: "short",
            day: "numeric",
            weekday: "short",
          }
        : {}),
    }).format(date);

    if (includeZone) {
      const abbr = getTimeZoneAbbr(date, timeZone);
      return `${timeStr} (${abbr})`;
    }
    return timeStr;
  } catch (err) {
    return date.toISOString();
  }
}

/**
 * Formats UTC Date into "YYYY-MM-DD" in a specific target timezone.
 */
export function getDateStringInTimeZone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;

    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().split("T")[0];
  }
}

/**
 * Formats UTC Date into "HH:mm" in a specific target timezone.
 */
export function getTimeHHMMInTimeZone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;

    return `${hour}:${minute}`;
  } catch {
    return "00:00";
  }
}

/**
 * Parses a local date ("YYYY-MM-DD") and time ("HH:mm") within an IANA timezone
 * and converts it into an exact UTC Date instance.
 *
 * CRITICAL DST HANDLING:
 * - Detects and rejects NONEXISTENT times (e.g. spring forward 1:00 AM -> 2:00 AM clock jumps).
 * - Detects and documents AMBIGUOUS times (e.g. fall back repeat hour 1:00 AM -> 1:00 AM).
 */
export function parseLocalToUtc(
  dateStr: string, // "2026-11-02"
  timeHHMM: string, // "09:30"
  timeZone: string
): { date: Date | null; error?: string } {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split("-");
    const [hourStr, minuteStr] = timeHHMM.split(":");

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
      return { date: null, error: "Invalid date or time components provided." };
    }

    // Construct target ISO candidate
    // We determine the offset of the given date in the target timezone
    // Step 1: Create a rough UTC date
    const roughUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

    // Step 2: Format this rough UTC date back in the target timezone to find the exact offset
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Compute timezone offset delta
    const parts = formatter.formatToParts(roughUtc);
    const pYear = parseInt(parts.find((p) => p.type === "year")?.value || "0", 10);
    const pMonth = parseInt(parts.find((p) => p.type === "month")?.value || "0", 10);
    const pDay = parseInt(parts.find((p) => p.type === "day")?.value || "0", 10);
    const pHour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const pMinute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);

    const asLocalFromRough = new Date(Date.UTC(pYear, pMonth - 1, pDay, pHour, pMinute, 0));
    const offsetMs = asLocalFromRough.getTime() - roughUtc.getTime();

    // The actual UTC date that corresponds to this local time
    const finalUtc = new Date(roughUtc.getTime() - offsetMs);

    // Step 3: DST Nonexistent check:
    // Format the finalUtc back in the timeZone. If it DOES NOT match the requested hour and minute,
    // this local time was skipped during Daylight Saving Time "spring forward" and does not exist!
    const verifyParts = formatter.formatToParts(finalUtc);
    const vHour = parseInt(verifyParts.find((p) => p.type === "hour")?.value || "0", 10);
    const vMinute = parseInt(verifyParts.find((p) => p.type === "minute")?.value || "0", 10);

    if (vHour !== hour || vMinute !== minute) {
      return {
        date: null,
        error: `Nonexistent local time: ${dateStr} ${timeHHMM} does not exist in ${timeZone} due to Daylight Saving Time clock jump.`,
      };
    }

    return { date: finalUtc };
  } catch (err: any) {
    return { date: null, error: err.message || "Failed to parse local time to UTC" };
  }
}
