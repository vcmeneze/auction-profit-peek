import { cn } from "@/lib/utils";
import { VERDICT_LABEL, type Verdict } from "@/lib/calc";

export const verdictClasses: Record<Verdict, string> = {
  excelente: "bg-success text-success-foreground",
  moderado: "bg-warning text-warning-foreground",
  inviavel: "bg-danger text-danger-foreground",
};

export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm", verdictClasses[verdict], className)}>
      {VERDICT_LABEL[verdict]}
    </span>
  );
}
