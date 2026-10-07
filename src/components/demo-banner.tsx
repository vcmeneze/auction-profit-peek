import { isDemo } from "@/lib/data";
import { Info } from "lucide-react";

export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <p>
        Exibindo <strong>dados de exemplo</strong>. Assim que seu banco de dados for conectado, os imóveis reais da Caixa aparecerão aqui automaticamente.
      </p>
    </div>
  );
}
