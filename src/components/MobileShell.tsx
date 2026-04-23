import { ReactNode } from "react";

interface MobileShellProps {
  children: ReactNode;
  withNav?: boolean;
}

export default function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="w-full bg-background">
      <main className="w-full max-w-md mx-auto bg-background min-h-screen pb-28 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
