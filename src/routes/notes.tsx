import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Camera, Upload, Search, BookOpen, ChevronRight, X,
  Sparkles, Highlighter, Layers, ArrowLeft,
} from "lucide-react";
import { MobileShell, PageHeader, Section } from "@/components/mobile/Shell";
import { GlassCard, Pill } from "@/components/mobile/ui";
import { noteChapters } from "@/data/notes";
import type { NoteChapter } from "@/data/notes";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Smart Notes — StudySphere AI" }] }),
  component: Notes,
});

// Unique subjects from noteChapters
const NOTE_SUBJECTS = Array.from(
  new Map(
    noteChapters.map((c) => [(c as any).code as string, c.subject || (c as any).code])
  ).entries()
).map(([code, name]) => ({ code, name: String(name) }));

function Notes() {
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<NoteChapter | null>(null);

  const filtered = useMemo(() => {
    let list = noteChapters;
    if (activeSubject) list = list.filter((c) => (c as any).code === activeSubject);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.subject || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeSubject, search]);

  if (selectedChapter) {
    return <ChapterView chapter={selectedChapter} onBack={() => setSelectedChapter(null)} />;
  }

  return (
    <MobileShell>
      <PageHeader title="Study Notes" subtitle="IGCSE revision notes" />

      {/* Quick actions */}
      <div className="px-5 grid grid-cols-3 gap-3 mb-2">
        {[
          { i: Camera, t: "Scan", to: "/scan" },
          { i: Upload, t: "Upload", to: "/scan" },
          { i: Sparkles, t: "AI Generate", to: "/tutor" },
        ].map((a) => (
          <Link key={a.t} to={a.to as any}>
            <button className="w-full glass rounded-[18px] py-5 flex flex-col items-center gap-2 tap">
              <a.i size={18} />
              <span className="text-[11px] font-medium">{a.t}</span>
            </button>
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="px-5 mt-4 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full pl-9 pr-4 py-2.5 rounded-[14px] glass text-[13.5px] outline-none"
            style={{ border: "1px solid rgba(109,76,255,0.15)" }}
          />
        </div>
      </div>

      {/* Subject filter */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubject(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold tap transition-all ${!activeSubject ? "gradient-primary text-white" : "glass text-muted-foreground"}`}
        >
          All
        </button>
        {NOTE_SUBJECTS.map(({ code, name }) => (
          <button
            key={code}
            onClick={() => setActiveSubject(activeSubject === code ? null : code)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold tap transition-all ${activeSubject === code ? "gradient-primary text-white" : "glass text-muted-foreground"}`}
          >
            {String(name).split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Chapter list */}
      <div className="px-5 pb-20 space-y-2">
        <p className="text-[11px] text-muted-foreground mb-3">{filtered.length} topics</p>
        {filtered.map((chapter, i) => (
          <button
            key={i}
            onClick={() => setSelectedChapter(chapter)}
            className="w-full glass rounded-[16px] px-4 py-3.5 tap text-left flex items-center gap-3"
            style={{ border: "1px solid rgba(109,76,255,0.1)" }}
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <BookOpen size={16} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] truncate">{chapter.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {chapter.subject || (chapter as any).code} · {chapter.pages?.length ?? 0} sections
              </p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-[14px]">No notes found</p>
            <button onClick={() => { setSearch(""); setActiveSubject(null); }} className="mt-3 text-[12px] text-[color:var(--primary)]">Clear filters</button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

// ─── Chapter Viewer ──────────────────────────────────────────────────────────
function ChapterView({ chapter, onBack }: { chapter: NoteChapter; onBack: () => void }) {
  const [pageIdx, setPageIdx] = useState(0);
  const pages = chapter.pages ?? [];
  const page = pages[pageIdx];

  return (
    <MobileShell hideNav>
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-md border-b border-hairline" style={{ background: "rgba(var(--background-rgb, 255,255,255),0.85)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full glass flex items-center justify-center tap">
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[14px] truncate">{chapter.title}</p>
          <p className="text-[11px] text-muted-foreground">{chapter.subject || (chapter as any).code}</p>
        </div>
      </header>

      {/* Page nav */}
      {pages.length > 1 && (
        <div className="px-5 py-3 flex gap-2 overflow-x-auto border-b border-hairline">
          {pages.map((p, i) => (
            <button
              key={i}
              onClick={() => setPageIdx(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold tap ${i === pageIdx ? "gradient-primary text-white" : "glass text-muted-foreground"}`}
            >
              {p.section ?? p.title ?? `Section ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="px-5 py-5 pb-20 space-y-4">
        {page ? (
          <>
            <h2 className="text-[17px] font-bold">{page.section ?? page.title}</h2>
            {(page.blocks ?? []).map((block: any, bi: number) => (
              <NoteBlock key={bi} block={block} />
            ))}
          </>
        ) : (
          <p className="text-muted-foreground text-[13px]">No content for this chapter yet.</p>
        )}
      </div>
    </MobileShell>
  );
}

function NoteBlock({ block }: { block: any }) {
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
        }`}>
          {block.text}
        </div>
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
            <thead>
              <tr className="border-b border-hairline">
                {block.headers?.map((h: string, i: number) => (
                  <th key={i} className="px-3 py-2 text-left font-bold text-[11px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows?.map((row: string[], ri: number) => (
                <tr key={ri} className="border-b border-hairline last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
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
                      <li key={si} className="flex gap-1.5 text-[12px] text-muted-foreground">
                        <span>–</span> {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      );

    case "tip":
      return (
        <div className="rounded-[14px] p-4 bg-amber-50 border border-amber-200 text-amber-900 text-[13px]">
          <span className="font-bold">💡 Tip: </span>{block.text}
        </div>
      );

    case "warning":
      return (
        <div className="rounded-[14px] p-4 bg-red-50 border border-red-200 text-red-900 text-[13px]">
          <span className="font-bold">⚠️ Watch out: </span>{block.text}
        </div>
      );

    case "comparison":
      return (
        <div className="grid grid-cols-2 gap-2">
          {[block.left, block.right].map((side: any, i: number) => (
            <GlassCard key={i} className="!p-3">
              <p className="font-bold text-[11px] mb-2">{side?.label}</p>
              <ul className="space-y-1">
                {side?.items?.map((item: string, j: number) => (
                  <li key={j} className="text-[11.5px] text-muted-foreground flex gap-1">
                    <span>•</span> {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      );

    case "video":
      return (
        <div className="rounded-[14px] overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${block.youtubeId}`}
            title={block.title}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {block.caption && <p className="text-[11px] text-muted-foreground mt-1 px-1">{block.caption}</p>}
        </div>
      );

    default:
      return null;
  }
}
