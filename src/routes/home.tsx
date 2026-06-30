import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Mic, Upload, Play, Sparkles as SparkIcon, Clock, Target, ChevronRight } from "lucide-react";
import { MobileShell, Section } from "@/components/mobile/Shell";
import { GlassCard, Pill, ProgressRing } from "@/components/mobile/ui";
import { subjects, exams, notes } from "@/lib/mock";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — StudySphere AI" }] }),
  component: Home,
});

function Home() {
  return (
    <MobileShell>
      <header className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Good evening</p>
          <h1 className="text-[26px] font-semibold tracking-tight">Shi</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Ready for 45 minutes of focused learning?</p>
        </div>
        <div className="w-11 h-11 rounded-full glass flex items-center justify-center font-semibold text-sm">S</div>
      </header>

      <div className="px-5 mt-5">
        <div className="glass rounded-[18px] flex items-center gap-3 px-4 h-12">
          <Search size={16} className="text-muted-foreground" />
          <span className="text-[14px] text-muted-foreground flex-1">Search notes, topics, past papers…</span>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {["Quadratics", "IGCSE Physics", "WAEC 2022", "Organic chem"].map((c) => (
            <Pill key={c}>{c}</Pill>
          ))}
        </div>
      </div>

      <Section>
        <GlassCard className="!p-0 overflow-hidden">
          <div className="p-5 gradient-primary text-white">
            <p className="text-[11px] uppercase tracking-wider opacity-80">Continue studying</p>
            <div className="flex items-center justify-between mt-2">
              <div>
                <h3 className="text-[18px] font-semibold">Quadratic Functions</h3>
                <p className="text-[12px] opacity-80 mt-0.5">Mathematics · Chapter 4</p>
              </div>
              <ProgressRing value={68} size={58} label="68%" />
            </div>
            <div className="flex gap-2 mt-5">
              <button className="tap bg-white/15 backdrop-blur rounded-[14px] px-4 py-2.5 text-sm font-medium flex items-center gap-2 flex-1 justify-center">
                <Play size={14} /> Resume
              </button>
              <button className="tap bg-white/15 rounded-[14px] w-11 h-11 flex items-center justify-center" aria-label="Quick quiz">
                <SparkIcon size={16} />
              </button>
            </div>
          </div>
        </GlassCard>
      </Section>

      <Section>
        <Link to="/tutor" className="block">
          <GlassCard className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <SparkIcon size={16} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium">Ask StudySphere</p>
              <p className="text-[12px] text-muted-foreground truncate">Voice, photo or text — instant answers</p>
            </div>
            <button className="w-9 h-9 rounded-full glass-strong flex items-center justify-center"><Mic size={14} /></button>
            <button className="w-9 h-9 rounded-full glass-strong flex items-center justify-center"><Upload size={14} /></button>
          </GlassCard>
        </Link>
      </Section>

      <Section title="Today">
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="!p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-[11px]"><Clock size={12} /> Focus time</div>
            <p className="mono text-[24px] font-medium mt-2">32<span className="text-sm text-muted-foreground">m</span></p>
            <p className="text-[11px] text-success mt-1">+12m vs avg</p>
          </GlassCard>
          <GlassCard className="!p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-[11px]"><Target size={12} /> Accuracy</div>
            <p className="mono text-[24px] font-medium mt-2">78<span className="text-sm text-muted-foreground">%</span></p>
            <p className="text-[11px] text-success mt-1">▲ 4%</p>
          </GlassCard>
        </div>
      </Section>

      <Section title="Subjects" action={<Link to="/subjects" className="text-[12px] text-muted-foreground">See all</Link>}>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-1">
          {subjects.slice(0, 4).map((s) => (
            <GlassCard key={s.slug} className="!p-4 min-w-[140px]">
              <div className="text-2xl">{s.icon}</div>
              <p className="text-[13px] font-medium mt-2 truncate">{s.name}</p>
              <div className="mt-2 h-1 bg-glass rounded-full overflow-hidden">
                <div className="h-full gradient-primary" style={{ width: `${s.progress}%` }} />
              </div>
              <p className="mono text-[10px] text-muted-foreground mt-1.5">{s.progress}%</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section title="Upcoming exams">
        <div className="space-y-2">
          {exams.map((e) => (
            <GlassCard key={e.name} className="!p-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium">{e.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Mark your readiness</p>
              </div>
              <Pill tone={e.color === "purple" ? "purple" : "primary"}>{e.days} days</Pill>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section title="Recent notes" action={<Link to="/notes" className="text-[12px] text-muted-foreground">See all</Link>}>
        <div className="space-y-2">
          {notes.slice(0, 3).map((n) => (
            <Link to="/notes" key={n.id}>
              <GlassCard className="!p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-glass-strong flex items-center justify-center text-[15px]">📝</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium truncate">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{n.subject} · {n.edited}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </GlassCard>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Quick actions">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/quiz"><GlassCard className="!p-4"><p className="text-[13px] font-medium">Generate quiz</p><p className="text-[11px] text-muted-foreground mt-1">From notes or topic</p></GlassCard></Link>
          <Link to="/planner"><GlassCard className="!p-4"><p className="text-[13px] font-medium">Plan my week</p><p className="text-[11px] text-muted-foreground mt-1">AI study schedule</p></GlassCard></Link>
          <Link to="/focus"><GlassCard className="!p-4"><p className="text-[13px] font-medium">Focus mode</p><p className="text-[11px] text-muted-foreground mt-1">Pomodoro · sounds</p></GlassCard></Link>
          <Link to="/analytics"><GlassCard className="!p-4"><p className="text-[13px] font-medium">Insights</p><p className="text-[11px] text-muted-foreground mt-1">This week</p></GlassCard></Link>
        </div>
      </Section>
    </MobileShell>
  );
}
