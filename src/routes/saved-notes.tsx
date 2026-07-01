import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookmarkCheck, Trash2, ChevronRight } from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import { GlassCard } from "@/components/mobile/ui";

export const Route = createFileRoute("/saved-notes")({
  head: () => ({ meta: [{ title: "Saved Notes — StudySphere AI" }] }),
  component: SavedNotes,
});

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  savedAt: number;
}

export function getSavedNotes(): SavedNote[] {
  try {
    const raw = localStorage.getItem("studysphere_saved_notes");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNote(note: Omit<SavedNote, "id" | "savedAt">): SavedNote {
  const notes = getSavedNotes();
  const newNote: SavedNote = { ...note, id: crypto.randomUUID(), savedAt: Date.now() };
  notes.unshift(newNote);
  localStorage.setItem("studysphere_saved_notes", JSON.stringify(notes));
  return newNote;
}

function SavedNotes() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [selected, setSelected] = useState<SavedNote | null>(null);

  useEffect(() => {
    setNotes(getSavedNotes());
  }, []);

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem("studysphere_saved_notes", JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  };

  if (selected) {
    return (
      <MobileShell hideNav>
        <header className="px-5 pt-6 pb-4 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-md border-b border-hairline bg-background/90">
          <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full glass flex items-center justify-center tap">
            <ArrowLeft size={15} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[14px] truncate">{selected.title}</p>
            <p className="text-[11px] text-muted-foreground">{new Date(selected.savedAt).toLocaleDateString()}</p>
          </div>
          <button onClick={() => deleteNote(selected.id)} className="w-9 h-9 rounded-full glass flex items-center justify-center tap text-destructive">
            <Trash2 size={15} />
          </button>
        </header>
        <div className="px-5 py-5 pb-20">
          <div className="prose-sm text-[14px] leading-relaxed whitespace-pre-wrap">{selected.content}</div>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell hideNav>
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-md border-b border-hairline bg-background/90">
        <Link to="/home" className="w-9 h-9 rounded-full glass flex items-center justify-center tap">
          <ArrowLeft size={15} />
        </Link>
        <h1 className="text-[16px] font-semibold flex-1">Saved Notes</h1>
      </header>

      <div className="px-5 py-5 pb-20 space-y-3">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
              <BookmarkCheck size={28} className="text-muted-foreground opacity-40" />
            </div>
            <p className="text-[15px] font-semibold text-muted-foreground">No saved notes yet</p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-[220px]">
              Scan a note and tap "Save to Notes" to keep it here.
            </p>
            <Link to="/scan" className="mt-5 px-5 py-2.5 gradient-primary text-white rounded-[14px] text-[13px] font-medium tap">
              Scan a Note
            </Link>
          </div>
        ) : (
          notes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelected(note)}
              className="w-full glass rounded-[16px] px-4 py-3.5 tap text-left flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#fd79a8,#e84393)" }}>
                <BookmarkCheck size={16} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] truncate">{note.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{note.content.slice(0, 60)}…</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </MobileShell>
  );
}
