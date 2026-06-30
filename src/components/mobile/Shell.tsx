import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, FileText, User } from "lucide-react";
import type { ReactNode } from "react";
import { BotMark } from "@/components/BotMark";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/tutor", label: "Tutor", icon: "bot" as const },
  { to: "/past-papers", label: "Papers", icon: FileText },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function MobileShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mobile-frame">
      <div className={`relative anim-in ${hideNav ? "" : "pb-32"}`}>{children}</div>

      {!hideNav && (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[388px]">
          <div className="glass-strong rounded-[26px] flex items-center justify-between px-2 py-2">
            {tabs.map(({ to, label, icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className="tap relative flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-[18px]"
                >
                  {/* underline indicator at the top of the active icon */}
                  <span
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-300 ${
                      active ? "w-7 gradient-primary opacity-100" : "w-0 opacity-0"
                    }`}
                  />
                  {icon === "bot" ? (
                    <BotMark size={20} withGradient={active} className={active ? "" : "opacity-70"} />
                  ) : (
                    (() => {
                      const Icon = icon;
                      return (
                        <Icon
                          size={20}
                          strokeWidth={active ? 2.2 : 1.7}
                          className={active ? "text-[color:var(--primary)]" : "text-muted-foreground"}
                        />
                      );
                    })()
                  )}
                  <span
                    className={`text-[10px] tracking-tight ${
                      active ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="px-5 pt-6 pb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Section({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-5 mt-6">
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
