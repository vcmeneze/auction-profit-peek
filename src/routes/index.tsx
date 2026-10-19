import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MapPin, Building2, SearchX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VerdictBadge } from "@/components/verdict-badge";
import { DemoBanner } from "@/components/demo-banner";
import { listImoveis, supabase } from "@/lib/data";
import { brl, defaultScenario, simulate } from "@/lib/calc";
import houseImg from "@/assets/house.jpg";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ location }) => {
    if (!supabase) return;
    
    // Verifica a sessão antes mesmo de carregar a tela do Radar
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          // O pathname pega apenas o "/relatorios" ou "/" e evita recarregamentos
          redirect: location.pathname, 
        },
      } as any);
    }
  },
  component: Dashboard,
});

const ALL = "__all";

function Dashboard() {
  const navigate = useNavigate();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["imoveis"], queryFn: listImoveis });
  const [uf, setUf] = useState(ALL);
  const [cidade, setCidade] = useState(ALL);
  const [veredictoFiltro, setVeredictoFiltro] = useState(ALL);
  const [ordenacao, setOrdenacao] = useState("roi_desc");
  const [maxPreco, setMaxPreco] = useState("");

  const ufs = useMemo(() => [...new Set(data.map((d) => d.uf).filter(Boolean))].sort() as string[], [data]);
  const cidades = useMemo(() => [...new Set(data.filter((d) => uf === ALL || d.uf === uf).map((d) => d.cidade).filter(Boolean))].sort() as string[], [data, uf]);

  const imoveisProcessados = useMemo(() => {
    return data.map(im => {
      const p = im.preco_minimo ?? 0;
      const cenario = defaultScenario(p, im.status_ocupacao);
      const r = simulate({ preco: p, valorAvaliacao: im.valor_avaliacao, descricao: im.descricao, meses: cenario.meses, reforma: cenario.reforma, honorarios: cenario.honorarios });

      return { ...im, preco_minimo: p, simulacao: r };
    });
  }, [data]);

  const filteredAndSorted = useMemo(() => {
    let result = imoveisProcessados.filter((d) =>
      (uf === ALL || d.uf === uf) &&
      (cidade === ALL || d.cidade === cidade) &&
      (veredictoFiltro === ALL || d.simulacao.verdict === veredictoFiltro) &&
      (!maxPreco || d.preco_minimo <= Number(maxPreco))
    );

    result.sort((a, b) => {
      if (ordenacao === "roi_desc") return b.simulacao.roi - a.simulacao.roi;
      if (ordenacao === "preco_asc") return a.preco_minimo - b.preco_minimo;
      return 0;
    });

    return result;
  }, [imoveisProcessados, uf, cidade, veredictoFiltro, ordenacao, maxPreco]);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Radar de Oportunidades</h1>
          <p className="text-muted-foreground">Imóveis filtrados com proteção de Smart Defaults (Risco Prudencial Ativado).</p>
        </div>
        {/* Botão de Logout opcional no canto direito */}
        <Button variant="outline" onClick={async () => {
          await supabase?.auth.signOut();
          window.location.reload();
        }}>
          Sair do Sistema
        </Button>
      </header>
      <DemoBanner />

      <Card className="mb-6">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <div className="space-y-1.5">
            <Label>Cidade</Label>
            <Select value={cidade} onValueChange={setCidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as cidades</SelectItem>
                {cidades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Risco (Veredicto)</Label>
            <Select value={veredictoFiltro} onValueChange={setVeredictoFiltro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os Riscos</SelectItem>
                <SelectItem value="excelente">Excelente Negócio</SelectItem>
                <SelectItem value="moderado">Risco Moderado</SelectItem>
                <SelectItem value="inviavel">Inviável / Perigoso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Preço máximo (R$)</Label>
            <Input type="number" placeholder="Ex.: 250000" value={maxPreco} onChange={(e) => setMaxPreco(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ordenar por</Label>
            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="roi_desc">Maior Rentabilidade (ROI)</SelectItem>
                <SelectItem value="preco_asc">Menor Lance Inicial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => { setCidade(ALL); setVeredictoFiltro(ALL); setMaxPreco(""); setOrdenacao("roi_desc"); }}>
            Limpar filtros
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-destructive">Erro: {(error as Error).message}</p>}
      <p className="mb-4 text-sm text-muted-foreground">{filteredAndSorted.length} imóveis processados pelo algoritmo.</p>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        
        {filteredAndSorted.map((im) => {
          const clusterLabel = im.cluster_risco?.split("/")[0]?.trim();

          return (
            <button
              key={im.id_imovel}
              onClick={() => navigate({ to: "/simulacao/$id", params: { id: im.id_imovel } })}
              className="group overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring flex flex-col"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100 flex-shrink-0">
                <img src={houseImg} alt="" className="h-full w-full object-cover opacity-80 mix-blend-multiply transition group-hover:scale-105" />
                <VerdictBadge verdict={im.simulacao.verdict} className="absolute left-3 top-3 shadow-md" />
                {clusterLabel && (
                  <span className="absolute bottom-3 left-3 bg-indigo-900 text-indigo-50 text-[10px] font-bold px-2 py-1 rounded shadow">
                    IA: {clusterLabel}
                  </span>
                )}
              </div>
              
              <div className="space-y-3 p-5 flex flex-col flex-1">
                <p className="line-clamp-2 font-semibold text-gray-800 leading-snug">{im.endereco_completo}</p>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary/70" /> {im.cidade} - {im.uf}</p>
                  <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary/70" /> Assumido Ocupado (Risco)</p>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="inline-flex items-center rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border">
                    {im.modalidade || "N/A"}
                  </span>
                  {im.financiamento === 'Sim' && (
                    <span className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                      Aceita Financiamento
                    </span>
                  )}
                </div>
                
                <div className="flex-1"></div>
                
                <div className="flex items-end justify-between border-t pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Lance Mínimo</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-display text-xl font-bold text-primary">{brl(im.preco_minimo)}</p>
                      {im.desconto && <span className="text-xs text-emerald-600 font-bold">-{im.desconto}%</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">ROI Proj.</p>
                    <span className="text-lg font-bold text-emerald-600">{im.simulacao.roi.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}