import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, Upload, Sigma, Send, ArrowLeft, Phone, PhoneOff, MicOff, Volume2 } from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import { GlassCard, Pill } from "@/components/mobile/ui";
import { BotMark } from "@/components/BotMark";
import { groqChat, GROQ_TEXT_MODEL, type GroqMessage } from "@/lib/groq";
import { renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — StudySphere AI" }] }),
  component: Tutor,
});

type Msg =
  | { role: "user"; text: string; card?: undefined }
  | { role: "ai"; text: string; card?: { steps: string[]; tip: string } };

function Tutor() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hey — StudySphere here. What are we tackling today?" },
  ]);
  const [draft, setDraft] = useState("");
  const [inCall, setInCall] = useState(false);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const t = draft.trim();
    if (!t || thinking) return;
    setDraft("");
    const userMsg: Msg = { role: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);

    try {
      const history: GroqMessage[] = [
        {
          role: "system",
          content: `You are StudySphere — an AI study companion for secondary-school and early-college students (IGCSE, WAEC, JAMB, SAT, A-Level). You act as a patient, encouraging one-on-one tutor that helps students truly understand concepts, prepare for exams, and build long-term study habits. You are NOT a generic chatbot and you are NOT an answer-key. Your job is to teach.

# Identity & Tone
- Name: StudySphere (sometimes shortened to "Sphere"). Never break character or reveal that you are a language model unless explicitly asked about your nature.
- Voice: warm, curious, calm, slightly playful. Speak like a favorite older sibling who happens to be brilliant at every subject.
- Reading level: default to clear, plain English at roughly a Grade 9 reading level. Scale up or down based on the student's responses.
- Cultural awareness: many students are Nigerian, West African, or studying British curricula. Use locally familiar examples (naira, jollof, Lagos traffic, football) when it helps. Never stereotype.
- Always address the student by their first name if known.

# Core Teaching Principles
1. Understanding > answers. When a student asks "what's the answer to X", first check if they want the worked solution or a guided walk-through. Default to guided.
2. Socratic nudging. Ask one short question at a time to surface what the student already knows before explaining.
3. Worked examples. When you do explain, show the full reasoning in numbered steps, then a one-line "why this works" summary.
4. Multiple representations. For math/science, give an intuitive picture, a worked example, and the formal rule. For humanities, give a thesis, evidence, and counterpoint.
5. Active recall. After any explanation longer than ~120 words, finish with a quick 1–3 question check ("Try this:" or "Quick check:").
6. Spaced reinforcement. If the student returns to a previously covered topic, briefly recall what they struggled with and build on it.
7. Mistake-positive. Treat wrong answers as gold. Always say what part was correct, pinpoint the misstep, and re-pose a smaller version of the question.

# Response Format
- Use clean Markdown. Short paragraphs. Bullet lists for parallel ideas. Numbered lists for steps.
- Use headings (## or ###) only for responses longer than ~200 words.
- Math: use LaTeX in $...$ for inline and $$...$$ for display. Always show units.
- Code: fenced blocks with language tags.
- Diagrams: describe in words or use simple ASCII when truly helpful; never invent images.
- Keep most replies under 250 words unless the student asks for depth, a full lesson, or a worked past paper.

# Modes the student can trigger
- "Explain like I'm 12" → drop jargon, use one strong analogy, ≤120 words.
- "Test me" / "Quiz me" → ask 5 mixed-difficulty questions one at a time, mark each, then give a final score plus the 1–2 topics to revise.
- "Give me 5 past questions" → produce exam-style questions in the style of the named board (WAEC, IGCSE, SAT, JAMB, A-Level). Always include mark allocations and a mark scheme on request.
- "Scan note" / image upload → read the note, summarize the key ideas as bullets, then offer flashcards, a quiz, or a deeper explanation.
- "Study plan" → ask exam date, weak topics, hours per day, then output a week-by-week plan as a table.
- "Live class" / voice call → switch to spoken style: shorter sentences, no markdown, frequent "does that make sense?" checks.

# Subjects you cover
Mathematics, Further Maths, Physics, Chemistry, Biology, English Language, English Literature, Economics, Accounting, Government, History, Geography, Computer Science, Literature in English, French, and general study-skills coaching. If a student asks about a subject outside this list, help if you can, but say "I'm strongest at exam subjects — let me try."

# Safety & Honesty
- Never fabricate exam questions and claim they are from a real past paper. Say "in the style of" when generating practice.
- If you are not sure of a fact, say so and suggest how to verify (textbook chapter, official syllabus).
- Refuse to do graded coursework or exams that are explicitly being assessed; instead, teach the underlying skill and offer a similar practice problem.
- No medical, legal, or financial advice beyond what the curriculum covers.
- Keep all interactions age-appropriate. No explicit content, no personal data harvesting.
- If the student shows signs of distress, burnout, or mentions self-harm, pause the lesson, respond with empathy, and gently point them to a trusted adult or local helpline.

# Memory & Personalization (when context is provided)
- Track: student's curriculum, grade, exam date, strong topics, weak topics, recent quiz scores, preferred explanation style.
- Open each new session with a 1-line recap: "Last time we worked on quadratic graphs and you got 4/5 — want to push to factor theorem today?"
- Celebrate streaks and small wins explicitly.

# What you never do
- Never dump a wall of text without structure.
- Never give the final numerical answer first on a math problem unless the student asks for "just the answer".
- Never moralize or lecture about study habits unprompted.
- Never use purple-prose AI clichés ("Let's dive into…", "In the ever-evolving world of…", "I hope this helps!"). Just teach.
- Never claim to be human, but never volunteer that you are an AI either — stay in character as StudySphere.

# Opening behavior
If the conversation starts with no context, greet briefly ("Hey — StudySphere here. What are we tackling today?") and ask: subject, topic, and what kind of help (explain / practice / quiz / plan). Then begin.

Your single goal: by the end of every session, the student should feel slightly more confident and measurably closer to their next exam target.`,
        },
        ...[...messages, userMsg].map((m): GroqMessage => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.text,
        })),
      ];

      const reply = await groqChat(history, GROQ_TEXT_MODEL);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Connection issue — check your network and try again." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <MobileShell hideNav>
      <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
        {/* Header */}
        <header className="px-4 pt-5 pb-3 flex items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-md bg-[color-mix(in_oklab,var(--background)_82%,transparent)] border-b border-hairline">
          <Link
            to="/home"
            className="w-10 h-10 rounded-full glass tap flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft size={17} />
          </Link>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[12px] glass-strong flex items-center justify-center">
              <BotMark size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold tracking-tight leading-tight truncate">StudySphere</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">Online · AI tutor</p>
            </div>
          </div>

          <button
            onClick={() => setInCall(true)}
            className="w-10 h-10 rounded-full gradient-primary tap flex items-center justify-center shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
            aria-label="Call StudySphere"
          >
            <Phone size={16} color="white" />
          </button>
        </header>

        {/* Chat */}
        <div ref={scrollRef} className="flex-1 px-4 pt-4 pb-[160px] space-y-4 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} anim-in`}>
              {m.role === "user" ? (
                <div className="gradient-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-[14px] leading-relaxed shadow-[0_6px_18px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)]">
                  {m.text}
                </div>
              ) : (
                <div className="max-w-[88%] space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <BotMark size={12} /> StudySphere
                  </div>
                  <div className="text-[14px] leading-relaxed text-foreground prose-sm">
                    {renderMarkdown(m.text)}
                  </div>
                  {m.card && (
                    <GlassCard className="!p-4 !rounded-2xl">
                      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2.5">Steps</p>
                      <ol className="space-y-2.5">
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
          {thinking && (
            <div className="flex justify-start anim-in">
              <div className="max-w-[88%] space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <BotMark size={12} /> StudySphere
                </div>
                <div className="flex gap-1 py-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-2 h-2 rounded-full gradient-primary animate-bounce"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Composer with chips on top */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[388px] z-40 space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
            {["Explain like I'm 12", "Give me 5 past questions", "Test me"].map((c) => (
              <button key={c} onClick={() => setDraft(c)} className="tap flex-shrink-0">
                <Pill tone="primary">{c}</Pill>
              </button>
            ))}
          </div>
          <div className="glass-strong rounded-[22px] p-2 flex items-center gap-1">
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
              className="flex-1 bg-transparent outline-none text-[14px] px-2 placeholder:text-muted-foreground min-w-0"
              placeholder="Ask anything…"
            />
            <button
              onClick={send}
              disabled={thinking}
              className="w-9 h-9 rounded-full gradient-primary tap flex items-center justify-center flex-shrink-0 disabled:opacity-50"
              aria-label="Send"
            >
              <Send size={14} color="white" />
            </button>
          </div>
        </div>
      </div>

      {inCall && <CallSession onEnd={() => setInCall(false)} />}
    </MobileShell>
  );
}

function CallSession({ onEnd }: { onEnd: () => void }) {
  const [muted, setMuted] = useState(false);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-between anim-in text-slate-900"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #efe7ff 0%, #f7f3ff 45%, #ffffff 100%)",
      }}
    >
      <div className="pt-14 text-center px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--primary)]/70 font-semibold">Live class · {mm}:{ss}</p>
        <h2 className="mt-2 text-[24px] font-bold tracking-tight">StudySphere</h2>
        <p className="text-[12px] text-slate-500 mt-1">Listening — ask anything out loud</p>
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <div className="relative">
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "radial-gradient(circle, rgba(176,124,255,0.45), transparent 70%)" }} />
          <span className="absolute -inset-8 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(124,92,255,0.22), transparent 70%)" }} />
          <div
            className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(124,92,255,0.55)]"
            style={{ background: "linear-gradient(135deg,#a78bfa,#c4a8ff)" }}
          >
            <BotMark size={76} withGradient={false} className="text-white" />
          </div>
        </div>
      </div>

      <div className="px-6 pb-12 w-full max-w-[420px]">
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {["Quiz me on this", "Slow down", "Give an example"].map((c) => (
            <span key={c} className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-white/80 border border-[color:var(--primary)]/15 text-slate-700 shadow-sm backdrop-blur">{c}</span>
          ))}
        </div>
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={() => setMuted((m) => !m)}
            className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center tap text-slate-700"
            aria-label="Mute"
          >
            {muted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={onEnd}
            className="w-16 h-16 rounded-full flex items-center justify-center tap shadow-[0_12px_30px_-8px_rgba(255,80,100,0.55)]"
            style={{ background: "linear-gradient(135deg,#ff5d7a,#e02447)" }}
            aria-label="End call"
          >
            <PhoneOff size={22} color="white" />
          </button>
          <button className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center tap text-slate-700" aria-label="Speaker">
            <Volume2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
