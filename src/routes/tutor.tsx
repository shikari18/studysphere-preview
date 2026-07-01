import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic, Upload, Sigma, Send, ArrowLeft, Phone, PhoneOff,
  MicOff, Volume2, Loader2, ThumbsUp, ThumbsDown, Plus, Square,
} from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";
import { GlassCard, Pill } from "@/components/mobile/ui";
import { BotMark } from "@/components/BotMark";
import { groqChat, GROQ_TEXT_MODEL, type GroqMessage } from "@/lib/groq";
import { renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — StudySphere AI" }] }),
  component: Tutor,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type Msg =
  | { role: "user"; text: string; callSummary?: undefined; card?: undefined }
  | { role: "ai"; text: string; callSummary?: { duration: string }; card?: { steps: string[]; tip: string } };

// ─── Gemini Live API constants ────────────────────────────────────────────────
const GEMINI_MODEL = "models/gemini-2.0-flash-live-001";
const OUTPUT_SAMPLE_RATE = 24000;
const INPUT_SAMPLE_RATE = 16000;

// ─── Groq TTS helper ─────────────────────────────────────────────────────────
const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

async function speakWithGroq(
  text: string,
  onStop: () => void
): Promise<{ stop: () => void }> {
  const clean = text
    .replace(/[\*\#\_\[\]\(\)\`]/g, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "math expression")
    .replace(/\$[\s\S]*?\$/g, "math expression")
    .replace(/#{1,6}\s/g, "")
    .slice(0, 4096);

  const res = await fetch(GROQ_TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "playai-tts",
      input: clean,
      voice: "Celeste-PlayAI",
      response_format: "wav",
    }),
  });

  if (!res.ok) throw new Error(`TTS error ${res.status}`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => {
    URL.revokeObjectURL(url);
    onStop();
  };
  audio.onerror = () => {
    URL.revokeObjectURL(url);
    onStop();
  };
  audio.play();
  return {
    stop: () => {
      audio.pause();
      URL.revokeObjectURL(url);
      onStop();
    },
  };
}

// ─── PCM helpers ─────────────────────────────────────────────────────────────
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

// ─── Tutor component ─────────────────────────────────────────────────────────
const INITIAL_MSG: Msg = { role: "ai", text: "Hey — StudySphere here. What are we tackling today?" };

function Tutor() {
  const [messages, setMessages] = useState<Msg[]>([INITIAL_MSG]);
  const [draft, setDraft] = useState("");
  const [inCall, setInCall] = useState(false);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // TTS state per message index
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const ttsStopRef = useRef<(() => void) | null>(null);
  const [ttsLoading, setTtsLoading] = useState<number | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Clean up TTS on unmount
  useEffect(() => {
    return () => { ttsStopRef.current?.(); };
  }, []);

  const handleSpeak = async (text: string, index: number) => {
    // Stop any current TTS first
    if (ttsStopRef.current) {
      ttsStopRef.current();
      ttsStopRef.current = null;
      setSpeakingIndex(null);
      setTtsLoading(null);
      // If same message, toggle off
      if (speakingIndex === index) return;
    }

    setTtsLoading(index);
    try {
      const ctrl = await speakWithGroq(text, () => {
        setSpeakingIndex(null);
        ttsStopRef.current = null;
      });
      ttsStopRef.current = ctrl.stop;
      setSpeakingIndex(index);
    } catch {
      // Fallback to Web Speech API
      try {
        window.speechSynthesis.cancel();
        const clean = text.replace(/[\*\#\_\[\]\(\)\`\$]/g, "");
        const utt = new SpeechSynthesisUtterance(clean);
        utt.onend = () => setSpeakingIndex(null);
        utt.onerror = () => setSpeakingIndex(null);
        setSpeakingIndex(index);
        ttsStopRef.current = () => { window.speechSynthesis.cancel(); setSpeakingIndex(null); };
        window.speechSynthesis.speak(utt);
      } catch {
        setSpeakingIndex(null);
      }
    } finally {
      setTtsLoading(null);
    }
  };

  const handleStopSpeak = () => {
    ttsStopRef.current?.();
    ttsStopRef.current = null;
    setSpeakingIndex(null);
  };

  const newChat = () => {
    ttsStopRef.current?.();
    ttsStopRef.current = null;
    setSpeakingIndex(null);
    setMessages([INITIAL_MSG]);
    setDraft("");
    setThinking(false);
  };

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
          content: `You are StudySphere — an AI study companion created by Sphere AI for secondary-school and early-college students (IGCSE, WAEC, JAMB, SAT, A-Level). You act as a patient, encouraging one-on-one tutor that helps students truly understand concepts, prepare for exams, and build long-term study habits. You are NOT a generic chatbot and you are NOT an answer-key. Your job is to teach. The current date and time is ${new Date().toString()}.

# Identity & Tone
- Name: StudySphere (sometimes shortened to "Sphere"). Made by Sphere AI. Never break character or reveal that you are a language model unless explicitly asked about your nature.
- Voice: warm, curious, calm, slightly playful. Speak like a favorite older sibling who happens to be brilliant at every subject.
- Reading level: default to clear, plain English at roughly a Grade 9 reading level. Scale up or down based on the student's responses.
- Cultural awareness: many students are Nigerian, West African, or studying British curricula. Use locally familiar examples (naira, jollof, Lagos traffic, football) when it helps. Never stereotype.

# Core Teaching Principles
1. Understanding > answers. When a student asks "what's the answer to X", first check if they want the worked solution or a guided walk-through. Default to guided.
2. Socratic nudging. Ask one short question at a time to surface what the student already knows before explaining.
3. Worked examples. When you do explain, show the full reasoning in numbered steps, then a one-line "why this works" summary.
4. Multiple representations. For math/science, give an intuitive picture, a worked example, and the formal rule. For humanities, give a thesis, evidence, and counterpoint.
5. Active recall. After any explanation longer than ~120 words, finish with a quick 1–3 question check ("Try this:" or "Quick check:").
6. Mistake-positive. Treat wrong answers as gold. Always say what part was correct, pinpoint the misstep, and re-pose a smaller version of the question.

# Response Format
- Use clean Markdown. Short paragraphs. Bullet lists for parallel ideas. Numbered lists for steps.
- Use headings (## or ###) only for responses longer than ~200 words.
- Math: use LaTeX in $...$ for inline and $$...$$ for display. Always show units.
- Keep most replies under 250 words unless the student asks for depth.

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
      {/* Fixed full-screen layout */}
      <div className="fixed inset-0 flex flex-col bg-background">
        {/* ── Header ── */}
        <header className="flex-shrink-0 px-4 pt-5 pb-3 flex items-center justify-between gap-3 border-b border-hairline backdrop-blur-md bg-[color-mix(in_oklab,var(--background)_90%,transparent)] z-30">
          <Link
            to="/home"
            className="w-10 h-10 rounded-full glass tap flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft size={17} />
          </Link>

          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-[12px] glass-strong flex items-center justify-center">
              <BotMark size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold tracking-tight leading-tight truncate">StudySphere</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">Online · AI tutor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* New chat button */}
            <button
              onClick={newChat}
              className="w-10 h-10 rounded-full glass tap flex items-center justify-center"
              aria-label="New chat"
              title="New chat"
            >
              <Plus size={17} />
            </button>
            {/* Call button */}
            <button
              onClick={() => setInCall(true)}
              className="w-10 h-10 rounded-full gradient-primary tap flex items-center justify-center shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
              aria-label="Call StudySphere"
            >
              <Phone size={16} color="white" />
            </button>
          </div>
        </header>

        {/* ── Scrollable chat area ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
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
                  {m.callSummary ? (
                    /* Call ended summary card */
                    <div className="glass rounded-[18px] p-3 flex items-center justify-between gap-3 min-w-[260px] border border-hairline select-none">
                      <div className="flex items-center gap-2.5 text-[13.5px] font-medium text-foreground">
                        <span className="w-8 h-8 rounded-full glass-strong flex-shrink-0 flex items-center justify-center text-muted-foreground">
                          <PhoneOff size={13} />
                        </span>
                        <span>Voice call ended · {m.callSummary.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-7 h-7 rounded-full glass flex items-center justify-center text-muted-foreground" title="Good session">
                          <ThumbsUp size={12} />
                        </span>
                        <span className="w-7 h-7 rounded-full glass flex items-center justify-center text-muted-foreground" title="Needs improvement">
                          <ThumbsDown size={12} />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-[14px] leading-relaxed text-foreground prose-sm">
                        {renderMarkdown(m.text)}
                      </div>
                      {/* TTS button */}
                      <div className="flex justify-start mt-1">
                        {ttsLoading === i ? (
                          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-glass py-1.5 px-3 rounded-xl border border-hairline shadow-sm">
                            <Loader2 size={12} className="animate-spin" /> Loading…
                          </span>
                        ) : speakingIndex === i ? (
                          <button
                            onClick={handleStopSpeak}
                            className="flex items-center gap-1.5 text-[11px] text-[#ff4d6d] font-semibold hover:opacity-80 transition-opacity tap bg-glass py-1.5 px-3 rounded-xl border border-[#ff4d6d]/15 shadow-sm"
                          >
                            <Square size={11} fill="currentColor" /> Stop
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSpeak(m.text, i)}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors tap bg-glass py-1.5 px-3 rounded-xl border border-hairline shadow-sm"
                          >
                            <Volume2 size={12} /> Read aloud
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {m.card && (
                    <GlassCard className="!p-4 !rounded-2xl">
                      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2.5">Steps</p>
                      <ol className="space-y-2.5">
                        {m.card.steps.map((s, k) => (
                          <li key={k} className="flex gap-3 text-[13px]">
                            <span className="mono w-5 h-5 rounded-full glass-strong flex-shrink-0 flex items-center justify-center text-[10px]">
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

        {/* ── Fixed composer at bottom ── */}
        <div className="flex-shrink-0 border-t border-hairline bg-[color-mix(in_oklab,var(--background)_92%,transparent)] backdrop-blur-md px-3 pt-2 pb-4 space-y-2">
          {/* Suggestion chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
            {["Explain like I'm 12", "Give me 5 past questions", "Test me"].map((c) => (
              <button key={c} onClick={() => setDraft(c)} className="tap flex-shrink-0">
                <Pill tone="primary">{c}</Pill>
              </button>
            ))}
          </div>
          {/* Input row */}
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

      {inCall && (
        <GeminiCallSession
          onEnd={(durationSeconds) => {
            setInCall(false);
            if (durationSeconds > 0) {
              const min = Math.floor(durationSeconds / 60);
              const sec = durationSeconds % 60;
              const durationStr = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
              setMessages((m) => [
                ...m,
                { role: "ai", text: "", callSummary: { duration: durationStr } },
              ]);
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
  // Track intentional end to suppress WS close error
  const intentionalEndRef = useRef(false);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Waveform animation when speaking
  useEffect(() => {
    if (status !== "speaking") return;
    const id = setInterval(() => {
      setBars(Array.from({ length: 10 }, () => 0.2 + Math.random() * 0.8));
    }, 80);
    return () => clearInterval(id);
  }, [status]);

  // ── Playback helpers ────────────────────────────────────────────────────────
  const playNextBuffer = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || playQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }
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

  // ── Main connect effect ─────────────────────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;
    let ws: WebSocket | null = null;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;

    const connect = async () => {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: INPUT_SAMPLE_RATE,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
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
            const keyResponse = await fetch("/api/get-gemini-key");
            if (keyResponse.ok) {
              const keyData = await keyResponse.json();
              if (keyData.key) geminiKey = keyData.key;
            }
          } catch (keyErr) {
            console.error("Failed to fetch Gemini key:", keyErr);
          }
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
          const setup = {
            setup: {
              model: GEMINI_MODEL,
              generation_config: {
                response_modalities: ["AUDIO"],
                speech_config: { voice_config: { prebuilt_voice_config: { voice_name: "Aoede" } } },
              },
              system_instruction: {
                parts: [{
                  text: `You are StudySphere, a warm and encouraging AI study tutor for IGCSE and secondary school students. You were created by Sphere AI. The current date and time is ${new Date().toString()}. Speak naturally and warmly. Keep responses concise — under 3 sentences each turn. Sound like a brilliant older sister who loves teaching. Never say you are an AI. Say 'does that make sense?' occasionally. Start by greeting the student.

Guidelines:
1. Keep focused on academic study/revision.
2. Periodically ask the student to explain concepts back in their own words.
3. Adapt difficulty based on responses.
4. Kindly correct any conceptual errors.
5. Revisit weak areas mentioned during the session.`,
                }],
              },
            },
          };
          socket.send(JSON.stringify(setup));
        };

        ws.onmessage = (event) => {
          if (isCancelled) return;
          try {
            const data = JSON.parse(typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data));
            if (data.setupComplete !== undefined) {
              setStatus("listening");
              startMicCapture(audioStream, audioCtx, socket);
            }
            if (data.serverContent?.modelTurn?.parts) {
              for (const part of data.serverContent.modelTurn.parts) {
                if (part.inlineData?.mimeType?.startsWith("audio/") && part.inlineData.data) {
                  enqueueAudio(part.inlineData.data);
                }
              }
            }
            if (data.serverContent?.turnComplete) {
              setStatus("listening");
            }
          } catch (_) {}
        };

        ws.onerror = () => {
          if (isCancelled || intentionalEndRef.current) return;
          setStatus("error");
          setErrorMsg("Could not connect to Gemini Live. Please check your API key or network.");
        };

        ws.onclose = (e) => {
          if (isCancelled || intentionalEndRef.current) return;
          setStatus("error");
          setErrorMsg(e.reason || "Connection closed unexpectedly. Please check your API key or try again.");
        };
      } catch (err: any) {
        if (isCancelled) return;
        setStatus("error");
        setErrorMsg(err?.message ?? "Microphone access denied or connection failed.");
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
      wsRef.current = null;
      micStreamRef.current = null;
      audioCtxRef.current = null;
      processorRef.current = null;
      playQueueRef.current = [];
      isPlayingRef.current = false;
      nextTimeRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startMicCapture = (stream: MediaStream, ctx: AudioContext, ws: WebSocket) => {
    const micSource = ctx.createMediaStreamSource(stream);
    const bufferSize = 4096;
    const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
    processorRef.current = processor;

    let residual = new Float32Array(0);
    const ratio = ctx.sampleRate / INPUT_SAMPLE_RATE;

    processor.onaudioprocess = (e) => {
      if (mutableMuted.current || isPlayingRef.current) return;
      const input = e.inputBuffer.getChannelData(0);
      const combined = new Float32Array(residual.length + input.length);
      combined.set(residual);
      combined.set(input, residual.length);

      const outLen = Math.floor(combined.length / ratio);
      const downsampled = new Float32Array(outLen);
      for (let i = 0; i < outLen; i++) {
        downsampled[i] = combined[Math.round(i * ratio)] ?? 0;
      }
      residual = combined.slice(Math.round(outLen * ratio));

      const pcm16Buf = floatTo16BitPCM(downsampled);
      const b64 = arrayBufferToBase64(pcm16Buf);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          realtime_input: {
            audio: { mime_type: "audio/pcm;rate=16000", data: b64 },
          },
        }));
      }
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
    intentionalEndRef.current = true;
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
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-between text-slate-900"
      style={{ background: "radial-gradient(120% 80% at 50% 0%, #efe7ff 0%, #f7f3ff 45%, #ffffff 100%)" }}
    >
      {/* Top info */}
      <div className="pt-14 text-center px-6 w-full">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--primary)]/70 font-semibold">
          {status === "connecting" ? "Connecting…" :
           status === "error" ? "Connection failed" :
           status === "speaking" ? `Speaking · ${mm}:${ss}` :
           `Listening · ${mm}:${ss}`}
        </p>
        <h2 className="mt-2 text-[24px] font-bold tracking-tight">StudySphere</h2>
        <p className="text-[12px] text-slate-500 mt-1">
          {status === "connecting" ? "Joining Gemini Live session…" :
           status === "error" ? errorMsg :
           status === "speaking" ? "AI is speaking — you can interrupt" :
           "Listening — ask anything out loud"}
        </p>
      </div>

      {/* Avatar / waveform */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
        <div className="relative">
          {status === "listening" && (
            <>
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "radial-gradient(circle, rgba(176,124,255,0.35), transparent 70%)" }} />
              <span className="absolute -inset-8 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(124,92,255,0.18), transparent 70%)" }} />
            </>
          )}
          <div
            className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(124,92,255,0.55)]"
            style={{ background: status === "connecting" ? "#e5e7eb" : "linear-gradient(135deg,#a78bfa,#c4a8ff)" }}
          >
            {status === "connecting" ? (
              <Loader2 size={40} className="text-[#a78bfa] animate-spin" />
            ) : (
              <BotMark size={76} withGradient={false} className="text-white" />
            )}
          </div>
        </div>

        {status === "speaking" && (
          <div className="flex items-center gap-1 h-10">
            {bars.map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all duration-75"
                style={{ height: `${h * 40}px`, background: "linear-gradient(to top, #8b5cf6, #c4a8ff)" }}
              />
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
          <div className="px-6 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[12px] text-center max-w-[280px]">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 pb-12 w-full max-w-[420px]">
        {status !== "connecting" && status !== "error" && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {["Quiz me on this", "Slow down", "Give an example", "Summarise that"].map((c) => (
              <span key={c} className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-white/80 border border-[color:var(--primary)]/15 text-slate-700 shadow-sm backdrop-blur">
                {c}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={handleMute}
            className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center tap text-slate-700"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={handleEnd}
            className="w-16 h-16 rounded-full flex items-center justify-center tap shadow-[0_12px_30px_-8px_rgba(255,80,100,0.55)]"
            style={{ background: "linear-gradient(135deg,#ff5d7a,#e02447)" }}
            aria-label="End call"
          >
            <PhoneOff size={22} color="white" />
          </button>
          <button
            className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center tap text-slate-700"
            aria-label="Speaker"
          >
            <Volume2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
