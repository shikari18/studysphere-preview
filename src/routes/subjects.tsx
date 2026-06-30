import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ArrowUpRight, Flame, BookOpen } from "lucide-react";
import { MobileShell, PageHeader, Section } from "@/components/mobile/Shell";
import { Pill } from "@/components/mobile/ui";
import { subjects } from "@/lib/mock";

export const Route = createFileRoute("/subjects")({
  head: () => ({ meta: [{ title: "Subjects — Viora AI" }] }),
  component: Subjects,
});

function Subjects() {
  const featured = subjects[0];
  const rest = subjects.slice(1);
  const totalNotes = subjects.reduce((a, s) => a + s.notes, 0);
  const avg = Math.round(subjects.reduce((a, s) => a + s.progress, 0) / subjects.length);

  return (
    <MobileShell>
      <PageHeader title="Subjects" subtitle="Your IGCSE library" />

      {/* Search */}
      <div className="px-5">
        <div className="glass rounded-[16px] flex items-center gap-3 px-4 h-11">
          <Search size={15} className="text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">Search topics, chapters…</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-2">
        <div className="glass rounded-[14px] p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg</p>
          <p className="mono text-[18px] font-semibold mt-0.5">{avg}%</p>
        </div>
        <div className="glass rounded-[14px] p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Notes</p>
          <p className="mono text-[18px] font-semibold mt-0.5">{totalNotes}</p>
        </div>
        <div className="glass rounded-[14px] p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Subjects</p>
          <p className="mono text-[18px] font-semibold mt-0.5">{subjects.length}</p>
        </div>
      </div>

      {/* Featured hero */}
      <Section title="Pick up where you left off">
        <Link to="/subjects">
          <div
            className="rounded-[24px] p-5 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#0a0a0f 0%,#1a1a24 100%)" }}
          >
            <span
              className="absolute -right-10 -top-10 w-44 h-44 rounded-full opacity-50 blur-2xl"
              style={{ background: "radial-gradient(circle, #7c5cff 0%, transparent 70%)" }}
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <Pill tone="primary">Most active</Pill>
                <span className="text-[28px] leading-none">{featured.icon}</span>
              </div>
              <h3 className="text-[22px] font-semibold mt-3 tracking-tight">{featured.name}</h3>
              <p className="text-[12px] opacity-70 mt-1">
                {featured.notes} notes · {featured.quizzes} quizzes · {featured.papers} papers
              </p>

              <div className="mt-4">
                <div className="flex justify-between text-[11px] opacity-80">
                  <span>Progress</span>
                  <span className="mono">{featured.progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${featured.progress}%`, background: "linear-gradient(90deg,#7c5cff,#b07cff)" }} />
                </div>
              </div>

              <button className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium bg-white/10 border border-white/10 rounded-full px-3 py-1.5">
                Continue <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </Link>
      </Section>

      {/* List */}
      <Section title="All subjects">
        <div className="space-y-2">
          {rest.map((s) => (
            <Link to="/subjects" key={s.slug}>
              <div className="glass rounded-[18px] p-4 flex items-center gap-4 tap">
                <div className="w-12 h-12 rounded-[14px] glass-strong flex items-center justify-center text-[22px]">
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold truncate">{s.name}</p>
                    <span className="mono text-[11px] text-muted-foreground">{s.progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1 bg-glass-strong rounded-full overflow-hidden">
                    <div className="h-full gradient-primary rounded-full" style={{ width: `${s.progress}%` }} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><BookOpen size={11} /> {s.notes}</span>
                    {s.weak[0] && (
                      <span className="inline-flex items-center gap-1 text-[color:var(--warning)]">
                        <Flame size={11} /> {s.weak[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </MobileShell>
  );
}
