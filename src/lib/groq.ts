/**
 * Groq API client — used for ALL AI features in StudySphere.
 * - Text chat (tutor, quiz generation, notes): llama-3.3-70b-versatile
 * - Vision / image scanning: meta-llama/llama-4-scout-17b-16e-instruct
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

// Best quality text model — same as Exam-Glow
export const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
// Vision-capable model for image scanning / OCR
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

export interface GroqOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  signal?: AbortSignal;
}

/**
 * Core chat completion call — supports text and vision messages.
 */
export async function groqChat(
  messages: GroqMessage[],
  model: string = GROQ_TEXT_MODEL,
  opts: GroqOptions = {}
): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      "VITE_GROQ_API_KEY is not set. Add it to your .env file."
    );
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    signal: opts.signal,
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

/**
 * Convenience: system prompt + single user message → reply.
 */
export async function groqAsk(
  systemPrompt: string,
  userPrompt: string,
  opts: GroqOptions = {}
): Promise<string> {
  return groqChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    opts.model ?? GROQ_TEXT_MODEL,
    opts
  );
}

/** Convert a File to a base64 data URL for vision requests */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
