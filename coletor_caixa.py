import pandas as pd
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import requests
import io
import urllib3
from sklearn.cluster import KMeans

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def limpar_moeda(valor):
    v = str(valor).replace('R$', '').replace('.', '').replace(',', '.').strip()
    return pd.to_numeric(v, errors='coerce')

def extrair_dados_caixa_bahia():
    print("A iniciar a comunicacao com a Caixa...")
    url_base = "https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp"
    url_csv = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_BA.csv"
    
    session = requests.Session()
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        session.get(url_base, headers=headers, verify=False)
        response = session.get(url_csv, headers=headers, verify=False)
        response.raise_for_status()
        
        # O CSV da Caixa costuma ter 2 linhas de cabeçalho inútil
        df = pd.read_csv(io.StringIO(response.text), sep=";", encoding="iso-8859-1", skiprows=2) 
    except Exception as e:
        print(f"[ERRO] Falha no download: {e}")
        return

    print(f"Leitura concluida. {len(df)} imoveis encontrados. A higienizar...")

    # Renomear as colunas oficiais da Caixa
    # Renomear as colunas oficiais da Caixa usando partes seguras (sem acentos)
    df.columns = df.columns.str.strip()
    
    def padronizar_colunas(coluna):
        c = str(coluna).lower()
        if 'im' in c and 'v' in c: return 'id_imovel'
        if 'uf' == c.strip(): return 'uf'
        if 'cidade' in c: return 'cidade'
        if 'bairro' in c: return 'bairro'
        if 'endere' in c: return 'endereco'
        if 'pre' in c: return 'preco_minimo'
        if 'avalia' in c: return 'valor_avaliacao'
        if 'desconto' in c: return 'desconto'
        if 'financia' in c: return 'financiamento'
        if 'descri' in c: return 'descricao'
        if 'moda' in c: return 'modalidade'
        return coluna

    df = df.rename(columns=padronizar_colunas)

    # Limpeza de dados financeiros
    df['preco_minimo'] = df['preco_minimo'].apply(limpar_moeda)
    df['valor_avaliacao'] = df['valor_avaliacao'].apply(limpar_moeda)
    df['desconto'] = pd.to_numeric(df['desconto'], errors='coerce')
    
    df = df.dropna(subset=['id_imovel', 'preco_minimo', 'valor_avaliacao'])

    print("\n" + "="*50)
    print("MODULO DE ANALISE DE DADOS (PANDAS + SCIKIT-LEARN)")
    print("="*50)
    print(f"Preco Medio (Lance Inicial): R$ {df['preco_minimo'].mean():,.2f}")
    
    # -------------------------------------------------------------
    # FUNCAO ANALITICA: AGRUPAMENTO (K-MEANS CLUSTERING)
    # Objetivo: Agrupar imóveis com base no Preço Mínimo e Valor de Avaliação
    # -------------------------------------------------------------
    print("A treinar modelo K-Means para segmentacao de risco e valor...")
    
    # Selecionamos as duas variáveis financeiras principais para a IA
    X = df[['preco_minimo', 'valor_avaliacao']]
    
    # Pedimos ao algoritmo para encontrar 3 perfis naturais de imóveis
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(X)
    
    # Identificar o que cada cluster significa ordenando pela média de preço
    medias_cluster = df.groupby('cluster')['preco_minimo'].mean().sort_values()
    
    # Mapear os clusters para nomes comerciais (Apresentacao para a banca)
    nomes_clusters = {
        medias_cluster.index[0]: "Popular / Baixo Risco Financeiro",
        medias_cluster.index[1]: "Medio Padrao / Risco Intermediario",
        medias_cluster.index[2]: "Alto Padrao / Alto Risco Financeiro"
    }
    df['cluster_risco'] = df['cluster'].map(nomes_clusters)
    
    print("\n-> Perfis de Investimento identificados pelo K-Means:")
    print(df['cluster_risco'].value_counts().to_string())
    print("="*50 + "\n")

    print("A iniciar o envio (Upsert) para o Supabase...")
    
    sucessos, erros = 0, 0
    erro_detalhado = ""
    for _, row in df.iterrows():
        endereco_full = f"{str(row.get('endereco', '')).strip()} - {str(row.get('bairro', '')).strip()}"
        
        # Tratamento seguro contra valores NaN (Not a Number) gerados pelo Pandas
        desc = row.get('desconto', 0)
        desc_seguro = 0 if pd.isna(desc) else float(desc)
        
        dados_imovel = {
            "id_imovel": str(row['id_imovel']).strip(),
            "numero_edital": "N/A", # A linha que faltava para satisfazer o banco de dados!
            "endereco_completo": endereco_full,
            "preco_minimo": float(row['preco_minimo']),
            "valor_avaliacao": float(row['valor_avaliacao']),
            "desconto": desc_seguro, # Agora blindado contra NaN
            "descricao": str(row.get('descricao', 'N/A')).strip(),
            "modalidade": str(row.get('modalidade', 'N/A')).strip(),
            "financiamento": str(row.get('financiamento', 'N/A')).strip(),
            "cluster_risco": str(row.get('cluster_risco', 'N/A')),
            "status_ocupacao": "Não Informado (Assumido Ocupado)",
            "cidade": str(row.get('cidade', 'N/A')).strip(),
            "uf": str(row.get('uf', 'BA')).strip()
        }
        
        try:
            supabase.table("imovel_caixa").upsert(dados_imovel).execute()
            sucessos += 1
        except Exception as e:
            erros += 1
            if erros == 1:
                erro_detalhado = str(e)
            
    print(f"Processo finalizado! Inseridos/Atualizados: {sucessos} | Erros: {erros}")
    if erros > 0:
        print(f"\n[DIAGNÓSTICO DO ERRO]: {erro_detalhado}")

if __name__ == "__main__":
    extrair_dados_caixa_bahia()