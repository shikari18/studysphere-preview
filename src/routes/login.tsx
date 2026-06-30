import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — StudySphere AI" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: "#ffffff", color: "#0b0b14" }}
    >
      <header className="px-6 pt-8 flex items-center justify-between">
        <span className="text-[13px] font-medium tracking-wider" style={{ color: "#1f1f2b" }}>
          STUDYSPHERE <span style={{ color: "#6d4cff" }}>AI</span>
        </span>
        <Link to="/" className="text-[13px]" style={{ color: "#5a5a6d" }}>
          Back
        </Link>
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-[420px] w-full mx-auto">
        <h1 className="text-[28px] font-semibold tracking-tight">Welcome back</h1>
        <p className="text-[14px] mt-1" style={{ color: "#5a5a6d" }}>
          Sign in to continue where you left off.
        </p>

        <form
          className="mt-7 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            nav({ to: "/home" });
          }}
        >
          <label className="block">
            <span className="text-[12px] font-medium" style={{ color: "#3a3a4a" }}>Email</span>
            <div
              className="mt-1.5 flex items-center gap-2 px-3.5 py-3 rounded-[14px]"
              style={{ border: "1px solid #e5e5ec", background: "#fff" }}
            >
              <Mail size={16} style={{ color: "#8a8a9a" }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent outline-none text-[14.5px]"
                style={{ color: "#0b0b14" }}
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[12px] font-medium" style={{ color: "#3a3a4a" }}>Password</span>
            <div
              className="mt-1.5 flex items-center gap-2 px-3.5 py-3 rounded-[14px]"
              style={{ border: "1px solid #e5e5ec", background: "#fff" }}
            >
              <Lock size={16} style={{ color: "#8a8a9a" }} />
              <input
                type="password"
                required
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-[14.5px]"
                style={{ color: "#0b0b14" }}
              />
            </div>
          </label>

          <div className="flex justify-end -mt-1">
            <button type="button" className="text-[12px]" style={{ color: "#6d4cff" }}>
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-[16px] px-5 py-3.5 text-[15px] font-medium text-white tap"
            style={{
              background: "linear-gradient(90deg,#6d4cff,#a06bff)",
              boxShadow: "0 12px 30px -12px rgba(109,76,255,0.55)",
            }}
          >
            Sign in <ArrowRight size={16} />
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: "#e5e5ec" }} />
          <span className="text-[11px] uppercase tracking-wider" style={{ color: "#8a8a9a" }}>or continue with</span>
          <div className="flex-1 h-px" style={{ background: "#e5e5ec" }} />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { name: "Google", icon: (
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.96-4.32 2.96-7.45Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.07v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.42 13.89A6.02 6.02 0 0 1 6.1 12c0-.66.11-1.3.32-1.89V7.5H3.07a10 10 0 0 0 0 9l3.35-2.61Z"/><path fill="#EA4335" d="M12 6c1.47 0 2.78.5 3.82 1.5l2.86-2.86C16.95 3.07 14.7 2 12 2A10 10 0 0 0 3.07 7.5l3.35 2.61C7.2 7.76 9.4 6 12 6Z"/></svg>
            )},
            { name: "Apple", icon: (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#000"><path d="M16.37 12.62c.02 2.6 2.28 3.46 2.3 3.47-.02.06-.36 1.23-1.19 2.43-.72 1.04-1.46 2.07-2.64 2.1-1.15.02-1.52-.69-2.84-.69-1.32 0-1.74.66-2.83.71-1.13.04-2-1.13-2.72-2.16-1.49-2.14-2.63-6.06-1.1-8.7.76-1.32 2.13-2.16 3.6-2.18 1.12-.02 2.17.75 2.85.75.68 0 1.97-.93 3.32-.79.56.02 2.14.23 3.15 1.71-.08.05-1.88 1.1-1.86 3.27ZM14.22 4.6c.6-.74 1.01-1.76.9-2.78-.87.04-1.93.58-2.56 1.31-.56.65-1.06 1.7-.93 2.7.98.07 1.98-.5 2.59-1.23Z"/></svg>
            )},
            { name: "Phone", icon: (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0b0b14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>
            )},
          ].map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => nav({ to: "/home" })}
              className="flex items-center justify-center gap-2 py-3 rounded-[14px] tap"
              style={{ border: "1px solid #e5e5ec", background: "#fff" }}
            >
              {p.icon}
              <span className="text-[13px] font-medium" style={{ color: "#0b0b14" }}>{p.name}</span>
            </button>
          ))}
        </div>


        <p className="text-center text-[13px] mt-6" style={{ color: "#5a5a6d" }}>
          New to StudySphere?{" "}
          <Link to="/" style={{ color: "#6d4cff", fontWeight: 500 }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
