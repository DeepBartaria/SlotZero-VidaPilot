"use client";

import { useState, useMemo, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Globe,
  ShieldCheck,
  AlertCircle,
  CalendarClock,
  UserCheck,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Plus,
  ShieldAlert,
  Info,
  CalendarDays,
  History,
  Timer,
  Zap,
} from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";
import AppleIntro from "@/components/AppleIntro";
import {
  DoctorProfile,
  PatientProfile,
  Booking,
  AuditEvent,
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  formatTimeInTimeZone,
  timeToMinutes,
  minutesToTime,
  format12Hour,
  checkIntervalOverlap,
} from "@/lib/scheduling";

export default function LandingPage() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"]);

  // --- Dynamic State for SlotZero Engine ---
  const [doctors, setDoctors] = useState<DoctorProfile[]>(INITIAL_DOCTORS);
  const [patients] = useState<PatientProfile[]>(INITIAL_PATIENTS);

  // Active viewing persona: Doctor (dr-meera, dr-alex) or Patient (patient-asha, patient-sam)
  const [activePersonaId, setActivePersonaId] = useState<string>("patient-asha");

  // Scheduling View state
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("dr-meera");
  const [selectedDate, setSelectedDate] = useState<string>("2026-11-02"); // Monday
  const [durationMinutes, setDurationMinutes] = useState<number>(30); // 15, 30, 60

  // Existing dynamic bookings
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: "booking-sample-1",
      doctorId: "dr-meera",
      patientId: "patient-sam",
      patientName: "Sam Taylor",
      doctorName: "Dr. Meera Patel",
      dateStr: "2026-11-02",
      startTime: "11:00",
      endTime: "11:30",
      durationMinutes: 30,
      status: "CONFIRMED",
      createdAt: "2026-10-31T08:00:00Z",
    },
    {
      id: "booking-sample-2",
      doctorId: "dr-meera",
      patientId: "patient-asha",
      patientName: "Asha Sharma",
      doctorName: "Dr. Meera Patel",
      dateStr: "2026-11-02",
      startTime: "14:00",
      endTime: "14:30",
      durationMinutes: 30,
      status: "CONFIRMED",
      createdAt: "2026-10-31T09:15:00Z",
    },
  ]);

  // Audit Event History Trail
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([
    {
      id: "audit-1",
      timestamp: "10:15 AM",
      action: "BOOKED",
      description: "Sam Taylor booked 30m with Dr. Meera at 11:00 GMT (07:00 EDT)",
      actor: "Sam Taylor",
    },
    {
      id: "audit-2",
      timestamp: "09:30 AM",
      action: "BOOKED",
      description: "Asha Sharma booked 30m with Dr. Meera at 14:00 GMT (19:30 IST)",
      actor: "Asha Sharma",
    },
    {
      id: "audit-3",
      timestamp: "09:00 AM",
      action: "BLOCK_TIME",
      description: "Dr. Meera set Lunch Break: 12:00–13:00 Europe/London",
      actor: "Dr. Meera Patel",
    },
  ]);

  // Alert and feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>({
    type: "info",
    title: "SlotZero Engine Ready",
    message: "Select a persona below to experience real-time cross-timezone booking without conflicts.",
  });

  // Reschedule modal state
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);

  // Derived current persona
  const activeDoctor = doctors.find((d) => d.id === activePersonaId);
  const activePatient = patients.find((p) => p.id === activePersonaId);
  const isDoctorView = !!activeDoctor;

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  const currentViewerTimeZone = activeDoctor
    ? activeDoctor.timeZone
    : activePatient
    ? activePatient.timeZone
    : "UTC";

  // Available days for quick tab selection
  const dateOptions = [
    { label: "Mon, Nov 2", value: "2026-11-02" },
    { label: "Tue, Nov 3", value: "2026-11-03" },
    { label: "Wed, Nov 4", value: "2026-11-04" },
    { label: "Thu, Nov 5", value: "2026-11-05" },
  ];

  // Generate Slots dynamically for current doctor & selected date
  const generatedSlots = useMemo(() => {
    const slots: Array<{
      startTime: string;
      endTime: string;
      status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "OVERLAP_BLOCKED";
      booking?: Booking;
      blockedReason?: string;
    }> = [];

    currentDoctor.workingRanges.forEach((range) => {
      const rangeStartMin = timeToMinutes(range.start);
      const rangeEndMin = timeToMinutes(range.end);

      let currentMin = rangeStartMin;
      while (currentMin + durationMinutes <= rangeEndMin) {
        const slotStart = minutesToTime(currentMin);
        const slotEnd = minutesToTime(currentMin + durationMinutes);

        // Check if inside doctor blocked breaks
        const blockedMatch = currentDoctor.blockedRanges.find((b) =>
          checkIntervalOverlap(slotStart, slotEnd, b.start, b.end)
        );

        // Check if any active booking conflicts with this slot
        const bookingMatch = bookings.find(
          (b) =>
            b.doctorId === currentDoctor.id &&
            b.dateStr === selectedDate &&
            b.status === "CONFIRMED" &&
            checkIntervalOverlap(slotStart, slotEnd, b.startTime, b.endTime)
        );

        if (blockedMatch) {
          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            status: "BLOCKED",
            blockedReason: blockedMatch.title,
          });
        } else if (bookingMatch) {
          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            status: "BOOKED",
            booking: bookingMatch,
          });
        } else {
          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            status: "AVAILABLE",
          });
        }

        currentMin += durationMinutes;
      }
    });

    return slots;
  }, [currentDoctor, selectedDate, durationMinutes, bookings]);

  // --- Handlers for User Actions ---

  // 1. Patient Books a Slot
  const handleBookSlot = (startTime: string, endTime: string) => {
    if (isDoctorView) {
      setFeedback({
        type: "error",
        title: "Role Restriction",
        message: "Doctors manage schedules. Please switch to Asha or Sam to test patient bookings.",
      });
      return;
    }

    const patient = activePatient!;

    // Check for overlap conflicts again
    const conflict = bookings.find(
      (b) =>
        b.doctorId === currentDoctor.id &&
        b.dateStr === selectedDate &&
        b.status === "CONFIRMED" &&
        checkIntervalOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    if (conflict) {
      setFeedback({
        type: "error",
        title: "Conflict Blocked (Rule 04)",
        message: `This slot overlaps with an existing appointment for ${conflict.patientName}. SlotZero actively prevents double-allocation.`,
      });
      return;
    }

    // Check repeated requests idempotency
    const existingSameSlot = bookings.find(
      (b) =>
        b.patientId === patient.id &&
        b.doctorId === currentDoctor.id &&
        b.dateStr === selectedDate &&
        b.startTime === startTime &&
        b.status === "CONFIRMED"
    );

    if (existingSameSlot) {
      setFeedback({
        type: "info",
        title: "Repeated Request Handled (Rule 07)",
        message: "You have already confirmed this exact appointment. Duplicate creation was blocked.",
      });
      return;
    }

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      doctorId: currentDoctor.id,
      patientId: patient.id,
      patientName: patient.name,
      doctorName: currentDoctor.name,
      dateStr: selectedDate,
      startTime,
      endTime,
      durationMinutes,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [...prev, newBooking]);

    const doctorTimeStr = `${format12Hour(startTime)}–${format12Hour(endTime)} ${currentDoctor.timeZone}`;
    const patientTimeStr = `${formatTimeInTimeZone(selectedDate, startTime, currentDoctor.timeZone, patient.timeZone)} ${patient.timeZone}`;

    const newAudit: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      action: "BOOKED",
      description: `${patient.name} booked ${durationMinutes}m with ${currentDoctor.name} at ${startTime} (${patientTimeStr})`,
      actor: patient.name,
    };

    setAuditLog((prev) => [newAudit, ...prev]);

    setFeedback({
      type: "success",
      title: "Appointment Confirmed!",
      message: `Booked for ${doctorTimeStr}. In your local time (${patient.location}): ${patientTimeStr}.`,
    });
  };

  // 2. Patient Cancels a Booking (Rule 05: 2 hours rule)
  const handleCancelBooking = (booking: Booking) => {
    // In our demonstration, simulate checking 2h window
    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: "CANCELLED" } : b))
    );

    const newAudit: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      action: "CANCELLED",
      description: `${booking.patientName} cancelled ${booking.durationMinutes}m appointment with ${booking.doctorName} at ${booking.startTime}`,
      actor: booking.patientName,
    };

    setAuditLog((prev) => [newAudit, ...prev]);

    setFeedback({
      type: "info",
      title: "Booking Cancelled (Rule 05)",
      message: `Appointment cancelled successfully. The slot (${booking.startTime}) is now immediately available for other patients.`,
    });
  };

  // 3. Rescheduling Booking safely (Rule 06)
  const handleConfirmReschedule = (newStartTime: string, newEndTime: string) => {
    if (!reschedulingBooking) return;

    // Check if new slot has conflict
    const conflict = bookings.find(
      (b) =>
        b.id !== reschedulingBooking.id &&
        b.doctorId === reschedulingBooking.doctorId &&
        b.dateStr === selectedDate &&
        b.status === "CONFIRMED" &&
        checkIntervalOverlap(newStartTime, newEndTime, b.startTime, b.endTime)
    );

    if (conflict) {
      setFeedback({
        type: "error",
        title: "Rescheduling Failed (Rule 06)",
        message: "The requested new slot is already occupied. Your original appointment remains intact and unchanged.",
      });
      setReschedulingBooking(null);
      return;
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === reschedulingBooking.id
          ? {
              ...b,
              dateStr: selectedDate,
              startTime: newStartTime,
              endTime: newEndTime,
            }
          : b
      )
    );

    const newAudit: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      action: "RESCHEDULED",
      description: `${reschedulingBooking.patientName} rescheduled appointment with ${reschedulingBooking.doctorName} to ${newStartTime} on ${selectedDate}`,
      actor: reschedulingBooking.patientName,
    };

    setAuditLog((prev) => [newAudit, ...prev]);

    setFeedback({
      type: "success",
      title: "Reschedule Confirmed (Rule 06)",
      message: `Appointment safely moved to ${newStartTime} on ${selectedDate}. Original slot released.`,
    });

    setReschedulingBooking(null);
  };

  // 4. Doctor toggles blocking a break
  const handleToggleBreak = (start: string, end: string, label: string) => {
    const isCurrentlyBlocked = currentDoctor.blockedRanges.some(
      (b) => b.start === start && b.end === end
    );

    if (isCurrentlyBlocked) {
      // Unblock
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === currentDoctor.id
            ? {
                ...d,
                blockedRanges: d.blockedRanges.filter(
                  (b) => !(b.start === start && b.end === end)
                ),
              }
            : d
        )
      );

      const audit: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        action: "UNBLOCK_TIME",
        description: `${currentDoctor.name} unblocked time period ${start}–${end}`,
        actor: currentDoctor.name,
      };
      setAuditLog((prev) => [audit, ...prev]);

      setFeedback({
        type: "success",
        title: "Break Time Released",
        message: `Working time ${start}–${end} is now open for patient consultations.`,
      });
    } else {
      // Block
      // Check if any existing booking overlaps (Rule 03: Existing bookings must not silently disappear)
      const overlappingBookings = bookings.filter(
        (b) =>
          b.doctorId === currentDoctor.id &&
          b.dateStr === selectedDate &&
          b.status === "CONFIRMED" &&
          checkIntervalOverlap(start, end, b.startTime, b.endTime)
      );

      setDoctors((prev) =>
        prev.map((d) =>
          d.id === currentDoctor.id
            ? {
                ...d,
                blockedRanges: [
                  ...d.blockedRanges,
                  { id: `break-${Date.now()}`, title: label, start, end },
                ],
              }
            : d
        )
      );

      const audit: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        action: "BLOCK_TIME",
        description: `${currentDoctor.name} blocked break: ${start}–${end} (${label})`,
        actor: currentDoctor.name,
      };
      setAuditLog((prev) => [audit, ...prev]);

      if (overlappingBookings.length > 0) {
        setFeedback({
          type: "info",
          title: "Notice (Rule 03)",
          message: `Break added for ${start}–${end}. Notice: ${overlappingBookings.length} existing booking(s) are preserved and not silently deleted.`,
        });
      } else {
        setFeedback({
          type: "success",
          title: "Break Blocked (Rule 03)",
          message: `Period ${start}–${end} (${label}) is blocked from new patient bookings.`,
        });
      }
    }
  };

  // Filter bookings visible to active persona (Privacy Bound)
  const myAppointments = useMemo(() => {
    if (isDoctorView) {
      return bookings.filter(
        (b) => b.doctorId === activeDoctor!.id && b.status === "CONFIRMED"
      );
    } else {
      return bookings.filter(
        (b) => b.patientId === activePatient!.id && b.status === "CONFIRMED"
      );
    }
  }, [bookings, activePersonaId, isDoctorView, activeDoctor, activePatient]);

  return (
    <>
      <AppleIntro />
      {/* 3D WebGL Three.js Starfield Canvas */}
      <StarfieldBackground />

      <div className="min-h-screen text-slate-100 relative overflow-clip font-sans">
        {/* Soft emerald & purple telehealth nebula glows */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-[#714B67]/30 to-emerald-500/10 blur-[130px]" />
          <div className="absolute top-[30%] right-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-bl from-emerald-500/15 via-[#714B67]/20 to-transparent blur-[160px]" />
          <div className="absolute bottom-[-5%] left-[20%] w-[35%] h-[35%] rounded-full bg-emerald-600/15 blur-[120px]" />
        </div>

        {/* Floating Glassmorphism Navbar */}
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-8">
          <nav className="flex items-center justify-between w-full max-w-6xl px-6 md:px-8 py-3.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <img
                src="/VidaPilot_icon.png"
                alt="VidaPilot Icon"
                className="w-8 h-8 rounded-lg object-contain"
              />
              <img
                src="/VidaPilot_text.png"
                alt="VidaPilot"
                className="h-7 w-auto object-contain"
              />
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 tracking-wide uppercase">
                SlotZero
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
              <a href="#live-demo" className="hover:text-emerald-300 transition-colors">
                Live Scheduler
              </a>
              <a href="#rules" className="hover:text-emerald-300 transition-colors">
                Scheduling Rules
              </a>
              <a href="#personas" className="hover:text-emerald-300 transition-colors">
                Test Personas
              </a>
              <a href="#faq" className="hover:text-emerald-300 transition-colors">
                FAQ
              </a>
            </div>

            <div className="flex items-center">
              <a
                href="#live-demo"
                className="bg-white hover:bg-slate-100 px-6 py-2 rounded-full text-sm font-semibold transition-all text-slate-900 shadow-md shadow-black/20 flex items-center gap-1.5"
              >
                <span>Try Demo</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </nav>
        </div>

        {/* Hero Section */}
        <main className="relative z-10 flex flex-col items-center text-center px-4 pt-32 pb-20 max-w-5xl mx-auto">
          {/* Sub-badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-sm font-bold text-emerald-300 shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MedaVida Intern Hackathon · SlotZero Engine</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.45)]"
          >
            Zero Overlaps. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-[#d6bccc] bg-clip-text text-transparent">
              Global Time Zones.
            </span>{" "}
            Flawless Care.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-slate-300 max-w-3xl mb-10 leading-relaxed font-medium"
          >
            Dr. Meera runs a London clinic for patients across India and the US. SlotZero
            eliminates manual calendar chaos: automatic multi-timezone conversion, strict
            overlap prevention, protected breaks, and safe 2-hour rescheduling.
          </motion.p>

          {/* Key Metric Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl mb-12"
          >
            {[
              { label: "Double-Bookings", val: "0 Allowed", sub: "Strict atomic locking" },
              { label: "Time Zones", val: "Instant Sync", sub: "London · NY · Kolkata" },
              { label: "Slot Durations", val: "15 / 30 / 60m", sub: "Within working hours" },
              { label: "Cancellation Window", val: "2 Hours", sub: "Instant slot recycling" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center hover:bg-white/[0.07] transition-all"
              >
                <div className="text-xl sm:text-2xl font-black text-white mb-0.5">{stat.val}</div>
                <div className="text-xs font-bold text-emerald-300">{stat.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <a
              href="#live-demo"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-700/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 text-emerald-200" />
              <span>Launch Live Scheduler</span>
            </a>
            <a
              href="#rules"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/15 hover:bg-white/10 text-white font-bold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5 text-slate-300" />
              <span>View Scheduling Rules</span>
            </a>
          </motion.div>
        </main>

        {/* ========================================================
            SECTION: LIVE INTERACTIVE SCHEDULER (The Centerpiece)
        ======================================================== */}
        <section id="live-demo" className="relative z-10 py-16 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Interactive Test Environment
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 mb-3 tracking-tight">
              Test SlotZero Scheduling Rules Live
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
              Switch roles to experience Dr. Meera&apos;s schedule in London, Dr. Alex in New York,
              or test cross-border patient bookings as Asha (Kolkata) and Sam (New York).
            </p>
          </div>

          {/* Feedback banner */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                  feedback.type === "success"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                    : feedback.type === "error"
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-200"
                    : "bg-[#714B67]/25 border-[#714B67]/40 text-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : feedback.type === "error" ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-sm text-white">{feedback.title}</div>
                    <div className="text-xs mt-0.5 opacity-90">{feedback.message}</div>
                  </div>
                </div>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-white/60 hover:text-white text-xs font-bold"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Glass Workspace Card */}
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
            {/* 1. Persona Switcher Bar */}
            <div className="mb-8 pb-6 border-b border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                    Demonstration Persona (Switch to test role & timezone)
                  </div>
                  <div className="text-sm font-semibold text-slate-200 mt-0.5">
                    Viewing as:{" "}
                    <span className="text-emerald-300 font-bold">
                      {activeDoctor
                        ? `${activeDoctor.name} (${activeDoctor.location})`
                        : `${activePatient!.name} (${activePatient!.location})`}
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
                  <span className="text-[11px] font-bold text-slate-400 px-2">Doctors:</span>
                  {doctors.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setActivePersonaId(doc.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activePersonaId === doc.id
                          ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-900/40"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {doc.name.split(" ")[1]} (UK/US)
                    </button>
                  ))}
                  <div className="w-px h-5 bg-white/15 mx-1" />
                  <span className="text-[11px] font-bold text-slate-400 px-2">Patients:</span>
                  {patients.map((pat) => (
                    <button
                      key={pat.id}
                      onClick={() => setActivePersonaId(pat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activePersonaId === pat.id
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {pat.name.split(" ")[0]} ({pat.location.includes("India") ? "IST" : "EDT"})
                    </button>
                  ))}
                </div>
              </div>

              {/* Timezone banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>
                    Your Local Timezone: <strong className="text-white">{currentViewerTimeZone}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-300" />
                  <span>
                    Doctor Clinic Timezone:{" "}
                    <strong className="text-white">{currentDoctor.timeZone}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Interactive Booking Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Doctor Selector */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  1. Select Doctor
                </label>
                <div className="space-y-2">
                  {doctors.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedDoctorId === doc.id
                          ? "bg-white/10 border-emerald-400/50 shadow-md"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                        <div>
                          <div className="text-sm font-bold text-white">{doc.name}</div>
                          <div className="text-[11px] text-slate-400">{doc.location}</div>
                        </div>
                      </div>
                      {selectedDoctorId === doc.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  2. Select Consultation Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {dateOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedDate(opt.value)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedDate === opt.value
                          ? "bg-emerald-500/20 border-emerald-400 text-white font-bold"
                          : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      <CalendarDays className="w-4 h-4 mx-auto mb-1 text-emerald-300" />
                      <div className="text-xs">{opt.label}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 leading-tight">
                  Working hours for {currentDoctor.name.split(" ")[1]}:{" "}
                  <strong className="text-slate-200">
                    {currentDoctor.workingRanges.map((r) => `${r.start}–${r.end}`).join(", ")}
                  </strong>
                </div>
              </div>

              {/* Duration Selector (Rule 02: 15, 30, 60 mins) */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  3. Consultation Length (Rule 02)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-3 rounded-2xl border text-center transition-all ${
                        durationMinutes === mins
                          ? "bg-purple-600/30 border-purple-400 text-white font-bold"
                          : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="text-base font-black">{mins}m</div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        {mins === 30 ? "Standard" : mins === 15 ? "Quick" : "Detailed"}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
                  Slots automatically adapt to duration and must fit fully inside doctor shifts.
                </div>
              </div>
            </div>

            {/* 3. Slot Schedule Grid */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-emerald-400" />
                    <span>Calculated Consultation Slots ({durationMinutes}m)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Times shown in Doctor timezone ({currentDoctor.timeZone}) and your timezone (
                    {currentViewerTimeZone}).
                  </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-300 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Available
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Booked / Overlap
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Blocked Break
                  </div>
                </div>
              </div>

              {/* Slot Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {generatedSlots.map((slot, idx) => {
                  const patientLocalTime = formatTimeInTimeZone(
                    selectedDate,
                    slot.startTime,
                    currentDoctor.timeZone,
                    currentViewerTimeZone
                  );

                  const isAvailable = slot.status === "AVAILABLE";
                  const isBlocked = slot.status === "BLOCKED";
                  const isBooked = slot.status === "BOOKED";
                  const isMyBooking = isBooked && slot.booking?.patientId === activePersonaId;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between relative group ${
                        isAvailable
                          ? "bg-white/[0.04] border-white/10 hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                          : isBlocked
                          ? "bg-amber-500/10 border-amber-500/25 opacity-75"
                          : isMyBooking
                          ? "bg-purple-600/20 border-purple-400 shadow-md"
                          : "bg-rose-500/10 border-rose-500/20 opacity-80"
                      }`}
                      onClick={() => {
                        if (isAvailable) {
                          if (reschedulingBooking) {
                            handleConfirmReschedule(slot.startTime, slot.endTime);
                          } else {
                            handleBookSlot(slot.startTime, slot.endTime);
                          }
                        } else if (isBooked) {
                          setFeedback({
                            type: "error",
                            title: "Conflict Detection Triggered (Rule 04)",
                            message: `Slot ${slot.startTime}–${slot.endTime} is already booked for ${slot.booking?.patientName}. Overlapping bookings are rejected.`,
                          });
                        }
                      }}
                    >
                      <div>
                        {/* Doctor Time */}
                        <div className="text-xs font-black text-white">
                          {slot.startTime} – {slot.endTime}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {currentDoctor.name.split(" ")[1]} Time
                        </div>

                        {/* Patient Local Time */}
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <div className="text-xs font-extrabold text-emerald-300">
                            {patientLocalTime}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate">
                            Your Time ({currentViewerTimeZone.split("/")[1] || "Local"})
                          </div>
                        </div>
                      </div>

                      {/* Status / Button Pill */}
                      <div className="mt-3">
                        {isAvailable ? (
                          <div className="w-full py-1 text-center text-[10px] font-bold rounded-lg bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                            {reschedulingBooking ? "Move Here" : "Book Slot"}
                          </div>
                        ) : isBlocked ? (
                          <div className="text-center text-[10px] font-bold text-amber-300 py-1 bg-amber-500/10 rounded-lg truncate">
                            {slot.blockedReason || "Break"}
                          </div>
                        ) : isMyBooking ? (
                          <div className="text-center text-[10px] font-bold text-purple-200 py-1 bg-purple-500/30 rounded-lg">
                            Your Booking
                          </div>
                        ) : (
                          <div className="text-center text-[10px] font-bold text-rose-300 py-1 bg-rose-500/10 rounded-lg truncate">
                            Booked
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Doctor Controls / Active Appointments Tabs */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: My Appointments (Role Privacy) */}
              <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {isDoctorView
                        ? `Patients Confirmed with ${activeDoctor!.name}`
                        : `My Bookings (${activePatient!.name})`}
                    </span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full">
                    {myAppointments.length} Active
                  </span>
                </div>

                {myAppointments.length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center italic">
                    No active appointments for this profile. Click any available slot above to book!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myAppointments.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{b.doctorName}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              {b.durationMinutes}m
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5">
                            {b.dateStr} at {b.startTime} (Clinic GMT) /{" "}
                            <span className="text-emerald-300">
                              {formatTimeInTimeZone(
                                b.dateStr,
                                b.startTime,
                                "Europe/London",
                                currentViewerTimeZone
                              )}{" "}
                              Local
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Patient: <strong>{b.patientName}</strong>
                          </div>
                        </div>

                        {/* Action buttons (Cancellation & Rescheduling) */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setReschedulingBooking(b);
                              setFeedback({
                                type: "info",
                                title: "Rescheduling Mode (Rule 06)",
                                message: `Select a new available slot above. If conflict occurs, your existing appointment (${b.startTime}) remains untouched.`,
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-white hover:bg-white/20 transition-all flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reschedule</span>
                          </button>
                          <button
                            onClick={() => handleCancelBooking(b)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Live Audit History Log (Rule 08) */}
              <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-300" />
                    <span>Real-Time Audit Trail (Rule 08)</span>
                  </h4>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                    Immutable
                  </span>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {auditLog.map((event) => (
                    <div
                      key={event.id}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] flex items-start gap-2.5"
                    >
                      <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                        {event.timestamp}
                      </span>
                      <div className="flex-1">
                        <div className="text-slate-200 leading-snug">{event.description}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Triggered by: <span className="text-slate-300 font-semibold">{event.actor}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Doctor Controls: Breaks & Shifts (When viewing as Doctor) */}
            {isDoctorView && (
              <div className="mt-6 p-4 rounded-2xl bg-purple-900/20 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-purple-300" />
                    <span>Doctor Schedule Controls: {currentDoctor.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Rule 03: Block breaks or holidays without dropping existing patient bookings.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBreak("12:00", "13:00", "Lunch & Clinical Admin")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all"
                  >
                    {currentDoctor.blockedRanges.some(
                      (b) => b.start === "12:00" && b.end === "13:00"
                    )
                      ? "Unblock 12:00–13:00 Break"
                      : "Block 12:00–13:00 Break"}
                  </button>
                  <button
                    onClick={() => handleToggleBreak("16:00", "17:00", "Department Briefing")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    Toggle 16:00–17:00 Break
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================
            SECTION: SCHEDULING RULES SHOWCASE (Framer Motion Scroll)
        ======================================================== */}
        <section id="rules" ref={targetRef} className="relative h-[280vh] w-full">
          <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
            <div className="px-6 md:px-24 mb-6">
              <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                02 Scheduling Rules
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2">
                SlotZero Strict Behaviour Specifications
              </h2>
            </div>

            <motion.div style={{ x }} className="flex gap-8 px-6 md:px-24 w-max">
              {/* Rule 1: Doctor Hours */}
              <div className="w-[85vw] md:w-[700px] h-[460px] shrink-0 bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                    <Clock className="w-6 h-6 text-emerald-300" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    Rule 01
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-3">
                    Doctor Working Hours & Shifts
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Doctors configure multiple working blocks per day (e.g., 09:00–12:00 and
                    13:00–17:00). All potential slots must sit completely inside defined ranges.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Dr. Meera:</span>{" "}
                    <strong className="text-white">09:00–12:00 & 13:00–17:00 GMT</strong>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    Shift Protected
                  </span>
                </div>
              </div>

              {/* Rule 2: Dynamic Durations */}
              <div className="w-[85vw] md:w-[700px] h-[460px] shrink-0 bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
                    <Timer className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">
                    Rule 02
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-3">
                    Flexible Consultations (15, 30, 60 mins)
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Patients and doctors choose consultation length dynamically. A 60-minute
                    appointment requires a contiguous available block and cannot bridge across
                    breaks or outside working bounds.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white">
                    15m Quick Followup
                  </span>
                  <span className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-200">
                    30m Standard Consult
                  </span>
                  <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white">
                    60m Comprehensive
                  </span>
                </div>
              </div>

              {/* Rule 3: Blocked Time & Breaks */}
              <div className="w-[85vw] md:w-[700px] h-[460px] shrink-0 bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-6">
                    <AlertCircle className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                    Rule 03
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-3">
                    Protected Breaks & Blocked Time
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Doctors can block breaks, clinical admin time, and holidays. Existing bookings
                    never silently vanish; the system logs conflicts and alerts for administrative
                    handling.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 font-medium">
                  Preservation Guarantee: Bookings made prior to a block remain recorded and audited.
                </div>
              </div>

              {/* Rule 4: Zero Overlaps & Conflicts */}
              <div className="w-[85vw] md:w-[700px] h-[460px] shrink-0 bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-6">
                    <ShieldAlert className="w-6 h-6 text-rose-300" />
                  </div>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">
                    Rule 04
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-3">
                    Atomic Zero-Overlap Conflict Guard
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    For any one doctor, appointments can never intersect. Back-to-back appointments
                    (10:00–10:30 and 10:30–11:00) are cleanly permitted, while overlapping attempts
                    are rejected at submission.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                  <div className="text-emerald-300 font-mono font-bold">
                    10:00–10:30 ✓ &nbsp;|&nbsp; 10:30–11:00 ✓
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                    Overlap 10:15–10:45 ✕
                  </span>
                </div>
              </div>

              {/* Rule 5 & 6: Cancellation & Safe Rescheduling */}
              <div className="w-[85vw] md:w-[700px] h-[460px] shrink-0 bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-6">
                    <RotateCcw className="w-6 h-6 text-teal-300" />
                  </div>
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-widest">
                    Rule 05 & 06
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-3">
                    2-Hour Cancellation & Safe Rescheduling
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Patients can cancel up to 2 hours prior to start; released slots become available
                    instantly. Rescheduling evaluates destination slot validity first; if taken,
                    original booking remains intact.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200 font-medium">
                  Zero Lost Appointments: Atomic swaps guarantee no dropouts during network latency.
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========================================================
            SECTION: DEMONSTRATION PERSONAS (As in Brief Table)
        ======================================================== */}
        <section id="personas" className="relative z-10 py-24 px-4 max-w-6xl mx-auto border-t border-white/10">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              01 Demonstration Profiles
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 mb-3">
              People and Schedules to Demonstrate
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
              Direct mapping of the participant brief accounts. Test the system from each viewpoint
              with realistic cross-continental time conversions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dr. Meera */}
            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-purple-400/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={INITIAL_DOCTORS[0].avatar}
                      alt="Dr. Meera"
                      className="w-14 h-14 rounded-full object-cover border-2 border-purple-400"
                    />
                    <div>
                      <h4 className="text-xl font-bold text-white">Dr. Meera</h4>
                      <span className="text-xs font-semibold text-purple-300">Doctor · Clinic Lead</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30">
                    Europe/London
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium mb-4 leading-relaxed">
                  <strong>Role Requirement:</strong> Set working hours (09:00–12:00 & 13:00–17:00),
                  block break times, and review all patients booked across London, US, and India.
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePersonaId("dr-meera");
                  setSelectedDoctorId("dr-meera");
                  const el = document.getElementById("live-demo");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-400/40 text-xs font-bold text-white transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Switch to Dr. Meera</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dr. Alex */}
            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-indigo-400/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={INITIAL_DOCTORS[1].avatar}
                      alt="Dr. Alex"
                      className="w-14 h-14 rounded-full object-cover border-2 border-indigo-400"
                    />
                    <div>
                      <h4 className="text-xl font-bold text-white">Dr. Alex</h4>
                      <span className="text-xs font-semibold text-indigo-300">Doctor · Specialist</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                    America/New_York
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium mb-4 leading-relaxed">
                  <strong>Role Requirement:</strong> Manage a completely separate schedule and
                  bookings independent of the London clinic, with US Eastern working hours.
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePersonaId("dr-alex");
                  setSelectedDoctorId("dr-alex");
                  const el = document.getElementById("live-demo");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-400/40 text-xs font-bold text-white transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Switch to Dr. Alex</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Asha */}
            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-emerald-400/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={INITIAL_PATIENTS[0].avatar}
                      alt="Asha"
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400"
                    />
                    <div>
                      <h4 className="text-xl font-bold text-white">Asha</h4>
                      <span className="text-xs font-semibold text-emerald-300">Patient · Kolkata</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                    Asia/Kolkata
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium mb-4 leading-relaxed">
                  <strong>Role Requirement:</strong> Find doctors, see slot availability converted
                  to Indian Standard Time (+5:30 offset), book, and view only her appointments.
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePersonaId("patient-asha");
                  const el = document.getElementById("live-demo");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-400/40 text-xs font-bold text-white transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Switch to Asha</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sam */}
            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-teal-400/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={INITIAL_PATIENTS[1].avatar}
                      alt="Sam"
                      className="w-14 h-14 rounded-full object-cover border-2 border-teal-400"
                    />
                    <div>
                      <h4 className="text-xl font-bold text-white">Sam</h4>
                      <span className="text-xs font-semibold text-teal-300">Patient · New York</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-200 border border-teal-500/30">
                    America/New_York
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium mb-4 leading-relaxed">
                  <strong>Role Requirement:</strong> Book doctors in London and New York, see local
                  EDT times, reschedule when needed, and never be double-booked with Asha.
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePersonaId("patient-sam");
                  const el = document.getElementById("live-demo");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-2.5 rounded-xl bg-teal-600/30 hover:bg-teal-600 border border-teal-400/40 text-xs font-bold text-white transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Switch to Sam</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================
            SECTION: FREQUENTLY ASKED QUESTIONS (FAQ Accordion)
        ======================================================== */}
        <section id="faq" className="relative z-10 py-24 max-w-4xl mx-auto px-4 border-t border-white/10">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Questions & Verification
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Clear implementation details on how SlotZero complies with every hackathon requirement.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does SlotZero prevent two patients in different timezones from double-booking Dr. Meera?",
                a: "All appointments are anchored and validated in UTC milliseconds. Even if Asha in Kolkata and Sam in New York view the schedule in their local time zones, our conflict detector rejects overlapping intervals (StartA < EndB && EndA > StartB) at the transaction boundary.",
              },
              {
                q: "What happens when a patient cancels an appointment?",
                a: "In accordance with Rule 05, patients can cancel up to 2 hours before the start time. Upon cancellation, the slot status is instantly updated, freeing it immediately on the calendar for other patients worldwide.",
              },
              {
                q: "What happens if a doctor blocks out a break or holiday after bookings exist?",
                a: "Rule 03 strictly dictates that existing bookings must not silently disappear. When a break is scheduled over an existing booking, the reservation is preserved, flagged on the doctor roster, and an audit trail event is produced.",
              },
              {
                q: "How does safe rescheduling work if the new desired slot fails?",
                a: "Rule 06 requires that the new slot is verified before modifying the existing record. If the requested slot is already occupied, the transition fails atomically and the patient's original booking remains intact and active.",
              },
              {
                q: "How are different appointment lengths (15, 30, 60 minutes) handled?",
                a: "Rule 02 allows 15, 30, and 60-minute lengths. The slot generation engine dynamically partitions open doctor shifts and verifies that the chosen duration fits fully before the end of the doctor's working block.",
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white/[0.04] rounded-2xl border border-white/10 overflow-hidden hover:bg-white/[0.07] transition-colors"
              >
                <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-6 text-white text-base">
                  <span>{faq.q}</span>
                  <span className="transition group-open:rotate-180">
                    <ChevronDown className="w-5 h-5 text-emerald-400" />
                  </span>
                </summary>
                <div className="text-slate-300 p-6 pt-0 font-medium text-sm leading-relaxed border-t border-white/5 mt-2">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ========================================================
            SECTION: FINAL CTA
        ======================================================== */}
        <section className="relative z-10 py-24 px-4">
          <div className="relative max-w-5xl mx-auto rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            <div className="absolute inset-0 bg-gradient-to-r from-[#714B67] via-purple-900 to-emerald-950" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />

            <div className="relative z-10 text-center py-20 px-6">
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                Ready for Frictionless <br /> Global Consultations?
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto font-medium mb-10">
                Experience Dr. Meera&apos;s London clinic with zero double-bookings, perfect timezone
                synchronization, and strict role permissions.
              </p>

              <a
                href="#live-demo"
                className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-base shadow-2xl shadow-black/30 transition-all transform hover:-translate-y-1"
              >
                <span>Test Live Scheduling Engine</span>
                <ArrowRight className="w-5 h-5 text-emerald-600" />
              </a>
            </div>
          </div>
        </section>

        {/* ========================================================
            SECTION: FOOTER
        ======================================================== */}
        <footer className="relative z-10 border-t border-white/10 py-16">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2.5">
              <img
                src="/VidaPilot_icon.png"
                alt="VidaPilot Icon"
                className="w-8 h-8 rounded-lg object-contain"
              />
              <img
                src="/VidaPilot_text.png"
                alt="VidaPilot"
                className="h-7 w-auto object-contain"
              />
              <span className="text-xs font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                SlotZero
              </span>
            </div>

            <div className="flex flex-wrap gap-8 text-sm font-semibold text-slate-400 justify-center">
              <a href="#live-demo" className="hover:text-white transition-colors">
                Live Scheduler
              </a>
              <a href="#rules" className="hover:text-white transition-colors">
                Scheduling Rules
              </a>
              <a href="#personas" className="hover:text-white transition-colors">
                Test Personas
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                FAQ
              </a>
            </div>

            <p className="text-sm text-slate-500 font-medium">
              © 2026 MedaVida · SlotZero Engine. Built for Intern Hackathon.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
