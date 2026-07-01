import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic, ArrowLeft, Phone, PhoneOff, MicOff, Volume2, Loader2,
  Plus, Send, ThumbsUp, ThumbsDown, ImageIcon, FileText,
  Camera, Image as ImageLucide, File, X,
} from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import { GlassCard } from "@/components/mobile/ui";
import { BotMark } from "@/components/BotMark";
import { groqChat, GROQ_TEXT_MODEL, GROQ_VISION_MODEL, fileToDataUrl, type GroqMessage } from "@/lib/groq";
import { renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — StudySphere AI" }] }),
  component: Tutor,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type AttachmentType = { kind: "image"; dataUrl: string; name: string }
  | { kind: "pdf" | "file"; dataUrl: string; name: string; text: string };

type Msg =
  | { role: "user"; text: string; attachment?: AttachmentType; card?: undefined; callSummary?: undefined; generatedImage?: undefined }
  | { role: "ai"; text: string; card?: { steps: string[]; tip: string }; callSummary?: { duration: string }; generatedImage?: string; attachment?: undefined };

// ─── Gemini constants ─────────────────────────────────────────────────────────
const GEMINI_MODEL = "models/gemini-3.1-flash-live-preview";
const OUTPUT_SAMPLE_RATE = 24000;
const INPUT_SAMPLE_RATE = 16000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

// ─── Image generation via Gemini 2.5 Flash Image ────────────────────────────
async function generateImageGemini(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string;
  // gemini-2.5-flash-image supports generateContent with IMAGE responseModality
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Image generation failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  const parts: any[] = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith("image/") && part.inlineData?.data) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image was returned by the model. Try a more descriptive prompt.");
}

