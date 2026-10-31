import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const doctors = await db.user.findMany({
      where: { role: "DOCTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        timeZone: true,
        specialty: true,
        location: true,
        avatar: true,
        schedules: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
        blockedTimes: {
          orderBy: { startTimeUtc: "asc" },
        },
        _count: {
          select: {
            doctorAppointments: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ doctors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch doctors" }, { status: 500 });
  }
}
