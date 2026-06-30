import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronLeft, Crown, Sparkles as Star, Rocket } from "lucide-react";
import { MobileShell } from "@/components/mobile/Shell";

export const Route = createFileRoute("/billing")({
  head: () => ({ meta: [{ title: "Plans — Viora AI" }] }),
  component: Billing,
});

type PlanKey = "free" | "pro" | "elite";

const plans: Record<PlanKey, {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  badge?: string;
  highlight?: boolean;
  features: string[];
  cta: string;
}> = {
  free: {
    name: "Free",
    price: "$0",
    cadence: "forever",
    tagline: "Best for trying the app.",
    features: [
      "20 AI questions per day",
      "3 note scans per day",
      "Basic summaries",
      "1 quiz generation per day",
      "Limited flashcards",
      "Basic study planner",
      "Past questions — recent years only",
      "Access to 3 IGCSE subjects",
      "Ads enabled",
      "Basic analytics",
      "1 saved study plan",
    ],
    cta: "Current plan",
  },
  pro: {
    name: "Pro",
    price: "$7",
    cadence: "/ month",
    tagline: "Study smarter, score higher.",
    badge: "Most Popular",
    highlight: true,
    features: [
      "Unlimited AI tutor chats",
      "Unlimited note scanning & summaries",
      "Unlimited flashcards & quizzes",
      "Full homework solver",
      "AI essay helper & voice tutor",
      "Image / PDF question solving",
      "All IGCSE subjects unlocked",
      "Full past questions library + AI explanations",
      "Download past papers",
      "Advanced planner & focus mode",
      "Progress analytics & weak-topic detection",
      "Exam countdown · cloud sync · no ads",
      "Priority AI speed",
    ],
    cta: "Upgrade to Pro",
  },
  elite: {
    name: "Elite",
    price: "$40",
    cadence: "/ month",
    tagline: "Your full personal AI academic coach.",
    badge: "Best Results",
    features: [
      "Everything in Pro, plus:",
      "AI Exam Prediction Engine",
      "Personalized daily coaching",
      "Unlimited past-paper solving",
      "Advanced performance analytics",
      "Smart revision engine",
      "Study streak protection",
      "AI-generated mock exams",
      "AI marking system (essays & theory)",
      "Live study rooms",
      "Parent progress dashboard",
      "Teacher mode access",
      "Priority support",
      "Exclusive exam strategy packs",
      "University admission guidance",
      "Scholarship section · Export to PDF",
      "Premium achievement badges",
    ],
    cta: "Go Elite",
  },
};

function Billing() {
  const [selected, setSelected] = useState<PlanKey>("pro");

  return (
    <MobileShell hideNav>
      <header className="px-5 pt-6 pb-2 flex items-center gap-3">
        <Link
          to="/profile"
          aria-label="Back"
          className="w-10 h-10 rounded-full glass tap flex items-center justify-center"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-[24px] leading-[28px] font-semibold tracking-tight">Choose your plan</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">Cancel anytime. Switch tiers any month.</p>
        </div>
      </header>

      <div className="px-5 mt-5 space-y-4 pb-6">
        {(Object.keys(plans) as PlanKey[]).map((k) => {
          const p = plans[k];
          const isSel = selected === k;
          return (
            <button
              key={k}
              onClick={() => setSelected(k)}
              className={`w-full text-left relative rounded-[24px] overflow-hidden transition-all tap ${
                p.highlight ? "glass-strong" : "glass"
              }`}
              style={{
                border: isSel
                  ? "1.5px solid color-mix(in oklab, var(--primary) 75%, transparent)"
                  : "1px solid var(--hairline)",
                boxShadow: isSel
                  ? "0 18px 50px -22px color-mix(in oklab, var(--primary) 65%, transparent)"
                  : "none",
              }}
            >
              {p.highlight && (
                <div
                  className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-40"
                  style={{ background: "linear-gradient(135deg,var(--primary),var(--secondary))" }}
                />
              )}

              <div className="relative p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {k === "free" && <span>Starter</span>}
                      {k === "pro" && (
                        <span className="flex items-center gap-1 text-[color:var(--primary)]">
                          <Star size={11} /> {p.badge}
                        </span>
                      )}
                      {k === "elite" && (
                        <span className="flex items-center gap-1 text-[color:var(--secondary)]">
                          <Rocket size={11} /> {p.badge}
                        </span>
                      )}
                    </div>
                    <h2 className="text-[22px] font-semibold mt-1 flex items-center gap-2">
                      {p.name}
                      {k === "elite" && <Crown size={16} className="text-[color:var(--secondary)]" />}
                    </h2>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5">{p.tagline}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[24px] font-semibold tracking-tight">{p.price}</p>
                    <p className="text-[11px] text-muted-foreground -mt-0.5">{p.cadence}</p>
                  </div>
                </div>

                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px]">
                      <span
                        className="mt-[3px] w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{
                          background:
                            k === "free"
                              ? "color-mix(in oklab, var(--foreground) 10%, transparent)"
                              : k === "pro"
                                ? "color-mix(in oklab, var(--primary) 22%, transparent)"
                                : "color-mix(in oklab, var(--secondary) 22%, transparent)",
                          color:
                            k === "free"
                              ? "var(--muted-foreground)"
                              : k === "pro"
                                ? "var(--primary)"
                                : "var(--secondary)",
                        }}
                      >
                        <Check size={10} strokeWidth={3} />
                      </span>
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <div
                  className={`mt-5 w-full text-center rounded-[14px] py-3 text-[13.5px] font-medium ${
                    k === "free"
                      ? "bg-glass text-muted-foreground"
                      : "text-white"
                  }`}
                  style={
                    k === "free"
                      ? undefined
                      : { background: "linear-gradient(90deg,var(--primary),var(--secondary))" }
                  }
                >
                  {p.cta}
                </div>
              </div>
            </button>
          );
        })}

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Plans renew automatically. Manage or cancel anytime in Settings.
        </p>
      </div>
    </MobileShell>
  );
}
