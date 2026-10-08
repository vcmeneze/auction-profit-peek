import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { listImoveis } from "@/lib/data";
import { brl, defaultScenario, simulate } from "@/lib/calc";
import houseImg from "@/assets/house.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Radar de Oportunidades — LeilãoSeguro" },
      { name: "description", content: "Encontre imóveis de leilão da Caixa com classificação de risco automática." },
    ],
  }),
  component: Dashboard,
});

const ALL = "__all";

function Dashboard() {
  const navigate = useNavigate();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["imoveis"], queryFn: listImoveis });
  const [uf, setUf] = useState(ALL);
  const [cidade, setCidade] = useState(ALL);
  const [bairro, setBairro] = useState("");
  const [maxPreco, setMaxPreco] = useState("");

  const ufs = useMemo(() => [...new Set(data.map((d) => d.uf).filter(Boolean))].sort() as string[], [data]);
  const cidades = useMemo(
    () => [...new Set(data.filter((d) => uf === ALL || d.uf === uf).map((d) => d.cidade).filter(Boolean))].sort() as string[],
    [data, uf],
  );

  const filtered = data.filter(
    (d) =>
      (uf === ALL || d.uf === uf) &&
      (cidade === ALL || d.cidade === cidade) &&
      (!bairro || d.endereco_completo.toLowerCase().includes(bairro.toLowerCase())) &&
      (!maxPreco || d.preco_minimo <= Number(maxPreco)),
  );

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Radar de Oportunidades</h1>
        <p className="text-muted-foreground">Imóveis em leilão da Caixa, já classificados pelo nível de risco.</p>
      </header>
      <DemoBanner />

      <Card className="mb-6">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <div className="space-y-1.5">
            <Label>Estado (UF)</Label>
            <Select value={uf} onValueChange={(v) => { setUf(v); setCidade(ALL); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os estados</SelectItem>
                {ufs.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" placeholder="Ex.: Pituba" value={bairro} onChange={(e) => setBairro(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preco">Preço máximo (R$)</Label>
            <Input id="preco" type="number" inputMode="numeric" placeholder="Ex.: 250000" value={maxPreco} onChange={(e) => setMaxPreco(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => { setUf(ALL); setCidade(ALL); setBairro(""); setMaxPreco(""); }}>
            Limpar filtros
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-destructive">Não foi possível carregar os imóveis: {(error as Error).message}</p>}

      <p className="mb-4 text-sm text-muted-foreground">{filtered.length} imóveis encontrados</p>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        {filtered.map((im) => {
          // CORREÇÃO: Passando o 'preco' para o simulate junto com o cenário padrão
          const cenario = defaultScenario(im.preco_minimo, im.status_ocupacao);
          const r = simulate({ 
            preco: im.preco_minimo, 
            meses: cenario.meses, 
            reforma: cenario.reforma, 
            honorarios: cenario.honorarios 
          });
          
          return (
            <button
              key={im.id_imovel}
              onClick={() => navigate({ to: "/simulacao/$id", params: { id: im.id_imovel } })}
              className="group overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="relative h-44 overflow-hidden">
                <img src={houseImg} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                <VerdictBadge verdict={r.verdict} className="absolute left-3 top-3" />
              </div>
              <div className="space-y-2 p-4">
                <p className="line-clamp-2 font-medium">{im.endereco_completo}</p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {im.cidade} {im.uf && `- ${im.uf}`}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> {im.status_ocupacao}
                </p>
                <div className="flex items-end justify-between border-t pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Lance inicial</p>
                    <p className="font-display text-xl font-bold text-primary">{brl(im.preco_minimo)}</p>
                  </div>
                  <span className="text-sm font-medium text-gold">Simular →</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <SearchX className="mb-2 h-10 w-10" /> Nenhum imóvel com esses filtros.
        </div>
      )}
    </div>
  );
}