# LeilãoSeguro - Sistema de Apoio à Decisão (SAD)

Este repositório contém o código-fonte e a documentação do **LeilãoSeguro**, um Sistema de Apoio à Decisão desenvolvido como requisito acadêmico. O sistema visa mitigar a assimetria de informação no mercado de leilões de imóveis da Caixa Econômica Federal através de técnicas de mineração de dados e inteligência artificial.

## 🔗 Link Oficial e Credenciais para teste

* **Aplicação em Produção (Live):** <https://vcmeneze-auction-profit-peek.vcm7000.workers.dev/>

* **Usuário:**  usuario@teste.com
* **Senha:** teste@123

## 🎯 Objetivo e Metodologia

O LeilãoSeguro auxilia investidores na avaliação de riscos e projeção de custos ocultos (como tempo de desocupação e taxas acumuladas). Para atender aos requisitos da disciplina, o sistema implementa quatro funções analíticas fundamentais:

1. **Sumarização (Pandas):** Geração de estatísticas descritivas do mercado para visão macro durante a higienização dos dados brutos.

2. **Agrupamento / Clustering (K-Means):** Utilização do algoritmo *K-Means* (Scikit-Learn) para cruzar o Lance Inicial e o Valor de Avaliação, segmentando matematicamente os imóveis em três perfis de risco: Popular, Médio e Alto Padrão.

3. **Regressão Linear (Projeção de Custos):** Aplicação de um modelo determinístico ($y = \beta_1 x$) para projetar a corrosão da margem de lucro ao longo dos meses de desocupação judicial. O coeficiente ($\beta_1$) é dinâmico: identifica via texto se o imóvel é um apartamento (~0,5% a.m. para condomínio e IPTU) ou casa (~0,15% a.m. apenas para IPTU).

4. **Classificação (Regras de Negócio):** Avaliação da Margem de Segurança final do ativo, classificando a oportunidade como "Excelente Negócio" ($\ge$ 35%), "Risco Moderado" (15% a 34%) ou "Inviável / Perigoso" ($<$ 15%).

## 🚀 Instruções de Execução (Manual de Uso do Sistema)

Este guia descreve o fluxo passo a passo para que o investidor ou gestor utilize o LeilãoSeguro para tomar decisões fundamentadas.

**Passo 1: Acesso ao Radar (Visão Geral e Agrupamento)**
1. Acesse o sistema através do link oficial na nuvem.
2. A tela inicial (Radar) exibe a base de imóveis higienizada. Note que o sistema já aplicou o **K-Means**, rotulando cada imóvel visualmente de acordo com seu cluster de competitividade (Popular, Médio Padrão ou Alto Padrão).
3. Utilize os filtros no topo da tela para refinar a busca por cidade, status de ocupação ou faixa de preço.

**Passo 2: Simulação de Cenários (Regressão e What-If Analysis)**
1. Escolha um imóvel de interesse no Radar e clique no botão de simulação.
2. Na tela de detalhes, interaja com os controles deslizantes (*sliders*) no painel esquerdo ("E se...?"):
   * **Tempo de Desocupação:** Arraste entre 3 e 24 meses. Observe que o valor de "Custos mensais (IPTU/Condomínio)" é atualizado em tempo real. O sistema aplica a regressão linear automaticamente, cobrando condomínio apenas se identificar que é um apartamento.
   * **Custo de Reforma:** Ajuste o valor manualmente ou clique em "Usar sugestão" para aplicar a heurística *Smart Default* (reserva preventiva de 10% do valor do lance).

**Passo 3: Interpretação do Veredito (Classificação)**
1. Conforme você move os *sliders*, observe o painel direito ("Custo vs. Mercado").
2. O gráfico de barras atualizará instantaneamente a relação entre o seu custo total e o teto de mercado.
3. Analise o quadro inferior: o motor de regras de negócio avaliará a sua **Margem de Segurança** final e emitirá o **Veredito do Sistema** ("Excelente Negócio", "Risco Moderado" ou "Inviável").

**Passo 4: Consolidação da Decisão**
1. Se o cenário simulado for satisfatório, clique no botão **"Salvar Simulação"**.
2. Navegue até a aba **Relatórios** (no menu principal) para visualizar uma tabela consolidada de todos os imóveis que você simulou.
3. Compare as margens de segurança lado a lado para definir qual será o alvo do seu investimento no leilão.

## 🏗️ Arquitetura do Sistema

O projeto adota uma arquitetura moderna e dividida em:

* **Pipeline de Dados (Backend/ETL):** Script Python 3 (`coletor_caixa.py`) que extrai, limpa, aplica a IA de agrupamento e popula o banco de dados.
* **Motor Analítico e Interface (Frontend):** Construído com React, TypeScript e Vite, utilizando Tailwind CSS para estilização e Recharts para visualização de dados.
* **Banco de Dados e Autenticação:** Supabase (PostgreSQL + RLS).
* **Hospedagem (Deploy):** Serveless via Cloudflare Workers / Pages (Motor Nitro).

## 🗺️ Trabalhos Futuros (Roadmap)

Como próximos passos para a evolução deste MVP, prevemos:

* **Automação de ETL via Cron Jobs:** Migrar a execução do `coletor_caixa.py` para um ambiente de integração contínua (ex: GitHub Actions), automatizando a captação de novos editais.
* **Multilocação (Multi-Tenant) Rigorosa:** Aperfeiçoar as políticas de *Row Level Security* (RLS) no Supabase para garantir isolamento total de simulações entre diferentes usuários (funcionalidade base para um futuro modelo de monetização SaaS).
* **Implementação de Método SAW (MCDM):** Integração do método *Simple Additive Weighting* para gerar um ranking global das melhores oportunidades do mês, ponderando margem de lucro, liquidez e risco de ocupação.