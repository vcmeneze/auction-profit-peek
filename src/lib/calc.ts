export const AUCTIONEER_FEE_RATE = 0.05; // 5% do leiloeiro
export const TAXES_RATE = 0.04; // 4% de ITBI/Registro
export const MONTHLY_CARRY_COST = 800; // Mantido por retrocompatibilidade

export type Verdict = "excelente" | "moderado" | "inviavel";

export interface SimInput {
  preco: number;
  valorAvaliacao?: number | null | undefined;
  descricao?: string | null | undefined;
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

export function simulate(input: SimInput) {
  const mercado = input.valorAvaliacao && input.valorAvaliacao > 0 
    ? input.valorAvaliacao 
    : Math.round(input.preco / 0.65);
  
  // Lógica invertida: busca ativa por indicadores de Apartamento / Condomínio
  const desc = (input.descricao ?? "").toLowerCase();
  const temCondominio = 
    desc.includes("apto") || 
    desc.includes("apartamento") || 
    desc.includes("cond.") || 
    desc.includes("condomínio") || 
    desc.includes("condominio") ||
    desc.includes("bloco");

  // Coeficiente Beta1 dinâmico: 0.5% se tiver condomínio (Apto) vs 0.15% padrão (Casas/Terrenos/Comercial)
  const taxaMensal = temCondominio ? 0.005 : 0.0015;
  
  // Define um piso mínimo de R$ 120/mês e calcula o carregamento proporcional
  const custoMensalEstimado = Math.max(120, Math.round(mercado * taxaMensal));
  const carregamento = input.meses * custoMensalEstimado;

  const comissao = input.preco * AUCTIONEER_FEE_RATE;
  const impostos = input.preco * TAXES_RATE;
  const taxas = Math.round(comissao + impostos);

  const custoTotal = input.preco + taxas + input.reforma + input.honorarios + carregamento;
  const lucro = mercado - custoTotal;
  const margem = mercado > 0 ? (lucro / mercado) * 100 : 0;
  const roi = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

  return {
    avaliacao: mercado,
    mercado,
    comissao,
    impostos,
    taxas,
    temCondominio, // <-- Exportamos a flag para deixar a interface ainda mais inteligente
    custoMensalEstimado,
    carregamento,
    custoTotal,
    lucro,
    margem,
    roi,
    verdict: verdictFor(margem),
  };
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

export const brl = (n: number) => (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const pct = (n: number) => `${(n ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;