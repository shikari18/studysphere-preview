import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Upload, FileText, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import { GlassCard, Pill, PrimaryButton } from "@/components/mobile/ui";
import { BotMark } from "@/components/BotMark";
import { groqChat, fileToDataUrl, GROQ_VISION_MODEL } from "@/lib/groq";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "Scan Note — StudySphere AI" }] }),
  component: Scan,
});

interface ScanResult {
  title: string;
  bullets: string[];
}

function Scan() {
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
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

    try {
      const text = await groqChat(
        [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'You are an expert note-taking assistant. Read this image of handwritten or printed study notes. Return a JSON object with exactly two fields: "title" (a short descriptive heading) and "bullets" (an array of 3–6 concise key-point strings). Respond with raw JSON only — no markdown, no explanation.',
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        GROQ_VISION_MODEL
      );

      const parsed: ScanResult = JSON.parse(text.replace(/```json|```/g, "").trim());
      setResult(parsed);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
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
              StudySphere extracts text, structures it, and generates a clean note.
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
              {["Reads handwriting & printed text", "Cleans & structures into sections", "Suggests flashcards & a quiz"].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-[color:var(--primary)] mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      )}

      {image && (
        <div className="px-5 mt-2 space-y-3">
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
                <p className="text-[11px] text-muted-foreground">OCR · structuring · summarising</p>
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
              <GlassCard className="!p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-[color:var(--primary)]" />
                  <p className="text-[13px] font-semibold">Generated note</p>
                  <Pill tone="primary">AI</Pill>
                </div>
                <p className="text-[13.5px] font-medium">{result.title}</p>
                <ul className="mt-2 space-y-1.5 text-[12.5px] text-muted-foreground list-disc pl-4">
                  {result.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </GlassCard>

              <div className="grid grid-cols-2 gap-2">
                <button className="tap glass-strong rounded-[14px] py-3 text-[12.5px] font-medium flex items-center justify-center gap-1.5">
                  <Sparkles size={13} /> Flashcards
                </button>
                <button className="tap glass-strong rounded-[14px] py-3 text-[12.5px] font-medium flex items-center justify-center gap-1.5">
                  <Sparkles size={13} /> Quiz
                </button>
              </div>

              <PrimaryButton className="w-full">Save to Notes</PrimaryButton>
            </>
          )}
        </div>
      )}
    </MobileShell>
  );
}
