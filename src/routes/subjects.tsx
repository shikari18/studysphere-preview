import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Search, ChevronRight, X, FileText, ExternalLink, Loader2,
  BookOpen, Beaker, Calculator, Globe, Laptop, Palette, Briefcase, Languages, GraduationCap,
  Eye, CheckCircle2, Layers,
} from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import {
  IGCSE_SUBJECTS, IGCSE_YEARS, IGCSE_SESSIONS, CATEGORY_META,
  type IgcseSubject, type SubjectCategory,
} from "@/data/past-papers/igcse-subjects";
import { noteChapters } from "@/data/notes";
import type { NoteChapter } from "@/data/notes";
import { buildSyllabusUrls, SYLLABUS_SUBJECT_NAMES, fetchPdfAsBlob, buildXtremeUrl } from "@/lib/pdf-proxy";

export const Route = createFileRoute("/subjects")({
  head: () => ({ meta: [{ title: "Subjects — StudySphere AI" }] }),
  component: Subjects,
});

const CATEGORY_ICON: Record<SubjectCategory, React.ElementType> = {
  sciences: Beaker,
  mathematics: Calculator,
  languages: Languages,
  humanities: Globe,
  business: Briefcase,
  technology: Laptop,
  arts: Palette,
  other: GraduationCap,
};

const categories: { id: SubjectCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sciences", label: "Sciences" },
  { id: "mathematics", label: "Maths" },
  { id: "languages", label: "Languages" },
  { id: "humanities", label: "Humanities" },
  { id: "business", label: "Business" },
  { id: "technology", label: "Tech" },
  { id: "arts", label: "Arts" },
];

// Get notes for a subject code
function getSubjectNotes(code: string): NoteChapter[] {
  return noteChapters.filter((c) => (c as any).code === code);
}

// ─── Paper row (same as past-papers.tsx) ─────────────────────────────────────
interface PaperSelection {
  subject: IgcseSubject;
  year: string;
  session: string;
  paperNum: string;
  paperLabel: string;
  variant: string;
}

interface PdfLoaded {
  qpBlob: string | null;
  msBlob: string | null;
  qpUrl: string;
  msUrl: string;
  error: string | null;
}

function PaperRow({
  year, session,
  paper,
  variant,
  onView,
}: {
  year: string;
  session: string;
  paper: { num: string; label: string; diff: "Core" | "Extended" | "Practical" };
  variant: string;
  onView: () => void;
}) {
  const s = session === "May/June" ? "M/J" : session === "Oct/Nov" ? "O/N" : "F/M";
  return (
    <button
      onClick={onView}
      className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors group text-left tap"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-[11px] font-bold text-muted-foreground w-9 flex-shrink-0">{s}</span>
        <span className="text-[12px] font-semibold truncate">{paper.label} · v{variant}</span>
      </div>
      <div className="ml-3 px-3 py-1 rounded-full text-[11px] font-bold gradient-primary text-white flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Eye size={10} /> Open
      </div>
    </button>
  );
}

// ─── Subject Detail Sheet ─────────────────────────────────────────────────────
// ─── Syllabus Pairs Mapping (Standard to 9-1) ─────────────────────────────────
const SYLLABUS_PAIRS: Record<string, { name: string; code: string; folder: string }> = {
  "0610": { name: "Biology (9-1)", code: "0970", folder: "Biology (9-1) (0970)" },
  "0620": { name: "Chemistry (9-1)", code: "0971", folder: "Chemistry (9-1) (0971)" },
  "0625": { name: "Physics (9-1)", code: "0972", folder: "Physics (9-1) (0972)" },
  "0580": { name: "Mathematics (9-1)", code: "0980", folder: "Mathematics (9-1) (0980)" },
  "0478": { name: "Computer Science (9-1)", code: "0984", folder: "Computer Science (9-1) (0984)" },
  "0450": { name: "Business Studies (9-1)", code: "0986", folder: "Business Studies (9-1) (0986)" },
  "0452": { name: "Accounting (9-1)", code: "0985", folder: "Accounting (9-1) (0985)" },
  "0455": { name: "Economics (9-1)", code: "0987", folder: "Economics (9-1) (0987)" },
  "0500": { name: "English - First Language (9-1)", code: "0990", folder: "English - First Language (9-1) (0990)" },
  "0470": { name: "History (9-1)", code: "0977", folder: "History (9-1) (0977)" },
  "0460": { name: "Geography (9-1)", code: "0976", folder: "Geography (9-1) (0976)" },
};

