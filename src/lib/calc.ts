export const MARKET_FACTOR = 1.8; 
export const AUCTIONEER_FEE_RATE = 0.05; // 5% do lance para o leiloeiro oficial (Obrigatório)
export const TAXES_RATE = 0.04; // 4% médio de ITBI e despesas de cartório

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

// O sistema calcula preventivamente 10% do lance para proteção caso esteja ocupado
export function smartReform(preco: number) {
  return Math.round(preco * 0.10); 
}

export function isOccupied(status: string) {
  const s = status.toLowerCase();
  return s.includes("ocupado") && !s.includes("desocupado");
}

export function simulate({ preco, meses, reforma, honorarios }: SimInput) {
  const mercado = marketPrice(preco);
  
  // Taxas Fixas de Aquisição
  const leiloeiro = preco * AUCTIONEER_FEE_RATE;
  const taxasITBI = preco * TAXES_RATE;
  
  // FUNÇÃO ANALÍTICA: REGRESSÃO LINEAR DO CUSTO DE CARREGAMENTO
  // Estimativa de IPTU e Condomínio: R$ 800/mês acumulados pelo tempo judicial
  const custoFixoMensal = 800; 
  const carregamento = meses * custoFixoMensal;
  
  // Custo Total Projetado (C_total)
  const custoTotal = preco + leiloeiro + taxasITBI + carregamento + reforma + honorarios;
  
  // FUNÇÃO ANALÍTICA: CLASSIFICAÇÃO DE RISCO (MARGEM E ROI)
  const margem = ((mercado - custoTotal) / mercado) * 100;
  const roi = ((mercado - custoTotal) / custoTotal) * 100;
  
  return { mercado, taxas: taxasITBI + leiloeiro, carregamento, custoTotal, margem, roi, verdict: verdictFor(margem) };
}

export function verdictFor(margem: number): Verdict {
  // Regras de Decisão extraídas do projeto (Motor de Regras)
  if (margem >= 35) return "excelente";  // Etiqueta Verde
  if (margem >= 15) return "moderado";   // Etiqueta Amarela (15% a 34.9%)
  return "inviavel";                     // Etiqueta Vermelha (< 15%)
}

export function defaultScenario(preco: number, status: string): SimInput {
  return {
    preco,
    // Se ocupado, bloqueia em 12 meses. Se desocupado, 3 meses para tramitação.
    meses: isOccupied(status) ? 12 : 3,
    reforma: isOccupied(status) ? smartReform(preco) : 0,
    honorarios: isOccupied(status) ? 5000 : 0,
  };
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  excelente: "Excelente Negócio",
  moderado: "Risco Moderado",
  inviavel: "Inviável / Perigoso",
};

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const pct = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;