import { ReactNode } from "react";

interface MobileShellProps {
  children: ReactNode;
  withNav?: boolean;
}

export default function MobileShell({ children, withNav = true }: MobileShellProps) {
  return (
    <div className="min-h-screen w-full bg-background flex justify-center">
      <main
        className={`relative w-full max-w-md bg-background ${withNav ? "pb-24" : ""} animate-fade-in`}
      >
        {children}
      </main>
    </div>
  );
}
