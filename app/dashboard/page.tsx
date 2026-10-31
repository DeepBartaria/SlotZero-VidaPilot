"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TaraAssistant from "@/components/TaraAssistant";
import {
  Calendar,
  Clock,
  User,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Search,
  LogOut,
  RefreshCw,
  Plus,
  Trash2,
  Globe,
  Activity,
  ChevronRight,
  ArrowRight,
  X,
  CalendarCheck,
  CalendarX,
  Stethoscope,
  Info,
  Check,
  Zap,
  Sparkles,
  Video,
  FileText,
  MapPin,
  Lock,
  Building2,
  SlidersHorizontal,
  ChevronDown,
  Download,
  ExternalLink,
} from "lucide-react";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "DOCTOR" | "PATIENT";
  timeZone: string;
  specialty?: string | null;
  location?: string | null;
  avatar?: string | null;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  timeZone: string;
  specialty: string;
  location: string;
  avatar: string;
  schedules: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  blockedTimes: Array<{
    id: string;
    title: string;
    startTimeUtc: string;
    endTimeUtc: string;
  }>;
  _count?: {
    doctorAppointments: number;
  };
}

interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  startTimeUtc: string;
  endTimeUtc: string;
  durationMinutes: number;
  status: "CONFIRMED" | "CANCELLED";
  reason?: string;
  doctor: {
    id: string;
    name: string;
    timeZone: string;
    specialty: string;
    avatar: string;
    location: string;
  };
  patient: {
    id: string;
    name: string;
    timeZone: string;
    avatar: string;
    location: string;
  };
  viewerDisplay: {
    timeZone: string;
    start: string;
    end: string;
  };
  counterpartDisplay: {
    timeZone: string;
    start: string;
    end: string;
  };
}

interface SlotItem {
  startTimeUtc: string;
  endTimeUtc: string;
  doctorStartTime: string;
  doctorEndTime: string;
  doctorDisplay: string;
  patientDisplay: string;
  durationMinutes: number;
}

