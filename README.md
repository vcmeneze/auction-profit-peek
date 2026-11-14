# LeilãoSeguro - Sistema de Apoio à Decisão (SAD)

Este repositório contém o código-fonte e a documentação do **LeilãoSeguro**, um Sistema de Apoio à Decisão desenvolvido como requisito acadêmico. O sistema visa mitigar a assimetria de informação no mercado de leilões de imóveis da Caixa Econômica Federal através de técnicas de mineração de dados e inteligência artificial.

## 🔗 Link Oficial

* **Aplicação em Produção (Live):** <https://vcmeneze-auction-profit-peek.vcm7000.workers.dev/>

## 🎯 Objetivo e Metodologia

O LeilãoSeguro auxilia investidores na avaliação de riscos e projeção de custos ocultos (como tempo de desocupação e taxas acumuladas). Para atender aos requisitos da disciplina, o sistema implementa quatro funções analíticas fundamentais:

1. **Sumarização (Pandas):** Geração de estatísticas descritivas do mercado para visão macro durante a higienização dos dados brutos.

2. **Agrupamento / Clustering (K-Means):** Utilização do algoritmo *K-Means* (Scikit-Learn) para cruzar o Lance Inicial e o Valor de Avaliação, segmentando matematicamente os imóveis em três perfis de risco: Popular, Médio e Alto Padrão.

3. **Regressão Linear (Projeção de Custos):** Aplicação de um modelo determinístico ($y = \beta_1 x$) para projetar a corrosão da margem de lucro ao longo dos meses de desocupação judicial. O coeficiente ($\beta_1$) é dinâmico: identifica via texto se o imóvel é um apartamento (\~0,5% a.m. para condomínio e IPTU) ou casa (\~0,15% a.m. apenas para IPTU).

4. **Classificação (Regras de Negócio):** Avaliação da Margem de Segurança final do ativo, classificando a oportunidade como "Excelente Negócio" (>35%), "Risco Moderado" (15% a 34%) ou "Inviável" (<15%).

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