// Log study actions to populate the homepage black card
function recordStudyEvent(type: 'syllabus' | 'note' | 'paper', subjectName: string, code: string, title: string) {
  try {
    const infoMap = {
      'syllabus': 'Syllabus',
      'note': 'Study Notes',
      'paper': 'Past Papers',
    };
    const event = {
      subjectName,
      subjectCode: code,
      type,
      title,
      subInfo: `${subjectName} · ${infoMap[type]}`,
      progress: Math.floor(Math.random() * 30) + 50, // Generate simulated progress (50-80%)
      routePath: `/subjects?openSubject=${code}&tab=${type}`,
      timestamp: Date.now()
    };
    localStorage.setItem("studysphere_recent_study", JSON.stringify(event));
  } catch (e) {
    console.error("Failed to save study progress", e);
  }
}

// ─── Subject Detail Sheet ─────────────────────────────────────────────────────
function SubjectDetail({
  subject,
  onClose,
}: {
  subject: IgcseSubject;
  onClose: () => void;
}) {
  const [activeView, setActiveView] = useState<"notes" | "papers" | null>(null);
  const [activeSyllabusCode, setActiveSyllabusCode] = useState<string>(subject.code);

  // Syllabus options
  const syllabusOptions = useMemo(() => {
    const options = [
      { name: subject.name, code: subject.code, folder: subject.folder }
    ];
    const pair = SYLLABUS_PAIRS[subject.code];
    if (pair) {
      options.push(pair);
    }
    return options;
  }, [subject]);

  // Support query params for initial view if opened from a resume link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const openSubCode = params.get("openSubject");
    if (openSubCode) {
      const found = syllabusOptions.find(o => o.code === openSubCode);
      if (found) {
        setActiveSyllabusCode(openSubCode);
        if (tabParam === "notes") {
          setActiveView("notes");
        } else if (tabParam === "paper") {
          setActiveView("papers");
        } else if (tabParam === "syllabus") {
          setActiveView(null);
          openSyllabus(openSubCode);
        }
      }
    }
  }, [syllabusOptions]);

  // Syllabus state
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [syllabusBlobUrl, setSyllabusBlobUrl] = useState<string | null>(null);
  const [syllabusDirectUrl, setSyllabusDirectUrl] = useState<string | null>(null);
  const [syllabusError, setSyllabusError] = useState(false);
  const [syllabusStarted, setSyllabusStarted] = useState(false);

  // Syllabus PDF viewer overlay
  const [syllabusView, setSyllabusView] = useState(false);

  // Past papers state
  const [selectedYear, setSelectedYear] = useState("2023");
  const [viewingPaper, setViewingPaper] = useState<PaperSelection | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState<PdfLoaded | null>(null);
  const [paperLoading, setPaperLoading] = useState(false);
  const [paperTab, setPaperTab] = useState<"qp" | "ms">("qp");

  // Notes state
  const notesCode = useMemo(() => {
    const baseCode = Object.keys(SYLLABUS_PAIRS).find(k => SYLLABUS_PAIRS[k].code === activeSyllabusCode);
    return baseCode || activeSyllabusCode;
  }, [activeSyllabusCode]);

  const subjectNotes = getSubjectNotes(notesCode);
  const [selectedChapter, setSelectedChapter] = useState<NoteChapter | null>(null);
  const [chapterPageIdx, setChapterPageIdx] = useState(0);

  const openSyllabus = async (code: string) => {
    recordStudyEvent('syllabus', subject.name, code, `${subject.name} Syllabus (${code})`);

    setSyllabusStarted(true);
    setSyllabusView(true);
    setSyllabusLoading(true);
    setSyllabusError(false);
    setSyllabusBlobUrl(null);

    const currentOpt = syllabusOptions.find(o => o.code === code) || subject;
    const subjectName = SYLLABUS_SUBJECT_NAMES[code] ?? currentOpt.name;
    const folder = `${subjectName} (${code})`;

    // Try years newest→oldest until one loads
    const years = ["26", "25", "24", "23", "22"];
    let found: string | null = null;
    for (const yy of years) {
      const url = `https://www.gceguide.xyz/Cambridge%20IGCSE/${encodeURIComponent(folder)}/${code}_y${yy}_sy.pdf`;
      try {
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(6000) });
        if (res.ok) { found = url; break; }
      } catch { /* try next */ }
    }

    if (found) {
      // Use PDF.js viewer hosted on Mozilla CDN — works cross-origin without CORS issues
      const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(found)}`;
      setSyllabusBlobUrl(viewerUrl);
      setSyllabusDirectUrl(found);
      setSyllabusLoading(false);
    } else {
      // Fallback: try direct iframe with the y25 URL (some browsers can render it)
      const fallbackUrl = `https://www.gceguide.xyz/Cambridge%20IGCSE/${encodeURIComponent(folder)}/${code}_y25_sy.pdf`;
      setSyllabusDirectUrl(fallbackUrl);
      setSyllabusBlobUrl(null);
      setSyllabusLoading(false);
      setSyllabusError(true);
    }
  };

  const openPaper = async (year: string, session: string, paperNum: string, paperLabel: string, variant: string) => {
    recordStudyEvent('paper', subject.name, activeSyllabusCode, `${year} ${session} Paper ${paperNum} (v${variant})`);

    const currentOpt = syllabusOptions.find(o => o.code === activeSyllabusCode) || subject;
    setViewingPaper({ 
      subject: { ...subject, code: activeSyllabusCode, folder: currentOpt.folder }, 
      year, 
      session, 
      paperNum, 
      paperLabel, 
      variant 
    });
    setPaperLoading(true);
    setPaperTab("qp");
    setPdfLoaded(null);

    const qpUrl = buildXtremeUrl(activeSyllabusCode, currentOpt.folder, year, session, paperNum, variant, "qp");
    const msUrl = buildXtremeUrl(activeSyllabusCode, currentOpt.folder, year, session, paperNum, variant, "ms");

    // Probe QP availability
    let qpOk = false;
    try {
      const r = await fetch(qpUrl, { method: "HEAD", signal: AbortSignal.timeout(8000) });
      qpOk = r.ok;
    } catch { qpOk = false; }

    if (!qpOk) {
      setPdfLoaded({ qpBlob: null, msBlob: null, qpUrl, msUrl, error: "Paper not found in archive. Try a different year, session, or variant." });
      setPaperLoading(false);
      return;
    }

    // Use PDF.js viewer — works for direct public PDFs
    const qpViewer = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(qpUrl)}`;
    const msViewer = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(msUrl)}`;

    setPdfLoaded({
      qpBlob: qpViewer,
      msBlob: msViewer,
      qpUrl,
      msUrl,
      error: null,
    });
    setPaperLoading(false);
  };

  const closePaperViewer = () => {
    setViewingPaper(null);
    setPdfLoaded(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="px-5 pt-6 pb-3 flex items-center gap-3 border-b border-hairline flex-shrink-0">
        <button 
          onClick={activeView ? () => setActiveView(null) : onClose} 
          className="w-9 h-9 rounded-full glass flex items-center justify-center tap flex-shrink-0"
        >
          {activeView ? <ChevronLeft size={16} /> : <X size={15} />}
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-bold truncate">
            {activeView ? `${subject.name} — ${activeView === "notes" ? "Notes" : "Papers"}` : subject.name}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Cambridge IGCSE {activeView ? `· ${activeSyllabusCode}` : `· ${subject.code}`}
          </p>
        </div>
      </header>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">

        {/* ── SELECTION DASHBOARD (when activeView === null) ── */}
        {activeView === null && (
          <div className="px-5 py-6 space-y-5 pb-24">
            <div className="text-center max-w-[280px] mx-auto mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Study Type</h3>
              <p className="text-[12px] text-muted-foreground/75 mt-1 leading-relaxed">
                Choose a syllabus version below to read the official syllabus, view revision notes, or practice past papers.
              </p>
            </div>
            
            {syllabusOptions.map((opt) => {
              const notesCodeOpt = Object.keys(SYLLABUS_PAIRS).find(k => SYLLABUS_PAIRS[k].code === opt.code) || opt.code;
              const chaptersCount = getSubjectNotes(notesCodeOpt).length;
              
              return (
                <div 
                  key={opt.code} 
                  className="glass rounded-[24px] p-5 relative overflow-hidden flex flex-col gap-4 shadow-sm"
                  style={{ border: "1px solid rgba(109,76,255,0.12)" }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-primary/10 text-primary">
                          Code {opt.code}
                        </span>
                        {opt.code !== subject.code && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-500">
                            9-1 Graded
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-[15px] text-foreground mt-2 tracking-tight leading-tight">{opt.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Official Cambridge IGCSE Syllabus</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {/* Syllabus Button */}
                    <button
                      onClick={() => openSyllabus(opt.code)}
                      className="flex flex-col items-center gap-2 py-3 rounded-[18px] glass hover:bg-white/5 transition-all tap border border-white/5"
                    >
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <FileText size={15} />
                      </div>
                      <span className="text-[11px] font-semibold">Syllabus</span>
                    </button>

                    {/* Notes Button */}
                    <button
                      onClick={() => {
                        setActiveSyllabusCode(opt.code);
                        setActiveView("notes");
                      }}
                      className="flex flex-col items-center gap-2 py-3 rounded-[18px] glass hover:bg-white/5 transition-all tap border border-white/5"
                    >
                      <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                        <BookOpen size={15} />
                      </div>
                      <span className="text-[11px] font-semibold truncate max-w-full px-1">
                        Notes {chaptersCount > 0 ? `(${chaptersCount})` : ""}
                      </span>
                    </button>

                    {/* Past Papers Button */}
                    <button
                      onClick={() => {
                        setActiveSyllabusCode(opt.code);
                        setActiveView("papers");
                      }}
                      className="flex flex-col items-center gap-2 py-3 rounded-[18px] glass hover:bg-white/5 transition-all tap border border-white/5"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Layers size={15} />
                      </div>
                      <span className="text-[11px] font-semibold">Papers</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PAST PAPERS VIEW ── */}
        {activeView === "papers" && (
          <div>
            {/* Year selector */}
            <div className="px-5 py-3 flex gap-2 overflow-x-auto border-b border-hairline bg-background/50 backdrop-blur-md sticky top-0 z-10">
              {IGCSE_YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`flex-shrink-0 px-3.5 py-1 rounded-full text-[11px] font-bold tap transition-all ${
                    selectedYear === y ? "gradient-primary text-white" : "glass text-muted-foreground"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
            {/* Session rows */}
            <div className="divide-y divide-hairline pb-20">
              {IGCSE_SESSIONS.map((session) => (
                <div key={session} className="px-5 py-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {session} {selectedYear}
                  </p>
                  <div className="space-y-1">
                    {subject.papers.flatMap((paper) =>
                      ["1", "2"].map((variant) => (
                        <PaperRow
                          key={`${session}-${paper.num}-${variant}`}
                          year={selectedYear}
                          session={session}
                          paper={paper}
                          variant={variant}
                          onView={() => openPaper(selectedYear, session, paper.num, paper.label, variant)}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NOTES VIEW ── */}
        {activeView === "notes" && (
          <div className="px-5 py-5 space-y-2 pb-24">
            {subjectNotes.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen size={32} className="mx-auto mb-3 opacity-30 text-primary" />
                <p className="font-semibold text-[14px]">No notes available yet</p>
                <p className="text-[12px] mt-1 opacity-70">Notes for {subject.name} are coming soon.</p>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground tracking-wider uppercase font-bold mb-3">{subjectNotes.length} chapters available</p>
                {subjectNotes.map((chapter, i) => (
                  <button
                    key={i}
                    onClick={() => { 
                      setSelectedChapter(chapter); 
                      setChapterPageIdx(0); 
                      recordStudyEvent('note', subject.name, activeSyllabusCode, chapter.title);
                    }}
                    className="w-full glass rounded-[20px] px-4 py-4 tap text-left flex items-center gap-3 transition-all"
                    style={{ border: "1px solid rgba(109,76,255,0.1)" }}
                  >
                    <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <BookOpen size={14} color="white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-foreground truncate">{chapter.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {chapter.pages?.length ?? 0} sections to read
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Chapter viewer (slides over notes tab) ── */}
      {selectedChapter && (
        <div className="absolute inset-0 z-10 flex flex-col" style={{ background: "var(--background)" }}>
          <header
            className="px-5 pt-6 pb-4 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-md border-b border-hairline"
            style={{ background: "rgba(var(--background-rgb, 255,255,255),0.85)" }}
          >
            <button
              onClick={() => setSelectedChapter(null)}
              className="w-9 h-9 rounded-full glass flex items-center justify-center tap"
            >
              <X size={15} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[14px] truncate">{selectedChapter.title}</p>
              <p className="text-[11px] text-muted-foreground">{subject.name}</p>
            </div>
          </header>

          {(selectedChapter.pages ?? []).length > 1 && (
            <div className="px-5 py-3 flex gap-2 overflow-x-auto border-b border-hairline bg-background/50">
              {(selectedChapter.pages ?? []).map((p: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setChapterPageIdx(i)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold tap transition-all ${
                    i === chapterPageIdx ? "gradient-primary text-white" : "glass text-muted-foreground"
                  }`}
                >
                  {p.section ?? p.title ?? `Section ${i + 1}`}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 space-y-4">
            {(() => {
              const page = (selectedChapter.pages ?? [])[chapterPageIdx];
              if (!page) return <p className="text-muted-foreground text-[13px]">No content yet.</p>;
              return (
                <>
                  <h2 className="text-[17px] font-bold text-foreground">{(page as any).section ?? (page as any).title}</h2>
                  {((page as any).blocks ?? []).map((block: any, bi: number) => (
                    <NoteBlockRenderer key={bi} block={block} />
                  ))}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Syllabus PDF full-screen overlay ── */}
      {syllabusView && (
        <div className="absolute inset-0 z-20 bg-black flex flex-col">
          <div className="bg-black/90 backdrop-blur-md px-4 pt-4 pb-3 flex items-center gap-3 border-b border-white/10">
            <button
              onClick={() => { setSyllabusView(false); }}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center tap"
            >
              <X size={15} color="white" />
            </button>
            <div className="flex-1">
              <p className="font-bold text-[13px] text-white">Syllabus PDF</p>
              <p className="text-[11px] text-white/50">Cambridge IGCSE Official</p>
            </div>
            {syllabusDirectUrl && (
              <a href={syllabusDirectUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <ExternalLink size={14} color="white" />
              </a>
            )}
          </div>
          {syllabusLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-black">
              <Loader2 size={28} className="text-[color:var(--primary)] animate-spin" />
              <p className="text-white/60 text-[13px]">Loading syllabus…</p>
            </div>
          )}
          {!syllabusLoading && syllabusError && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-black p-8">
              <FileText size={36} className="text-amber-400" />
              <p className="text-white font-bold text-[14px]">Syllabus Not Available</p>
              <p className="text-white/50 text-[12px] text-center">The PDF wasn't found. Try opening externally.</p>
              {syllabusDirectUrl && (
                <a href={syllabusDirectUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2 rounded-full gradient-primary text-white text-[12px] font-semibold">Open externally</a>
              )}
            </div>
          )}
          {!syllabusLoading && !syllabusError && syllabusBlobUrl && (
            <iframe
              key={syllabusBlobUrl}
              src={syllabusBlobUrl}
              className="flex-1 w-full border-0"
              style={{ background: "#525659" }}
              title="Syllabus PDF"
              allow="fullscreen"
            />
          )}
        </div>
      )}

      {/* ── Paper PDF viewer overlay ── */}
      {viewingPaper && (
        <div className="absolute inset-0 z-20 bg-black flex flex-col">
          <div className="bg-black/90 backdrop-blur-md px-4 pt-4 pb-2 flex items-center gap-3 border-b border-white/10">
            <button onClick={closePaperViewer} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center tap">
              <X size={15} color="white" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px] text-white truncate">{subject.name} — {viewingPaper.paperLabel}</p>
              <p className="text-[11px] text-white/50">{viewingPaper.session} {viewingPaper.year} · v{viewingPaper.variant}</p>
            </div>
            {(() => {
              const directUrl = paperTab === "qp" ? pdfLoaded?.qpUrl : pdfLoaded?.msUrl;
              return directUrl ? (
                <a href={directUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <ExternalLink size={14} color="white" />
                </a>
              ) : null;
            })()}
          </div>
          {pdfLoaded && !paperLoading && (
            <div className="bg-black/80 px-4 py-2 flex gap-2">
              <button
                onClick={() => setPaperTab("qp")}
                disabled={!pdfLoaded.qpBlob}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold tap transition-all ${paperTab === "qp" ? "gradient-primary text-white" : pdfLoaded.qpBlob ? "text-white/60" : "text-white/25 cursor-not-allowed"}`}
              >
                <FileText size={11} /> Question Paper
              </button>
              <button
                onClick={() => setPaperTab("ms")}
                disabled={!pdfLoaded.msBlob}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold tap transition-all ${paperTab === "ms" ? "gradient-primary text-white" : pdfLoaded.msBlob ? "text-white/60" : "text-white/25 cursor-not-allowed"}`}
              >
                <CheckCircle2 size={11} /> Mark Scheme
              </button>
            </div>
          )}
          {paperLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-black">
              <Loader2 size={28} className="text-[color:var(--primary)] animate-spin" />
              <p className="text-white/60 text-[13px]">Fetching paper from archive…</p>
            </div>
          )}
          {!paperLoading && pdfLoaded?.error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-black p-8">
              <FileText size={40} className="text-amber-400" />
              <p className="font-bold text-white text-[15px]">Paper Not Found</p>
              <p className="text-white/50 text-[12px] text-center">Try a different year, session, or variant.</p>
              <button onClick={closePaperViewer} className="mt-2 px-6 py-2 rounded-full bg-white/10 text-white text-[12px] font-semibold tap">Go Back</button>
            </div>
          )}
          {!paperLoading && (() => {
            const src = paperTab === "qp" ? pdfLoaded?.qpBlob : pdfLoaded?.msBlob;
            return src ? (
              <iframe
                key={src}
                src={src}
                className="flex-1 w-full border-0"
                style={{ background: "#525659" }}
                title={paperTab === "qp" ? "Question Paper" : "Mark Scheme"}
                allow="fullscreen"
              />
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Note Block Renderer (mirrors notes.tsx NoteBlock) ────────────────────────
import { GlassCard } from "@/components/mobile/ui";

function NoteBlockRenderer({ block }: { block: any }) {
  switch (block.kind) {
    case "intro":
      return <p className="text-[13.5px] leading-relaxed">{block.text}</p>;
    case "highlight":
      return (
        <div className={`rounded-[14px] p-4 text-[13px] leading-relaxed whitespace-pre-line ${
          block.color === "blue" ? "bg-blue-50 border border-blue-200 text-blue-900" :
          block.color === "green" ? "bg-green-50 border border-green-200 text-green-900" :
          block.color === "pink" ? "bg-pink-50 border border-pink-200 text-pink-900" :
          "bg-purple-50 border border-purple-200 text-purple-900"
        }`}>{block.text}</div>
      );
    case "keyterms":
      return (
        <GlassCard className="!p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Key Terms</p>
          {block.terms?.map((t: any, i: number) => (
            <div key={i} className="flex gap-2">
              <span className="font-bold text-[12.5px] flex-shrink-0">{t.label}:</span>
              <span className="text-[12.5px] text-muted-foreground">{t.value}</span>
            </div>
          ))}
        </GlassCard>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-[14px] glass" style={{ border: "1px solid rgba(109,76,255,0.1)" }}>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-hairline">{block.headers?.map((h: string, i: number) => <th key={i} className="px-3 py-2 text-left font-bold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>{block.rows?.map((row: string[], ri: number) => <tr key={ri} className="border-b border-hairline last:border-0">{row.map((cell, ci) => <td key={ci} className="px-3 py-2">{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case "bullets":
      return (
        <ul className="space-y-2 text-[13px]">
          {block.items?.map((item: any, i: number) => (
            <li key={i} className="flex gap-2">
              <span className="text-[color:var(--primary)] mt-0.5 flex-shrink-0">•</span>
              <div>
                <span>{item.text ?? item}</span>
                {item.sub && (
                  <ul className="mt-1 space-y-1 ml-3">
                    {item.sub.map((s: string, si: number) => (
                      <li key={si} className="flex gap-1.5 text-[12px] text-muted-foreground"><span>–</span> {s}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      );
    case "tip":
      return <div className="rounded-[14px] p-4 bg-amber-50 border border-amber-200 text-amber-900 text-[13px]"><span className="font-bold">💡 Tip: </span>{block.text}</div>;
    case "warning":
      return <div className="rounded-[14px] p-4 bg-red-50 border border-red-200 text-red-900 text-[13px]"><span className="font-bold">⚠️ Watch out: </span>{block.text}</div>;
    case "comparison":
      return (
        <div className="grid grid-cols-2 gap-2">
          {[block.left, block.right].map((side: any, i: number) => (
            <GlassCard key={i} className="!p-3">
              <p className="font-bold text-[11px] mb-2">{side?.label}</p>
              <ul className="space-y-1">{side?.items?.map((item: string, j: number) => <li key={j} className="text-[11.5px] text-muted-foreground flex gap-1"><span>•</span> {item}</li>)}</ul>
            </GlassCard>
          ))}
        </div>
      );
    case "video":
      return (
        <div className="rounded-[14px] overflow-hidden">
          <iframe src={`https://www.youtube.com/embed/${block.youtubeId}`} title={block.title} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          {block.caption && <p className="text-[11px] text-muted-foreground mt-1 px-1">{block.caption}</p>}
        </div>
      );
    default:
      return null;
  }
}

// ─── Main Subjects page ───────────────────────────────────────────────────────
function Subjects() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<SubjectCategory | "all">("all");
  const [selectedSubject, setSelectedSubject] = useState<IgcseSubject | null>(null);

  const filtered = useMemo(() => {
    let list = IGCSE_SUBJECTS;
    if (activeCategory !== "all") list = list.filter((s) => s.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.code.includes(q));
    }
    return list;
  }, [activeCategory, search]);

  return (
    <MobileShell>
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <Link to="/home" className="text-[13px] font-medium" style={{ color: "#6d4cff" }}>← Home</Link>
        <h1 className="text-[16px] font-semibold">Subjects</h1>
        <div className="w-12" />
      </header>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject or code…"
            className="w-full pl-9 pr-4 py-2.5 rounded-[14px] glass text-[13.5px] outline-none"
            style={{ border: "1px solid rgba(109,76,255,0.15)" }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold tap transition-all ${
              activeCategory === cat.id ? "gradient-primary text-white" : "glass text-muted-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Subject list */}
      <div className="px-5 pb-20 space-y-2">
        <p className="text-[11px] text-muted-foreground mb-3">{filtered.length} subjects</p>
        {filtered.map((subject) => {
          const meta = CATEGORY_META[subject.category];
          const Icon = CATEGORY_ICON[subject.category];
          const notesCount = getSubjectNotes(subject.code).length;
          return (
            <button
              key={subject.code}
              onClick={() => setSelectedSubject(subject)}
              className="w-full flex items-center gap-3 glass rounded-[16px] px-4 py-3.5 tap text-left transition-all"
              style={{ border: "1px solid rgba(109,76,255,0.1)" }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${meta.bg}`}>
                <Icon className={`w-5 h-5 ${meta.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] truncate">{subject.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {subject.code}
                  {notesCount > 0 && ` · ${notesCount} note topics`}
                </p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Subject Detail Sheet */}
      {selectedSubject && (
        <SubjectDetail
          subject={selectedSubject}
          onClose={() => setSelectedSubject(null)}
        />
      )}
    </MobileShell>
  );
}
