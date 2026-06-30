import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, BookOpen, FileQuestion, Minus, Plus, Check } from "lucide-react";
import { MobileShell, PageHeader, Section } from "@/components/mobile/Shell";
import { GlassCard, PrimaryButton } from "@/components/mobile/ui";

export const Route = createFileRoute("/quiz")({
  head: () => ({ meta: [{ title: "Quiz Generator — StudySphere AI" }] }),
  component: Quiz,
});

function Quiz() {
  const [source, setSource] = useState("notes");
  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState(10);
  const [timer, setTimer] = useState(true);
  const [selected, setSelected] = useState<number | null>(1);

  const sources = [
    { id: "notes", t: "Notes", i: FileText },
    { id: "subject", t: "Subject", i: BookOpen },
    { id: "paper", t: "Past paper", i: FileQuestion },
  ];

  return (
    <MobileShell>
      <PageHeader title="Generate a quiz" subtitle="Adapts to your level in real-time" />

      <Section title="Source">
        <div className="grid grid-cols-3 gap-2">
          {sources.map((s) => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`tap p-3 rounded-[16px] border flex flex-col items-center gap-1.5 ${
                source === s.id ? "gradient-primary text-white border-transparent" : "glass border-transparent"
              }`}
            >
              <s.i size={16} />
              <span className="text-[11px] font-medium">{s.t}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Difficulty">
        <div className="glass rounded-[16px] p-1 flex">
          {["Easy", "Medium", "Hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 py-2.5 rounded-[12px] text-[12px] font-medium tap ${
                difficulty === d ? "gradient-primary text-white" : "text-muted-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Questions">
        <GlassCard className="!p-3 flex items-center justify-between">
          <button onClick={() => setCount(Math.max(5, count - 5))} className="w-9 h-9 rounded-full glass-strong flex items-center justify-center tap"><Minus size={14} /></button>
          <span className="mono text-[20px] font-medium">{count}</span>
          <button onClick={() => setCount(Math.min(40, count + 5))} className="w-9 h-9 rounded-full glass-strong flex items-center justify-center tap"><Plus size={14} /></button>
        </GlassCard>
      </Section>

      <Section title="Timer mode">
        <GlassCard className="!p-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium">Exam-style timing</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">2 minutes per question</p>
          </div>
          <button
            onClick={() => setTimer(!timer)}
            className={`w-11 h-6 rounded-full transition-colors ${timer ? "gradient-primary" : "bg-glass-strong"} relative`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${timer ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </GlassCard>
      </Section>

      <Section>
        <PrimaryButton className="w-full">Generate quiz</PrimaryButton>
      </Section>

      <Section title="Preview · Question 1 / 10">
        <GlassCard>
          <div className="mono text-[10px] text-muted-foreground">MATH · ALGEBRA</div>
          <p className="text-[15px] font-medium mt-2 leading-snug">
            If x² − 5x + 6 = 0, what are the values of x?
          </p>
          <div className="space-y-2 mt-4">
            {["x = 1, 6", "x = 2, 3", "x = −2, −3", "x = 0, 5"].map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`tap w-full text-left flex items-center gap-3 rounded-[14px] px-4 py-3 text-[13px] border ${
                  selected === i
                    ? "border-[color:var(--primary)] bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]"
                    : "border-transparent glass"
                }`}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected === i ? "border-[color:var(--primary)] bg-[color:var(--primary)]" : "border-muted-foreground"}`}>
                  {selected === i && <Check size={11} color="white" />}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </GlassCard>
      </Section>
    </MobileShell>
  );
}
