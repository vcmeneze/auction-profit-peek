import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/simulacao/")({
  head: () => ({
    meta: [
      { title: "Simulação — LeilãoSeguro" },
      { name: "description", content: "Simule cenários de custo e retorno para imóveis de leilão." },
      { property: "og:title", content: "Simulação — LeilãoSeguro" },
      { property: "og:description", content: "Simule cenários de custo e retorno para imóveis de leilão." },
    ],
  }),
  component: () => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Calculator className="mb-4 h-12 w-12 text-gold" />
      <h1 className="font-display text-2xl font-bold">Escolha um imóvel para simular</h1>
      <p className="mt-2 max-w-md text-muted-foreground">Vá ao Radar de Oportunidades e clique em qualquer imóvel para abrir a simulação.</p>
      <Button asChild className="mt-6"><Link to="/">Ver imóveis</Link></Button>
    </div>
  ),
});
