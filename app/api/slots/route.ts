import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  parseLocalToUtc,
  formatToLocalTime,
  isValidTimeZone,
} from "@/lib/timezone";
import { timeToMinutes, minutesToTime } from "@/lib/scheduling";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const dateStr = searchParams.get("date"); // e.g. "2026-11-02"
    const durationParam = searchParams.get("duration"); // "15" | "30" | "60"
    const patientTimeZone = searchParams.get("patientTimeZone") || "Asia/Kolkata";

    if (!doctorId || !dateStr) {
      return NextResponse.json(
        { error: "doctorId and date (YYYY-MM-DD) are required query parameters." },
        { status: 400 }
      );
    }

    const durationMinutes = parseInt(durationParam || "30", 10);
    if (![15, 30, 60].includes(durationMinutes)) {
      return NextResponse.json(
        { error: "Appointment length must be 15, 30, or 60 minutes." },
        { status: 400 }
      );
    }

    const doctor = await db.user.findUnique({
      where: { id: doctorId, role: "DOCTOR" },
      include: {
        schedules: true,
        blockedTimes: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    // Determine Day of Week for dateStr in Doctor's TimeZone
    // Parse noon in doctor's timezone to ensure safe day-of-week calculation
    const noonParse = parseLocalToUtc(dateStr, "12:00", doctor.timeZone);
    if (!noonParse.date) {
      return NextResponse.json({ error: noonParse.error || "Invalid date provided." }, { status: 400 });
    }

    // Format weekday in doctor's timezone
    const dayOfWeekStr = new Intl.DateTimeFormat("en-US", {
      timeZone: doctor.timeZone,
      weekday: "narrow",
    }).format(noonParse.date);

    // Map to 0 (Sun) - 6 (Sat)
    const dayOfWeekIndex = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ].indexOf(
      new Intl.DateTimeFormat("en-US", {
        timeZone: doctor.timeZone,
        weekday: "long",
      }).format(noonParse.date)
    );

    // Filter doctor's working shifts for this day of week
    const shifts = doctor.schedules.filter((s) => s.dayOfWeek === dayOfWeekIndex);

    if (shifts.length === 0) {
      return NextResponse.json({
        doctor: {
          id: doctor.id,
          name: doctor.name,
          timeZone: doctor.timeZone,
          specialty: doctor.specialty,
        },
        date: dateStr,
        dayOfWeek: dayOfWeekIndex,
        slots: [],
        message: `${doctor.name} does not have working hours configured on this day of the week.`,
      });
    }

    // Get all confirmed appointments for this doctor on this day (with margin for timezone span)
    const dayStartUtc = new Date(noonParse.date.getTime() - 24 * 60 * 60 * 1000);
    const dayEndUtc = new Date(noonParse.date.getTime() + 24 * 60 * 60 * 1000);

    const existingAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "CONFIRMED",
        startTimeUtc: { gte: dayStartUtc, lte: dayEndUtc },
      },
    });

    // Generate candidate slots for each working shift
    const candidateSlots: Array<{
      startTimeUtc: string;
      endTimeUtc: string;
      doctorStartTime: string;
      doctorEndTime: string;
      doctorDisplay: string;
      patientDisplay: string;
      durationMinutes: number;
    }> = [];

    for (const shift of shifts) {
      const shiftStartMins = timeToMinutes(shift.startTime);
      const shiftEndMins = timeToMinutes(shift.endTime);

      let curMins = shiftStartMins;
      while (curMins + durationMinutes <= shiftEndMins) {
        const slotStartStr = minutesToTime(curMins);
        const slotEndMins = curMins + durationMinutes;
        const slotEndStr = minutesToTime(slotEndMins);

        // Convert to UTC using Doctor's IANA timezone
        const startUtcResult = parseLocalToUtc(dateStr, slotStartStr, doctor.timeZone);
        const endUtcResult = parseLocalToUtc(dateStr, slotEndStr, doctor.timeZone);

        // If nonexistent local time during DST spring forward, skip slot!
        if (startUtcResult.date && endUtcResult.date) {
          const slotStartUtc = startUtcResult.date;
          const slotEndUtc = endUtcResult.date;

          // Conflict Check 1: Overlaps with any confirmed appointments
          // Two intervals [A_start, A_end] and [B_start, B_end] overlap if:
          // A_start < B_end && A_end > B_start
          const hasApptConflict = existingAppointments.some((appt) => {
            return slotStartUtc < appt.endTimeUtc && slotEndUtc > appt.startTimeUtc;
          });

          // Conflict Check 2: Overlaps with doctor blocked time
          const hasBlockedConflict = doctor.blockedTimes.some((block) => {
            return slotStartUtc < block.endTimeUtc && slotEndUtc > block.startTimeUtc;
          });

          if (!hasApptConflict && !hasBlockedConflict) {
            candidateSlots.push({
              startTimeUtc: slotStartUtc.toISOString(),
              endTimeUtc: slotEndUtc.toISOString(),
              doctorStartTime: slotStartStr,
              doctorEndTime: slotEndStr,
              doctorDisplay: `${formatToLocalTime(slotStartUtc, doctor.timeZone)} - ${formatToLocalTime(slotEndUtc, doctor.timeZone)}`,
              patientDisplay: `${formatToLocalTime(slotStartUtc, patientTimeZone)} - ${formatToLocalTime(slotEndUtc, patientTimeZone)}`,
              durationMinutes,
            });
          }
        }

        curMins += durationMinutes;
      }
    }

    // Sort slots chronologically
    candidateSlots.sort(
      (a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime()
    );

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        name: doctor.name,
        timeZone: doctor.timeZone,
        specialty: doctor.specialty,
      },
      date: dateStr,
      dayOfWeek: dayOfWeekIndex,
      durationMinutes,
      patientTimeZone,
      slotsCount: candidateSlots.length,
      slots: candidateSlots,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate slots." }, { status: 500 });
  }
}
