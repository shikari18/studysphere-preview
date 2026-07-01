import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search, Mic, Upload, Sparkles as SparkIcon,
  BookOpen, FileText, Scan, Layers,
  Calendar, Brain, Play,
} from "lucide-react";
import { BotMark } from "@/components/BotMark";
import { MobileShell, Section } from "@/components/mobile/Shell";
import { GlassCard, Pill } from "@/components/mobile/ui";
import { IGCSE_SUBJECTS } from "@/data/past-papers/igcse-subjects";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — StudySphere AI" }] }),
  component: Home,
});

// Popular subjects from real IGCSE list
const popularSubjectCodes = ["0580", "0625", "0620", "0610", "0478", "0455"];
const popularSubjects = popularSubjectCodes
  .map((code) => IGCSE_SUBJECTS.find((s) => s.code === code))
  .filter(Boolean) as typeof IGCSE_SUBJECTS;

// Subject emoji map
const SUBJECT_EMOJI: Record<string, string> = {
  "0580": "∑", "0625": "⚛︎", "0620": "⚗︎",
  "0610": "🧬", "0478": "💻", "0455": "$",
  "0452": "📊", "0450": "📈", "0460": "🌍",
  "0470": "📜", "0500": "✎", "0495": "👥",
};

function Home() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [recentStudy, setRecentStudy] = useState<{
    subjectName: string;
    subjectCode: string;
    type: 'syllabus' | 'note' | 'paper';
    title: string;
    subInfo: string;
    progress: number;
    routePath: string;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("studysphere_recent_study");
      if (saved) {
        setRecentStudy(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const progress = recentStudy?.progress ?? 0;

  return (
    <MobileShell>
      {/* Header */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{greeting}</p>
          <h1 className="text-[26px] font-semibold tracking-tight">Shi</h1>
          <p className="text-[13px] text-muted-foreground mt-1">What are we tackling today?</p>
        </div>
        <div className="w-11 h-11 rounded-full glass flex items-center justify-center font-semibold text-sm">S</div>
      </header>

      {/* Search bar */}
      <div className="px-5 mt-5">
        <Link to="/subjects">
          <div className="glass rounded-[18px] flex items-center gap-3 px-4 h-12">
            <Search size={16} className="text-muted-foreground" />
            <span className="text-[14px] text-muted-foreground flex-1">Search subjects, notes, past papers…</span>
          </div>
        </Link>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {["Past Papers", "Syllabus", "IGCSE Notes", "AI Tutor"].map((c) => (
            <Pill key={c}>{c}</Pill>
          ))}
        </div>
      </div>

      {/* Black Card: Continue Studying */}
      <div className="px-5 mt-5">
        <div className="bg-black text-white rounded-[24px] p-5 shadow-lg border border-neutral-900 relative overflow-hidden">
          {recentStudy ? (
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Continue Studying</p>
                  <h3 className="text-[16px] font-bold mt-1 text-white tracking-tight leading-tight truncate">{recentStudy.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{recentStudy.subInfo}</p>
                </div>
                <div className="relative flex-shrink-0 ml-4">
                  <svg className="w-12 h-12">
                    <circle cx="24" cy="24" r="18" stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="none" />
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray="113"
                      strokeDashoffset={113 - (113 * progress) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 24 24)"
                    />
                    <text x="24" y="27" className="text-[9px] font-bold fill-white" textAnchor="middle">
                      {progress}%
                    </text>
                  </svg>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Link
                  to={recentStudy.routePath}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white py-2.5 rounded-xl text-xs font-semibold transition-colors tap"
                >
                  <Play size={12} fill="white" />
                  Resume
                </Link>
                <Link
                  to="/tutor"
                  className="w-9 h-9 flex items-center justify-center bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white rounded-xl transition-colors tap"
                  aria-label="AI Help"
                >
                  <SparkIcon size={14} className="text-[#a78bfa]" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground self-start">Continue Studying</p>
              <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center mt-2 mb-3">
                <BookOpen size={16} className="text-neutral-500" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">Your study card is empty</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-[240px]">
                Read a syllabus, note chapter, or past paper to see your progress card here.
              </p>
              <Link
                to="/subjects"
                className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all tap"
              >
                Browse Subjects
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* AI Tutor card */}
      <Section>
        <Link to="/tutor" className="block">
          <GlassCard className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <BotMark size={18} withGradient={false} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold">Ask StudySphere</p>
              <p className="text-[12px] text-muted-foreground truncate">Voice, photo or text — instant answers</p>
            </div>
            <button className="w-9 h-9 rounded-full glass-strong flex items-center justify-center tap" aria-label="Voice"><Mic size={14} /></button>
            <button className="w-9 h-9 rounded-full glass-strong flex items-center justify-center tap" aria-label="Upload"><Upload size={14} /></button>
          </GlassCard>
        </Link>
      </Section>

      {/* Quick actions */}
      <Section title="Quick actions">
        <div className="grid grid-cols-3 gap-3">
          <Link to="/past-papers">
            <GlassCard className="!p-4 flex flex-col items-center gap-2 tap text-center">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <FileText size={16} color="white" />
              </div>
              <p className="text-[12px] font-semibold">Past Papers</p>
            </GlassCard>
          </Link>
          <Link to="/subjects">
            <GlassCard className="!p-4 flex flex-col items-center gap-2 tap text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#ff6b6b,#ff4757)" }}>
                <BookOpen size={16} color="white" />
              </div>
              <p className="text-[12px] font-semibold">Syllabus</p>
            </GlassCard>
          </Link>
          <Link to="/notes">
            <GlassCard className="!p-4 flex flex-col items-center gap-2 tap text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#2ed573,#1e90ff)" }}>
                <Layers size={16} color="white" />
              </div>
              <p className="text-[12px] font-semibold">Notes</p>
            </GlassCard>
          </Link>
          <Link to="/scan">
            <GlassCard className="!p-4 flex flex-col items-center gap-2 tap text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#a29bfe,#6c5ce7)" }}>
                <Scan size={16} color="white" />
              </div>
              <p className="text-[12px] font-semibold">Scan Note</p>
            </GlassCard>
          </Link>
          <Link to="/quiz">
            <GlassCard className="!p-4 flex flex-col items-center gap-2 tap text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#fdcb6e,#e17055)" }}>
                <Brain size={16} color="white" />
              </div>
              <p className="text-[12px] font-semibold">Quiz</p>
            </GlassCard>
          </Link>
          <Link to="/planner">
            <GlassCard className="!p-4 flex flex-col items-center gap-2 tap text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#55efc4,#00b894)" }}>
                <Calendar size={16} color="white" />
              </div>
              <p className="text-[12px] font-semibold">Planner</p>
            </GlassCard>
          </Link>
        </div>
      </Section>

      {/* Popular subjects */}
      <Section title="Popular subjects" action={<Link to="/subjects" className="text-[12px] text-muted-foreground">See all</Link>}>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-1">
          {popularSubjects.map((s) => (
            <Link key={s.code} to="/subjects">
              <GlassCard className="!p-4 min-w-[130px]">
                <div className="text-2xl">{SUBJECT_EMOJI[s.code] ?? "📚"}</div>
                <p className="text-[12.5px] font-medium mt-2 truncate">{s.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.code}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </Section>

      {/* ── Streak & Stats row ── */}
      <Section>
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="!p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px]">🔥</span>
              <span className="text-[11.5px] font-semibold text-muted-foreground">Study streak</span>
            </div>
            <p className="text-[28px] font-bold tracking-tight" style={{ color: "#f97316" }}>3</p>
            <p className="text-[10.5px] text-muted-foreground font-medium">days in a row</p>
          </GlassCard>
          <GlassCard className="!p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px]">⚡</span>
              <span className="text-[11.5px] font-semibold text-muted-foreground">This week</span>
            </div>
            <p className="text-[28px] font-bold tracking-tight" style={{ color: "#6d4cff" }}>5h 24m</p>
            <p className="text-[10.5px] text-emerald-500 font-medium">↑ 18% vs last week</p>
          </GlassCard>
        </div>
      </Section>

      {/* ── Exam countdown ── */}
      <Section title="Upcoming exams">
        <GlassCard className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold">IGCSE May/June 2025</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Cambridge International</p>
            </div>
            <div className="text-center">
              <p className="text-[24px] font-bold" style={{ color: "#6d4cff" }}>42</p>
              <p className="text-[10px] text-muted-foreground font-medium">days left</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-hairline overflow-hidden">
            <div className="h-full rounded-full gradient-primary" style={{ width: "68%" }} />
          </div>
          <p className="text-[10.5px] text-muted-foreground mt-1.5">68% of prep time used</p>
        </GlassCard>
      </Section>

      {/* ── Motivational footer ── */}
      <Section>
        <div className="text-center py-4">
          <p className="text-[12px] text-muted-foreground">Powered by</p>
          <p className="text-[13px] font-semibold mt-0.5" style={{ color: "#6d4cff" }}>Cambridge IGCSE · {IGCSE_SUBJECTS.length} subjects</p>
        </div>
      </Section>
    </MobileShell>
  );
}

