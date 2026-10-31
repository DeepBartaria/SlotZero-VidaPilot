import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/timezone";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      role = "PATIENT",
      timeZone = "Europe/London",
      specialty,
      location,
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!["DOCTOR", "PATIENT"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be DOCTOR or PATIENT." },
        { status: 400 }
      );
    }

    if (!isValidTimeZone(timeZone)) {
      return NextResponse.json(
        { error: `Invalid timezone '${timeZone}'. Must be a valid IANA timezone (e.g. Europe/London, America/New_York, Asia/Kolkata).` },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check existing email
    const existing = await db.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Default avatars
    const defaultAvatar =
      role === "DOCTOR"
        ? "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";

    const defaultLocation =
      location?.trim() ||
      (timeZone.includes("London")
        ? "London, UK"
        : timeZone.includes("New_York")
        ? "New York, USA"
        : "Kolkata, India");

    // Create user and initial schedules inside transaction
    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: password,
          role: role as "DOCTOR" | "PATIENT",
          timeZone,
          specialty: specialty?.trim() || (role === "DOCTOR" ? "General Medicine" : null),
          location: defaultLocation,
          avatar: defaultAvatar,
        },
      });

      // If doctor, create initial standard working shifts Mon-Fri (1-5) 09:00-12:00 and 13:00-17:00
      if (role === "DOCTOR") {
        for (let day = 1; day <= 5; day++) {
          await tx.doctorSchedule.create({
            data: {
              doctorId: user.id,
              dayOfWeek: day,
              startTime: "09:00",
              endTime: "12:00",
            },
          });
          await tx.doctorSchedule.create({
            data: {
              doctorId: user.id,
              dayOfWeek: day,
              startTime: "13:00",
              endTime: "17:00",
            },
          });
        }
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "REGISTER",
          description: `New ${role} account registered: ${user.name} (${user.email}) in ${user.timeZone}`,
        },
      });

      return user;
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, newUser.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          timeZone: newUser.timeZone,
          specialty: newUser.specialty,
          location: newUser.location,
          avatar: newUser.avatar,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to register account" },
      { status: 500 }
    );
  }
}
