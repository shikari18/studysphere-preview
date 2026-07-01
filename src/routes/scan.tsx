import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Upload, FileText, Sparkles, ArrowLeft, CheckCircle2, BookmarkCheck, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import { GlassCard, Pill, PrimaryButton } from "@/components/mobile/ui";
import { BotMark } from "@/components/BotMark";
import { groqChat, fileToDataUrl, GROQ_VISION_MODEL, GROQ_TEXT_MODEL } from "@/lib/groq";
import { saveNote } from "@/routes/saved-notes";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "Scan Note — StudySphere AI" }] }),
  component: Scan,
});

interface ScanResult {
  title: string;
  fullNote: string;
  summary: string;
}

function Scan() {
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [summarising, setSummarising] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await fileToDataUrl(f);
    setImage(dataUrl);
    setStatus("scanning");
    setResult(null);
    setErrorMsg("");
    setSaved(false);
    setShowSummary(false);

    try {
      const text = await groqChat(
        [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert note-taking and study assistant. Read this image of handwritten or printed study notes carefully.

Return ONLY a valid JSON object with exactly three fields:
- "title": a short descriptive heading (e.g. "Photosynthesis — IGCSE Biology")
- "fullNote": a comprehensive, well-structured, long-form note expanding everything in the image. Use plain text with newlines for structure. Make it thorough and educational.
- "summary": a concise 3-5 sentence summary of the key points.

IMPORTANT: Return raw JSON only. No markdown code blocks, no backticks, no explanation. Start your response with { and end with }.`,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        GROQ_VISION_MODEL
      );

      // Robust JSON extraction — strip any markdown/extra text
      let jsonStr = text.trim();
      // Remove markdown code fences if present
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      // Extract first {...} block
      const firstBrace = jsonStr.indexOf("{");
      const lastBrace = jsonStr.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
      }
      const parsed: ScanResult = JSON.parse(jsonStr);
      if (!parsed.title || !parsed.fullNote) throw new Error("Incomplete response from AI");
      setResult(parsed);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  const handleSummarise = async () => {
    if (!result) return;
    setSummarising(true);
    setShowSummary(true);
    // Summary is already generated from the scan, just show it
    setTimeout(() => setSummarising(false), 400);
  };

  const handleSave = () => {
    if (!result || saved) return;
    saveNote({ title: result.title, content: result.fullNote });
    setSaved(true);
  };

  return (
    <MobileShell>
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <Link to="/home" className="w-10 h-10 rounded-full glass tap flex items-center justify-center">
          <ArrowLeft size={17} />
        </Link>
        <h1 className="text-[16px] font-semibold">Scan note</h1>
        <div className="w-10" />
      </header>

      {!image && (
        <div className="px-5 mt-2 space-y-3">
          <GlassCard className="!p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-primary flex items-center justify-center">
              <Camera size={22} color="white" />
            </div>
            <p className="mt-4 text-[15px] font-semibold">Snap a page</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              StudySphere reads your note and turns it into a full, detailed study note.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button onClick={() => camRef.current?.click()} className="tap gradient-primary text-white rounded-[14px] py-3 text-[13px] font-medium flex items-center justify-center gap-1.5">
                <Camera size={14} /> Camera
              </button>
              <button onClick={() => fileRef.current?.click()} className="tap glass-strong rounded-[14px] py-3 text-[13px] font-medium flex items-center justify-center gap-1.5">
                <Upload size={14} /> Upload
              </button>
            </div>
            <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
          </GlassCard>

          <GlassCard className="!p-4">
            <p className="text-[12px] font-semibold mb-2">What StudySphere does</p>
            <ul className="space-y-2 text-[12.5px] text-muted-foreground">
              {["Reads handwriting & printed text", "Expands into a full detailed note", "Summarises key points on demand"].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-[color:var(--primary)] mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      )}

      {image && (
        <div className="px-5 mt-2 space-y-3 pb-8">
          <GlassCard className="!p-2">
            <img src={image} alt="scanned" className="w-full rounded-[14px]" />
          </GlassCard>

          {status === "scanning" && (
            <GlassCard className="!p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center animate-pulse">
                <BotMark size={18} withGradient={false} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium">Reading your note…</p>
                <p className="text-[11px] text-muted-foreground">OCR · expanding · structuring</p>
              </div>
            </GlassCard>
          )}

          {status === "error" && (
            <GlassCard className="!p-4">
              <p className="text-[13px] font-semibold text-red-500">Scan failed</p>
              <p className="text-[12px] text-muted-foreground mt-1">{errorMsg}</p>
              <button
                onClick={() => { setImage(null); setStatus("idle"); }}
                className="mt-3 tap text-[12.5px] font-medium text-[color:var(--primary)]"
              >
                Try again
              </button>
            </GlassCard>
          )}

          {status === "done" && result && (
            <>
              {/* Full Note */}
              <GlassCard className="!p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-[color:var(--primary)]" />
                  <p className="text-[13px] font-semibold flex-1">{result.title}</p>
                  <Pill tone="primary">AI Note</Pill>
                </div>
                <div className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
                  {result.fullNote}
                </div>
              </GlassCard>

              {/* Summary panel */}
              {showSummary && (
                <GlassCard className="!p-4 border border-[color:var(--primary)]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={13} className="text-[color:var(--primary)]" />
                    <p className="text-[12px] font-semibold text-[color:var(--primary)]">Summary</p>
                  </div>
                  {summarising ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 size={14} className="animate-spin text-muted-foreground" />
                      <span className="text-[12px] text-muted-foreground">Summarising…</span>
                    </div>
                  ) : (
                    <p className="text-[13px] leading-relaxed text-muted-foreground">{result.summary}</p>
                  )}
                </GlassCard>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSummarise}
                  disabled={showSummary}
                  className="tap glass-strong rounded-[14px] py-3 text-[12.5px] font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles size={13} /> Summarise
                </button>
                <button className="tap glass-strong rounded-[14px] py-3 text-[12.5px] font-medium flex items-center justify-center gap-1.5">
                  <Sparkles size={13} /> Quiz me
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={saved}
                className={`w-full tap rounded-[16px] py-3.5 text-[14px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  saved
                    ? "bg-green-500 text-white"
                    : "gradient-primary text-white shadow-[0_8px_24px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
                }`}
              >
                <BookmarkCheck size={16} />
                {saved ? "Saved to Notes!" : "Save to Notes"}
              </button>

              <button
                onClick={() => { setImage(null); setStatus("idle"); setSaved(false); setShowSummary(false); }}
                className="w-full tap glass rounded-[14px] py-3 text-[13px] font-medium text-center"
              >
                Scan another
              </button>
            </>
          )}
        </div>
      )}
    </MobileShell>
  );
}
