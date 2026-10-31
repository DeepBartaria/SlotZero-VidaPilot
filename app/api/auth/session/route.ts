import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME, getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to get session" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, password } = body;

    let targetUser = null;
    if (userId) {
      targetUser = await db.user.findUnique({ where: { id: userId } });
    } else if (email) {
      const cleanEmail = email.trim();
      targetUser = await db.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      });

      if (targetUser && password && targetUser.password && targetUser.password !== password) {
        return NextResponse.json({ error: "Invalid password provided." }, { status: 401 });
      }
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, targetUser.id, {
      path: "/",
      httpOnly: false, // Accessible to client JS for quick role display
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Log login in audit
    await db.auditLog.create({
      data: {
        actorId: targetUser.id,
        action: "LOGIN",
        description: `${targetUser.name} (${targetUser.role}) logged in from ${targetUser.timeZone}`,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        timeZone: targetUser.timeZone,
        specialty: targetUser.specialty,
        location: targetUser.location,
        avatar: targetUser.avatar,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Logout failed" }, { status: 500 });
  }
}
