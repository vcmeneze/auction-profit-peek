import pandas as pd
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import requests
import io
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def extrair_dados_caixa_bahia():
    print("A iniciar a comunicação com a Caixa...")
    
    url_base = "https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp"
    url_csv = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_BA.csv"
    
    session = requests.Session()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        print("A obter cookies de sessão...")
        session.get(url_base, headers=headers, verify=False)
        
        print("A transferir o ficheiro CSV da Bahia...")
        response = session.get(url_csv, headers=headers, verify=False)
        response.raise_for_status()
        
        if response.text.strip().startswith("<"):
            print("[ERRO] A Caixa devolveu HTML em vez do ficheiro CSV.")
            return

        print("Ficheiro recebido! A procurar o cabeçalho correto...")
        
        # BUSCA DINÂMICA DO CABEÇALHO
        linhas = response.text.split('\n')
        linha_cabecalho = 0
        for i, linha in enumerate(linhas[:10]): # Procura nas 10 primeiras linhas
            if "Cidade" in linha and "Bairro" in linha:
                linha_cabecalho = i
                break
                
        df = pd.read_csv(io.StringIO(response.text), sep=";", encoding="iso-8859-1", skiprows=linha_cabecalho) 
        
    except Exception as e:
        print(f"[ERRO] Falha no processo de extração: {e}")
        return

    print(f"Leitura concluída. {len(df)} imóveis encontrados. A higienizar os dados...")

    df.columns = df.columns.str.strip()

    def padronizar_colunas(coluna):
        c = str(coluna).lower()
        if 'imóvel' in c: return 'id_imovel'
        if 'edital' in c: return 'numero_edital'
        if 'endereço' in c or 'endereco' in c: return 'endereco_completo'
        if 'preço' in c or 'preco' in c: return 'preco_minimo'
        if 'situação' in c or 'situacao' in c: return 'status_ocupacao'
        if c == 'cidade': return 'cidade'
        if c == 'uf': return 'uf'
        return coluna

    df = df.rename(columns=padronizar_colunas)

    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = df[col].astype(str).str.strip()

    if 'id_imovel' not in df.columns or 'preco_minimo' not in df.columns:
        print(f"[ERRO] Colunas não encontradas. O ficheiro possui apenas: {df.columns.tolist()}")
        return
    
    if 'preco_minimo' in df.columns:
        df['preco_minimo'] = df['preco_minimo'].astype(str).str.replace('R$', '', regex=False)
        df['preco_minimo'] = df['preco_minimo'].str.replace('.', '', regex=False)
        df['preco_minimo'] = df['preco_minimo'].str.replace(',', '.', regex=False)
        df['preco_minimo'] = pd.to_numeric(df['preco_minimo'], errors='coerce')
    
    df = df.dropna(subset=['id_imovel', 'preco_minimo'])
    
    # --- MÓDULO DE ANÁLISE DE DADOS PARA A BANCA (SUMARIZAÇÃO) ---
    print("\n" + "="*50)
    print("📊 RELATÓRIO ANALÍTICO DE SUMARIZAÇÃO (PANDAS)")
    print("="*50)
    print(f"Total de oportunidades ativas na Bahia: {len(df)}")
    print(f"Preço Médio (Lance Inicial): R$ {df['preco_minimo'].mean():,.2f}")
    print(f"Oportunidade de menor valor: R$ {df['preco_minimo'].min():,.2f}")
    print(f"Oportunidade de maior valor: R$ {df['preco_minimo'].max():,.2f}")
    
    print("\n-> Distribuição por Status de Ocupação:")
    print(df['status_ocupacao'].value_counts().to_string())
    
    print("\n-> Top 5 Cidades com maior volume de leilões:")
    print(df['cidade'].value_counts().head(5).to_string())
    print("="*50 + "\n")
    # -------------------------------------------------------------

    print("A iniciar o envio (Upsert) para o Supabase...")
    
    sucessos, erros = 0, 0
    for index, row in df.iterrows():
        dados_imovel = {
            "id_imovel": str(row.get("id_imovel", f"temp-{index}")).strip(),
            "numero_edital": str(row.get("numero_edital", "N/A")).strip(),
            "endereco_completo": str(row.get("endereco_completo", "N/A")).strip(),
            "preco_minimo": float(row.get("preco_minimo", 0)),
            "status_ocupacao": str(row.get("status_ocupacao", "Desconhecido")).strip(),
            "cidade": str(row.get("cidade", "N/A")).strip(),
            "uf": str(row.get("uf", "BA")).strip()
        }
        
        try:
            supabase.table("imovel_caixa").upsert(dados_imovel).execute()
            sucessos += 1
        except Exception:
            erros += 1
            
    print(f"Processo finalizado com sucesso! Imóveis inseridos/atualizados: {sucessos} | Erros: {erros}")

if __name__ == "__main__":
    extrair_dados_caixa_bahia()