import type { ReactNode } from "react";

export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-3xl font-semibold uppercase text-[#111111] ${className}`}>{children}</h2>;
}

export default SectionTitle;
