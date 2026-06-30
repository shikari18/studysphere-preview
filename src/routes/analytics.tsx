import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Sparkles, ChevronRight, Flame } from "lucide-react";
import { MobileShell, PageHeader, Section } from "@/components/mobile/Shell";
import { GlassCard, Sparkline, Pill } from "@/components/mobile/ui";
import { studyHours, subjects } from "@/lib/mock";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Viora AI" }] }),
  component: Analytics,
});

function Analytics() {
  return (
    <MobileShell>
      <PageHeader title="Insights" subtitle="Last 7 days" />

      <Section>
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="!p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hours</p>
            <p className="mono text-[20px] font-medium mt-1">19.0</p>
            <p className="text-[10px] text-success">▲ 12%</p>
          </GlassCard>
          <GlassCard className="!p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</p>
            <p className="mono text-[20px] font-medium mt-1 flex items-center gap-1">14<Flame size={14} className="text-[color:var(--warning)]" /></p>
            <p className="text-[10px] text-muted-foreground">days</p>
          </GlassCard>
          <GlassCard className="!p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Accuracy</p>
            <p className="mono text-[20px] font-medium mt-1">78%</p>
            <p className="text-[10px] text-success">▲ 4%</p>
          </GlassCard>
        </div>
      </Section>

      <Section title="Study time">
        <GlassCard>
          <div className="flex items-baseline justify-between mb-3">
            <p className="mono text-[28px] font-medium">19.0<span className="text-sm text-muted-foreground ml-1">hrs</span></p>
            <div className="flex items-center gap-1 text-[11px] text-success"><TrendingUp size={12} /> +2.4 hrs</div>
          </div>
          <Sparkline data={studyHours} />
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground mono">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
        </GlassCard>
      </Section>

      <Section title="Subject performance">
        <GlassCard className="space-y-3">
          {subjects.slice(0, 4).map((s) => (
            <div key={s.slug}>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className="font-medium">{s.name}</span>
                <span className="mono text-muted-foreground">{s.progress}%</span>
              </div>
              <div className="h-1.5 bg-glass-strong rounded-full overflow-hidden">
                <div className="h-full gradient-primary" style={{ width: `${s.progress}%` }} />
              </div>
            </div>
          ))}
        </GlassCard>
      </Section>

      <Section title="Weak topics">
        <div className="space-y-2">
          {[
            { t: "Calculus — Limits", s: "Math", a: 42 },
            { t: "Waves & Oscillations", s: "Physics", a: 51 },
            { t: "Organic reactions", s: "Chem", a: 58 },
          ].map((w) => (
            <GlassCard key={w.t} className="!p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[13.5px] font-medium">{w.t}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Pill>{w.s}</Pill>
                  <span className="mono text-[10px] text-muted-foreground">{w.a}% accuracy</span>
                </div>
              </div>
              <button className="gradient-primary text-white text-[11px] font-medium px-3 py-1.5 rounded-full tap flex items-center gap-1">
                Practice <ChevronRight size={11} />
              </button>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section title="AI recommendations">
        <GlassCard className="!p-5 border border-[color:var(--secondary)]/30">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[color:var(--secondary)]">
            <Sparkles size={12} /> This week's improvements
          </div>
          <ul className="mt-3 space-y-2.5 text-[13px]">
            <li className="flex gap-3"><span className="text-[color:var(--secondary)]">•</span> Spend 30 more minutes on Calculus — biggest gap before exam.</li>
            <li className="flex gap-3"><span className="text-[color:var(--secondary)]">•</span> Switch Physics to morning sessions — accuracy is 18% higher then.</li>
            <li className="flex gap-3"><span className="text-[color:var(--secondary)]">•</span> Try 2 timed past papers — readiness predicted +9%.</li>
          </ul>
        </GlassCard>
      </Section>
    </MobileShell>
  );
}
