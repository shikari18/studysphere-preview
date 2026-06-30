import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import { MobileShell, PageHeader } from "@/components/mobile/Shell";
import { GlassCard, Pill, ProgressRing } from "@/components/mobile/ui";
import { subjects } from "@/lib/mock";

export const Route = createFileRoute("/subjects")({
  head: () => ({ meta: [{ title: "Subjects — Viora AI" }] }),
  component: Subjects,
});

function Subjects() {
  return (
    <MobileShell>
      <PageHeader title="IGCSE Subjects" subtitle="Collectible learning modules" />
      <div className="px-5">
        <div className="glass rounded-[16px] flex items-center gap-3 px-4 h-11">
          <Search size={15} className="text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">Search within subjects…</span>
        </div>
      </div>
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        {subjects.map((s) => (
          <Link key={s.slug} to="/subjects">
            <GlassCard className="!p-4 h-full">
              <div className="flex items-start justify-between">
                <div className="text-[26px]">{s.icon}</div>
                <ProgressRing value={s.progress} size={42} stroke={4} />
              </div>
              <p className="text-[14px] font-semibold mt-3">{s.name}</p>
              <div className="flex gap-2 mt-2 text-[10px] text-muted-foreground mono">
                <span>{s.notes}n</span>·<span>{s.quizzes}q</span>·<span>{s.papers}p</span>
              </div>
              {s.weak.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {s.weak.slice(0, 2).map((w) => <Pill key={w} tone="warn">{w}</Pill>)}
                </div>
              )}
              <button className="mt-3 w-full glass-strong rounded-[12px] py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 tap">
                <Sparkles size={11} /> Tutor
              </button>
            </GlassCard>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
