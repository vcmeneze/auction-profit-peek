# Imóvel Insights

já tenho um banco de dados no supabase feito com supabase 
CREATE TABLE imovel_caixa (

    id_imovel VARCHAR PRIMARY KEY,

    numero_edital VARCHAR NOT NULL,

    endereco_completo TEXT NOT NULL,

    preco_minimo NUMERIC NOT NULL,

    status_ocupacao VARCHAR NOT NULL,

    cidade VARCHAR,

    uf VARCHAR(2),

    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    tipo_perfil VARCHAR NOT NULL
);

-- 2. Tabela de Simulações
CREATE TABLE simulacao (
    id_simulacao SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_imovel VARCHAR REFERENCES imovel_caixa(id_imovel) ON DELETE CASCADE,
    tempo_desocupacao INTEGER NOT NULL,
    custo_reforma NUMERIC NOT NULL,
    custo_advogado NUMERIC NOT NULL,
    roi_projetado NUMERIC NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Laudos de Viabilidade
CREATE TABLE laudo_viabilidade (
    id_laudo SERIAL PRIMARY KEY,
    id_simulacao INTEGER REFERENCES simulacao(id_simulacao) ON DELETE CASCADE,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    score_recomendacao VARCHAR NOT NULL,
    url_pdf TEXT
);

tambem ja tenho um script de Web Scraping e carga em Python rodando em um ambiente virtual para baixar a planilha pública, tratar as colunas e disparar os registros para o Supabase.

Agora preciso de ajuda para desenvolver o frontend da aplicação e integrar ao meu banco de dados do supabase

A aplicação deve conter uma barra lateral de navegação e 3 telas principais:

DASHBOARD PRINCIPAL (Radar de Oportunidades)

Barra de filtros no topo: Estado (UF), Cidade, Bairro e Faixa de Preço Máxima.

Grelha central com 'Cards de Imóveis'. Cada card exibe: imagem genérica, Endereço, Cidade e Valor do Lance Inicial.

No topo de cada Card, um Badge de risco: Verde ('Excelente Negócio'), Amarelo ('Risco Moderado') ou Vermelho ('Inviável').

Clicar no card redireciona para a Simulação.

MÓDULO DE SIMULAÇÃO (Cenários 'What-If')

Tela dividida em duas colunas.

Coluna Esquerda: Sliders para 'Tempo para Desocupação' (3 a 24 meses), 'Custo de Reforma (R$)' (com input numérico) e 'Honorários (R$)'. Inclua um texto menor explicando o 'Smart Default' de reforma preventiva.

Coluna Direita: Gráfico de barras dinâmico (Recharts) comparando 'Custo Total Projetado' com 'Preço de Mercado'. Abaixo, KPIs grandes para 'Margem de Segurança (%)' e 'ROI Projetado (%)', além de um card colorido com o 'Veredicto do Sistema'.

TELA DE RELATÓRIOS

Tabela (Data Table) com histórico de simulações. Colunas: Data, Endereço, ROI e Status.

Botão de ação 'Exportar Laudo' (ícone de PDF) na última coluna.

Utilize componentes Shadcn UI e garanta usabilidade impecável para usuários sem conhecimento técnico.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/efef62d5-3809-4f98-9c08-ec891e333ec3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
