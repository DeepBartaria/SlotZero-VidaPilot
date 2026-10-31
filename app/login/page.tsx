"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Stethoscope,
  User,
  Globe,
  KeyRound,
  UserPlus,
  Building2,
  CheckCircle2,
} from "lucide-react";

const TEST_ACCOUNTS = [
  {
    role: "Doctor",
    name: "Dr. Meera Patel",
    email: "dr.meera@medavida.com",
    timeZone: "Europe/London (GMT/BST)",
    flag: "🇬🇧",
    specialty: "General Physician & Clinic Lead",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    role: "Doctor",
    name: "Dr. Alex Rivera",
    email: "dr.alex@medavida.com",
    timeZone: "America/New_York (EDT/EST)",
    flag: "🇺🇸",
    specialty: "Internal Medicine Specialist",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    role: "Patient",
    name: "Asha Sharma",
    email: "asha@medavida.com",
    timeZone: "Asia/Kolkata (IST +5:30)",
    flag: "🇮🇳",
    specialty: "Cross-Border Patient",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    role: "Patient",
    name: "Sam Taylor",
    email: "sam@medavida.com",
    timeZone: "America/New_York (EDT)",
    flag: "🇺🇸",
    specialty: "Cross-Border Patient",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

const TIME_ZONE_OPTIONS = [
  { value: "Europe/London", label: "Europe/London (GMT/BST · UTC+0/+1)", flag: "🇬🇧" },
  { value: "America/New_York", label: "America/New_York (EDT/EST · UTC-4/-5)", flag: "🇺🇸" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST · UTC+5:30)", flag: "🇮🇳" },
];

function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") || "";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);

  // Login form state
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("password123");

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"DOCTOR" | "PATIENT">("PATIENT");
  const [regTimeZone, setRegTimeZone] = useState("Europe/London");
  const [regSpecialty, setRegSpecialty] = useState("");
  const [regLocation, setRegLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
      setPassword("password123");
    }
  }, [prefillEmail]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Invalid email or password.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("medavida_session_user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          role: regRole,
          timeZone: regTimeZone,
          specialty: regRole === "DOCTOR" ? regSpecialty.trim() || "General Practitioner" : null,
          location: regLocation.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setSuccessMsg("Account created successfully! Launching your clinical dashboard...");

      if (typeof window !== "undefined") {
        localStorage.setItem("medavida_session_user", JSON.stringify(data.user));
      }

      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account.");
      setLoading(false);
    }
  };

  const handleAutofill = (accEmail: string) => {
    setAuthMode("login");
    setEmail(accEmail);
    setPassword("password123");
    setErrorMsg(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8">
      {/* Auth Mode Toggle Bar */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl max-w-xs mx-auto text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => {
            setAuthMode("login");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === "login"
              ? "bg-white text-slate-900 shadow-xs"
              : "hover:text-slate-900"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode("register");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === "register"
              ? "bg-white text-slate-900 shadow-xs"
              : "hover:text-slate-900"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-blue-600" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-9 shadow-sm">
        {authMode === "login" ? (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Clinical Portal
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Sign In with Credentials
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered clinical email and password to access your role dashboard.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. dr.meera@medavida.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Need a new account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setErrorMsg(null);
                }}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </div>
          </div>
        ) : (
          /* CREATE ACCOUNT FORM */
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                <UserPlus className="w-3.5 h-3.5" />
                New User Registration
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Create Clinical Account
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Register a new Doctor or Patient account stored directly in PostgreSQL with server-enforced roles.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Role Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegRole("PATIENT")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      regRole === "PATIENT"
                        ? "border-emerald-500 bg-emerald-50/60 shadow-xs"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className={`w-4 h-4 ${regRole === "PATIENT" ? "text-emerald-700" : "text-slate-400"}`} />
                      <span className="font-extrabold text-xs text-slate-900">Patient</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Find doctors, view local times, book, cancel & reschedule.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole("DOCTOR")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      regRole === "DOCTOR"
                        ? "border-blue-500 bg-blue-50/60 shadow-xs"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Stethoscope className={`w-4 h-4 ${regRole === "DOCTOR" ? "text-blue-700" : "text-slate-400"}`} />
                      <span className="font-extrabold text-xs text-slate-900">Doctor</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Set clinic shifts, block breaks, and manage consultations.
                    </p>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={regRole === "DOCTOR" ? "e.g. Dr. Fiona Campbell" : "e.g. Rahul Sharma"}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. user@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a secure password"
                    minLength={6}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              {/* Primary Time Zone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Clinic / Local Time Zone (IANA Standard)
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={regTimeZone}
                    onChange={(e) => setRegTimeZone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900"
                  >
                    {TIME_ZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.flag} {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Doctor Specific: Specialty */}
              {regRole === "DOCTOR" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Medical Specialization
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regSpecialty}
                      onChange={(e) => setRegSpecialty(e.target.value)}
                      placeholder="e.g. General Physician, Cardiologist, Pediatrician"
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* City / Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  City / Location
                </label>
                <input
                  type="text"
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  placeholder="e.g. London, UK or New York, USA or Kolkata, India"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Create Account & Launch Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setErrorMsg(null);
                }}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Sign in here
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            PostgreSQL 14 Relational Storage
          </span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Double-Booking Guard
          </span>
        </div>
      </div>

      {/* Demonstration Credentials (from Problem Statement) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Example Test Accounts from Problem Statement
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click &quot;Autofill&quot; on any account to populate the login form above.
            </p>
          </div>
          <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-semibold">
            Password: password123
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEST_ACCOUNTS.map((acc) => (
            <div
              key={acc.email}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:bg-slate-100/70 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>{acc.flag}</span>
                    <span>{acc.name}</span>
                  </span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${acc.badgeColor}`}>
                    {acc.role}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-600 truncate">{acc.email}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Globe className="w-3 h-3 text-slate-400" />
                  {acc.timeZone}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAutofill(acc.email)}
                className="mt-3 w-full py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Autofill Credentials</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
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
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                MedaVida
              </span>
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 leading-none">
                SlotZero
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Cross-Border Clinical Telehealth OS</span>
          </div>
        </Link>

        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
          <Link
            href="/"
            className="text-slate-600 hover:text-blue-600 hover:underline font-semibold transition-colors"
          >
            ← Back to Landing
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col justify-center">
        <Suspense fallback={<div className="text-center text-xs text-slate-400 py-12">Loading authentication portal...</div>}>
          <AuthCard />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MedaVida SlotZero • Enterprise Production Portal</span>
          <span className="text-[11px] text-slate-400">PostgreSQL 14 • IANA Multi-Timezone Engine • Zero Overlaps</span>
        </div>
      </footer>
    </div>
  );
}
