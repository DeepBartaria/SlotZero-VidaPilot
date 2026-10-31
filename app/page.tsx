"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Clock,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
  Timer,
} from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";
import AppleIntro from "@/components/AppleIntro";
import { INITIAL_DOCTORS, INITIAL_PATIENTS } from "@/lib/scheduling";

export default function LandingPage() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"]);

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
              <a href="#rules" className="hover:text-emerald-300 transition-colors">
                Scheduling Rules
              </a>
              <a href="#personas" className="hover:text-emerald-300 transition-colors">
                Test Personas
              </a>
              <a href="#faq" className="hover:text-emerald-300 transition-colors">
                FAQ & Specs
              </a>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="bg-white hover:bg-slate-100 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all text-slate-900 shadow-md shadow-black/20 flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Sign In / Dashboard</span>
              </Link>
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
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
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 via-teal-600 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-extrabold shadow-lg shadow-emerald-700/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span>Launch White Clinical Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#rules"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/15 hover:bg-white/10 text-white font-bold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
              <span>Explore Engine Specifications</span>
            </a>
          </motion.div>
        </main>

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
              Direct mapping of the participant brief accounts. Access the real clinical scheduling
              system from each viewpoint with authentic multi-timezone synchronization.
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
                      <h4 className="text-xl font-bold text-white">Dr. Meera Patel</h4>
                      <span className="text-xs font-semibold text-purple-300">Doctor · Clinic Lead</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30">
                    Europe/London
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium mb-6 leading-relaxed">
                  <strong>Role Requirement:</strong> Set working hours (09:00–12:00 & 13:00–17:00),
                  block break times, and review all patients booked across London, US, and India.
                </div>
              </div>
              <Link
                href="/login?email=dr.meera@medavida.com"
                className="w-full py-3 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-400/40 text-xs font-bold text-white transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In as Dr. Meera</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
                      <h4 className="text-xl font-bold text-white">Dr. Alex Rivera</h4>
                      <span className="text-xs font-semibold text-indigo-300">Doctor · Specialist</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                    America/New_York
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium mb-6 leading-relaxed">
                  <strong>Role Requirement:</strong> Manage a completely separate schedule and
                  bookings independent of the London clinic, with US Eastern working hours.
                </div>
              </div>
              <Link
                href="/login?email=dr.alex@medavida.com"
                className="w-full py-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-400/40 text-xs font-bold text-white transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In as Dr. Alex</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
                      <h4 className="text-xl font-bold text-white">Asha Sharma</h4>
                      <span className="text-xs font-semibold text-emerald-300">Patient · Kolkata</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                    Asia/Kolkata
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium mb-6 leading-relaxed">
                  <strong>Role Requirement:</strong> Find doctors, see slot availability converted
                  to Indian Standard Time (+5:30 offset), book, and view only her appointments.
                </div>
              </div>
              <Link
                href="/login?email=asha@medavida.com"
                className="w-full py-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-400/40 text-xs font-bold text-white transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In as Asha Sharma</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
                      <h4 className="text-xl font-bold text-white">Sam Taylor</h4>
                      <span className="text-xs font-semibold text-teal-300">Patient · New York</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-200 border border-teal-500/30">
                    America/New_York
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium mb-6 leading-relaxed">
                  <strong>Role Requirement:</strong> Book doctors in London and New York, see local
                  EDT times, reschedule when needed, and never be double-booked with Asha.
                </div>
              </div>
              <Link
                href="/login?email=sam@medavida.com"
                className="w-full py-3 rounded-xl bg-teal-600/30 hover:bg-teal-600 border border-teal-400/40 text-xs font-bold text-white transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In as Sam Taylor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
                a: "All appointments are anchored and validated in UTC milliseconds. Even if Asha in Kolkata and Sam in New York view the schedule in their local time zones, our conflict detector rejects overlapping intervals at the PostgreSQL serializable transaction boundary.",
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

              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-base shadow-2xl shadow-black/30 transition-all transform hover:-translate-y-1"
              >
                <span>Launch Enterprise Dashboard</span>
                <ArrowRight className="w-5 h-5 text-emerald-600" />
              </Link>
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
              <a href="#rules" className="hover:text-white transition-colors">
                Scheduling Rules
              </a>
              <a href="#personas" className="hover:text-white transition-colors">
                Test Personas
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                FAQ
              </a>
              <Link href="/login" className="hover:text-white transition-colors">
                Dashboard Login
              </Link>
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
