import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Crown, Flame, Award, BookmarkCheck, FileText, Settings, HelpCircle, LogOut, ChevronRight, Moon, Sun } from "lucide-react";
import { MobileShell, PageHeader, Section } from "@/components/mobile/Shell";
import { GlassCard, Pill } from "@/components/mobile/ui";
import { useTheme } from "@/lib/theme";


export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — StudySphere AI" }] }),
  component: Profile,
});

function Profile() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const handleSignOut = () => {
    try { localStorage.removeItem("studysphere-theme"); } catch {}
    navigate({ to: "/login" });
  };
  return (
    <MobileShell>

      <PageHeader title="Profile" />

      <div className="px-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-semibold">S</div>
          <div>
            <p className="text-[17px] font-semibold">Shi Adeyemi</p>
            <p className="text-[12px] text-muted-foreground">IGCSE · Year 11 · Lagos</p>
          </div>
        </div>
      </div>

      <Section>
        <div className="glass-strong rounded-[22px] p-5 relative overflow-hidden border border-[color:var(--primary)]/30">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full gradient-primary opacity-30 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[color:var(--secondary)]">
            <Crown size={12} /> Sphere Plus
          </div>
          <p className="text-[20px] font-semibold mt-2">Premium plan</p>
          <p className="text-[12px] text-muted-foreground mt-1">Unlimited AI tutor, all past papers, advanced analytics.</p>
          <Link to="/billing" className="inline-block mt-4 glass rounded-[14px] px-4 py-2.5 text-[12px] font-medium tap">Manage plan</Link>
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="!p-3 text-center">
            <Flame size={16} className="mx-auto text-[color:var(--warning)]" />
            <p className="mono text-[18px] font-medium mt-1">14</p>
            <p className="text-[10px] text-muted-foreground">day streak</p>
          </GlassCard>
          <GlassCard className="!p-3 text-center">
            <Award size={16} className="mx-auto text-[color:var(--secondary)]" />
            <p className="mono text-[18px] font-medium mt-1">23</p>
            <p className="text-[10px] text-muted-foreground">badges</p>
          </GlassCard>
          <GlassCard className="!p-3 text-center">
            <BookmarkCheck size={16} className="mx-auto text-[color:var(--primary)]" />
            <p className="mono text-[18px] font-medium mt-1">86</p>
            <p className="text-[10px] text-muted-foreground">mastered</p>
          </GlassCard>
        </div>
      </Section>

      <Section title="Library">
        <div className="glass rounded-[18px] divide-y divide-[color:var(--hairline)]">
          {[
            { i: BookmarkCheck, t: "Saved notes", c: "24 items", to: "/notes" },
            { i: FileText, t: "Saved past questions", c: "37 items", to: "/papers" },
            { i: Award, t: "Achievements", c: "23 unlocked", to: "/profile" },
          ].map((r) => (
            <Link to={r.to} key={r.t} className="flex items-center gap-3 px-4 py-3.5 tap">
              <div className="w-9 h-9 rounded-[10px] bg-glass-strong flex items-center justify-center"><r.i size={15} /></div>
              <div className="flex-1">
                <p className="text-[13.5px] font-medium">{r.t}</p>
                <p className="text-[11px] text-muted-foreground">{r.c}</p>
              </div>
              <ChevronRight size={15} className="text-muted-foreground" />
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Settings">
        <div className="glass rounded-[18px] divide-y divide-[color:var(--hairline)]">
          <button onClick={toggle} className="w-full flex items-center gap-3 px-4 py-3.5 tap text-left">
            <div className="w-9 h-9 rounded-[10px] bg-glass-strong flex items-center justify-center">
              {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
            </div>
            <span className="flex-1 text-[13.5px] font-medium">Appearance</span>
            <span className="text-[12px] text-muted-foreground capitalize">{theme}</span>
          </button>
          {[
            { i: Settings, t: "Account & preferences", onClick: () => {} },
            { i: HelpCircle, t: "Help & support", onClick: () => {} },
            { i: LogOut, t: "Sign out", danger: true, onClick: handleSignOut },
          ].map((r) => (
            <button key={r.t} onClick={r.onClick} className="w-full flex items-center gap-3 px-4 py-3.5 tap text-left">
              <div className="w-9 h-9 rounded-[10px] bg-glass-strong flex items-center justify-center"><r.i size={15} /></div>
              <span className={`flex-1 text-[13.5px] font-medium ${r.danger ? "text-[color:var(--destructive)]" : ""}`}>{r.t}</span>
              <ChevronRight size={15} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5">
          <Pill>v1.0 · StudySphere AI</Pill>
        </div>
      </Section>
    </MobileShell>
  );
}
