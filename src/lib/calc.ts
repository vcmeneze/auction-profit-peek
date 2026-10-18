export const AUCTIONEER_FEE_RATE = 0.05; // 5% do leiloeiro
export const TAXES_RATE = 0.04; // 4% de ITBI/Registro

export type Verdict = "excelente" | "moderado" | "inviavel";

export interface SimInput {
  preco: number;
  valorAvaliacao?: number | undefined;
  meses: number;
  reforma: number;
  honorarios: number;
}

export function isOccupied(status?: string | null) {
  if (!status) return true;
  return !status.toLowerCase().includes("desocupado");
}

export function smartReform(preco: number) {
  return Math.round(preco * 0.10); // 10% de contingência estrutural
}

export function simulate({ preco, valorAvaliacao, meses, reforma, honorarios }: SimInput) {
  const mercado = valorAvaliacao && valorAvaliacao > preco ? valorAvaliacao : Math.round(preco * 1.5);
  
  const leiloeiro = preco * AUCTIONEER_FEE_RATE;
  const taxas = preco * TAXES_RATE;
  const carregamento = meses * 800; // R$ 800 fixos mensais previstos
  
  const custoTotal = preco + leiloeiro + taxas + carregamento + reforma + honorarios;
  
  const margem = ((mercado - custoTotal) / mercado) * 100;
  const roi = ((mercado - custoTotal) / custoTotal) * 100;
  
  return { mercado, taxas: taxas + leiloeiro, carregamento, custoTotal, margem, roi, verdict: verdictFor(margem) };
}

export function verdictFor(margem: number): Verdict {
  if (margem >= 35) return "excelente";
  if (margem >= 15) return "moderado";
  return "inviavel";
}

export function defaultScenario(preco: number, status?: string | null): SimInput {
  const ocupado = isOccupied(status);
  return {
    preco,
    meses: ocupado ? 12 : 3,
    reforma: ocupado ? smartReform(preco) : 0,
    honorarios: ocupado ? 5000 : 0,
  };
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  excelente: "Excelente Negócio",
  moderado: "Risco Moderado",
  inviavel: "Inviável / Perigoso",
};

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const pct = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;