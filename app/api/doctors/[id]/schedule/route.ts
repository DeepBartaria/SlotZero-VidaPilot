import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doctor = await db.user.findUnique({
      where: { id, role: "DOCTOR" },
      include: {
        schedules: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
        blockedTimes: {
          orderBy: { startTimeUtc: "asc" },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser(request);

    // RBAC: caller must be authenticated and must be THIS doctor
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (sessionUser.role !== "DOCTOR" || sessionUser.id !== id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify another doctor's working schedule." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { schedules } = body as {
      schedules: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
    };

    if (!Array.isArray(schedules)) {
      return NextResponse.json({ error: "Invalid schedules format. Expected array." }, { status: 400 });
    }

    // Validate times
    for (const item of schedules) {
      if (item.startTime >= item.endTime) {
        return NextResponse.json(
          { error: `Invalid range: ${item.startTime} must be before ${item.endTime}` },
          { status: 400 }
        );
      }
    }

    // Replace schedule inside transaction
    await db.$transaction(async (tx) => {
      await tx.doctorSchedule.deleteMany({
        where: { doctorId: id },
      });

      if (schedules.length > 0) {
        await tx.doctorSchedule.createMany({
          data: schedules.map((s) => ({
            doctorId: id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: id,
          action: "HOURS_UPDATED",
          description: `${sessionUser.name} updated their working schedule (${schedules.length} shifts configured).`,
        },
      });
    });

    const updated = await db.doctorSchedule.findMany({
      where: { doctorId: id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ success: true, schedules: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update schedule" }, { status: 500 });
  }
}
