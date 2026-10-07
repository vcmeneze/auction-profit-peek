// Regras financeiras do SAD LeilãoSeguro (premissas ajustáveis num só lugar).
export const MARKET_FACTOR = 1.8; // preço de mercado estimado = lance mínimo × fator (até integrar FIPEZAP)
export const ACQUISITION_RATE = 0.05; // ITBI + registro
export const MONTHLY_CARRY_RATE = 0.005; // condomínio + IPTU por mês, sobre o valor de mercado
export const SALE_COST_RATE = 0.06; // corretagem/impostos na revenda
export const SMART_REFORM_RATE = 0.1; // reforma preventiva = 10% do lance
export const DEFAULT_LAWYER_FEE = 5000;

export type Verdict = "excelente" | "moderado" | "inviavel";

export interface SimInput {
  preco: number;
  meses: number;
  reforma: number;
  honorarios: number;
}

export function marketPrice(preco: number) {
  return Math.round(preco * MARKET_FACTOR);
}

export function smartReform(preco: number) {
  return Math.round(preco * SMART_REFORM_RATE);
}

export function isOccupied(status: string) {
  const s = status.toLowerCase();
  return s.includes("ocupado") && !s.includes("desocupado");
}

export function simulate({ preco, meses, reforma, honorarios }: SimInput) {
  const mercado = marketPrice(preco);
  const taxas = preco * ACQUISITION_RATE;
  const carregamento = mercado * MONTHLY_CARRY_RATE * meses;
  const custoTotal = preco + taxas + carregamento + reforma + honorarios;
  const margem = ((mercado - custoTotal) / mercado) * 100;
  const roi = ((mercado * (1 - SALE_COST_RATE) - custoTotal) / custoTotal) * 100;
  return { mercado, taxas, carregamento, custoTotal, margem, roi, verdict: verdictFor(margem) };
}

export function verdictFor(margem: number): Verdict {
  if (margem >= 30) return "excelente";
  if (margem >= 10) return "moderado";
  return "inviavel";
}

export function defaultScenario(preco: number, status: string): SimInput {
  return {
    preco,
    meses: isOccupied(status) ? 12 : 3,
    reforma: smartReform(preco),
    honorarios: isOccupied(status) ? DEFAULT_LAWYER_FEE : 0,
  };
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  excelente: "Excelente Negócio",
  moderado: "Risco Moderado",
  inviavel: "Inviável",
};

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const pct = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
