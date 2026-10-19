export const AUCTIONEER_FEE_RATE = 0.05; // 5% do leiloeiro
export const TAXES_RATE = 0.04; // 4% de ITBI/Registro
export const MONTHLY_CARRY_COST = 800; // Mantido por retrocompatibilidade caso algum ficheiro importe

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
  const avaliacao = input.valorAvaliacao && input.valorAvaliacao > 0 
    ? input.valorAvaliacao 
    : input.preco / 0.65;
  
  // Verifica pela descrição da Caixa se é Casa ou Terreno
  const desc = (input.descricao ?? "").toLowerCase();
  const isSemCondominio = desc.includes("casa") || desc.includes("terreno") || desc.includes("gleba");

  // Coeficiente Beta1 dinâmico: 0.15% para casas/terrenos (só IPTU/manutenção) vs 0.5% para apartamentos
  const taxaMensal = isSemCondominio ? 0.0015 : 0.005;
  
  // Define um piso mínimo de R$ 120/mês e calcula o carregamento proporcional
  const custoMensalEstimado = Math.max(120, Math.round(avaliacao * taxaMensal));
  const carregamento = input.meses * custoMensalEstimado;

  const comissao = input.preco * AUCTIONEER_FEE_RATE;
  const impostos = input.preco * TAXES_RATE;

  const custoTotal = input.preco + comissao + impostos + input.reforma + input.honorarios + carregamento;
  const lucro = avaliacao - custoTotal;
  const margem = avaliacao > 0 ? (lucro / avaliacao) * 100 : 0;
  const roi = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0; // <-- A propriedade que faltava e quebrava o Radar!

  return {
    avaliacao,
    comissao,
    impostos,
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