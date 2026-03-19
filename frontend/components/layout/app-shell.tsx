import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="relative min-h-screen overflow-hidden p-3 sm:p-4">
    <div className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute left-[6%] top-[7%] h-56 w-56 rounded-full bg-brand/20 blur-3xl motion-safe:animate-[floatDrift_18s_ease-in-out_infinite]" />
      <div className="absolute bottom-[9%] right-[5%] h-64 w-64 rounded-full bg-white/10 blur-3xl motion-safe:animate-[floatDrift_22s_ease-in-out_infinite]" />
    </div>

    <div className="page-enter relative z-10 mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1600px] gap-4 rounded-[36px] border border-white/10 bg-white/5 p-2 shadow-[0_32px_100px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:rounded-[44px] xl:rounded-shell">
      <Sidebar />
      <main className="relative min-h-full flex-1 overflow-hidden rounded-[30px] border border-white/60 bg-shell-surface bg-ambient shadow-[0_30px_120px_rgba(15,23,42,0.14)] md:rounded-[36px]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/90 via-white/50 to-transparent" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative min-h-full overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  </div>
);
