import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface Imovel {
  id_imovel: string;
  numero_edital: string;
  endereco_completo: string;
  preco_minimo: number;
  status_ocupacao: string;
  cidade: string | null;
  uf: string | null;
  data_atualizacao: string | null;
  // Novas colunas ricas adicionadas
  valor_avaliacao?: number;
  desconto?: number;
  descricao?: string;
  modalidade?: string;
  financiamento?: string;
  cluster_risco?: string;
}

export interface SimulacaoRow {
  id_simulacao: number;
  id_imovel: string;
  tempo_desocupacao: number;
  custo_reforma: number;
  custo_advogado: number;
  roi_projetado: number;
  data_criacao: string;
  // Atualizado para receber as novas colunas
  imovel_caixa: Pick<Imovel, "endereco_completo" | "cidade" | "uf" | "preco_minimo" | "numero_edital" | "status_ocupacao" | "valor_avaliacao" | "modalidade" | "financiamento" | "cluster_risco"> | null;
}

const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const key = (import.meta.env['VITE_SUPABASE_ANON_KEY'] ?? import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']) as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
export const isDemo = !supabase;

const DEMO: Imovel[] = [
  ["1444400001", "Rua das Acácias, 120, Apto 302 - Pituba", 185000, "Desocupado", "Salvador", "BA"],
  ["1444400002", "Av. Sete de Setembro, 980 - Centro", 142000, "Ocupado", "Salvador", "BA"],
].map(([id, end, preco, st, cid, uf]) => ({
  id_imovel: id as string,
  numero_edital: "0012/2026",
  endereco_completo: end as string,
  preco_minimo: preco as number,
  status_ocupacao: st as string,
  cidade: cid as string,
  uf: uf as string,
  data_atualizacao: new Date().toISOString(),
}));

const DEMO_SIMS_KEY = "leilaoseguro_demo_sims";

export async function listImoveis(): Promise<Imovel[]> {
  if (!supabase) return DEMO;
  // Aumentado o limite para 1000 para abranger todos os imóveis extraídos
  const { data, error } = await supabase.from("imovel_caixa").select("*").order("preco_minimo").limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ ...d, preco_minimo: Number(d.preco_minimo) }));
}

export async function getImovel(id: string): Promise<Imovel | undefined> {
  if (!supabase) {
    return DEMO.find((d) => d.id_imovel === id);
  }

  const { data, error } = await supabase
    .from("imovel_caixa")
    .select("*") // O asterisco garante que ele puxa a avaliação e o cluster!
    .eq("id_imovel", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Imovel;
}

export async function saveSimulacao(s: Omit<SimulacaoRow, "id_simulacao" | "data_criacao" | "imovel_caixa">) {
  if (!supabase) return; // fallback omitido para brevidade
  
  // Pega o utilizador atualmente logado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Precisa estar logado para salvar.");

  const { error } = await supabase.from("simulacao").insert({
    ...s,
    id_usuario: user.id // <-- Injeta o UUID do utilizador aqui!
  });
  
  if (error) throw new Error(error.message);
}

export async function listSimulacoes(): Promise<SimulacaoRow[]> {
  if (!supabase) return JSON.parse(localStorage.getItem(DEMO_SIMS_KEY) ?? "[]");
  const { data, error } = await supabase
    .from("simulacao")
    // Puxando as novas colunas do banco
    .select("*, imovel_caixa(endereco_completo, cidade, uf, preco_minimo, numero_edital, status_ocupacao, valor_avaliacao, modalidade, financiamento, cluster_risco)")
    .order("data_criacao", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SimulacaoRow[];
}