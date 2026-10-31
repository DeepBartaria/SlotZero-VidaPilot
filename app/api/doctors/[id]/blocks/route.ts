import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { parseLocalToUtc } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blocks = await db.doctorBlockedTime.findMany({
      where: { doctorId: id },
      orderBy: { startTimeUtc: "asc" },
    });
    return NextResponse.json({ blocks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch blocked times" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (sessionUser.role !== "DOCTOR" || sessionUser.id !== id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify another doctor's blocked time." },
        { status: 403 }
      );
    }

    const doctor = await db.user.findUnique({ where: { id } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, dateStr, startTime, endTime, startTimeUtc: directStartUtc, endTimeUtc: directEndUtc } = body;

    let startUtc: Date;
    let endUtc: Date;

    if (directStartUtc && directEndUtc) {
      startUtc = new Date(directStartUtc);
      endUtc = new Date(directEndUtc);
    } else {
      if (!dateStr || !startTime || !endTime) {
        return NextResponse.json({ error: "Missing required fields (dateStr, startTime, endTime)" }, { status: 400 });
      }

      const parsedStart = parseLocalToUtc(dateStr, startTime, doctor.timeZone);
      const parsedEnd = parseLocalToUtc(dateStr, endTime, doctor.timeZone);

      if (!parsedStart.date || parsedStart.error) {
        return NextResponse.json({ error: parsedStart.error || "Invalid start time" }, { status: 400 });
      }
      if (!parsedEnd.date || parsedEnd.error) {
        return NextResponse.json({ error: parsedEnd.error || "Invalid end time" }, { status: 400 });
      }

      startUtc = parsedStart.date;
      endUtc = parsedEnd.date;
    }

    if (startUtc >= endUtc) {
      return NextResponse.json({ error: "Start time must be before end time" }, { status: 400 });
    }

    // CHECK FOR EXISTING BOOKINGS:
    // Specification: "Existing bookings must not silently disappear."
    const existingBookings = await db.appointment.findMany({
      where: {
        doctorId: id,
        status: "CONFIRMED",
        startTimeUtc: { lt: endUtc },
        endTimeUtc: { gt: startUtc },
      },
      include: {
        patient: { select: { name: true, email: true } },
      },
    });

    const block = await db.doctorBlockedTime.create({
      data: {
        doctorId: id,
        title: title || "Unavailable",
        startTimeUtc: startUtc,
        endTimeUtc: endUtc,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: id,
        action: "BLOCKED_TIME",
        description: `${sessionUser.name} blocked ${title || "period"} (${startTime || startUtc.toISOString()} - ${endTime || endUtc.toISOString()})`,
        metadata: JSON.stringify({
          existingConflictingBookingsCount: existingBookings.length,
          conflictingPatients: existingBookings.map((b) => b.patient.name),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      block,
      warning:
        existingBookings.length > 0
          ? `Notice: ${existingBookings.length} existing booking(s) fall in this blocked window. They remain intact and have NOT been cancelled silently.`
          : null,
      affectedBookings: existingBookings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add blocked time" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser(request);

    if (!sessionUser || sessionUser.role !== "DOCTOR" || sessionUser.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get("blockId");

    if (!blockId) {
      return NextResponse.json({ error: "blockId query param required" }, { status: 400 });
    }

    await db.doctorBlockedTime.delete({
      where: { id: blockId, doctorId: id },
    });

    await db.auditLog.create({
      data: {
        actorId: id,
        action: "UNBLOCKED_TIME",
        description: `${sessionUser.name} removed blocked time interval #${blockId}`,
      },
    });

    return NextResponse.json({ success: true, message: "Blocked time removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete block" }, { status: 500 });
  }
}
