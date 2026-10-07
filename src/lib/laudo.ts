import { jsPDF } from "jspdf";
import { brl, pct, simulate, VERDICT_LABEL } from "./calc";
import type { SimulacaoRow } from "./data";

export function exportLaudo(s: SimulacaoRow) {
  const preco = Number(s.imovel_caixa?.preco_minimo ?? 0);
  const r = simulate({
    preco,
    meses: s.tempo_desocupacao,
    reforma: Number(s.custo_reforma),
    honorarios: Number(s.custo_advogado),
  });
  const doc = new jsPDF();
  doc.setFillColor(20, 40, 80);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("LeilãoSeguro — Laudo de Viabilidade", 14, 19);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  const lines = [
    `Data da simulação: ${new Date(s.data_criacao).toLocaleDateString("pt-BR")}`,
    `Imóvel: ${s.id_imovel}  •  Edital: ${s.imovel_caixa?.numero_edital ?? "-"}`,
    `Endereço: ${s.imovel_caixa?.endereco_completo ?? "-"}`,
    `Cidade: ${s.imovel_caixa?.cidade ?? "-"} / ${s.imovel_caixa?.uf ?? "-"}`,
    "",
    `Lance inicial: ${brl(preco)}`,
    `Tempo para desocupação: ${s.tempo_desocupacao} meses`,
    `Condomínio/IPTU acumulado: ${brl(r.carregamento)}`,
    `Reforma: ${brl(Number(s.custo_reforma))}`,
    `Honorários advocatícios: ${brl(Number(s.custo_advogado))}`,
    `ITBI e registro: ${brl(r.taxas)}`,
    "",
    `Custo total projetado: ${brl(r.custoTotal)}`,
    `Preço de mercado estimado: ${brl(r.mercado)}`,
    `Margem de segurança: ${pct(r.margem)}`,
    `ROI projetado: ${pct(Number(s.roi_projetado))}`,
    "",
    `Veredicto do sistema: ${VERDICT_LABEL[r.verdict].toUpperCase()}`,
  ];
  lines.forEach((l, i) => doc.text(doc.splitTextToSize(l, 180), 14, 44 + i * 8));
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text("Estimativa de apoio à decisão. Não substitui análise jurídica do edital.", 14, 285);
  doc.save(`laudo-${s.id_imovel}.pdf`);
}
