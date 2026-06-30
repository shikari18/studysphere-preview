import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, Upload, Sigma, Send, ArrowLeft, Phone, PhoneOff, MicOff, Volume2 } from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import { GlassCard, Pill } from "@/components/mobile/ui";
import { BotMark } from "@/components/BotMark";
import { conversation } from "@/lib/mock";

export const Route = createFileRoute("/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — StudySphere AI" }] }),
  component: Tutor,
});

type Msg =
  | { role: "user"; text: string; card?: undefined }
  | { role: "ai"; text: string; card?: { steps: string[]; tip: string } };

function Tutor() {
  const [messages, setMessages] = useState<Msg[]>(conversation);
  const [draft, setDraft] = useState("");
  const [inCall, setInCall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Got it — let me think through that step by step." },
      ]);
    }, 600);
  };

  return (
    <MobileShell hideNav>
      <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
        {/* Header */}
        <header className="px-4 pt-5 pb-3 flex items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-md bg-[color-mix(in_oklab,var(--background)_82%,transparent)] border-b border-hairline">
          <Link
            to="/home"
            className="w-10 h-10 rounded-full glass tap flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft size={17} />
          </Link>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[12px] glass-strong flex items-center justify-center">
              <BotMark size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold tracking-tight leading-tight truncate">StudySphere</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">Online · AI tutor</p>
            </div>
          </div>

          <button
            onClick={() => setInCall(true)}
            className="w-10 h-10 rounded-full gradient-primary tap flex items-center justify-center shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
            aria-label="Call StudySphere"
          >
            <Phone size={16} color="white" />
          </button>
        </header>

        {/* Chat */}
        <div ref={scrollRef} className="flex-1 px-4 pt-4 pb-[160px] space-y-4 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} anim-in`}>
              {m.role === "user" ? (
                <div className="gradient-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-[14px] leading-relaxed shadow-[0_6px_18px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)]">
                  {m.text}
                </div>
              ) : (
                <div className="max-w-[88%] space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <BotMark size={12} /> StudySphere
                  </div>
                  <div className="text-[14px] leading-relaxed text-foreground">{m.text}</div>
                  {m.card && (
                    <GlassCard className="!p-4 !rounded-2xl">
                      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2.5">Steps</p>
                      <ol className="space-y-2.5">
                        {m.card.steps.map((s, k) => (
                          <li key={k} className="flex gap-3 text-[13px]">
                            <span className="mono w-5 h-5 rounded-full bg-glass-strong flex-shrink-0 flex items-center justify-center text-[10px]">
                              {k + 1}
                            </span>
                            <span className="pt-0.5">{s}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-3 pt-3 border-t border-hairline text-[12px] text-muted-foreground">
                        <span className="font-medium text-foreground">Tip · </span>
                        {m.card.tip}
                      </div>
                    </GlassCard>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Composer with chips on top */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[388px] z-40 space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
            {["Explain like I'm 12", "Give me 5 past questions", "Test me"].map((c) => (
              <button key={c} onClick={() => setDraft(c)} className="tap flex-shrink-0">
                <Pill tone="primary">{c}</Pill>
              </button>
            ))}
          </div>
          <div className="glass-strong rounded-[22px] p-2 flex items-center gap-1">
            <button className="w-9 h-9 rounded-full hover:bg-glass tap flex items-center justify-center" aria-label="Voice">
              <Mic size={15} />
            </button>
            <button className="w-9 h-9 rounded-full hover:bg-glass tap flex items-center justify-center" aria-label="Upload">
              <Upload size={15} />
            </button>
            <button className="w-9 h-9 rounded-full hover:bg-glass tap flex items-center justify-center" aria-label="Math">
              <Sigma size={15} />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="flex-1 bg-transparent outline-none text-[14px] px-2 placeholder:text-muted-foreground min-w-0"
              placeholder="Ask anything…"
            />
            <button
              onClick={send}
              className="w-9 h-9 rounded-full gradient-primary tap flex items-center justify-center flex-shrink-0"
              aria-label="Send"
            >
              <Send size={14} color="white" />
            </button>
          </div>
        </div>
      </div>

      {inCall && <CallSession onEnd={() => setInCall(false)} />}
    </MobileShell>
  );
}

function CallSession({ onEnd }: { onEnd: () => void }) {
  const [muted, setMuted] = useState(false);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-between text-white anim-in"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #2a1455 0%, #0a0a14 60%, #050509 100%)",
      }}
    >
      <div className="pt-14 text-center px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] opacity-60">Live class · {mm}:{ss}</p>
        <h2 className="mt-2 text-[22px] font-semibold tracking-tight">StudySphere</h2>
        <p className="text-[12px] opacity-70 mt-1">Listening — ask anything out loud</p>
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <div className="relative">
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "radial-gradient(circle, rgba(176,124,255,0.35), transparent 70%)" }} />
          <span className="absolute -inset-6 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(124,92,255,0.18), transparent 70%)" }} />
          <div className="relative w-40 h-40 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c5cff,#b07cff)" }}>
            <BotMark size={72} withGradient={false} className="text-white" />
          </div>
        </div>
      </div>

      <div className="px-6 pb-12 w-full max-w-[420px]">
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {["Quiz me on this", "Slow down", "Give an example"].map((c) => (
            <span key={c} className="px-3 py-1.5 rounded-full text-[11px] bg-white/10 border border-white/10">{c}</span>
          ))}
        </div>
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={() => setMuted((m) => !m)}
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center tap"
            aria-label="Mute"
          >
            {muted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={onEnd}
            className="w-16 h-16 rounded-full flex items-center justify-center tap shadow-[0_10px_30px_-10px_rgba(255,60,80,0.6)]"
            style={{ background: "linear-gradient(135deg,#ff4d6d,#c81d3a)" }}
            aria-label="End call"
          >
            <PhoneOff size={22} color="white" />
          </button>
          <button className="w-14 h-14 rounded-full bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center tap" aria-label="Speaker">
            <Volume2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
