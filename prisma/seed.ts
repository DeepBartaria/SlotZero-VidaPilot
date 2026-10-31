import { PrismaClient } from "@prisma/client";
import { parseLocalToUtc } from "../lib/timezone";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding MedaVida SlotZero database...");

  // Clean old records
  await prisma.auditLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorBlockedTime.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.user.deleteMany();

  // 1. Dr. Meera (Doctor · Europe/London)
  const drMeera = await prisma.user.create({
    data: {
      id: "user-dr-meera",
      email: "dr.meera@medavida.com",
      password: "password123",
      name: "Dr. Meera Patel",
      role: "DOCTOR",
      timeZone: "Europe/London",
      specialty: "General Physician & Clinic Lead",
      location: "London, UK",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Shifts for Dr. Meera: Mon-Fri (1-5) 09:00-12:00 and 13:00-17:00
  for (let day = 1; day <= 5; day++) {
    await prisma.doctorSchedule.create({
      data: {
        doctorId: drMeera.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "12:00",
      },
    });
    await prisma.doctorSchedule.create({
      data: {
        doctorId: drMeera.id,
        dayOfWeek: day,
        startTime: "13:00",
        endTime: "17:00",
      },
    });
  }

  // 2. Dr. Alex (Doctor · America/New_York)
  const drAlex = await prisma.user.create({
    data: {
      id: "user-dr-alex",
      email: "dr.alex@medavida.com",
      password: "password123",
      name: "Dr. Alex Rivera",
      role: "DOCTOR",
      timeZone: "America/New_York",
      specialty: "Internal Medicine Specialist",
      location: "New York, USA",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Shifts for Dr. Alex: Mon-Fri (1-5) 08:30-12:30 and 14:00-18:00
  for (let day = 1; day <= 5; day++) {
    await prisma.doctorSchedule.create({
      data: {
        doctorId: drAlex.id,
        dayOfWeek: day,
        startTime: "08:30",
        endTime: "12:30",
      },
    });
    await prisma.doctorSchedule.create({
      data: {
        doctorId: drAlex.id,
        dayOfWeek: day,
        startTime: "14:00",
        endTime: "18:00",
      },
    });
  }

  // 3. Asha (Patient · Asia/Kolkata)
  const asha = await prisma.user.create({
    data: {
      id: "user-asha",
      email: "asha@medavida.com",
      password: "password123",
      name: "Asha Sharma",
      role: "PATIENT",
      timeZone: "Asia/Kolkata",
      location: "Kolkata, India",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 4. Sam (Patient · America/New_York)
  const sam = await prisma.user.create({
    data: {
      id: "user-sam",
      email: "sam@medavida.com",
      password: "password123",
      name: "Sam Taylor",
      role: "PATIENT",
      timeZone: "America/New_York",
      location: "New York, USA",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Target demo date: 2026-11-02 (Monday)
  const targetDate = "2026-11-02";

  // Block Dr. Meera lunch break on targetDate: 12:00 to 13:00 London time
  const meeraBreakStart = parseLocalToUtc(targetDate, "12:00", drMeera.timeZone).date!;
  const meeraBreakEnd = parseLocalToUtc(targetDate, "13:00", drMeera.timeZone).date!;
  await prisma.doctorBlockedTime.create({
    data: {
      doctorId: drMeera.id,
      title: "Lunch & Clinical Admin",
      startTimeUtc: meeraBreakStart,
      endTimeUtc: meeraBreakEnd,
    },
  });

  // Initial Bookings to showcase cross-border times (Asha & Sam)
  // Appointment 1: Sam with Dr. Meera at 10:00 London time (30 mins)
  const appt1Start = parseLocalToUtc(targetDate, "10:00", drMeera.timeZone).date!;
  const appt1End = parseLocalToUtc(targetDate, "10:30", drMeera.timeZone).date!;
  await prisma.appointment.create({
    data: {
      id: "appt-seed-1",
      doctorId: drMeera.id,
      patientId: sam.id,
      startTimeUtc: appt1Start,
      endTimeUtc: appt1End,
      durationMinutes: 30,
      status: "CONFIRMED",
      reason: "Quarterly health review",
    },
  });

  // Appointment 2: Asha with Dr. Meera at 14:00 London time (30 mins = 19:30 Kolkata IST)
  const appt2Start = parseLocalToUtc(targetDate, "14:00", drMeera.timeZone).date!;
  const appt2End = parseLocalToUtc(targetDate, "14:30", drMeera.timeZone).date!;
  await prisma.appointment.create({
    data: {
      id: "appt-seed-2",
      doctorId: drMeera.id,
      patientId: asha.id,
      startTimeUtc: appt2Start,
      endTimeUtc: appt2End,
      durationMinutes: 30,
      status: "CONFIRMED",
      reason: "Telehealth consultation",
    },
  });

  // Appointment 3: Asha with Dr. Alex at 10:00 New York time (30 mins = 19:30 Kolkata IST)
  const appt3Start = parseLocalToUtc(targetDate, "10:00", drAlex.timeZone).date!;
  const appt3End = parseLocalToUtc(targetDate, "10:30", drAlex.timeZone).date!;
  await prisma.appointment.create({
    data: {
      id: "appt-seed-3",
      doctorId: drAlex.id,
      patientId: asha.id,
      startTimeUtc: appt3Start,
      endTimeUtc: appt3End,
      durationMinutes: 30,
      status: "CONFIRMED",
      reason: "Specialist second opinion",
    },
  });

  // Initial audit records
  await prisma.auditLog.create({
    data: {
      actorId: asha.id,
      action: "BOOKED",
      description: "Asha Sharma booked 30m consultation with Dr. Meera Patel for Nov 2, 2026 at 14:00 GMT (19:30 IST)",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: sam.id,
      action: "BOOKED",
      description: "Sam Taylor booked 30m consultation with Dr. Meera Patel for Nov 2, 2026 at 10:00 GMT (05:00 EDT)",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: drMeera.id,
      action: "BLOCKED_TIME",
      description: "Dr. Meera Patel blocked Lunch & Clinical Admin (12:00–13:00 Europe/London)",
    },
  });

  console.log("✓ Seeding complete! Database populated with Dr. Meera, Dr. Alex, Asha, and Sam.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
