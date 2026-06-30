import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Calendar, Check } from "lucide-react";
import { MobileShell, PageHeader, Section } from "@/components/mobile/Shell";
import { GlassCard, PrimaryButton, ProgressRing } from "@/components/mobile/ui";

export const Route = createFileRoute("/planner")({
  head: () => ({ meta: [{ title: "Planner — Viora AI" }] }),
  component: Planner,
});

const week = ["M", "T", "W", "T", "F", "S", "S"];
const events: Record<number, { c: "primary" | "purple"; t: string }[]> = {
  0: [{ c: "primary", t: "Math" }],
  1: [{ c: "purple", t: "Phys" }, { c: "primary", t: "Bio" }],
  2: [{ c: "primary", t: "Math" }],
  3: [{ c: "purple", t: "Chem" }],
  4: [{ c: "primary", t: "Mock" }],
  5: [],
  6: [{ c: "purple", t: "Review" }],
};

function Planner() {
  return (
    <MobileShell>
      <PageHeader title="Planner" subtitle="This week · Mar 18 – 24" right={<button className="w-10 h-10 rounded-full glass tap flex items-center justify-center"><Calendar size={15} /></button>} />

      <Section>
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((d, i) => (
            <div key={i} className={`glass rounded-[14px] p-2 flex flex-col items-center gap-1 ${i === 2 ? "border border-[color:var(--primary)]" : ""}`}>
              <span className="text-[10px] text-muted-foreground">{d}</span>
              <span className="mono text-[13px] font-medium">{18 + i}</span>
              <div className="flex gap-0.5 mt-1 h-1">
                {events[i].map((e, k) => (
                  <span key={k} className={`w-1 h-1 rounded-full ${e.c === "primary" ? "bg-[color:var(--primary)]" : "bg-[color:var(--secondary)]"}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="glass-strong rounded-[22px] p-5 relative overflow-hidden">
          <div className="absolute -bottom-12 -right-8 w-44 h-44 gradient-primary opacity-25 blur-3xl rounded-full" />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[color:var(--secondary)]">
            <Sparkles size={12} /> AI Planner
          </div>
          <p className="text-[18px] font-semibold mt-2">Build my week plan</p>
          <p className="text-[12px] text-muted-foreground mt-1">From your exam dates, available hours and weak subjects.</p>
          <PrimaryButton className="mt-4">Generate plan</PrimaryButton>
        </div>
      </Section>

      <Section title="Next exam">
        <GlassCard className="!p-5 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold">IGCSE Math Paper 2</p>
            <p className="text-[11px] text-muted-foreground mt-1">May 18 · 9:00 AM</p>
          </div>
          <ProgressRing value={68} size={60} label="12d" />
        </GlassCard>
      </Section>

      <Section title="Today">
        <div className="space-y-2">
          {[
            { t: "Quadratics practice", time: "45 min", done: true },
            { t: "Physics Ch.7 notes", time: "30 min", done: true },
            { t: "Chem flashcards", time: "20 min", done: false },
            { t: "Past paper review", time: "60 min", done: false },
          ].map((task) => (
            <GlassCard key={task.t} className="!p-4 flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.done ? "gradient-primary border-transparent" : "border-muted-foreground"}`}>
                {task.done && <Check size={11} color="white" />}
              </div>
              <div className="flex-1">
                <p className={`text-[13.5px] font-medium ${task.done ? "line-through text-muted-foreground" : ""}`}>{task.t}</p>
                <p className="text-[11px] text-muted-foreground">{task.time}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </Section>
    </MobileShell>
  );
}
