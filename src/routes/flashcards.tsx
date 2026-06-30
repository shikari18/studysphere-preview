import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCw, Flame } from "lucide-react";
import { MobileShell, PageHeader, Section } from "@/components/mobile/Shell";
import { GlassCard } from "@/components/mobile/ui";

export const Route = createFileRoute("/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards — Viora AI" }] }),
  component: Flashcards,
});

function Flashcards() {
  const [flipped, setFlipped] = useState(false);
  return (
    <MobileShell>
      <PageHeader title="Organic Chem" subtitle="23 / 80 mastered" />

      <Section>
        <div className="h-1.5 bg-glass rounded-full overflow-hidden">
          <div className="h-full gradient-primary" style={{ width: "29%" }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
          <span>Day 7 streak</span>
          <span className="flex items-center gap-1 text-[color:var(--warning)]"><Flame size={11} /> +12 today</span>
        </div>
      </Section>

      <Section>
        <div className="relative h-[360px]" onClick={() => setFlipped(!flipped)}>
          <GlassCard className="!p-0 absolute inset-0 flex items-center justify-center text-center cursor-pointer overflow-hidden">
            <div className="absolute inset-0 gradient-primary opacity-[0.06]" />
            <div className="relative p-8">
              {!flipped ? (
                <>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Front</p>
                  <p className="text-[22px] font-medium mt-4 leading-tight">What is the functional group of an aldehyde?</p>
                </>
              ) : (
                <>
                  <p className="text-[11px] uppercase tracking-wider text-[color:var(--secondary)]">Answer</p>
                  <p className="text-[22px] font-medium mt-4 leading-tight">−CHO</p>
                  <p className="text-[12px] text-muted-foreground mt-3">Carbonyl carbon bonded to at least one hydrogen.</p>
                </>
              )}
              <p className="text-[10px] text-muted-foreground mt-6 flex items-center justify-center gap-1.5"><RotateCw size={10} /> Tap to flip</p>
            </div>
          </GlassCard>
        </div>
      </Section>

      <Section>
        <div className="flex gap-3">
          <button className="flex-1 glass rounded-[18px] py-4 text-[14px] font-medium tap">
            Again
          </button>
          <button className="flex-1 gradient-primary text-white rounded-[18px] py-4 text-[14px] font-medium tap">
            Good
          </button>
        </div>
      </Section>

      <Section title="Memory">
        <GlassCard className="!p-4">
          <div className="flex items-end gap-1 h-16">
            {[40, 55, 35, 70, 60, 80, 65].map((v, i) => (
              <div key={i} className="flex-1 rounded-t-md gradient-primary opacity-80" style={{ height: `${v}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground mono">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
        </GlassCard>
      </Section>
    </MobileShell>
  );
}
