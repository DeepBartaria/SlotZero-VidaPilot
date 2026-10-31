import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatToLocalTime } from "@/lib/timezone";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        doctor: { select: { id: true, name: true, timeZone: true } },
        patient: { select: { id: true, name: true, timeZone: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    // Role and IDOR check
    const isOwnerPatient = sessionUser.role === "PATIENT" && appointment.patientId === sessionUser.id;
    const isDoctorOfAppt = sessionUser.role === "DOCTOR" && appointment.doctorId === sessionUser.id;

    if (!isOwnerPatient && !isDoctorOfAppt) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to reschedule this appointment." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { newStartTimeUtc, newEndTimeUtc, newDurationMinutes } = body;

    if (!newStartTimeUtc || !newEndTimeUtc) {
      return NextResponse.json(
        { error: "newStartTimeUtc and newEndTimeUtc are required." },
        { status: 400 }
      );
    }

    const newStart = new Date(newStartTimeUtc);
    const newEnd = new Date(newEndTimeUtc);

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      return NextResponse.json({ error: "Invalid new date format." }, { status: 400 });
    }

    if (newStart >= newEnd) {
      return NextResponse.json({ error: "New start time must be before end time." }, { status: 400 });
    }

    // SAFE RESCHEDULING RULE:
    // Specification: "Check the new slot before changing the booking. If it fails, the original appointment stays intact."
    const result = await db.$transaction(async (tx) => {
      // 1. Check if another confirmed appointment overlaps with the requested new slot
      // Notice: exclude the current appointment itself (id !== id)
      const conflictingAppointment = await tx.appointment.findFirst({
        where: {
          id: { not: id },
          doctorId: appointment.doctorId,
          status: "CONFIRMED",
          startTimeUtc: { lt: newEnd },
          endTimeUtc: { gt: newStart },
        },
      });

      if (conflictingAppointment) {
        throw new Error("RESCHEDULE_CONFLICT: The selected new slot is unavailable because another appointment is booked then. Your original appointment remains intact.");
      }

      // 2. Check if doctor blocked that period
      const conflictingBlock = await tx.doctorBlockedTime.findFirst({
        where: {
          doctorId: appointment.doctorId,
          startTimeUtc: { lt: newEnd },
          endTimeUtc: { gt: newStart },
        },
      });

      if (conflictingBlock) {
        throw new Error(`RESCHEDULE_BLOCKED: Doctor has blocked this new time (${conflictingBlock.title}). Your original appointment remains intact.`);
      }

      // 3. Slot is verified clear! Safely update the appointment
      const updatedAppt = await tx.appointment.update({
        where: { id },
        data: {
          startTimeUtc: newStart,
          endTimeUtc: newEnd,
          durationMinutes: newDurationMinutes ? Number(newDurationMinutes) : appointment.durationMinutes,
          status: "CONFIRMED",
        },
        include: {
          doctor: { select: { name: true, timeZone: true } },
          patient: { select: { name: true, timeZone: true } },
        },
      });

      // 4. Record audit log
      const oldTimeStr = formatToLocalTime(appointment.startTimeUtc, appointment.doctor.timeZone);
      const newTimeStr = formatToLocalTime(newStart, appointment.doctor.timeZone);

      await tx.auditLog.create({
        data: {
          actorId: sessionUser.id,
          action: "RESCHEDULED",
          description: `${sessionUser.name} rescheduled appointment #${id} with ${appointment.doctor.name} from ${oldTimeStr} to ${newTimeStr} (${appointment.doctor.timeZone})`,
          metadata: JSON.stringify({
            appointmentId: id,
            previousStartUtc: appointment.startTimeUtc.toISOString(),
            newStartUtc: newStart.toISOString(),
          }),
        },
      });

      return updatedAppt;
    });

    return NextResponse.json({
      success: true,
      appointment: result,
      message: "Appointment successfully rescheduled.",
    });
  } catch (err: any) {
    if (err.message && (err.message.startsWith("RESCHEDULE_CONFLICT") || err.message.startsWith("RESCHEDULE_BLOCKED"))) {
      return NextResponse.json(
        {
          error: err.message,
          originalAppointmentPreserved: true,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message || "Failed to reschedule" }, { status: 500 });
  }
}
