# 🪙 Stock Portfolio Ledger Blockchain API (Custo Médio Fixo)

Uma implementação de uma API de Blockchain (Ledger Distribuído) desenvolvida em **TypeScript** e **Node.js/Express** para rastreamento de portfólios de ações. O foco é em simular o registro de compras e vendas de ativos, aplicando a lógica contábil de **Custo Médio Ponderado (CM)**.

## ✨ Destaques da Implementação

* **Modelo de Registro de Portfólio:** Utiliza o modelo **UTXO (Unspent Transaction Output)** adaptado para rastrear a quantidade de ações (UTXO.amount) e o custo de aquisição (UTXO.price).
* **Cálculo de Custo Médio:**
    * **Compra:** O CM é recalculado por média ponderada em cada nova aquisição.
    * **Venda:** A venda *não* altera o preço médio. As ações vendidas são baixadas do portfólio usando o custo médio atual, garantindo que o Custo Médio Ponderado (CM) permaneça o mesmo para as ações restantes. Quando o saldo de ações chega a zero, o CM também zera.
* **Transações sem Taxa (Fee-less):** Não há cobrança de taxa de corretagem nas transações (zero-fee model).
* **API RESTful:** Endpoints para consultar a cadeia, o portfólio de um endereço e enviar operações de compra/venda.

## 🛠️ Tecnologias Utilizadas

* **Linguagem:** TypeScript
* **Backend:** Node.js, Express
* **Criptografia:** `crypto` (Node.js), `elliptic` (secp256k1)
* **Testes:** Jest, Supertest

## 🚀 Como Executar o Projeto

### Pré-requisitos

Você precisa ter o **Node.js** (versão 16+) e o **npm** instalados.

### Instalação

1.  Clone este repositório:
    ```bash
    git clone [SEU_LINK_DO_REPOSITORIO]
    cd [NOME_DO_PROJETO]
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```

### Rodando a API (Exemplo)

Para iniciar o servidor da API (assumindo que você tem um arquivo `server.ts` ou pode usar `ts-node`):

```bash
# Você precisará de um script de start no package.json, ex:
# "start": "ts-node src/server.ts" 
npm start 
# A API estará rodando em http://localhost:3000 (se configurado assim)
