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
export function simulate(input: {
  preco: number;
  valorAvaliacao?: number;
  descricao?: string; // <-- Novo parâmetro opcional
  meses: number;
  reforma: number;
  honorarios: number;
}) {
  const avaliacao = input.valorAvaliacao && input.valorAvaliacao > 0 ? input.valorAvaliacao : input.preco / 0.65;
  
  // Verifica pela descrição da Caixa se é Casa ou Terreno
  const desc = (input.descricao || "").toLowerCase();
  const isSemCondominio = desc.startsWith("casa") || desc.startsWith("terreno") || desc.startsWith("gleba");

  // Coeficiente Beta1 dinâmico: 0.15% para casas/terrenos (só IPTU/manutenção) vs 0.5% para apartamentos
  const taxaMensal = isSemCondominio ? 0.0015 : 0.005;
  
  // Define um piso mínimo de R$ 120/mês e calcula o carregamento proporcional
  const custoMensalEstimado = Math.max(120, Math.round(avaliacao * taxaMensal));
  const carregamento = input.meses * custoMensalEstimado;

  const custoTotal = input.preco * (1 + AUCTIONEER_FEE_RATE + TAXES_RATE)
    + input.reforma
    + input.honorarios
    + carregamento;
  const lucro = avaliacao - custoTotal;
  const margem = avaliacao > 0 ? (lucro / avaliacao) * 100 : 0;

  return {
    avaliacao,
    custoMensalEstimado,
    carregamento,
    custoTotal,
    lucro,
    margem,
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

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const pct = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;