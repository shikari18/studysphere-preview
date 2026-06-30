import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import { GlassCard } from "@/components/mobile/ui";

export const Route = createFileRoute("/focus")({
  head: () => ({ meta: [{ title: "Focus Mode — Viora AI" }] }),
  component: Focus,
});

function Focus() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState("Rain");

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const progress = 1 - seconds / (25 * 60);

  return (
    <MobileShell>
      <div className="min-h-[100dvh] flex flex-col items-center pt-16 px-6 relative">
        <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "radial-gradient(600px 600px at 50% 30%, color-mix(in oklab, var(--secondary) 24%, transparent), transparent 70%)" }} />
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Focus session</p>
        <p className="text-[14px] mt-2">Quadratic Functions</p>

        <div className="relative mt-10 w-[260px] h-[260px] flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r="120" stroke="var(--hairline)" strokeWidth="6" fill="none" />
            <circle
              cx="130" cy="130" r="120"
              stroke="url(#fg)" strokeWidth="6" fill="none"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={(1 - progress) * 2 * Math.PI * 120}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
            <defs>
              <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--primary)" /><stop offset="100%" stopColor="var(--secondary)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <p className="mono text-[64px] font-light leading-none tracking-tight">
              {m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">Round 1 · 4</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-10">
          <button onClick={() => { setSeconds(25*60); setRunning(false); }} className="w-12 h-12 rounded-full glass tap flex items-center justify-center"><RotateCcw size={16} /></button>
          <button
            onClick={() => setRunning(!running)}
            className="w-20 h-20 rounded-full gradient-primary tap flex items-center justify-center shadow-glow"
          >
            {running ? <Pause size={26} color="white" /> : <Play size={26} color="white" className="translate-x-0.5" />}
          </button>
          <button className="w-12 h-12 rounded-full glass tap flex items-center justify-center"><Volume2 size={16} /></button>
        </div>

        <div className="w-full mt-10">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 px-1">Ambient sound</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["Rain", "Library", "White noise", "Café", "Forest"].map((s) => (
              <button
                key={s}
                onClick={() => setSound(s)}
                className={`tap rounded-full px-4 py-2 text-[12px] font-medium border ${
                  sound === s ? "gradient-primary text-white border-transparent" : "glass border-transparent text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <GlassCard className="!p-4 w-full mt-8">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Last session</p>
          <div className="flex justify-between mt-2">
            <div><p className="mono text-[16px] font-medium">25m</p><p className="text-[10px] text-muted-foreground">duration</p></div>
            <div><p className="mono text-[16px] font-medium">1</p><p className="text-[10px] text-muted-foreground">breaks</p></div>
            <div><p className="mono text-[16px] font-medium">92</p><p className="text-[10px] text-muted-foreground">focus score</p></div>
          </div>
        </GlassCard>
      </div>
    </MobileShell>
  );
}
