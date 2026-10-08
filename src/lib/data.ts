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
}

export interface SimulacaoRow {
  id_simulacao: number;
  id_imovel: string;
  tempo_desocupacao: number;
  custo_reforma: number;
  custo_advogado: number;
  roi_projetado: number;
  data_criacao: string;
  imovel_caixa: Pick<Imovel, "endereco_completo" | "cidade" | "uf" | "preco_minimo" | "numero_edital" | "status_ocupacao"> | null;
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

export async function getImovel(id: string): Promise<Imovel | null> {
  if (!supabase) return DEMO.find((d) => d.id_imovel === id) ?? null;
  const { data, error } = await supabase.from("imovel_caixa").select("*").eq("id_imovel", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { ...data, preco_minimo: Number(data.preco_minimo) } : null;
}

export async function saveSimulacao(s: Omit<SimulacaoRow, "id_simulacao" | "data_criacao" | "imovel_caixa">) {
  if (!supabase) {
    const all = JSON.parse(localStorage.getItem(DEMO_SIMS_KEY) ?? "[]") as SimulacaoRow[];
    const im = DEMO.find((d) => d.id_imovel === s.id_imovel) ?? null;
    all.unshift({ ...s, id_simulacao: Date.now(), data_criacao: new Date().toISOString(), imovel_caixa: im });
    localStorage.setItem(DEMO_SIMS_KEY, JSON.stringify(all));
    return;
  }
  const { error } = await supabase.from("simulacao").insert(s);
  if (error) throw new Error(error.message);
}

export async function listSimulacoes(): Promise<SimulacaoRow[]> {
  if (!supabase) return JSON.parse(localStorage.getItem(DEMO_SIMS_KEY) ?? "[]");
  const { data, error } = await supabase
    .from("simulacao")
    .select("*, imovel_caixa(endereco_completo, cidade, uf, preco_minimo, numero_edital, status_ocupacao)")
    .order("data_criacao", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SimulacaoRow[];
}