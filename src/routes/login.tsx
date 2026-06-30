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
