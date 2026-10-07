import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Lightbulb, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { verdictClasses } from "@/components/verdict-badge";
import { getImovel, saveSimulacao } from "@/lib/data";
import { brl, defaultScenario, pct, simulate, smartReform, VERDICT_LABEL } from "@/lib/calc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulacao/$id")({
  head: () => ({
    meta: [
      { title: "Simulação do imóvel — LeilãoSeguro" },
      { name: "description", content: "Teste cenários de desocupação, reforma e honorários e veja o ROI." },
      { property: "og:title", content: "Simulação do imóvel — LeilãoSeguro" },
      { property: "og:description", content: "Teste cenários de desocupação, reforma e honorários e veja o ROI." },
    ],
  }),
  component: Simulacao,
});

function MoneyField({ label, value, onChange, max, step, hint }: { label: string; value: number; onChange: (n: number) => void; max: number; step: number; hint?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <div className="relative w-36">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
          <Input type="number" min={0} className="pl-9 text-right" value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />
        </div>
      </div>
      <Slider value={[Math.min(value, max)]} max={max} step={step} onValueChange={([v]) => onChange(v)} aria-label={label} />
      {hint}
    </div>
  );
}

function Simulacao() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: im, isLoading } = useQuery({ queryKey: ["imovel", id], queryFn: () => getImovel(id) });
  const [meses, setMeses] = useState(6);
  const [reforma, setReforma] = useState(0);
  const [honorarios, setHonorarios] = useState(0);

  useEffect(() => {
    if (!im) return;
    const d = defaultScenario(im.preco_minimo, im.status_ocupacao);
    setMeses(d.meses); setReforma(d.reforma); setHonorarios(d.honorarios);
  }, [im]);

  const save = useMutation({
    mutationFn: (roi: number) =>
      saveSimulacao({ id_imovel: id, tempo_desocupacao: meses, custo_reforma: reforma, custo_advogado: honorarios, roi_projetado: Number(roi.toFixed(2)) }),
    onSuccess: () => { toast.success("Simulação salva nos Relatórios"); qc.invalidateQueries({ queryKey: ["simulacoes"] }); },
    onError: (e) => toast.error(`Não foi possível salvar: ${(e as Error).message}`),
  });

  if (isLoading) return <Skeleton className="h-[600px] rounded-xl" />;
  if (!im) return <p>Imóvel não encontrado. <Link to="/" className="underline">Voltar</Link></p>;

  const r = simulate({ preco: im.preco_minimo, meses, reforma, honorarios });
  const economia = r.mercado - r.custoTotal;
  const chart = [
    { name: "Custo Total Projetado", valor: Math.round(r.custoTotal) },
    { name: "Preço de Mercado", valor: r.mercado },
  ];

  return (
    <div>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao Radar
      </Link>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Simulação de Cenários</h1>
        <p className="text-muted-foreground">{im.endereco_completo} — {im.cidade}/{im.uf} • Lance inicial <strong className="text-foreground">{brl(im.preco_minimo)}</strong></p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>E se...?</CardTitle><p className="text-sm text-muted-foreground">Mova os controles para ver como cada custo afeta o seu lucro.</p></CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between"><Label>Tempo para Desocupação</Label><span className="font-semibold">{meses} meses</span></div>
              <Slider value={[meses]} min={3} max={24} step={1} onValueChange={([v]) => setMeses(v)} aria-label="Tempo para desocupação" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>3 meses</span><span>24 meses</span></div>
              <p className="text-xs text-muted-foreground">Condomínio e IPTU acumulados nesse período: <strong>{brl(r.carregamento)}</strong></p>
            </div>
            <MoneyField
              label="Custo de Reforma"
              value={reforma}
              onChange={setReforma}
              max={Math.max(im.preco_minimo * 0.5, reforma)}
              step={500}
              hint={
                <div className="flex gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  <Lightbulb className="h-4 w-4 shrink-0 text-gold" />
                  <span>
                    <strong>Smart Default:</strong> sugerimos {brl(smartReform(im.preco_minimo))} (10% do lance) como reforma preventiva — imóveis de leilão costumam precisar de pintura, elétrica e hidráulica.{" "}
                    <button className="font-medium text-primary underline" onClick={() => setReforma(smartReform(im.preco_minimo))}>Usar sugestão</button>
                  </span>
                </div>
              }
            />
            <MoneyField label="Honorários do Advogado" value={honorarios} onChange={setHonorarios} max={Math.max(30000, honorarios)} step={500} />
            <Button className="w-full" size="lg" onClick={() => save.mutate(r.roi)} disabled={save.isPending}>
              <Save className="h-4 w-4" /> {save.isPending ? "Salvando..." : "Salvar simulação"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Custo vs. Mercado</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <Tooltip formatter={(v: number) => brl(v)} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]} isAnimationActive>
                    <Cell fill={r.custoTotal > r.mercado ? "var(--danger)" : "var(--primary)"} />
                    <Cell fill="var(--gold)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Margem de Segurança</p><p className="font-display text-4xl font-bold">{pct(r.margem)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">ROI Projetado</p><p className="font-display text-4xl font-bold">{pct(r.roi)}</p></CardContent></Card>
          </div>
          <div className={cn("rounded-xl p-5 shadow-sm", verdictClasses[r.verdict])}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Veredicto do Sistema</p>
            <p className="font-display text-2xl font-bold">{VERDICT_LABEL[r.verdict]}</p>
            <p className="mt-1 text-sm">
              {economia > 0
                ? `Mesmo com ${meses} meses de desocupação, você ainda economiza ${brl(economia)} em relação ao preço de mercado.`
                : "Atenção: os custos ocultos anularam o desconto do leilão."}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Preço de mercado estimado em {brl(r.mercado)}. Inclui ITBI e registro ({brl(r.taxas)}).</p>
        </div>
      </div>
    </div>
  );
}
