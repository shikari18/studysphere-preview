import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, Upload, Sigma, Send, Settings2 } from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import { GlassCard, Pill } from "@/components/mobile/ui";
import { BotMark } from "@/components/BotMark";
import { conversation } from "@/lib/mock";

export const Route = createFileRoute("/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — StudySphere AI" }] }),
  component: Tutor,
});

type Msg =
  | { role: "user"; text: string; card?: undefined }
  | { role: "ai"; text: string; card?: { steps: string[]; tip: string } };



function Tutor() {
  const [messages, setMessages] = useState<Msg[]>(conversation);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setDraft("");
    // Mock assistant reply
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Got it — let me think through that step by step." },
      ]);
    }, 600);
  };

  return (
    <MobileShell>
      {/* Header */}
      <header className="px-5 pt-6 pb-3 flex items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-md bg-[color-mix(in_oklab,var(--background)_75%,transparent)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] glass-strong flex items-center justify-center">
            <BotMark size={22} />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight leading-tight">AI Tutor</h1>
            <p className="text-[11.5px] text-muted-foreground">Online · ready to help</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full glass tap flex items-center justify-center" aria-label="Settings">
          <Settings2 size={16} />
        </button>
      </header>

      {/* Chat scroll area — leaves room for fixed composer + bottom nav */}
      <div
        ref={scrollRef}
        className="px-5 pt-2 pb-[180px] space-y-3 overflow-y-auto"
        style={{ minHeight: "calc(100dvh - 90px)" }}
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} anim-in`}>
            {m.role === "user" ? (
              <div className="gradient-primary text-white rounded-[18px] rounded-br-md px-4 py-2.5 max-w-[78%] text-[14px]">
                {m.text}
              </div>
            ) : (
              <div className="max-w-[88%] space-y-2">
                <div className="text-[14px] leading-relaxed">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
                    <BotMark size={12} /> StudySphere
                  </div>
                  {m.text}
                </div>
                {m.card && (
                  <GlassCard className="!p-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Steps</p>
                    <ol className="space-y-2">
                      {m.card.steps.map((s, k) => (
                        <li key={k} className="flex gap-3 text-[13px]">
                          <span className="mono w-5 h-5 rounded-full bg-glass-strong flex-shrink-0 flex items-center justify-center text-[10px]">
                            {k + 1}
                          </span>
                          <span className="pt-0.5">{s}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 pt-3 border-t border-hairline text-[12px] text-muted-foreground">
                      <span className="font-medium text-foreground">Tip · </span>
                      {m.card.tip}
                    </div>
                  </GlassCard>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-2 pt-3">
          {["Explain like I'm 12", "Give me 5 past questions", "Test me"].map((c) => (
            <button key={c} onClick={() => setDraft(c)} className="tap">
              <Pill tone="primary">{c}</Pill>
            </button>
          ))}
        </div>
      </div>

      {/* Composer pinned at the bottom (above tab bar) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[388px] z-40">
        <div className="glass-strong rounded-[22px] p-2 flex items-center gap-1.5">
          <button className="w-9 h-9 rounded-full hover:bg-glass tap flex items-center justify-center" aria-label="Voice">
            <Mic size={15} />
          </button>
          <button className="w-9 h-9 rounded-full hover:bg-glass tap flex items-center justify-center" aria-label="Upload">
            <Upload size={15} />
          </button>
          <button className="w-9 h-9 rounded-full hover:bg-glass tap flex items-center justify-center" aria-label="Math">
            <Sigma size={15} />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="flex-1 bg-transparent outline-none text-[14px] px-2 placeholder:text-muted-foreground"
            placeholder="Ask anything…"
          />
          <button
            onClick={send}
            className="w-9 h-9 rounded-full gradient-primary tap flex items-center justify-center"
            aria-label="Send"
          >
            <Send size={14} color="white" />
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