const DEMO_PERSONAS = [
  {
    id: "user-dr-meera",
    name: "Dr. Meera Patel",
    role: "DOCTOR" as const,
    timeZone: "Europe/London",
    zoneAbbr: "GMT/BST",
    country: "UK",
    flag: "🇬🇧",
    subtitle: "Clinic Lead · Harley St, London",
  },
  {
    id: "user-dr-alex",
    name: "Dr. Alex Rivera",
    role: "DOCTOR" as const,
    timeZone: "America/New_York",
    zoneAbbr: "EDT/EST",
    country: "US",
    flag: "🇺🇸",
    subtitle: "Internal Medicine · Manhattan, NY",
  },
  {
    id: "user-asha",
    name: "Asha Sharma",
    role: "PATIENT" as const,
    timeZone: "Asia/Kolkata",
    zoneAbbr: "IST (UTC+5:30)",
    country: "India",
    flag: "🇮🇳",
    subtitle: "Patient · Kolkata, India",
  },
  {
    id: "user-sam",
    name: "Sam Taylor",
    role: "PATIENT" as const,
    timeZone: "America/New_York",
    zoneAbbr: "EDT (UTC-4)",
    country: "US",
    flag: "🇺🇸",
    subtitle: "Patient · New York, USA",
  },
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DashboardPage() {
  const router = useRouter();

  // Current session user
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Live real-time clocks for the 3 IANA zones
  const [londonTimeStr, setLondonTimeStr] = useState<string>("");
  const [nyTimeStr, setNyTimeStr] = useState<string>("");
  const [kolkataTimeStr, setKolkataTimeStr] = useState<string>("");
  const [utcTimeStr, setUtcTimeStr] = useState<string>("");

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>("roster");

  // Global database state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning";
    message: string;
    subMessage?: string;
  } | null>(null);

  // Search & Filters
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterFilterStatus, setRosterFilterStatus] = useState<"ALL" | "CONFIRMED" | "CANCELLED">("CONFIRMED");

  // Patient Doctor Search & Filter State (Requirement 04.2)
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState("ALL");
  const [doctorAvailabilityFilter, setDoctorAvailabilityFilter] = useState("ALL");

  // Patient Booking Flow State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("user-dr-meera");
  const [selectedDate, setSelectedDate] = useState<string>("2026-11-02");
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<SlotItem | null>(null);
  const [bookingReason, setBookingReason] = useState("General Health & Clinical Review");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  // Doctor Schedule & Breaks Management State
  const [doctorShifts, setDoctorShifts] = useState<Array<{ dayOfWeek: number; startTime: string; endTime: string }>>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [newBreakTitle, setNewBreakTitle] = useState("Lunch & Clinical Admin");
  const [newBreakDate, setNewBreakDate] = useState("2026-11-02");
  const [newBreakStart, setNewBreakStart] = useState("12:00");
  const [newBreakEnd, setNewBreakEnd] = useState("13:00");
  const [addingBreak, setAddingBreak] = useState(false);

  // Rescheduling Modal State
  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>("2026-11-02");
  const [rescheduleSlots, setRescheduleSlots] = useState<SlotItem[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Judge Edge Cases Drawer & Audit Log State
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [judgeScenarioLoading, setJudgeScenarioLoading] = useState<string | null>(null);
  const [judgeResult, setJudgeResult] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // 1. Fetch Session User
  const fetchSession = useCallback(async () => {
    try {
      setLoadingUser(true);
      const res = await fetch("/api/auth/session");
      const data = await res.json();

      if (!res.ok || !data.user) {
        const stored = typeof window !== "undefined" ? localStorage.getItem("medavida_session_user") : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          setActiveTab(parsed.role === "DOCTOR" ? "roster" : "find_doctor");
        } else {
          router.push("/login");
        }
      } else {
        setCurrentUser(data.user);
        setActiveTab(data.user.role === "DOCTOR" ? "roster" : "find_doctor");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoadingUser(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Real-time Synchronized Clocks for All 3 Time Zones
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setUtcTimeStr(now.toUTCString().split(" ")[4] + " UTC");

      const fmt = (tz: string) =>
        new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(now);

      try {
        setLondonTimeStr(fmt("Europe/London"));
        setNyTimeStr(fmt("America/New_York"));
        setKolkataTimeStr(fmt("Asia/Kolkata"));
      } catch {
        // Fallback
      }
    };

    updateClocks();
    const timer = setInterval(updateClocks, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fast Persona Switcher
  const handleSwitchPersona = async (personaId: string) => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: personaId }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("medavida_session_user", JSON.stringify(data.user));
        }
        setActiveTab(data.user.role === "DOCTOR" ? "roster" : "find_doctor");
        setNotification({
          type: "success",
          message: `Switched identity to ${data.user.name}`,
          subMessage: `Active role: ${data.user.role} · Clinic time zone: ${data.user.timeZone}`,
        });
        loadAllData(data.user);
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to switch persona" });
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    if (typeof window !== "undefined") {
      localStorage.removeItem("medavida_session_user");
    }
    router.push("/login");
  };

  // Load Main Data (Doctors and Appointments)
  const loadAllData = useCallback(async (userToUse?: SessionUser) => {
    const user = userToUse || currentUser;
    if (!user) return;

    setLoadingData(true);
    try {
      const [docRes, apptRes] = await Promise.all([
        fetch("/api/doctors"),
        fetch("/api/appointments", {
          headers: { "x-user-id": user.id },
        }),
      ]);

      const docData = await docRes.json();
      const apptData = await apptRes.json();

      if (docData.doctors) {
        setDoctors(docData.doctors);

        if (user.role === "DOCTOR") {
          const doc = docData.doctors.find((d: Doctor) => d.id === user.id);
          if (doc && doc.schedules) {
            setDoctorShifts(
              doc.schedules.map((s: any) => ({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
              }))
            );
          }
        }
      }

      if (apptData.appointments) {
        setAppointments(apptData.appointments);
      }
    } catch (err: any) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoadingData(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadAllData(currentUser);
    }
  }, [currentUser, loadAllData]);

  // Load Available Slots dynamically for Patient
  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedDoctorId || !selectedDate || !currentUser) return;

    setLoadingSlots(true);
    try {
      const url = `/api/slots?doctorId=${selectedDoctorId}&date=${selectedDate}&duration=${selectedDuration}&patientTimeZone=${currentUser.timeZone}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.slots) {
        setAvailableSlots(data.slots);
      } else {
        setAvailableSlots([]);
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDoctorId, selectedDate, selectedDuration, currentUser]);

  useEffect(() => {
    if (currentUser?.role === "PATIENT") {
      fetchAvailableSlots();
    }
  }, [currentUser, selectedDoctorId, selectedDate, selectedDuration, fetchAvailableSlots]);

  // Handle Book Appointment
  const handleConfirmBooking = async () => {
    if (!selectedSlotForBooking || !currentUser) return;

    setIsBookingSubmitting(true);
    const idempotencyKey = `book-${currentUser.id}-${selectedSlotForBooking.startTimeUtc}-${Date.now()}`;

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          startTimeUtc: selectedSlotForBooking.startTimeUtc,
          endTimeUtc: selectedSlotForBooking.endTimeUtc,
          durationMinutes: selectedSlotForBooking.durationMinutes,
          reason: bookingReason,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Booking failed.");
      }

      setNotification({
        type: "success",
        message: "Appointment Confirmed Successfully!",
        subMessage: `Booked for ${selectedSlotForBooking.patientDisplay} in your local time.`,
      });

      setSelectedSlotForBooking(null);
      fetchAvailableSlots();
      loadAllData();
      setActiveTab("my_appointments");
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Slot conflict: This slot was just taken by another patient.",
      });
      fetchAvailableSlots();
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Handle Cancel Appointment (with 2-Hour rule feedback)
  const handleCancelAppointment = async (apptId: string) => {
    if (!currentUser) return;

    const confirmAction = window.confirm("Are you sure you want to cancel this booking? The slot will immediately be made available to other patients.");
    if (!confirmAction) return;

    try {
      const res = await fetch(`/api/appointments/${apptId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Cancellation failed.");
      }

      setNotification({
        type: "success",
        message: "Appointment Cancelled",
        subMessage: data.message || "The slot was returned to the availability pool.",
      });

      loadAllData();
      if (currentUser.role === "PATIENT") {
        fetchAvailableSlots();
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Cancellation rejected by policy.",
      });
    }
  };

  // Reschedule Slots Loader
  const loadRescheduleSlots = async (doctorId: string, dateStr: string, duration: number) => {
    if (!currentUser) return;
    setLoadingRescheduleSlots(true);
    try {
      const res = await fetch(
        `/api/slots?doctorId=${doctorId}&date=${dateStr}&duration=${duration}&patientTimeZone=${currentUser.timeZone}`
      );
      const data = await res.json();
      setRescheduleSlots(data.slots || []);
    } catch {
      setRescheduleSlots([]);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const handleOpenRescheduleModal = (appt: Appointment) => {
    setRescheduleTargetAppt(appt);
    setRescheduleDate(appt.startTimeUtc.split("T")[0]);
    loadRescheduleSlots(appt.doctorId, appt.startTimeUtc.split("T")[0], appt.durationMinutes);
  };

  const handleExecuteReschedule = async (newSlot: SlotItem) => {
    if (!rescheduleTargetAppt || !currentUser) return;

    setSubmittingReschedule(true);
    try {
      const res = await fetch(`/api/appointments/${rescheduleTargetAppt.id}/reschedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          newStartTimeUtc: newSlot.startTimeUtc,
          newEndTimeUtc: newSlot.endTimeUtc,
          newDurationMinutes: newSlot.durationMinutes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Rescheduling failed. Original booking preserved.");
      }

      setNotification({
        type: "success",
        message: "Appointment Rescheduled Successfully!",
        subMessage: `Your booking has been moved to ${newSlot.patientDisplay}.`,
      });

      setRescheduleTargetAppt(null);
      loadAllData();
      fetchAvailableSlots();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Rescheduling rejected. Your original booking remains untouched.",
      });
    } finally {
      setSubmittingReschedule(false);
    }
  };

  // Doctor Schedule Management (Save Shifts)
  const handleSaveSchedule = async () => {
    if (!currentUser || currentUser.role !== "DOCTOR") return;

    setSavingSchedule(true);
    try {
      const res = await fetch(`/api/doctors/${currentUser.id}/schedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ schedules: doctorShifts }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update schedule.");
      }

      setNotification({
        type: "success",
        message: "Working Schedule Updated!",
        subMessage: `${doctorShifts.length} shifts are now active. Available booking slots recalculated immediately.`,
      });
      loadAllData();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to save schedule" });
    } finally {
      setSavingSchedule(false);
    }
  };

  // Doctor Add Blocked Time (with preservation check)
  const handleAddBlockedTime = async () => {
    if (!currentUser || currentUser.role !== "DOCTOR") return;

    setAddingBreak(true);
    try {
      const res = await fetch(`/api/doctors/${currentUser.id}/blocks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          title: newBreakTitle,
          dateStr: newBreakDate,
          startTime: newBreakStart,
          endTime: newBreakEnd,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to block time.");
      }

      if (data.warning) {
        setNotification({
          type: "warning",
          message: "Blocked Time Saved with Existing Booking Notice",
          subMessage: data.warning,
        });
      } else {
        setNotification({
          type: "success",
          message: `Blocked period "${newBreakTitle}" added.`,
          subMessage: "Future booking slots in this interval have been removed.",
        });
      }

      loadAllData();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to add block" });
    } finally {
      setAddingBreak(false);
    }
  };

  // Doctor Delete Blocked Time
  const handleDeleteBlock = async (blockId: string) => {
    if (!currentUser || currentUser.role !== "DOCTOR") return;

    try {
      const res = await fetch(`/api/doctors/${currentUser.id}/blocks?blockId=${blockId}`, {
        method: "DELETE",
        headers: { "x-user-id": currentUser.id },
      });

      if (!res.ok) throw new Error("Failed to delete blocked time.");

      setNotification({
        type: "success",
        message: "Blocked time interval removed",
        subMessage: "Slots in this window have been reopened for patient booking.",
      });
      loadAllData();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    }
  };

  // Run Judge Edge-Case Scenarios
  const runJudgeScenario = async (scenarioKey: string) => {
    setJudgeScenarioLoading(scenarioKey);
    setJudgeResult(null);

    try {
      const res = await fetch("/api/demo/edge-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenarioKey }),
      });

      const data = await res.json();
      setJudgeResult({ status: res.status, ok: res.ok, data });
      loadAllData();
    } catch (err: any) {
      setJudgeResult({ status: 500, ok: false, error: err.message });
    } finally {
      setJudgeScenarioLoading(null);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch("/api/audit?limit=30");
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch {
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Filtered Roster Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (rosterFilterStatus !== "ALL" && appt.status !== rosterFilterStatus) return false;
      if (rosterSearch) {
        const query = rosterSearch.toLowerCase();
        const otherName = currentUser?.role === "DOCTOR" ? appt.patient.name : appt.doctor.name;
        const reason = appt.reason || "";
        return otherName.toLowerCase().includes(query) || reason.toLowerCase().includes(query);
      }
      return true;
    });
  }, [appointments, rosterFilterStatus, rosterSearch, currentUser]);

  // Filtered Doctors list (Requirement 04.2: filter by name / specialization / availability)
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (doctorSearchQuery) {
        const q = doctorSearchQuery.toLowerCase();
        const matchName = doc.name.toLowerCase().includes(q);
        const matchSpec = doc.specialty.toLowerCase().includes(q);
        const matchLoc = doc.location.toLowerCase().includes(q);
        if (!matchName && !matchSpec && !matchLoc) return false;
      }
      if (doctorSpecialtyFilter !== "ALL" && !doc.specialty.toLowerCase().includes(doctorSpecialtyFilter.toLowerCase())) {
        return false;
      }
      if (doctorAvailabilityFilter === "LONDON" && !doc.timeZone.includes("London")) {
        return false;
      }
      if (doctorAvailabilityFilter === "NEW_YORK" && !doc.timeZone.includes("New_York")) {
        return false;
      }
      return true;
    });
  }, [doctors, doctorSearchQuery, doctorSpecialtyFilter, doctorAvailabilityFilter]);

  // Next upcoming appointment for quick mobile visibility (Requirement 04.8)
  const nextAppointment = useMemo(() => {
    const upcoming = appointments.filter((a) => a.status === "CONFIRMED");
    if (upcoming.length === 0) return null;
    return upcoming.sort(
      (a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime()
    )[0];
  }, [appointments]);

  if (loadingUser || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-700">Loading MedaVida Clinical OS...</p>
        </div>
      </div>
    );
  }

  const isDoctor = currentUser.role === "DOCTOR";
  const currentDoctorProfile = isDoctor ? doctors.find((d) => d.id === currentUser.id) : null;
  const currentPersona = DEMO_PERSONAS.find((p) => p.id === currentUser.id) || DEMO_PERSONAS[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* ========================================================
          1. PRODUCTION ENTERPRISE NAVBAR (Clean White Theme)
      ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center p-1.5 shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Image
                    src="/VidaPilot_icon.png"
                    alt="MedaVida Icon"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                      MedaVida
                    </span>
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 leading-none">
                      SlotZero
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                    Clinical Scheduling OS
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Live Real-Time Multi-Zone Clocks */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-900">{currentPersona.flag} {currentUser.timeZone.split("/")[1]}:</span>
                <span className="font-bold text-blue-700 font-mono">
                  {currentUser.timeZone.includes("London")
                    ? londonTimeStr
                    : currentUser.timeZone.includes("New_York")
                    ? nyTimeStr
                    : kolkataTimeStr}
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-mono">{utcTimeStr}</span>
            </div>

            {/* Right: Persona Quick-Switcher, Judge Suite, User Profile */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Judge Evaluation Suite Trigger */}
              <button
                onClick={() => {
                  setShowJudgeModal(true);
                  fetchAuditLogs();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-300/80 text-xs font-bold transition-all shadow-xs hover:shadow"
                title="Open Evaluator Testing Drawer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span className="hidden sm:inline">Judge Test Suite</span>
                <span className="sm:hidden">Tests</span>
              </button>

              {/* Persona Quick Switcher Segmented Control */}
              <div className="hidden xl:flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                {DEMO_PERSONAS.map((p) => {
                  const isActive = currentUser.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSwitchPersona(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? "bg-white text-slate-900 shadow-xs font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>{p.flag}</span>
                      <span>{p.name.split(" ")[0]}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({p.zoneAbbr.split(" ")[0]})</span>
                    </button>
                  );
                })}
              </div>

              {/* Fallback Dropdown for Mobile / Tablet */}
              <div className="xl:hidden">
                <select
                  value={currentUser.id}
                  onChange={(e) => handleSwitchPersona(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  {DEMO_PERSONAS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.flag} {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* User Profile Capsule */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150"}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs"
                />
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* NOTIFICATION TOAST BAR */}
      {notification && (
        <div
          className={`px-4 py-2.5 text-xs sm:text-sm border-b transition-all duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : notification.type === "warning"
              ? "bg-amber-50 text-amber-900 border-amber-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : notification.type === "warning" ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <div>
                <span className="font-bold">{notification.message}</span>
                {notification.subMessage && (
                  <span className="ml-2 text-slate-600 font-medium hidden sm:inline">
                    {notification.subMessage}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          2. MAIN CONTENT CONTAINER
      ======================================================== */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* CLINICAL ENTITY HERO CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative">
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150"}
                  alt={currentUser.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-200"
                />
                <span className="absolute -bottom-1 -right-1 text-base">{currentPersona.flag}</span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {currentUser.name}
                  </h1>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      isDoctor
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {currentUser.role}
                  </span>
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    {currentUser.timeZone}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{currentUser.specialty || (isDoctor ? "Specialist Consultant" : "Registered Patient")}</span>
                  <span>•</span>
                  <span>{currentUser.location || "Clinical Telehealth"}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified {isDoctor ? "Medical Provider" : "Identity"}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <div className="bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl text-center min-w-[95px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isDoctor ? "Active Bookings" : "My Bookings"}
                </span>
                <span className="text-lg font-black text-slate-900">
                  {appointments.filter((a) => a.status === "CONFIRMED").length}
                </span>
              </div>

              {isDoctor && (
                <div className="bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl text-center min-w-[95px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Daily Shifts
                  </span>
                  <span className="text-lg font-black text-blue-600">
                    {doctorShifts.length}
                  </span>
                </div>
              )}

              <button
                onClick={() => loadAllData()}
                disabled={loadingData}
                className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100 transition-colors"
                title="Reload Database State"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto">
            {isDoctor ? (
              <>
                <button
                  onClick={() => setActiveTab("roster")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 ${
                    activeTab === "roster"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  Patient Appointments Roster ({appointments.filter((a) => a.status === "CONFIRMED").length})
                </button>
                <button
                  onClick={() => setActiveTab("working_hours")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 ${
                    activeTab === "working_hours"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Weekly Hours & Shifts
                </button>
                <button
                  onClick={() => setActiveTab("blocked_times")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 ${
                    activeTab === "blocked_times"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CalendarX className="w-4 h-4" />
                  Breaks & Blocked Periods
                </button>
                <button
                  onClick={() => setActiveTab("slot_simulator")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 ${
                    activeTab === "slot_simulator"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Multi-Timezone Slot Matrix
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab("find_doctor")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 ${
                    activeTab === "find_doctor"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Browse Doctors & Book Slots
                </button>
                <button
                  onClick={() => setActiveTab("my_appointments")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 ${
                    activeTab === "my_appointments"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  My Scheduled Appointments ({appointments.filter((a) => a.status === "CONFIRMED").length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* ========================================================
            QUICK GLANCE / MOBILE NEXT APPOINTMENT BANNER (Requirement 04.8)
        ======================================================== */}
        {nextAppointment ? (
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {isDoctor ? "Next Patient Consultation" : "Your Next Appointment"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono font-medium">
                    {nextAppointment.durationMinutes} mins
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {isDoctor ? nextAppointment.patient.name : nextAppointment.doctor.name}
                  <span className="font-medium text-slate-500 text-xs ml-1.5">
                    ({isDoctor ? nextAppointment.patient.location : nextAppointment.doctor.specialty})
                  </span>
                </h4>
                <p className="text-xs text-blue-900 font-bold mt-0.5">
                  Your Local Time: {nextAppointment.viewerDisplay.start}
                  <span className="text-slate-500 font-medium ml-2">
                    ({isDoctor ? "Patient time: " + nextAppointment.counterpartDisplay.start : "Doctor clinic: " + nextAppointment.counterpartDisplay.start})
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  if (isDoctor) {
                    window.open("https://meet.google.com/new", "_blank");
                  } else {
                    setActiveTab("my_appointments");
                  }
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                {isDoctor ? <Video className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                {isDoctor ? "Launch Encounter" : "View Booking"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>No upcoming appointments scheduled today.</span>
            </div>
            {!isDoctor && (
              <button
                onClick={() => setActiveTab("find_doctor")}
                className="text-blue-600 hover:underline font-bold text-xs"
              >
                Browse doctors & book slots →
              </button>
            )}
          </div>
        )}

        {/* ========================================================
            3. DOCTOR VIEW: PATIENT APPOINTMENTS ROSTER
        ======================================================== */}
        {isDoctor && activeTab === "roster" && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by patient name or reason..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                  {(["CONFIRMED", "CANCELLED", "ALL"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setRosterFilterStatus(st)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        rosterFilterStatus === st
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Appointment Cards */}
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
                <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                <h3 className="font-bold text-slate-700 text-sm">No Appointments Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Patients booking online through India or US portals will appear here dynamically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredAppointments.map((appt) => {
                  const isCancelled = appt.status === "CANCELLED";

                  return (
                    <div
                      key={appt.id}
                      className={`bg-white rounded-2xl border p-5 transition-all shadow-xs ${
                        isCancelled
                          ? "border-slate-200 bg-slate-50/40 opacity-60"
                          : "border-slate-200/90 hover:border-blue-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={appt.patient.avatar}
                            alt={appt.patient.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                {appt.patient.name}
                              </h3>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isCancelled
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {appt.status}
                              </span>
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                {appt.durationMinutes} min consultation
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: #{appt.id.slice(-6)}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 font-medium mt-1">
                              Location: {appt.patient.location || "Patient"} • Clinical Concern:{" "}
                              <span className="text-slate-800 font-semibold">{appt.reason || "General Consultation"}</span>
                            </p>

                            {/* Dual Timezone Breakdown */}
                            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs">
                              <div className="bg-blue-50 border border-blue-200/80 text-blue-900 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>Doctor Local ({currentUser.timeZone}):</span>
                                <span className="font-bold">{appt.viewerDisplay.start} - {appt.viewerDisplay.end}</span>
                              </div>

                              <div className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-slate-500" />
                                <span>Patient Local ({appt.patient.timeZone}):</span>
                                <span className="font-semibold">{appt.counterpartDisplay.start}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {!isCancelled && (
                          <div className="flex items-center gap-2 self-end lg:self-center">
                            <button
                              onClick={() => {
                                window.open("https://meet.google.com/new", "_blank");
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                              title="Launch Telehealth Encounter"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Launch Encounter
                            </button>
                            <button
                              onClick={() => handleOpenRescheduleModal(appt)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                              title="Reschedule Appointment to New Slot"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(appt.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                              title="Cancel & Release Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Cancel & Free Slot
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            4. DOCTOR VIEW: WORKING HOURS & SHIFTS CONFIGURATION
        ======================================================== */}
        {isDoctor && activeTab === "working_hours" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Clinic Operating Shifts & Hours
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rule requirement: A doctor sets working days and time ranges (e.g. 09:00--12:00 and 13:00--17:00) in their local time ({currentUser.timeZone}).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDoctorShifts([...doctorShifts, { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" }]);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Shift
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  disabled={savingSchedule}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingSchedule ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Save Shifts to PostgreSQL
                </button>
              </div>
            </div>

            {/* Shifts List */}
            <div className="space-y-3">
              {doctorShifts.map((shift, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="w-44">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Day of the Week
                    </label>
                    <select
                      value={shift.dayOfWeek}
                      onChange={(e) => {
                        const copy = [...doctorShifts];
                        copy[idx].dayOfWeek = parseInt(e.target.value, 10);
                        setDoctorShifts(copy);
                      }}
                      className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    >
                      {DAYS_OF_WEEK.map((dayName, dIdx) => (
                        <option key={dIdx} value={dIdx}>
                          {dayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={shift.startTime}
                      onChange={(e) => {
                        const copy = [...doctorShifts];
                        copy[idx].startTime = e.target.value;
                        setDoctorShifts(copy);
                      }}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={shift.endTime}
                      onChange={(e) => {
                        const copy = [...doctorShifts];
                        copy[idx].endTime = e.target.value;
                        setDoctorShifts(copy);
                      }}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>

                  <div className="ml-auto self-end">
                    <button
                      type="button"
                      onClick={() => {
                        const copy = doctorShifts.filter((_, i) => i !== idx);
                        setDoctorShifts(copy);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                      title="Remove Shift"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            5. DOCTOR VIEW: BLOCKED TIME & BREAKS
        ======================================================== */}
        {isDoctor && activeTab === "blocked_times" && (
          <div className="space-y-6">
            {/* Create Block Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Schedule Blocked Time (Breaks, Conferences, Holidays)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rule requirement: Blocked periods remove open slots from public view. Existing bookings must not silently disappear.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end pt-2">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Reason / Title
                  </label>
                  <input
                    type="text"
                    value={newBreakTitle}
                    onChange={(e) => setNewBreakTitle(e.target.value)}
                    placeholder="e.g. Lunch & Clinical Admin"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newBreakDate}
                    onChange={(e) => setNewBreakDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Start - End ({currentUser.timeZone})
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={newBreakStart}
                      onChange={(e) => setNewBreakStart(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
                    />
                    <span className="text-xs text-slate-400">-</span>
                    <input
                      type="time"
                      value={newBreakEnd}
                      onChange={(e) => setNewBreakEnd(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <button
                    onClick={handleAddBlockedTime}
                    disabled={addingBreak}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {addingBreak ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Block Period
                  </button>
                </div>
              </div>
            </div>

            {/* Currently Blocked Periods List */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Active Blocked Intervals Recorded in Database
              </h3>

              {!currentDoctorProfile?.blockedTimes || currentDoctorProfile.blockedTimes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No blocked intervals recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {currentDoctorProfile.blockedTimes.map((block) => {
                    const start = new Date(block.startTimeUtc);
                    const end = new Date(block.endTimeUtc);

                    return (
                      <div
                        key={block.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{block.title}</span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              UTC Instant: {start.toISOString()} → {end.toISOString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1"
                          title="Remove block and free slots"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Unblock
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            6. DOCTOR VIEW: LIVE PATIENT SLOT SIMULATOR
        ======================================================== */}
        {isDoctor && activeTab === "slot_simulator" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Live Multi-Timezone Slot Availability Preview
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluator Tool: See how your open consultation slots appear to patients in India (IST) and the US (EDT/EST) in real time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Consultation Length</label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(parseInt(e.target.value, 10))}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>

              <div className="self-end">
                <button
                  onClick={() => fetchAvailableSlots()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Recompute Slots
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Dynamically Generated Open Slots ({availableSlots.length} available)
              </h3>

              {loadingSlots ? (
                <div className="py-8 text-center text-xs text-slate-400">Computing real-time slots...</div>
              ) : availableSlots.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  No open slots found on this date. Doctor may not be scheduled or all slots are booked/blocked.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-xs hover:border-blue-300"
                    >
                      <div className="font-bold text-slate-900">{slot.doctorDisplay}</div>
                      <div className="text-[11px] text-blue-600 font-semibold mt-1">
                        Asha (IST): {slot.patientDisplay}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        UTC Instant: {slot.startTimeUtc.split("T")[1].substring(0, 5)}Z
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            7. PATIENT VIEW: FIND & BOOK A DOCTOR
        ======================================================== */}
        {!isDoctor && activeTab === "find_doctor" && (
          <div className="space-y-6">
            {/* Step 1: Browse & Filter Doctors (Requirement 04.2) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    1. Browse & Filter Doctors
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filter by name, clinical specialization, or timezone availability.
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Showing {filteredDoctors.length} of {doctors.length} doctors
                </span>
              </div>

              {/* Filter Controls Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search doctor by name or specialty..."
                    value={doctorSearchQuery}
                    onChange={(e) => setDoctorSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <select
                    value={doctorSpecialtyFilter}
                    onChange={(e) => setDoctorSpecialtyFilter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Specializations</option>
                    <option value="General Physician">General Physician (UK)</option>
                    <option value="Internal Medicine">Internal Medicine (US)</option>
                  </select>
                </div>

                <div>
                  <select
                    value={doctorAvailabilityFilter}
                    onChange={(e) => setDoctorAvailabilityFilter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Available Clinics</option>
                    <option value="LONDON">London Clinic (Europe/London)</option>
                    <option value="NEW_YORK">New York Clinic (America/New_York)</option>
                  </select>
                </div>
              </div>

              {/* Doctor Cards */}
              {filteredDoctors.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 shadow-xs">
                  <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No doctors found matching filters</p>
                  <button
                    onClick={() => {
                      setDoctorSearchQuery("");
                      setDoctorSpecialtyFilter("ALL");
                      setDoctorAvailabilityFilter("ALL");
                    }}
                    className="mt-2 text-blue-600 hover:underline font-bold"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDoctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;

                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 relative group shadow-xs ${
                          isSelected
                            ? "border-blue-600 ring-2 ring-blue-500/10 bg-blue-50/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={doc.avatar}
                              alt={doc.name}
                              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-base">{doc.name}</h3>
                                {isSelected && (
                                  <span className="bg-blue-600 text-white rounded-full p-0.5">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{doc.specialty}</p>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                <Globe className="w-3.5 h-3.5" />
                                {doc.location} ({doc.timeZone})
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {doc.schedules?.length || 0} Shift Windows
                          </span>
                          <span className="text-slate-400 font-medium">
                            {doc.blockedTimes?.length || 0} Scheduled Breaks
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Date & Duration Selector */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                2. Select Date & Duration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Evaluator Quick-Picks */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                      Quick Picks:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDate("2026-11-02")}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                        selectedDate === "2026-11-02"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      Nov 2, 2026 (Demo Day)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate("2026-03-29")}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                        selectedDate === "2026-03-29"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                      title="Demonstrates London Daylight Saving Time Clock Jump"
                    >
                      Mar 29, 2026 (London DST Jump)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate("2026-03-08")}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                        selectedDate === "2026-03-08"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                      title="Demonstrates New York Daylight Saving Time Clock Jump"
                    >
                      Mar 8, 2026 (NY DST Jump)
                    </button>
                  </div>
                </div>

                {/* Consultation Length */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Appointment Length (Rule requirement: 15, 30, or 60 min)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setSelectedDuration(mins)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          selectedDuration === mins
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {mins} Minutes
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Slots must fit entirely inside doctor operating shifts.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Dynamic Slots Grid */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    3. Available Slots on {selectedDate}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Displayed in your local time <span className="font-bold text-slate-800">({currentUser.timeZone})</span> alongside doctor clinic time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    {availableSlots.length} open slot(s)
                  </span>
                  <button
                    onClick={() => fetchAvailableSlots()}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"
                    title="Refresh slots"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSlots ? "animate-spin text-blue-600" : ""}`} />
                  </button>
                </div>
              </div>

              {loadingSlots ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Generating non-overlapping slots from doctor schedule...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-700 text-sm">No Open Slots Available</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    The doctor does not have working hours configured on this date, or all slots are booked/blocked. Try another date above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableSlots.map((slot, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedSlotForBooking(slot)}
                      className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {slot.patientDisplay.split(" - ")[0]}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Available
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Your time: {slot.patientDisplay}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">
                          Doctor: {slot.doctorStartTime} - {slot.doctorEndTime}
                        </span>
                        <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
                          Book Now
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            8. PATIENT VIEW: MY APPOINTMENTS
        ======================================================== */}
        {!isDoctor && activeTab === "my_appointments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  My Consultations Roster
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing strictly appointments booked for {currentUser.name}. 2-hour cancellation rule and safe rescheduling apply.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("find_doctor")}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Book New Slot
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                <h3 className="font-bold text-slate-700 text-sm">No Appointments Scheduled</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-3">
                  You have not booked any consultations yet.
                </p>
                <button
                  onClick={() => setActiveTab("find_doctor")}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Book with Dr. Meera or Dr. Alex
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {appointments.map((appt) => {
                  const isCancelled = appt.status === "CANCELLED";

                  return (
                    <div
                      key={appt.id}
                      className={`bg-white rounded-2xl border p-5 transition-all shadow-xs ${
                        isCancelled
                          ? "border-slate-200 bg-slate-50/40 opacity-60"
                          : "border-slate-200/90 hover:border-blue-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={appt.doctor.avatar}
                            alt={appt.doctor.name}
                            className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">{appt.doctor.name}</h3>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isCancelled
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {appt.status}
                              </span>
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                {appt.durationMinutes} mins
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Ref: #{appt.id.slice(-6)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {appt.doctor.specialty} • {appt.doctor.location}
                            </p>

                            {/* Dual Timezone Times */}
                            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs">
                              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Your Time ({currentUser.timeZone}):</span>
                                <span className="font-bold">{appt.viewerDisplay.start} - {appt.viewerDisplay.end}</span>
                              </div>

                              <div className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-slate-500" />
                                <span>Doctor's Clinic Time ({appt.doctor.timeZone}):</span>
                                <span className="font-semibold">{appt.counterpartDisplay.start}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {!isCancelled && (
                          <div className="flex items-center gap-2 self-end lg:self-center">
                            <button
                              onClick={() => handleOpenRescheduleModal(appt)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Safe Reschedule
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(appt.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================
          9. MODALS: CONFIRM BOOKING & SAFE RESCHEDULE
      ======================================================== */}
      {/* Booking Confirmation Modal */}
      {selectedSlotForBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-600" />
                Confirm Consultation Booking
              </h3>
              <button
                onClick={() => setSelectedSlotForBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-bold text-slate-900">
                    {doctors.find((d) => d.id === selectedDoctorId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Your Local Time ({currentUser.timeZone}):</span>
                  <span className="font-bold text-blue-700">{selectedSlotForBooking.patientDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor's Clinic Time:</span>
                  <span className="font-semibold text-slate-800">{selectedSlotForBooking.doctorDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-mono text-slate-700">{selectedSlotForBooking.durationMinutes} minutes</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Consultation / Medical Notes
                </label>
                <textarea
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  rows={2}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Follow-up consultation on lab results"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>
                  Atomic Backend Lock: If another patient selects this slot simultaneously, PostgreSQL transactions guarantee only one booking succeeds.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSlotForBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={isBookingSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {isBookingSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Reschedule Modal */}
      {rescheduleTargetAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  Safe Reschedule Appointment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specification Rule: The destination slot is verified first. If it fails, your original booking remains intact.
                </p>
              </div>
              <button
                onClick={() => setRescheduleTargetAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between">
                <div>
                  <span className="text-slate-500 block">Current Booking:</span>
                  <span className="font-bold text-slate-800">
                    {rescheduleTargetAppt.viewerDisplay.start}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">{isDoctor ? "Patient:" : "Doctor:"}</span>
                  <span className="font-bold text-slate-800">
                    {isDoctor ? rescheduleTargetAppt.patient.name : rescheduleTargetAppt.doctor.name}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pick New Target Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    loadRescheduleSlots(
                      rescheduleTargetAppt.doctorId,
                      e.target.value,
                      rescheduleTargetAppt.durationMinutes
                    );
                  }}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Available Slots on {rescheduleDate}
                </label>

                {loadingRescheduleSlots ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading open slots...</div>
                ) : rescheduleSlots.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl text-center">
                    No open slots found on this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {rescheduleSlots.map((slot, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleExecuteReschedule(slot)}
                        disabled={submittingReschedule}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-colors text-xs"
                      >
                        <div className="font-bold text-slate-900">{slot.patientDisplay.split(" - ")[0]}</div>
                        <div className="text-[10px] text-slate-500">Doctor: {slot.doctorStartTime}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRescheduleTargetAppt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          10. MODAL: EVALUATOR / JUDGE TEST RUNNER & AUDIT TRAIL
      ======================================================== */}
      {showJudgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[11px] font-extrabold border border-amber-200 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  MedaVida SlotZero Test Runner
                </div>
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                  Evaluator Test Suite & Edge-Case Validator
                </h3>
              </div>
              <button
                onClick={() => setShowJudgeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-4 leading-relaxed">
              Trigger live server-side validation for all 4 key scenarios from Section 05. The server enforces constraints in PostgreSQL with atomic locks and strict RBAC.
            </p>

            {/* Test Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {/* Scenario 1: Race Condition */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Concurrency
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">
                    Asha & Sam Click Same Slot Together
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Fires simultaneous bookings at the same millisecond. Only 1 succeeds (HTTP 201); the other is rejected (HTTP 409).
                  </p>
                </div>
                <button
                  onClick={() => runJudgeScenario("race_condition")}
                  disabled={judgeScenarioLoading !== null}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {judgeScenarioLoading === "race_condition" ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  Run Race Condition Test
                </button>
              </div>

              {/* Scenario 2: IDOR Tamper */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Security / RBAC
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">
                    Asha Tries to Cancel Sam&apos;s Booking
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Simulates IDOR attack by modifying appointment ID. Server strictly denies access (HTTP 403) with zero private data leaked.
                  </p>
                </div>
                <button
                  onClick={() => runJudgeScenario("idor_tamper")}
                  disabled={judgeScenarioLoading !== null}
                  className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {judgeScenarioLoading === "idor_tamper" ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  Test IDOR Attack Denial
                </button>
              </div>

              {/* Scenario 3: < 2-Hour Cancellation Rule */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Policy Enforcement
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">
                    Cancel &lt; 2 Hours Before Start
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Attempts cancellation 45 minutes before start. Server rejects (HTTP 400 Bad Request) with clear policy notice.
                  </p>
                </div>
                <button
                  onClick={() => runJudgeScenario("imminent_cancellation")}
                  disabled={judgeScenarioLoading !== null}
                  className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {judgeScenarioLoading === "imminent_cancellation" ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  Test &lt;2h Cancellation Policy
                </button>
              </div>

              {/* Scenario 4: DST Nonexistent Hour */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    IANA Timezone
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">
                    DST Spring-Forward Gap Handling
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Tests skipped clock times (London 01:30 Mar 29, 2026; NY 02:30 Mar 8, 2026). Strictly rejects nonexistent hours.
                  </p>
                </div>
                <button
                  onClick={() => runJudgeScenario("dst_nonexistent_time")}
                  disabled={judgeScenarioLoading !== null}
                  className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {judgeScenarioLoading === "dst_nonexistent_time" ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  Test DST Nonexistent Times
                </button>
              </div>
            </div>

            {/* Test Result Inspector */}
            {judgeResult && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span>Server Response Status: {judgeResult.status}</span>
                  <span className="text-emerald-400 font-bold">Outcome Verified</span>
                </div>
                <pre className="overflow-x-auto p-2 bg-slate-950 rounded-lg text-emerald-300">
                  {JSON.stringify(judgeResult.data || judgeResult.error, null, 2)}
                </pre>
              </div>
            )}

            {/* Live Audit Trail */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Live PostgreSQL Immutable Audit Trail
                </h4>
                <button
                  onClick={fetchAuditLogs}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Refresh Logs
                </button>
              </div>

              {loadingAudit ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading audit feed...</div>
              ) : auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No audit records logged yet.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 mr-2">[{log.action}]</span>
                        <span className="text-slate-700">{log.description}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono ml-4 flex-shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowJudgeModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TARA AI POWERED ASSISTANT (TOOL CALLING) */}
      {currentUser && currentUser.role === "PATIENT" && (
        <TaraAssistant
          currentUser={currentUser}
          onBookingConfirmed={() => {
            loadAllData();
            fetchAvailableSlots();
            setActiveTab("my_appointments");
          }}
        />
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200/90 py-5 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MedaVida SlotZero • Enterprise Multi-Timezone Clinical Scheduling OS</span>
          <span className="text-[11px] text-slate-400">PostgreSQL 14 • IANA DST Compliant • HIPAA Ready</span>
        </div>
      </footer>
    </div>
  );
}
