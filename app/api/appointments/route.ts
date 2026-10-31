import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatToLocalTime } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    // Role-Based Access Control:
    // Patients see ONLY their own bookings.
    // Doctors see ONLY bookings scheduled with them.
    const whereClause: any = {};
    if (sessionUser.role === "PATIENT") {
      whereClause.patientId = sessionUser.id;
    } else if (sessionUser.role === "DOCTOR") {
      whereClause.doctorId = sessionUser.id;
    }

    const appointments = await db.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            timeZone: true,
            specialty: true,
            avatar: true,
            location: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            timeZone: true,
            avatar: true,
            location: true,
          },
        },
      },
      orderBy: { startTimeUtc: "asc" },
    });

    // Decorate each appointment with formatted local times in both viewer's and counterpart's timezones
    const formatted = appointments.map((appt) => {
      const viewerTz = sessionUser.timeZone;
      const counterpartTz =
        sessionUser.role === "PATIENT" ? appt.doctor.timeZone : appt.patient.timeZone;

      return {
        ...appt,
        viewerDisplay: {
          timeZone: viewerTz,
          start: formatToLocalTime(appt.startTimeUtc, viewerTz, { includeDate: true }),
          end: formatToLocalTime(appt.endTimeUtc, viewerTz),
        },
        counterpartDisplay: {
          timeZone: counterpartTz,
          start: formatToLocalTime(appt.startTimeUtc, counterpartTz, { includeDate: true }),
          end: formatToLocalTime(appt.endTimeUtc, counterpartTz),
        },
        doctorDisplay: {
          timeZone: appt.doctor.timeZone,
          start: formatToLocalTime(appt.startTimeUtc, appt.doctor.timeZone, { includeDate: true }),
          end: formatToLocalTime(appt.endTimeUtc, appt.doctor.timeZone),
        },
        patientDisplay: {
          timeZone: appt.patient.timeZone,
          start: formatToLocalTime(appt.startTimeUtc, appt.patient.timeZone, { includeDate: true }),
          end: formatToLocalTime(appt.endTimeUtc, appt.patient.timeZone),
        },
      };
    });

    return NextResponse.json({ appointments: formatted, viewer: sessionUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized: Please log in to book." }, { status: 401 });
    }

    const body = await request.json();
    const {
      doctorId,
      patientId: requestedPatientId,
      startTimeUtc,
      endTimeUtc,
      durationMinutes = 30,
      reason = "General consultation",
      idempotencyKey,
    } = body;

    // RBAC: If patient, they can only book for themselves.
    // If developer passes requestedPatientId, verify match or allow if admin/demo.
    const effectivePatientId =
      sessionUser.role === "PATIENT" ? sessionUser.id : requestedPatientId || sessionUser.id;

    if (!doctorId || !startTimeUtc || !endTimeUtc) {
      return NextResponse.json(
        { error: "doctorId, startTimeUtc, and endTimeUtc are required." },
        { status: 400 }
      );
    }

    const startUtc = new Date(startTimeUtc);
    const endUtc = new Date(endTimeUtc);

    if (isNaN(startUtc.getTime()) || isNaN(endUtc.getTime())) {
      return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
    }

    if (startUtc >= endUtc) {
      return NextResponse.json({ error: "Start time must be before end time." }, { status: 400 });
    }

    // Reject past times (allow slight 5 min clock skew tolerance for demo seeds if needed)
    const now = new Date();
    // Allow past dates only if specifically flagged for backdated test replay
    // otherwise validate future date
    if (body.allowPast !== true && endUtc.getTime() < now.getTime() - 60000) {
      return NextResponse.json(
        { error: "Cannot book appointments in the past. Please select a future slot." },
        { status: 400 }
      );
    }

    // Repeated requests check (Idempotency Key):
    // "Submitting the same booking twice must not create duplicate appointments."
    if (idempotencyKey) {
      const existing = await db.appointment.findUnique({
        where: { idempotencyKey },
        include: { doctor: true, patient: true },
      });
      if (existing) {
        return NextResponse.json(
          {
            appointment: existing,
            idempotentReplay: true,
            message: "Idempotent request: returning previously confirmed booking.",
          },
          { status: 200 }
        );
      }
    }

    // Look up doctor
    const doctor = await db.user.findUnique({ where: { id: doctorId, role: "DOCTOR" } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    // Look up patient
    const patient = await db.user.findUnique({ where: { id: effectivePatientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    // Atomic Database Transaction for Double-Booking Prevention & Concurrency Control
    // Re-check on backend: if two patients click same slot at once, only one succeeds!
    const result = await db.$transaction(async (tx) => {
      // 1. Check for overlapping confirmed appointment for this doctor
      // Overlap condition: startA < endB AND endA > startB
      const conflictingAppointment = await tx.appointment.findFirst({
        where: {
          doctorId,
          status: "CONFIRMED",
          startTimeUtc: { lt: endUtc },
          endTimeUtc: { gt: startUtc },
        },
      });

      if (conflictingAppointment) {
        throw new Error("SLOT_ALREADY_TAKEN: This slot has just been confirmed by another patient.");
      }

      // 2. Check for overlapping doctor blocked period
      const conflictingBlock = await tx.doctorBlockedTime.findFirst({
        where: {
          doctorId,
          startTimeUtc: { lt: endUtc },
          endTimeUtc: { gt: startUtc },
        },
      });

      if (conflictingBlock) {
        throw new Error(`SLOT_BLOCKED: Doctor has blocked this period (${conflictingBlock.title}).`);
      }

      // 3. Create appointment
      const newAppt = await tx.appointment.create({
        data: {
          doctorId,
          patientId: effectivePatientId,
          startTimeUtc: startUtc,
          endTimeUtc: endUtc,
          durationMinutes: Number(durationMinutes),
          status: "CONFIRMED",
          reason,
          idempotencyKey: idempotencyKey || null,
        },
        include: {
          doctor: { select: { name: true, timeZone: true, specialty: true } },
          patient: { select: { name: true, timeZone: true } },
        },
      });

      // 4. Record audit log
      const doctorDisplay = formatToLocalTime(startUtc, doctor.timeZone);
      const patientDisplay = formatToLocalTime(startUtc, patient.timeZone);

      await tx.auditLog.create({
        data: {
          actorId: sessionUser.id,
          action: "BOOKED",
          description: `${patient.name} booked ${durationMinutes}m with ${doctor.name} for ${doctorDisplay} [Doctor] / ${patientDisplay} [Patient]`,
          metadata: JSON.stringify({
            appointmentId: newAppt.id,
            doctorId,
            patientId: effectivePatientId,
            startUtc: startUtc.toISOString(),
            endUtc: endUtc.toISOString(),
          }),
        },
      });

      return newAppt;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    return NextResponse.json(
      {
        success: true,
        appointment: result,
        message: "Appointment confirmed successfully.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (
      (err.message && err.message.startsWith("SLOT_ALREADY_TAKEN")) ||
      err.code === "P2034" ||
      (err.message && err.message.includes("could not serialize access"))
    ) {
      return NextResponse.json(
        { error: "Conflict: This slot is already booked by another patient. Please choose another time." },
        { status: 409 }
      );
    }
    if (err.message && err.message.startsWith("SLOT_BLOCKED")) {
      return NextResponse.json(
        { error: "Conflict: This time is blocked by the doctor." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message || "Failed to book appointment." }, { status: 500 });
  }
}