// ─── PDF text extractor (simple — reads embedded text via FileReader) ─────────
async function extractPdfText(file: File): Promise<string> {
  // Send PDF to Groq vision model as base64 for text extraction
  const dataUrl = await fileToDataUrl(file);
  const text = await groqChat([
    {
      role: "user",
      content: [
        { type: "text", text: "Extract and return ALL the text content from this document. Return only the extracted text, preserving structure." },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    },
  ], GROQ_VISION_MODEL);
  return text;
}

const IMAGE_GEN_TRIGGERS = [
  "generate an image", "generate image", "create an image", "draw", "illustrate",
  "make an image", "make a picture", "show me a picture", "show me an image",
  "produce an image", "visualise", "visualize",
];
function isImageGenRequest(text: string) {
  const lower = text.toLowerCase();
  return IMAGE_GEN_TRIGGERS.some((t) => lower.includes(t));
}

// ─── Tutor component ──────────────────────────────────────────────────────────
function Tutor() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hey — StudySphere here. What are we tackling today?" },
  ]);
  const [draft, setDraft] = useState("");
  const [inCall, setInCall] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<AttachmentType | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── Mic dictation ────────────────────────────────────────────────────────────
  const toggleMic = async () => {
    if (isRecording) {
      mediaRecRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        // Use Groq Whisper for transcription
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("file", blob, "audio.webm");
        fd.append("model", "whisper-large-v3");
        try {
          const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
            body: fd,
          });
          const data = await res.json();
          if (data.text) setDraft((d) => d + (d ? " " : "") + data.text);
        } catch { /* ignore transcription errors */ }
      };
      rec.start();
      mediaRecRef.current = rec;
      setIsRecording(true);
    } catch { /* microphone denied */ }
  };

  // ── File attachment handling ──────────────────────────────────────────────────
  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setShowAttachMenu(false);
    const dataUrl = await fileToDataUrl(f);
    if (f.type.startsWith("image/")) {
      setPendingAttachment({ kind: "image", dataUrl, name: f.name });
    } else if (f.type === "application/pdf") {
      const text = await extractPdfText(f);
      setPendingAttachment({ kind: "pdf", dataUrl, name: f.name, text });
    } else {
      const text = await f.text().catch(() => "(binary file — cannot read as text)");
      setPendingAttachment({ kind: "file", dataUrl, name: f.name, text });
    }
    e.target.value = "";
  };

  // ── Send message ──────────────────────────────────────────────────────────────
  const send = async () => {
    const t = draft.trim();
    if ((!t && !pendingAttachment) || thinking) return;
    setDraft("");
    const attachment = pendingAttachment;
    setPendingAttachment(null);

    const userMsg: Msg = { role: "user", text: t || `[Sent: ${attachment?.name}]`, attachment: attachment ?? undefined };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);

    try {
      // Image generation request
      if (t && isImageGenRequest(t)) {
        setMessages((m) => [...m, { role: "ai", text: "__generating_image__", generatedImage: undefined }]);
        try {
          const imgUrl = await generateImageGemini(t);
          setMessages((m) => m.map((msg, i) =>
            i === m.length - 1 && msg.text === "__generating_image__"
              ? { ...msg, text: "Here's the image I generated for you:", generatedImage: imgUrl }
              : msg
          ));
        } catch (err: any) {
          const errMsg = err?.message ?? "Image generation failed. Please try again.";
          setMessages((m) => m.map((msg) =>
            msg.text === "__generating_image__"
              ? { ...msg, text: `Sorry, I couldn't generate that image. ${errMsg}` }
              : msg
          ));
        }
        setThinking(false);
        return;
      }

      // Build message history for Groq
      const systemPrompt = `You are StudySphere — an AI study companion for secondary-school and early-college students (IGCSE, WAEC, JAMB, SAT, A-Level). You act as a patient, encouraging one-on-one tutor that helps students truly understand concepts, prepare for exams, and build long-term study habits. You are NOT a generic chatbot and you are NOT an answer-key. Your job is to teach.

# Identity & Tone
- Name: StudySphere (sometimes shortened to "Sphere"). Never break character or reveal that you are a language model unless explicitly asked about your nature.
- Voice: warm, curious, calm, slightly playful. Speak like a favorite older sibling who happens to be brilliant at every subject.
- Reading level: default to clear, plain English at roughly a Grade 9 reading level. Scale up or down based on the student's responses.
- Cultural awareness: many students are Nigerian, West African, or studying British curricula. Use locally familiar examples when it helps. Never stereotype.

# Core Teaching Principles
1. Understanding > answers. When a student asks "what's the answer to X", default to guided walk-through.
2. Socratic nudging. Ask one short question at a time to surface what the student already knows before explaining.
3. Worked examples. Show the full reasoning in numbered steps, then a one-line "why this works" summary.
4. Active recall. After any explanation longer than ~120 words, finish with a quick 1–3 question check.
5. Mistake-positive. Treat wrong answers as gold — say what part was correct, pinpoint the misstep, re-pose a smaller version.

# Response Format
- Use clean Markdown. Short paragraphs. Bullet lists for parallel ideas. Numbered lists for steps.
- Keep most replies under 250 words unless the student asks for depth.

# Subjects you cover
Mathematics, Further Maths, Physics, Chemistry, Biology, English, Economics, Accounting, Government, History, Geography, Computer Science, Literature, French, and general study-skills coaching.

Your single goal: by the end of every session, the student should feel slightly more confident and measurably closer to their next exam target.`;

      const historyMsgs: GroqMessage[] = [{ role: "system", content: systemPrompt }];

      for (const msg of [...messages, userMsg]) {
        if (msg.role === "user") {
          if (msg.attachment?.kind === "image") {
            historyMsgs.push({
              role: "user",
              content: [
                { type: "text", text: msg.text },
                { type: "image_url", image_url: { url: msg.attachment.dataUrl } },
              ],
            });
          } else if (msg.attachment && (msg.attachment.kind === "pdf" || msg.attachment.kind === "file")) {
            historyMsgs.push({
              role: "user",
              content: `${msg.text}\n\n[File: ${msg.attachment.name}]\n${msg.attachment.text}`,
            });
          } else {
            historyMsgs.push({ role: "user", content: msg.text });
          }
        } else {
          historyMsgs.push({ role: "assistant", content: msg.text });
        }
      }

      const model = userMsg.attachment?.kind === "image" ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL;
      const reply = await groqChat(historyMsgs, model);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Connection issue — check your network and try again." }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <MobileShell hideNav>
      <div className="flex flex-col h-[100dvh] overflow-hidden relative">
        {/* Header */}
        <header className="px-4 pt-5 pb-3 flex items-center justify-between gap-3 flex-shrink-0 z-30 backdrop-blur-md bg-[color-mix(in_oklab,var(--background)_82%,transparent)] border-b border-hairline">
          <Link to="/home" className="w-10 h-10 rounded-full glass tap flex items-center justify-center" aria-label="Back">
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
          <button onClick={() => setInCall(true)} className="w-10 h-10 rounded-full gradient-primary tap flex items-center justify-center shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)]" aria-label="Call">
            <Phone size={16} color="white" />
          </button>
        </header>

        {/* Chat scroll area */}
        <div ref={scrollRef} className="flex-1 px-4 pt-4 pb-4 space-y-4 overflow-y-auto min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} anim-in`}>
              {m.role === "user" ? (
                <div className="max-w-[82%] space-y-2">
                  {m.attachment?.kind === "image" && (
                    <img src={m.attachment.dataUrl} alt={m.attachment.name} className="w-full rounded-[16px] max-h-[220px] object-cover" />
                  )}
                  {m.attachment && m.attachment.kind !== "image" && (
                    <div className="glass rounded-[14px] px-3 py-2 flex items-center gap-2 text-[12px]">
                      <FileText size={14} className="text-[color:var(--primary)]" />
                      <span className="truncate">{m.attachment.name}</span>
                    </div>
                  )}
                  {m.text && m.text !== `[Sent: ${m.attachment?.name}]` && (
                    <div className="gradient-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-[14px] leading-relaxed shadow-[0_6px_18px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)]">
                      {m.text}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-[88%] space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <BotMark size={12} /> StudySphere
                  </div>
                  {m.callSummary ? (
                    <div className="glass rounded-[18px] p-3 flex items-center justify-between gap-3 min-w-[260px] border border-hairline select-none">
                      <div className="flex items-center gap-2.5 text-[13.5px] font-medium">
                        <span className="w-8 h-8 rounded-full bg-glass-strong flex-shrink-0 flex items-center justify-center text-muted-foreground">
                          <PhoneOff size={13} />
                        </span>
                        <span>Voice Call ended · {m.callSummary.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button className="w-7 h-7 rounded-full bg-glass flex items-center justify-center text-muted-foreground hover:text-green-500 tap" aria-label="Thumbs up">
                          <ThumbsUp size={12} />
                        </button>
                        <button className="w-7 h-7 rounded-full bg-glass flex items-center justify-center text-muted-foreground hover:text-red-500 tap" aria-label="Thumbs down">
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    </div>
                  ) : m.text === "__generating_image__" ? (
                    <div className="w-full aspect-square max-w-[260px] rounded-[20px] bg-glass border border-hairline flex flex-col items-center justify-center gap-3 animate-pulse">
                      <ImageIcon size={32} className="text-muted-foreground opacity-40" />
                      <span className="text-[12px] text-muted-foreground">Generating image…</span>
                    </div>
                  ) : m.generatedImage ? (
                    <div className="space-y-2">
                      <div className="text-[14px] leading-relaxed">{renderMarkdown(m.text)}</div>
                      <img src={m.generatedImage} alt="Generated" className="w-full max-w-[260px] rounded-[20px] border border-hairline shadow-md" />
                    </div>
                  ) : (
                    <div className="text-[14px] leading-relaxed text-foreground prose-sm">
                      {renderMarkdown(m.text)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start anim-in">
              <div className="max-w-[88%] space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><BotMark size={12} /> StudySphere</div>
                <div className="flex gap-1 py-1">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="w-2 h-2 rounded-full gradient-primary animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Composer ──────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 pb-5 pt-2 bg-background border-t border-hairline">

          {/* Pending attachment preview */}
          {pendingAttachment && (
            <div className="mb-2 flex items-center gap-2 glass rounded-[14px] px-3 py-2">
              {pendingAttachment.kind === "image" ? (
                <img src={pendingAttachment.dataUrl} className="w-10 h-10 rounded-[10px] object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-[10px] bg-glass-strong flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-[color:var(--primary)]" />
                </div>
              )}
              <span className="flex-1 text-[12px] truncate">{pendingAttachment.name}</span>
              <button onClick={() => setPendingAttachment(null)} className="w-6 h-6 rounded-full bg-glass flex items-center justify-center tap">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Input row */}
          <div className="glass-strong rounded-[22px] px-3 py-2.5 flex items-center gap-2">
            {/* Plus button */}
            <button
              onClick={() => setShowAttachMenu((v) => !v)}
              className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center tap transition-transform ${showAttachMenu ? "gradient-primary rotate-45" : "bg-glass-strong"}`}
              aria-label="Attach"
            >
              <Plus size={18} className={showAttachMenu ? "text-white" : ""} />
            </button>

            {/* Text input */}
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-muted-foreground min-w-0"
              placeholder="Ask anything…"
            />

            {/* Mic dictation */}
            <button
              onClick={toggleMic}
              className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center tap transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-glass-strong"}`}
              aria-label="Dictate"
            >
              <Mic size={15} className={isRecording ? "text-white" : ""} />
            </button>

            {/* Send */}
            <button
              onClick={send}
              disabled={thinking || (!draft.trim() && !pendingAttachment)}
              className="w-9 h-9 rounded-full gradient-primary tap flex items-center justify-center flex-shrink-0 disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={14} color="white" />
            </button>
          </div>
        </div>

        {/* ── Attachment slide-up panel ──────────────────────────────────────── */}
        {showAttachMenu && (
          <>
            <div className="fixed inset-0 z-[45]" onClick={() => setShowAttachMenu(false)} />
            <div className="absolute bottom-[90px] left-4 right-4 z-50 glass-strong rounded-[22px] p-4 border border-hairline shadow-lg anim-in">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 px-1">Attach</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: ImageLucide, label: "Photos", action: () => { fileRef.current!.accept = "image/*"; fileRef.current!.capture = ""; fileRef.current?.click(); } },
                  { icon: Camera, label: "Camera", action: () => { camRef.current?.click(); } },
                  { icon: FileText, label: "PDF", action: () => { fileRef.current!.accept = "application/pdf"; fileRef.current!.capture = ""; fileRef.current?.click(); } },
                  { icon: File, label: "File", action: () => { fileRef.current!.accept = "image/*,application/pdf,text/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"; fileRef.current!.capture = ""; fileRef.current?.click(); } },
                ].map(({ icon: Icon, label, action }) => (
                  <button key={label} onClick={action} className="flex flex-col items-center gap-2 tap">
                    <div className="w-14 h-14 rounded-[18px] glass flex items-center justify-center">
                      <Icon size={22} className="text-[color:var(--primary)]" />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Hidden file inputs */}
        <input ref={fileRef} type="file" hidden onChange={handleFilePick} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFilePick} />
      </div>

      {inCall && (
        <GeminiCallSession
          onEnd={(durationSeconds) => {
            setInCall(false);
            if (durationSeconds > 0) {
              const min = Math.floor(durationSeconds / 60);
              const sec = durationSeconds % 60;
              const durationStr = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "00")}`;
              setMessages((m) => [...m, { role: "ai", text: `Voice Call ended · ${durationStr}`, callSummary: { duration: durationStr } }]);
            }
          }}
        />
      )}
    </MobileShell>
  );
}

// ─── Gemini Live Call Session ─────────────────────────────────────────────────
function GeminiCallSession({ onEnd }: { onEnd: (durationSeconds: number) => void }) {
  const [status, setStatus] = useState<"connecting" | "listening" | "speaking" | "error">("connecting");
  const [muted, setMuted] = useState(false);
  const [secs, setSecs] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [bars, setBars] = useState<number[]>([0.2, 0.4, 0.6, 0.8, 0.6, 0.4, 0.3, 0.5, 0.7, 0.4]);

  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextTimeRef = useRef(0);
  const mutableMuted = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (status !== "speaking") return;
    const id = setInterval(() => setBars(Array.from({ length: 10 }, () => 0.2 + Math.random() * 0.8)), 80);
    return () => clearInterval(id);
  }, [status]);

  const playNextBuffer = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || playQueueRef.current.length === 0) { isPlayingRef.current = false; return; }
    isPlayingRef.current = true;
    const buf = playQueueRef.current.shift()!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime, nextTimeRef.current);
    src.start(startAt);
    nextTimeRef.current = startAt + buf.duration;
    src.onended = playNextBuffer;
  }, []);

  const enqueueAudio = useCallback((pcm16Base64: string) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const arrayBuf = base64ToArrayBuffer(pcm16Base64);
    const int16 = new Int16Array(arrayBuf);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    const audioBuf = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    audioBuf.copyToChannel(float32, 0);
    playQueueRef.current.push(audioBuf);
    if (!isPlayingRef.current) playNextBuffer();
    setStatus("speaking");
  }, [playNextBuffer]);

  useEffect(() => {
    let isCancelled = false;
    let ws: WebSocket | null = null;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;

    const connect = async () => {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { sampleRate: INPUT_SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (isCancelled) { audioStream.getTracks().forEach((t) => t.stop()); return; }
        stream = audioStream;
        micStreamRef.current = stream;
        const audioCtx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
        if (isCancelled) { audioStream.getTracks().forEach((t) => t.stop()); audioCtx.close().catch(() => {}); return; }
        ctx = audioCtx;
        audioCtxRef.current = ctx;

        let geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
        if (!geminiKey) {
          try {
            const kr = await fetch("/api/get-gemini-key");
            if (kr.ok) { const kd = await kr.json(); if (kd.key) geminiKey = kd.key; }
          } catch {}
        }

        let wsUrl: string;
        if (geminiKey) {
          wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${geminiKey}`;
        } else {
          const isSecure = window.location.protocol === "https:";
          wsUrl = `${isSecure ? "wss:" : "ws:"}//${window.location.host}/api/ws-gemini`;
        }

        const socket = new WebSocket(wsUrl);
        if (isCancelled) { audioStream.getTracks().forEach((t) => t.stop()); audioCtx.close().catch(() => {}); socket.close(); return; }
        ws = socket;
        wsRef.current = ws;
        ws.binaryType = "arraybuffer";

        ws.onopen = () => {
          if (isCancelled) { socket.close(); return; }
          socket.send(JSON.stringify({
            setup: {
              model: GEMINI_MODEL,
              generation_config: {
                response_modalities: ["AUDIO"],
                speech_config: { voice_config: { prebuilt_voice_config: { voice_name: "Aoede" } } },
              },
              system_instruction: {
                parts: [{
                  text: `You are StudySphere, a warm and encouraging AI study tutor for IGCSE and secondary school students. You were created by Sphere AI. The current date and time is ${new Date().toString()}. Speak naturally and warmly. Keep responses concise — under 3 sentences each turn. Sound like a brilliant older sister who loves teaching. Never say you are an AI. Start by greeting the student.

Always implement these tutoring guidelines during the session:
1. Context Lock: Keep the session strictly focused on academic study/revision. Gently redirect if the user drifts off-topic.
2. Knowledge Checks: Periodically ask the student to explain a concept back in their own words to verify true understanding.
3. Difficulty Scaling: Adapt the difficulty level based on the student's responses, starting simple and increasing complexity.
4. Error Detection: Immediately but kindly call out and correct any conceptual errors or misconceptions.
5. Reinforcement: Keep track of weak areas mentioned during this session and revisit them to reinforce learning.`
                }],
              },
            },
          }));
        };

        ws.onmessage = (event) => {
          if (isCancelled) return;
          try {
            const data = JSON.parse(typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data));
            if (data.setupComplete !== undefined) { setStatus("listening"); startMicCapture(audioStream, audioCtx, socket); }
            if (data.serverContent?.modelTurn?.parts) {
              for (const part of data.serverContent.modelTurn.parts) {
                if (part.inlineData?.mimeType?.startsWith("audio/") && part.inlineData.data) enqueueAudio(part.inlineData.data);
              }
            }
            if (data.serverContent?.turnComplete) setStatus("listening");
          } catch (_) {}
        };

        ws.onerror = () => { if (!isCancelled) { setStatus("error"); setErrorMsg("Could not connect to Gemini Live. Please check your API key or network."); } };
        ws.onclose = (e) => { if (!isCancelled) { setStatus("error"); setErrorMsg(e.reason || "Connection closed. Please check your API key or model availability."); } };
      } catch (err: any) {
        if (!isCancelled) { setStatus("error"); setErrorMsg(err?.message ?? "Microphone access denied or connection failed."); }
      }
    };

    connect();

    return () => {
      isCancelled = true;
      try { if (ws && ws.readyState < 2) ws.close(); } catch (_) {}
      try { if (wsRef.current && wsRef.current.readyState < 2) wsRef.current.close(); } catch (_) {}
      stream?.getTracks().forEach((t) => t.stop());
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (ctx && ctx.state !== "closed") ctx.close().catch(() => {});
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") audioCtxRef.current.close().catch(() => {});
      wsRef.current = null; micStreamRef.current = null; audioCtxRef.current = null;
      processorRef.current = null; playQueueRef.current = []; isPlayingRef.current = false; nextTimeRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startMicCapture = (stream: MediaStream, ctx: AudioContext, ws: WebSocket) => {
    const micSource = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    let residual = new Float32Array(0);
    const ratio = ctx.sampleRate / INPUT_SAMPLE_RATE;
    processor.onaudioprocess = (e) => {
      if (mutableMuted.current || isPlayingRef.current) return;
      const input = e.inputBuffer.getChannelData(0);
      const combined = new Float32Array(residual.length + input.length);
      combined.set(residual); combined.set(input, residual.length);
      const outLen = Math.floor(combined.length / ratio);
      const downsampled = new Float32Array(outLen);
      for (let i = 0; i < outLen; i++) downsampled[i] = combined[Math.round(i * ratio)] ?? 0;
      residual = combined.slice(Math.round(outLen * ratio));
      const b64 = arrayBufferToBase64(floatTo16BitPCM(downsampled));
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ realtime_input: { audio: { mime_type: "audio/pcm;rate=16000", data: b64 } } }));
    };
    micSource.connect(processor);
    processor.connect(ctx.destination);
  };

  const handleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    mutableMuted.current = newMuted;
    micStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
  };

  const handleEnd = () => {
    try { if (wsRef.current && wsRef.current.readyState < 2) wsRef.current.close(); } catch (_) {}
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== "closed") ctx.close().catch(() => {});
    audioCtxRef.current = null;
    onEnd(secs);
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between text-slate-900"
      style={{ background: "radial-gradient(120% 80% at 50% 0%, #efe7ff 0%, #f7f3ff 45%, #ffffff 100%)" }}>
      <div className="pt-14 text-center px-6 w-full">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--primary)]/70 font-semibold">
          {status === "connecting" ? "Connecting…" : status === "error" ? "Connection failed" : status === "speaking" ? `Speaking · ${mm}:${ss}` : `Listening · ${mm}:${ss}`}
        </p>
        <h2 className="mt-2 text-[24px] font-bold tracking-tight">StudySphere</h2>
        <p className="text-[12px] text-slate-500 mt-1">
          {status === "connecting" ? "Joining Gemini Live session…" : status === "error" ? errorMsg : status === "speaking" ? "AI is speaking — you can interrupt" : "Listening — ask anything out loud"}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
        <div className="relative">
          {status === "listening" && (
            <>
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "radial-gradient(circle, rgba(176,124,255,0.35), transparent 70%)" }} />
              <span className="absolute -inset-8 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(124,92,255,0.18), transparent 70%)" }} />
            </>
          )}
          <div className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(124,92,255,0.55)]"
            style={{ background: status === "connecting" ? "#e5e7eb" : "linear-gradient(135deg,#a78bfa,#c4a8ff)" }}>
            {status === "connecting" ? <Loader2 size={40} className="text-[#a78bfa] animate-spin" /> : <BotMark size={76} withGradient={false} className="text-white" />}
          </div>
        </div>
        {status === "speaking" && (
          <div className="flex items-center gap-1 h-10">
            {bars.map((h, i) => (
              <div key={i} className="w-1.5 rounded-full transition-all duration-75"
                style={{ height: `${h * 40}px`, background: "linear-gradient(to top, #8b5cf6, #c4a8ff)" }} />
            ))}
          </div>
        )}
        {status === "listening" && !muted && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] text-slate-500">Mic active</span>
          </div>
        )}
        {status === "error" && (
          <div className="px-6 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[12px] text-center max-w-[280px]">{errorMsg}</div>
        )}
      </div>

      <div className="px-6 pb-12 w-full max-w-[420px]">
        {status !== "connecting" && status !== "error" && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {["Quiz me on this", "Slow down", "Give an example", "Summarise that"].map((c) => (
              <span key={c} className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-white/80 border border-[color:var(--primary)]/15 text-slate-700 shadow-sm backdrop-blur">{c}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-5">
          <button onClick={handleMute} className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center tap text-slate-700" aria-label="Mute">
            {muted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button onClick={handleEnd} className="w-16 h-16 rounded-full flex items-center justify-center tap shadow-[0_12px_30px_-8px_rgba(255,80,100,0.55)]"
            style={{ background: "linear-gradient(135deg,#ff5d7a,#e02447)" }} aria-label="End call">
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
