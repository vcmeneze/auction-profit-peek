import { jsPDF } from "jspdf";
import { brl, pct, simulate, VERDICT_LABEL } from "./calc";
import type { SimulacaoRow } from "./data";

export function exportLaudo(s: SimulacaoRow) {
  const preco = Number(s.imovel_caixa?.preco_minimo ?? 0);
  const avaliacao = s.imovel_caixa?.valor_avaliacao ? Number(s.imovel_caixa.valor_avaliacao) : undefined;
  
  const r = simulate({
    preco,
    valorAvaliacao: avaliacao,
    meses: s.tempo_desocupacao,
    reforma: Number(s.custo_reforma),
    honorarios: Number(s.custo_advogado),
  });
  
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFillColor(20, 40, 80);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("LeilãoSeguro — Laudo de Viabilidade", 14, 19);
  
  // Corpo do documento
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  
  const lines = [
    `Data da simulação: ${new Date(s.data_criacao).toLocaleDateString("pt-BR")}`,
    `Imóvel ID: ${s.id_imovel}  •  Edital: ${s.imovel_caixa?.numero_edital ?? "-"}`,
    `Endereço: ${s.imovel_caixa?.endereco_completo ?? "-"}`,
    `Cidade: ${s.imovel_caixa?.cidade ?? "-"} / ${s.imovel_caixa?.uf ?? "-"}`,
    "",
    `--- DADOS OFICIAIS DA CAIXA ---`,
    `Modalidade: ${s.imovel_caixa?.modalidade ?? "Não informada"}`,
    `Lance Inicial: ${brl(preco)}`,
    `Avaliação Oficial (Engenharia): ${avaliacao ? brl(avaliacao) : "Não informada"}`,
    `Aceita Financiamento: ${s.imovel_caixa?.financiamento ?? "-"}`,
    s.imovel_caixa?.cluster_risco ? `Perfil IA (Algoritmo K-Means): ${s.imovel_caixa.cluster_risco}` : "",
    "",
    `--- PROJEÇÃO FINANCEIRA DE RISCO ---`,
    `Tempo para desocupação (Simulado): ${s.tempo_desocupacao} meses`,
    `Condomínio/IPTU acumulado no período: ${brl(r.carregamento)}`,
    `Reforma Estrutural (Preventiva): ${brl(Number(s.custo_reforma))}`,
    `Honorários Advocatícios (Evicção): ${brl(Number(s.custo_advogado))}`,
    `Taxas (ITBI, Registro e 5% Leiloeiro): ${brl(r.taxas)}`,
    "",
    `--- VEREDICTO FINAL ---`,
    `Custo Total Projetado (C_total): ${brl(r.custoTotal)}`,
    `Margem de Segurança (M_seg): ${pct(r.margem)}`,
    `ROI Líquido Projetado (ROI_final): ${pct(Number(s.roi_projetado))}`,
    "",
    `Veredicto do Sistema: ${VERDICT_LABEL[r.verdict].toUpperCase()}`,
  ];
  
  let y = 42;
  lines.forEach((l) => {
      if (l !== undefined && l !== null && l !== "") {
          doc.text(doc.splitTextToSize(l, 180), 14, y);
          y += 7.5;
      } else if (l === "") {
          y += 5; // Espaçamento menor para quebras de linha
      }
  });
  
  // Rodapé (Disclaimer Jurídico)
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text("Estimativa de apoio à decisão gerada por Inteligência Artificial (K-Means/Regressão).", 14, 280);
  doc.text("Este documento não substitui a análise jurídica profissional do edital.", 14, 284);
  
  doc.save(`laudo-viabilidade-${s.id_imovel}.pdf`);
}