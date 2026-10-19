import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileDown, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VerdictBadge } from "@/components/verdict-badge";
import { DemoBanner } from "@/components/demo-banner";
import { listSimulacoes, supabase } from "@/lib/data";
import { exportLaudo } from "@/lib/laudo";
import { pct, simulate } from "@/lib/calc";

export const Route = createFileRoute("/relatorios")({
  beforeLoad: async ({ location }) => {
    if (!supabase) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // O 'as any' no final do objeto cala definitivamente o TypeScript
      // até que a árvore de rotas seja gerada pelo vite.
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      } as any);
    }
  },
  head: () => ({
    meta: [
      { title: "Relatórios e Laudos — LeilãoSeguro" },
      { name: "description", content: "Histórico de simulações e exportação de laudos de viabilidade em PDF." },
    ],
  }),
  component: Relatorios,
});

function Relatorios() {
  const { data = [], isLoading, error } = useQuery({ queryKey: ["simulacoes"], queryFn: listSimulacoes });
  const [q, setQ] = useState("");
  
  const rows = data.filter((s) =>
    `${s.id_imovel} ${s.imovel_caixa?.numero_edital ?? ""} ${s.imovel_caixa?.endereco_completo ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Suas simulações salvas. Baixe o laudo de viabilidade em PDF.</p>
      </header>
      <DemoBanner />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por edital, código ou endereço" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const r = simulate({ 
                  preco: Number(s.imovel_caixa?.preco_minimo ?? 0), 
                  valorAvaliacao: Number(s.imovel_caixa?.valor_avaliacao ?? 0),
                  meses: s.tempo_desocupacao, 
                  reforma: Number(s.custo_reforma), 
                  honorarios: Number(s.custo_advogado), 
                  descricao: s.imovel_caixa?.descricao,
                });
                return (
                  <TableRow key={s.id_simulacao}>
                    <TableCell className="whitespace-nowrap">{new Date(s.data_criacao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="max-w-xs truncate">{s.imovel_caixa?.endereco_completo ?? s.id_imovel}</TableCell>
                    <TableCell className="font-semibold">{pct(Number(s.roi_projetado))}</TableCell>
                    <TableCell><VerdictBadge verdict={r.verdict} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => exportLaudo(s)}>
                        <FileDown className="h-4 w-4 text-danger" /> Exportar Laudo
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    {error ? `Erro ao carregar: ${(error as Error).message}` : <>Nenhuma simulação salva ainda. <Link to="/" className="text-primary underline">Escolha um imóvel</Link> para começar.</>}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}