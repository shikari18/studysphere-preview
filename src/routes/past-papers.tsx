import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, FileText, CheckCircle2, Eye, X, ExternalLink,
  BookOpen, ChevronRight, Loader2, Grid3X3, List,
  GraduationCap, Beaker, Calculator, Globe, Laptop, Palette,
  Briefcase, Languages,
} from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import {
  IGCSE_SUBJECTS, IGCSE_YEARS, IGCSE_SESSIONS, CATEGORY_META,
  type IgcseSubject, type SubjectCategory,
} from "@/data/past-papers/igcse-subjects";
import { buildXtremeUrl, fetchPdfAsBlob } from "@/lib/pdf-proxy";

export const Route = createFileRoute("/past-papers")({
  head: () => ({ meta: [{ title: "IGCSE Past Papers — StudySphere" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  component: PastPapers,
});

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

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function SubjectCard({ subject, onClick }: { subject: IgcseSubject; onClick: () => void }) {
  const meta = CATEGORY_META[subject.category];
  const Icon = CATEGORY_ICON[subject.category];
  return (
    <button onClick={onClick} className="group w-full text-left glass rounded-[16px] p-4 tap transition-all" style={{ border: "1px solid rgba(109,76,255,0.12)" }}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${meta.bg}`}>
          <Icon className={`w-5 h-5 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] truncate">{subject.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{subject.code} · {subject.papers.length} paper types</p>
        </div>
        <ChevronRight size={14} className="text-muted-foreground" />
      </div>
    </button>
  );
}

function PaperRow({ year, session, paper, variant, onView }: {
  year: string; session: string;
  paper: { num: string; label: string; diff: "Core" | "Extended" | "Practical" };
  variant: string; onView: () => void;
}) {
  const s = session === "May/June" ? "M/J" : session === "Oct/Nov" ? "O/N" : "F/M";
  return (
    <button onClick={onView} className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors group text-left tap">
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

export function PastPapers() {
  const { code: preselectedCode } = Route.useSearch();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<SubjectCategory | "all">("all");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedSubject, setSelectedSubject] = useState<IgcseSubject | null>(null);
  const [selectedYear, setSelectedYear] = useState("2023");
  const [viewingPaper, setViewingPaper] = useState<PaperSelection | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState<PdfLoaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"qp" | "ms">("qp");

  // Pre-select subject from ?code= query param on first render
  useEffect(() => {
    if (preselectedCode && !selectedSubject) {
      const match = IGCSE_SUBJECTS.find((s) => s.code === preselectedCode);
      if (match) {
        setSelectedSubject(match);
        setSelectedYear("2023");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedCode]);

  const filtered = useMemo(() => {
    let list = IGCSE_SUBJECTS;
    if (activeCategory !== "all") list = list.filter((s) => s.category === activeCategory);
    if (activeLetter) list = list.filter((s) => s.name[0].toUpperCase() === activeLetter);
    if (search) { const q = search.toLowerCase(); list = list.filter((s) => s.name.toLowerCase().includes(q) || s.code.includes(q)); }
    return list;
  }, [activeCategory, activeLetter, search]);

  const availableLetters = useMemo(() => new Set(IGCSE_SUBJECTS.map((s) => s.name[0].toUpperCase())), []);

  const openPaper = async (subject: IgcseSubject, year: string, session: string, paperNum: string, paperLabel: string, variant: string) => {
    setViewingPaper({ subject, year, session, paperNum, paperLabel, variant });
    setLoading(true);
    setPdfLoaded(null);
    setActiveTab("qp");

    const qpUrl = buildXtremeUrl(subject.code, subject.folder, year, session, paperNum, variant, "qp");
    const msUrl = buildXtremeUrl(subject.code, subject.folder, year, session, paperNum, variant, "ms");

    try {
      // Fetch both in parallel via CORS proxy (same as Exam-Glow's proxy endpoint)
      const [qpResult, msResult] = await Promise.allSettled([
        fetchPdfAsBlob(qpUrl),
        fetchPdfAsBlob(msUrl),
      ]);

      setPdfLoaded({
        qpBlob: qpResult.status === "fulfilled" ? qpResult.value : null,
        msBlob: msResult.status === "fulfilled" ? msResult.value : null,
        qpUrl,
        msUrl,
        error: qpResult.status === "rejected" && msResult.status === "rejected" ? "Paper not found in archive." : null,
      });
      setActiveTab(qpResult.status === "fulfilled" ? "qp" : "ms");
    } catch (e) {
      setPdfLoaded({ qpBlob: null, msBlob: null, qpUrl, msUrl, error: "Failed to load paper." });
    } finally {
      setLoading(false);
    }
  };

  const closeViewer = () => {
    // Revoke blob URLs to free memory
    if (pdfLoaded?.qpBlob) URL.revokeObjectURL(pdfLoaded.qpBlob);
    if (pdfLoaded?.msBlob) URL.revokeObjectURL(pdfLoaded.msBlob);
    setViewingPaper(null);
    setPdfLoaded(null);
  };

  const categories: { id: SubjectCategory | "all"; label: string }[] = [
    { id: "all", label: "All" }, { id: "sciences", label: "Sciences" },
    { id: "mathematics", label: "Maths" }, { id: "languages", label: "Languages" },
    { id: "humanities", label: "Humanities" }, { id: "business", label: "Business" },
    { id: "technology", label: "Tech" }, { id: "arts", label: "Arts" },
  ];

  const iframeSrc = activeTab === "qp" ? pdfLoaded?.qpBlob : pdfLoaded?.msBlob;
  const directUrl = activeTab === "qp" ? pdfLoaded?.qpUrl : pdfLoaded?.msUrl;

  return (
    <MobileShell>
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <Link to="/home" className="text-[13px] font-medium" style={{ color: "#6d4cff" }}>← Home</Link>
        <h1 className="text-[16px] font-semibold">Past Papers</h1>
        <div className="w-12" />
      </header>

      <div className="px-5 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setActiveLetter(null); }}
            placeholder="Search subject or code…"
            className="w-full pl-9 pr-4 py-2.5 rounded-[14px] glass text-[13.5px] outline-none"
            style={{ border: "1px solid rgba(109,76,255,0.15)" }} />
        </div>
      </div>

      <div className="px-5 mb-3 flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setActiveLetter(null); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold tap transition-all ${activeCategory === cat.id ? "gradient-primary text-white" : "glass text-muted-foreground"}`}>
            {cat.label}
          </button>
        ))}
        <div className="flex gap-1 ml-auto flex-shrink-0">
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg tap ${viewMode === "grid" ? "gradient-primary text-white" : "glass text-muted-foreground"}`}><Grid3X3 size={13} /></button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg tap ${viewMode === "list" ? "gradient-primary text-white" : "glass text-muted-foreground"}`}><List size={13} /></button>
        </div>
      </div>

      <div className="px-5 mb-4 flex flex-wrap gap-1">
        {ALPHABET.map((letter) => {
          const available = availableLetters.has(letter);
          return (
            <button key={letter} disabled={!available}
              onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
              className={`w-6 h-6 rounded-md text-[10px] font-bold tap transition-all ${activeLetter === letter ? "gradient-primary text-white" : available ? "glass text-muted-foreground" : "opacity-20 cursor-default"}`}>
              {letter}
            </button>
          );
        })}
      </div>

      <div className="px-5 pb-20">
        {selectedSubject ? (
          <div className="glass rounded-[20px] overflow-hidden" style={{ border: "1px solid rgba(109,76,255,0.15)" }}>
            <div className="px-5 py-4 border-b border-hairline flex items-center gap-3">
              <button onClick={() => setSelectedSubject(null)} className="w-8 h-8 rounded-full glass flex items-center justify-center tap"><X size={14} /></button>
              <div className="flex-1">
                <h2 className="text-[15px] font-bold">{selectedSubject.name}</h2>
                <p className="text-[11px] text-muted-foreground">Code: {selectedSubject.code}</p>
              </div>
            </div>
            <div className="px-5 py-3 border-b border-hairline flex gap-2 overflow-x-auto">
              {IGCSE_YEARS.map((y) => (
                <button key={y} onClick={() => setSelectedYear(y)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold tap ${selectedYear === y ? "gradient-primary text-white" : "glass text-muted-foreground"}`}>
                  {y}
                </button>
              ))}
            </div>
            <div className="divide-y divide-hairline">
              {IGCSE_SESSIONS.map((session) => (
                <div key={session} className="px-5 py-3">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase mb-2">{session} {selectedYear}</p>
                  <div className="space-y-0.5">
                    {selectedSubject.papers.flatMap((paper) =>
                      ["1", "2"].map((variant) => (
                        <PaperRow key={`${session}-${paper.num}-${variant}`} year={selectedYear} session={session} paper={paper} variant={variant}
                          onView={() => openPaper(selectedSubject, selectedYear, session, paper.num, paper.label, variant)} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground mb-3">Showing <b>{filtered.length}</b> of {IGCSE_SUBJECTS.length} subjects</p>
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Search size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-[14px]">No subjects found</p>
                <button onClick={() => { setSearch(""); setActiveLetter(null); setActiveCategory("all"); }} className="mt-3 text-[12px] text-[color:var(--primary)] tap">Clear filters</button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-2.5">
                {filtered.map((s) => <SubjectCard key={s.code} subject={s} onClick={() => { setSelectedSubject(s); setSelectedYear("2023"); }} />)}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map((subject) => {
                  const meta = CATEGORY_META[subject.category];
                  const Icon = CATEGORY_ICON[subject.category];
                  return (
                    <button key={subject.code} onClick={() => { setSelectedSubject(subject); setSelectedYear("2023"); }}
                      className="w-full flex items-center gap-3 glass rounded-[14px] px-4 py-3 tap text-left"
                      style={{ border: "1px solid rgba(109,76,255,0.1)" }}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${meta.bg}`}><Icon className={`w-4 h-4 ${meta.color}`} /></div>
                      <div className="flex-1 min-w-0"><span className="font-semibold text-[12.5px] truncate block">{subject.name}</span><span className="text-[11px] text-muted-foreground">{subject.code}</span></div>
                      <ChevronRight size={13} className="text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* PDF Viewer overlay */}
      {viewingPaper && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          {/* Header */}
          <div className="bg-black/90 backdrop-blur-md px-4 pt-safe-top pt-4 pb-2 flex items-center gap-3 border-b border-white/10">
            <button onClick={closeViewer} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center tap"><X size={15} color="white" /></button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px] text-white truncate">{viewingPaper.subject.name} — {viewingPaper.paperLabel}</p>
              <p className="text-[11px] text-white/50">{viewingPaper.session} {viewingPaper.year} · v{viewingPaper.variant}</p>
            </div>
            {directUrl && (
              <a href={directUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <ExternalLink size={14} color="white" />
              </a>
            )}
          </div>

          {/* QP / MS tabs */}
          {pdfLoaded && !loading && (
            <div className="bg-black/80 px-4 py-2 flex gap-2">
              <button onClick={() => setActiveTab("qp")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold tap transition-all ${activeTab === "qp" ? "gradient-primary text-white" : pdfLoaded.qpBlob ? "text-white/60 hover:text-white" : "text-white/25 cursor-not-allowed"}`}
                disabled={!pdfLoaded.qpBlob}>
                <FileText size={11} /> Question Paper
              </button>
              <button onClick={() => setActiveTab("ms")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold tap transition-all ${activeTab === "ms" ? "gradient-primary text-white" : pdfLoaded.msBlob ? "text-white/60 hover:text-white" : "text-white/25 cursor-not-allowed"}`}
                disabled={!pdfLoaded.msBlob}>
                <CheckCircle2 size={11} /> Mark Scheme
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-black">
              <div className="w-16 h-16 rounded-2xl gradient-primary/20 flex items-center justify-center animate-pulse">
                <Loader2 size={28} className="text-[color:var(--primary)] animate-spin" />
              </div>
              <p className="text-white/60 text-[13px]">Fetching paper from archive…</p>
              <p className="text-white/30 text-[11px]">XtremePapers · Cambridge</p>
            </div>
          )}

          {/* Error — paper not found */}
          {!loading && pdfLoaded?.error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-black p-8">
              <FileText size={40} className="text-amber-400" />
              <p className="font-bold text-white text-[15px]">Paper Not Found</p>
              <p className="text-white/50 text-[12px] text-center leading-relaxed">
                This paper wasn't found on XtremePapers. Try a different year, session, or variant.
              </p>
              <button onClick={closeViewer} className="mt-2 px-6 py-2 rounded-full bg-white/10 text-white text-[12px] font-semibold tap">Go Back</button>
            </div>
          )}

          {/* PDF iframe — blob URL means no CORS issues */}
          {!loading && iframeSrc && (
            <iframe
              key={iframeSrc}
              src={iframeSrc}
              className="flex-1 w-full border-0 bg-white"
              title={activeTab === "qp" ? "Question Paper" : "Mark Scheme"}
            />
          )}
        </div>
      )}
    </MobileShell>
  );
}

export default PastPapers;
