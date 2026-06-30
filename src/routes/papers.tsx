import { createFileRoute } from "@tanstack/react-router";
import { Search, Filter, Bookmark, Download, Sparkles, ChevronDown } from "lucide-react";
import { MobileShell, PageHeader, Section } from "@/components/mobile/Shell";
import { GlassCard, Pill } from "@/components/mobile/ui";
import { examBoards, pastQuestions } from "@/lib/mock";

export const Route = createFileRoute("/papers")({
  head: () => ({ meta: [{ title: "Past Papers — StudySphere AI" }] }),
  component: Papers,
});

function Papers() {
  return (
    <MobileShell>
      <PageHeader title="Past Questions" subtitle="WAEC · IGCSE · SAT · JAMB · Cambridge" />

      <div className="px-5">
        <div className="glass rounded-[16px] flex items-center gap-3 px-4 h-12">
          <Search size={16} className="text-muted-foreground" />
          <span className="text-[14px] text-muted-foreground flex-1">Search 12,400+ questions…</span>
          <button className="w-8 h-8 rounded-full glass-strong flex items-center justify-center"><Filter size={13} /></button>
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {["Year ▾", "Subject ▾", "Board ▾", "Difficulty ▾"].map((c) => (
            <button key={c} className="glass-strong px-3 py-1.5 rounded-full text-[11px] font-medium tap flex items-center gap-1">
              {c}
            </button>
          ))}
        </div>
      </div>

      <Section title="Exam boards">
        <div className="grid grid-cols-2 gap-3">
          {examBoards.map((b) => (
            <GlassCard key={b.code} className="!p-4">
              <div className="w-9 h-9 rounded-[10px] gradient-primary flex items-center justify-center text-white text-[11px] font-bold tracking-tight">
                {b.code}
              </div>
              <p className="mono text-[18px] font-medium mt-3">{b.papers.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">papers · trending: {b.trending}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section title="Browse by topic">
        <div className="flex flex-wrap gap-2">
          {["Algebra", "Mechanics", "Organic Chem", "Genetics", "Probability", "Waves", "Functions", "Kinematics"].map((t) => (
            <Pill key={t}>{t}</Pill>
          ))}
        </div>
      </Section>

      <Section title="Featured" action={<button className="text-[12px] text-muted-foreground flex items-center gap-1">Newest <ChevronDown size={12} /></button>}>
        <div className="space-y-2">
          {pastQuestions.map((q) => (
            <GlassCard key={q.id} className="!p-4">
              <div className="flex items-start gap-3">
                <div className="text-center flex-shrink-0">
                  <div className="mono text-[10px] text-muted-foreground">{q.board}</div>
                  <div className="mono text-[16px] font-medium">{q.year}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium leading-tight">{q.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {q.tags.map((t) => <Pill key={t}>{t}</Pill>)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-hairline">
                <button className="flex-1 text-[11px] flex items-center justify-center gap-1.5 py-1.5 hover:bg-glass rounded-md tap"><Bookmark size={12} /> Save</button>
                <button className="flex-1 text-[11px] flex items-center justify-center gap-1.5 py-1.5 hover:bg-glass rounded-md tap"><Download size={12} /> PDF</button>
                <button className="flex-1 text-[11px] flex items-center justify-center gap-1.5 py-1.5 hover:bg-glass rounded-md tap text-[color:var(--secondary)]"><Sparkles size={12} /> Explain</button>
              </div>
            </GlassCard>
          ))}
        </div>
      </Section>
    </MobileShell>
  );
}
