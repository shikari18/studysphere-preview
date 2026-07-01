import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Mail, X } from "lucide-react";
import hero from "@/assets/onboarding-hero.jpg";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Welcome — StudySphere AI" }] }),
  component: Onboarding,
});

const slides = [
  { t: "Your personal AI tutor", s: "Chat, voice and photo-solve — like having a top tutor in your pocket." },
  { t: "Notes → Quizzes in seconds", s: "Turn lecture notes into flashcards and adaptive quizzes." },
  { t: "Plan smarter, study less", s: "An AI planner that adapts to your exams and energy." },
  { t: "Track progress with insight", s: "Beautiful analytics that show what to study next." },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const [authed, setAuthed] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const nav = useNavigate();
  const last = i === slides.length - 1;

  // Force white background on html/body to prevent dark bleed in safe-area insets
  useEffect(() => {
    const prev = document.body.style.background;
    const prevHtml = document.documentElement.style.background;
    document.body.style.background = "#ffffff";
    document.documentElement.style.background = "#ffffff";
    return () => {
      document.body.style.background = prev;
      document.documentElement.style.background = prevHtml;
    };
  }, []);

  const onNext = () => {
    if (!authed) {
      setShowAuth(true);
      return;
    }
    if (last) nav({ to: "/home" });
    else setI(i + 1);
  };

  const handleProvider = (p: "google" | "apple" | "email") => {
    if (p === "email") {
      nav({ to: "/login" });
      return;
    }
    setAuthed(true);
    setShowAuth(false);
    setI((v) => Math.min(v + 1, slides.length - 1));
  };

  return (
    <div
      className="h-[100dvh] overflow-hidden flex flex-col"
      style={{ background: "#ffffff", color: "#0b0b14" }}
    >
      <header className="px-6 pt-8 flex items-center gap-2.5">
        <img src={logo} className="w-6 h-6 rounded-md object-contain" alt="StudySphere Logo" />
        <span className="text-[13.5px] font-semibold tracking-wider" style={{ color: "#1f1f2b" }}>
          STUDYSPHERE <span style={{ color: "#6d4cff" }}>AI</span>
        </span>
      </header>

      <div
        className="relative mx-6 mt-6 aspect-[4/5] rounded-[28px] overflow-hidden"
        style={{ boxShadow: "0 20px 60px -30px rgba(80,60,200,0.35)" }}
      >
        <img src={hero} alt="Student" className="w-full h-full object-cover" width={1024} height={1280} />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(255,255,255,0.85), rgba(255,255,255,0) 55%)" }}
        />
      </div>

      <div className="px-7 mt-8 anim-in" key={i}>
        <h1 className="text-[30px] leading-[36px] font-semibold tracking-tight" style={{ color: "#0b0b14" }}>
          {slides[i].t}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "#4a4a59" }}>
          {slides[i].s}
        </p>
      </div>

      <div className="flex-1" />

      <div className="px-6 pb-10">
        <div className="flex items-center gap-1.5 mb-6">
          {slides.map((_, k) => (
            <span
              key={k}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: k === i ? 28 : 6,
                background:
                  k === i ? "linear-gradient(90deg,#6d4cff,#b07cff)" : "rgba(20,18,40,0.12)",
              }}
            />
          ))}
        </div>
        <button
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 rounded-[18px] px-5 py-3.5 text-[15px] font-medium text-white tap"
          style={{
            background: "linear-gradient(90deg,#6d4cff,#a06bff)",
            boxShadow: "0 12px 30px -12px rgba(109,76,255,0.55)",
          }}
        >
          {last && authed ? "Start learning smarter" : "Next"}
          <ArrowRight size={18} />
        </button>
        <Link
          to="/login"
          className="w-full text-center mt-3 py-2 text-[13px] block"
          style={{ color: "#5a5a6d" }}
        >
          I already have an account
        </Link>
      </div>

      {showAuth && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4"
          style={{ background: "rgba(10,8,30,0.45)" }}
          onClick={() => setShowAuth(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-[28px] p-6 anim-in"
            style={{ background: "#ffffff", boxShadow: "0 30px 80px -20px rgba(0,0,0,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[20px] font-semibold tracking-tight" style={{ color: "#0b0b14" }}>
                  Create your account
                </h2>
                <p className="text-[13px] mt-1" style={{ color: "#5a5a6d" }}>
                  Continue to unlock the rest of the tour.
                </p>
              </div>
              <button
                onClick={() => setShowAuth(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center tap"
                style={{ background: "#f1f1f5" }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => handleProvider("google")}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-[16px] text-[14.5px] font-medium tap"
                style={{ border: "1px solid #e5e5ec", color: "#0b0b14", background: "#fff" }}
              >
                <GoogleIcon /> Continue with Google
              </button>
              <button
                onClick={() => handleProvider("apple")}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-[16px] text-[14.5px] font-medium text-white tap"
                style={{ background: "#0b0b14" }}
              >
                <AppleIcon /> Continue with Apple
              </button>
              <button
                onClick={() => handleProvider("email")}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-[16px] text-[14.5px] font-medium tap"
                style={{ border: "1px solid #e5e5ec", color: "#0b0b14", background: "#fff" }}
              >
                <Mail size={16} /> Continue with email
              </button>
            </div>

            <p className="mt-5 text-center text-[11px]" style={{ color: "#8a8a9a" }}>
              By continuing you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.4 35 44 30 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.4 1.4c0 1.2-.5 2.4-1.3 3.3-.9.9-2.2 1.6-3.4 1.5-.1-1.2.5-2.4 1.3-3.2.9-1 2.3-1.6 3.4-1.6zM20.8 17.5c-.6 1.4-.9 2-1.7 3.2-1.1 1.7-2.7 3.8-4.6 3.8-1.7 0-2.2-1.1-4.5-1.1-2.4 0-2.9 1.1-4.6 1.1-1.9 0-3.4-1.9-4.5-3.6-3.1-4.7-3.4-10.2-1.5-13.2 1.4-2.1 3.6-3.4 5.6-3.4 2.1 0 3.4 1.1 5.1 1.1 1.7 0 2.7-1.1 5.1-1.1 1.8 0 3.7 1 5.1 2.7-4.5 2.5-3.8 8.9.5 10.5z" />
    </svg>
  );
}
