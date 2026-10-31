"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface TaraMessage {
  id: string;
  sender: "user" | "tara";
  text: string;
  toolCall?: {
    tool: string;
    arguments: any;
    status: string;
    output?: any;
    error?: string;
  };
  slots?: Array<{
    startTimeUtc: string;
    endTimeUtc: string;
    doctorDisplay: string;
    patientDisplay: string;
    durationMinutes: number;
    doctorId?: string;
  }>;
  timestamp: string;
}

interface TaraAssistantProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    timeZone: string;
  };
  onBookingConfirmed?: () => void;
}

export default function TaraAssistant({ currentUser, onBookingConfirmed }: TaraAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<TaraMessage[]>([
    {
      id: "intro-msg",
      sender: "tara",
      text: `Hello ${currentUser.name.split(" ")[0]}! 👋 I'm **Tara**, your MedaVida AI Clinical Scheduling Assistant.\n\nI can use real-time scheduling tools to:\n• Check live doctor slots converted to your local time (**${currentUser.timeZone}**)\n• Book consultations without conflict\n• Look up or cancel your active appointments\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (userText?: string) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: TaraMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tara", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          message: textToSend,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Tara service error");
      }

      const taraMsg: TaraMessage = {
        id: `tara-${Date.now()}`,
        sender: "tara",
        text: data.reply,
        toolCall: data.toolCall,
        slots: data.data?.slots
          ? data.data.slots.map((s: any) => ({
              ...s,
              doctorId: data.data.doctor?.id,
            }))
          : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, taraMsg]);

      // If booking was executed, trigger dashboard refresh
      if (data.toolCall?.tool === "book_appointment" && data.toolCall.status === "SUCCESS") {
        if (onBookingConfirmed) onBookingConfirmed();
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `tara-err-${Date.now()}`,
          sender: "tara",
          text: `⚠️ I had trouble connecting: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlotDirect = async (slot: any) => {
    const prompt = `Book slot with doctor ${slot.doctorId || "Dr. Meera"} starting at ${slot.startTimeUtc} ending at ${slot.endTimeUtc}`;
    await handleSend(prompt);
  };

  // Only render for patients or allow toggle
  return (
    <>
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-4 py-3 rounded-full shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2.5 group cursor-pointer border border-white/20"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
            <Bot className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="text-left">
            <div className="text-xs font-black flex items-center gap-1.5">
              <span>Tara AI Assistant</span>
              <span className="text-[9px] bg-emerald-400 text-slate-900 font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                Tools
              </span>
            </div>
            <div className="text-[10px] text-blue-100 font-medium">Smart Patient Scheduling</div>
          </div>
        </button>
      )}

      {/* Main Tara Assistant Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl border border-slate-200/90 bg-white rounded-3xl flex flex-col overflow-hidden ${
            isMinimized
              ? "bottom-6 right-6 w-80 h-16"
              : "bottom-6 right-6 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white px-5 py-3.5 flex items-center justify-between select-none shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>Tara AI Assistant</span>
                  <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white font-medium">
                    Function Calling
                  </span>
                </h3>
                <p className="text-[10px] text-blue-100">SlotZero Multi-Timezone Clinical Co-Pilot</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 text-xs">
                {messages.map((m) => {
                  const isUser = m.sender === "user";

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                        <span>{isUser ? "You" : "Tara (AI Assistant)"}</span>
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed ${
                          isUser
                            ? "bg-blue-600 text-white rounded-br-xs shadow-xs"
                            : "bg-white text-slate-800 rounded-bl-xs border border-slate-200/80 shadow-xs"
                        }`}
                      >
                        {/* Text Content */}
                        <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                        {/* Interactive Tool Execution Badge */}
                        {m.toolCall && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px]">
                            <div className="flex items-center justify-between text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60 mb-1.5">
                              <span className="flex items-center gap-1 text-indigo-700 font-bold">
                                <Wrench className="w-3 h-3 text-indigo-600" />
                                tool: {m.toolCall.tool}()
                              </span>
                              <span
                                className={`font-bold ${
                                  m.toolCall.status === "SUCCESS"
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {m.toolCall.status}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Interactive Quick-Book Slot Cards (When tool returned available slots) */}
                        {m.slots && m.slots.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              Click to book instantly:
                            </span>
                            <div className="grid grid-cols-1 gap-1.5">
                              {m.slots.map((s, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => handleBookSlotDirect(s)}
                                  className="w-full text-left p-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/80 text-blue-900 flex items-center justify-between transition-colors group cursor-pointer"
                                >
                                  <div>
                                    <div className="font-bold text-xs">{s.patientDisplay}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      Clinic GMT: {s.doctorDisplay}
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-lg group-hover:bg-blue-700 flex items-center gap-0.5">
                                    <span>Book</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200/80 text-slate-500 text-xs w-max">
                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">Tara is executing tool call...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap">
                <button
                  onClick={() => handleSend("Show open slots for Dr. Meera this Monday")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  📅 Slots with Dr. Meera
                </button>
                <button
                  onClick={() => handleSend("Show open slots for Dr. Alex this Monday")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  🩺 Dr. Alex (NY)
                </button>
                <button
                  onClick={() => handleSend("What are my scheduled appointments?")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  📋 My Bookings
                </button>
              </div>

              {/* Input Bar */}
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Tara (e.g. 'Show slots for Dr. Meera on Nov 2')..."
                  disabled={loading}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 font-medium"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                  title="Send to Tara"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
