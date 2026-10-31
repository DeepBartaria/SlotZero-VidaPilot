export interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  timeZone: string;
  location: string;
  avatar: string;
  workingRanges: Array<{ start: string; end: string }>; // e.g. "09:00", "12:00"
  blockedRanges: Array<{ id: string; title: string; start: string; end: string }>;
}

export interface PatientProfile {
  id: string;
  name: string;
  timeZone: string;
  location: string;
  avatar: string;
}

export interface Booking {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:mm in Doctor's timezone
  endTime: string; // HH:mm in Doctor's timezone
  durationMinutes: number; // 15, 30, 60
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: "BOOKED" | "CANCELLED" | "RESCHEDULED" | "BLOCK_TIME" | "UNBLOCK_TIME" | "WORKING_HOURS";
  description: string;
  actor: string;
}

export const INITIAL_DOCTORS: DoctorProfile[] = [
  {
    id: "dr-meera",
    name: "Dr. Meera Patel",
    specialty: "General Physician & Consultant",
    timeZone: "Europe/London",
    location: "London, UK (GMT/BST)",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    workingRanges: [
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "17:00" },
    ],
    blockedRanges: [
      { id: "break-1", title: "Lunch & Clinical Admin", start: "12:00", end: "13:00" },
    ],
  },
  {
    id: "dr-alex",
    name: "Dr. Alex Rivera",
    specialty: "Internal Medicine Specialist",
    timeZone: "America/New_York",
    location: "New York, USA (EDT/EST)",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    workingRanges: [
      { start: "08:30", end: "12:30" },
      { start: "14:00", end: "18:00" },
    ],
    blockedRanges: [
      { id: "break-2", title: "Department Rounds & Lunch", start: "12:30", end: "14:00" },
    ],
  },
];

export const INITIAL_PATIENTS: PatientProfile[] = [
  {
    id: "patient-asha",
    name: "Asha Sharma",
    timeZone: "Asia/Kolkata",
    location: "Kolkata, India (IST)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "patient-sam",
    name: "Sam Taylor",
    timeZone: "America/New_York",
    location: "New York, USA (EDT)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
];

// Time conversion utilities using Intl.DateTimeFormat
export function formatTimeInTimeZone(
  dateStr: string,
  timeHHMM: string,
  fromTimeZone: string,
  toTimeZone: string
): string {
  try {
    const [h, m] = timeHHMM.split(":").map(Number);
    // Create UTC date reference
    // Parse dateStr (YYYY-MM-DD)
    const [year, month, day] = dateStr.split("-").map(Number);

    // Approximate ISO string in fromTimeZone
    // Construct local ISO representation
    const isoString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;

    // Calculate offset differences between timezones accurately
    const refDate = new Date(isoString + "Z");

    // Use Intl formatters to calculate precise offset difference
    const fromFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: fromTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const toFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: toTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Time offset math using actual Date parsing
    const dateInFromTz = new Date(refDate.toLocaleString("en-US", { timeZone: fromTimeZone }));
    const dateInToTz = new Date(refDate.toLocaleString("en-US", { timeZone: toTimeZone }));
    const diffMs = dateInToTz.getTime() - dateInFromTz.getTime();

    const targetDate = new Date(new Date(`${dateStr}T${timeHHMM}:00`).getTime() + diffMs);

    return targetDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (err) {
    return timeHHMM;
  }
}

// Convert "09:00" to minutes from midnight
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Convert minutes from midnight to "09:00"
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Format 24h to 12h AM/PM
export function format12Hour(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${mStr} ${ampm}`;
}

// Check if two time intervals overlap (strictly overlap: startA < endB && endA > startB)
export function checkIntervalOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a1 = timeToMinutes(startA);
  const a2 = timeToMinutes(endA);
  const b1 = timeToMinutes(startB);
  const b2 = timeToMinutes(endB);
  return a1 < b2 && a2 > b1;
}
