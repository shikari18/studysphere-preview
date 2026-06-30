import { createFileRoute } from "@tanstack/react-router";
import { Camera, Upload, Image as ImgIcon, Sparkles, Highlighter, Layers, ChevronRight } from "lucide-react";
import { MobileShell, PageHeader, Section } from "@/components/mobile/Shell";
import { GlassCard, Pill } from "@/components/mobile/ui";
import { notes } from "@/lib/mock";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Smart Notes — StudySphere AI" }] }),
  component: Notes,
});

function Notes() {
  return (
    <MobileShell>
      <PageHeader title="Smart Notes" subtitle="Capture, summarize, learn" />

      <div className="px-5 grid grid-cols-3 gap-3">
        {[
          { i: Camera, t: "Scan" },
          { i: Upload, t: "Upload" },
          { i: ImgIcon, t: "Import" },
        ].map((a) => (
          <button key={a.t} className="glass rounded-[18px] py-5 flex flex-col items-center gap-2 tap">
            <a.i size={18} />
            <span className="text-[11px] font-medium">{a.t}</span>
          </button>
        ))}
      </div>

      <Section title="AI features">
        <div className="glass rounded-[18px] divide-y divide-[color:var(--hairline)]">
          {[
            { i: Sparkles, t: "Summarize", s: "10-page chapter → 12 key points" },
            { i: Highlighter, t: "Highlight key points", s: "Auto-extract definitions" },
            { i: Layers, t: "Convert to flashcards", s: "Spaced repetition ready" },
          ].map((r) => (
            <button key={r.t} className="w-full flex items-center gap-3 px-4 py-3.5 tap text-left">
              <div className="w-10 h-10 rounded-[12px] gradient-primary flex items-center justify-center"><r.i size={15} color="white" /></div>
              <div className="flex-1">
                <p className="text-[13.5px] font-medium">{r.t}</p>
                <p className="text-[11px] text-muted-foreground">{r.s}</p>
              </div>
              <ChevronRight size={15} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </Section>

      <Section title="Your notes">
        <div className="space-y-2">
          {notes.map((n) => (
            <GlassCard key={n.id} className="!p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-[12px] bg-glass-strong flex items-center justify-center text-base">📄</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium truncate">{n.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Pill>{n.subject}</Pill>
                  <span className="text-[11px] text-muted-foreground">{n.edited}</span>
                </div>
              </div>
              {n.aiReady && <Pill tone="primary">AI</Pill>}
            </GlassCard>
          ))}
        </div>
      </Section>
    </MobileShell>
  );
}
