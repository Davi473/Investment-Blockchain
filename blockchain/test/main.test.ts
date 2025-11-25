// main.test.ts

import Blockchain from "../src/domain/Blockchain";
import Transaction from "../src/domain/Transaction";
import Wallet from "../src/domain/Wallet";

// Define os ativos (tickers de ações) e a taxa de corretagem (fee)
const ASSET1 = "AAPL";
const ASSET2 = "TSLA";
const CORRETAGEM_FIXA = 0.50; // $0.50 por transação



// Teste principal para a Blockchain como Livro-Razão de Portfólio de Ações
test("Should test the stock portfolio ledger blockchain and average cost calculation", function () {
	// Criação de carteiras (endereços de investidores)
	const walletA = Wallet.setup();
	const walletB = Wallet.setup();
	const brokerAddress = Wallet.setup().publicKey; // Endereço da Corretora (que mina blocos)
	
	// Criação da blockchain
	const timestamp = (new Date("2024-01-01T10:00:00Z")).getTime();
	const stockLedger = new Blockchain(timestamp);
	
	// Verifica o portfolio inicial de A para o ativo AAPL
	let portfolioA_AAPL = stockLedger.getPortfolioOfAddress(walletA.publicKey, ASSET1);
	expect(portfolioA_AAPL.quantity).toBe(0);
	expect(portfolioA_AAPL.averageCost).toBe(0);

	// --- FASE 1: Compras no ATIVO 1 (AAPL) - Custo Médio Ponderado ---
	
	// COMPRA 1 (A): 10 ações de AAPL a $100.00
	const tx1_buy_aapl = new Transaction(
		null, // Transação de "compra" (similar à Coinbase, sem remetente de UTXO de ações)
		walletA.publicKey, 
		10, // Quantidade de ações
		ASSET1, 
		100.00, // Preço por ação
		CORRETAGEM_FIXA // Taxa de corretagem
	);
	// NOTE: Transações 'null' (compra) não precisam de assinatura, mas se tivessem, seria aqui.
	stockLedger.createTransaction(tx1_buy_aapl);
	stockLedger.minePendingTransactions(brokerAddress, ASSET1); // Cria o bloco
	
	// Verifica Portfolio A após a 1ª Compra
	portfolioA_AAPL = stockLedger.getPortfolioOfAddress(walletA.publicKey, ASSET1);
	expect(portfolioA_AAPL.quantity).toBe(10);
	expect(portfolioA_AAPL.totalCost).toBeCloseTo(1000.00); // 10 * 100.00
	expect(portfolioA_AAPL.averageCost).toBeCloseTo(100.00); // 1000.00 / 10

	// COMPRA 2 (A): 10 ações de AAPL a $90.00 (Abaixo do preço - Média para baixo)
	const tx2_buy_aapl = new Transaction(
		null, 
		walletA.publicKey, 
		10, 
		ASSET1, 
		90.00, // Preço por ação mais baixo
		CORRETAGEM_FIXA
	);
	stockLedger.createTransaction(tx2_buy_aapl);
	stockLedger.minePendingTransactions(brokerAddress, ASSET1); // Cria o bloco

	// Verifica Portfolio A após a 2ª Compra (Cálculo do Custo Médio Ponderado)
	// Total de Ações: 10 + 10 = 20
	// Custo Total: (10 * 100) + (10 * 90) = 1000 + 900 = 1900.00
	// Custo Médio: 1900.00 / 20 = 95.00
	portfolioA_AAPL = stockLedger.getPortfolioOfAddress(walletA.publicKey, ASSET1);
	expect(portfolioA_AAPL.quantity).toBe(20);
	expect(portfolioA_AAPL.totalCost).toBeCloseTo(1900.00);
	expect(portfolioA_AAPL.averageCost).toBeCloseTo(95.00);
	
	// --- FASE 2: Compra no ATIVO 2 (TSLA) - Verificação de Isolamento de Portfólio ---

	// Verifica o portfolio inicial de B para o ativo TSLA
	let portfolioB_TSLA = stockLedger.getPortfolioOfAddress(walletB.publicKey, ASSET2);
	expect(portfolioB_TSLA.quantity).toBe(0);
	
	// COMPRA 3 (B): 5 ações de TSLA a $200.00
	const tx3_buy_tsla = new Transaction(
		null, 
		walletB.publicKey, 
		5, // Quantidade de ações
		ASSET2, 
		200.00, // Preço por ação
		CORRETAGEM_FIXA
	);
	stockLedger.createTransaction(tx3_buy_tsla);
	stockLedger.minePendingTransactions(brokerAddress, ASSET2); // Cria o bloco
	
	// Verifica Portfolio B (TSLA)
	portfolioB_TSLA = stockLedger.getPortfolioOfAddress(walletB.publicKey, ASSET2);
	expect(portfolioB_TSLA.quantity).toBe(5);
	expect(portfolioB_TSLA.totalCost).toBeCloseTo(1000.00); // 5 * 200.00
	expect(portfolioB_TSLA.averageCost).toBeCloseTo(200.00); 

	// Verifica se o Portfolio A (AAPL) permaneceu inalterado
	portfolioA_AAPL = stockLedger.getPortfolioOfAddress(walletA.publicKey, ASSET1);
	expect(portfolioA_AAPL.quantity).toBe(20);
	expect(portfolioA_AAPL.averageCost).toBeCloseTo(95.00);
	
	// --- FASE 3: Transação de VENDA (Transferência de Ativo) ---

	// Transações de venda usam a lógica de UTXO de um remetente para um destinatário
	// Venda (A -> B): A vende 5 ações de AAPL para B a um preço de mercado de $98.00
	const tx4_sell_aapl = new Transaction(
		walletA.publicKey, 
		walletB.publicKey, 
		5, // Quantidade de ações
		ASSET1, 
		98.00, // Preço de mercado (usado no hash)
		CORRETAGEM_FIXA
	);
	walletA.sign(tx4_sell_aapl);
	stockLedger.createTransaction(tx4_sell_aapl);
	stockLedger.minePendingTransactions(brokerAddress, ASSET1);
	
	// Verifica Portfolio A após a Venda
	// A tinha 20 ações (10@100 + 10@90). A venda consome 5 UTXOs.
	// Assumindo que a implementação consome a primeira UTXO (10@100), restando 5@100 de troco.
	// Pool remanescente A: 10@90 + 5@100 = 15 ações.
	// Custo Total: 900 + 500 = 1400.00
	// Custo Médio: 1400.00 / 15 ≈ 93.3333
	portfolioA_AAPL = stockLedger.getPortfolioOfAddress(walletA.publicKey, ASSET1);
	expect(portfolioA_AAPL.quantity).toBe(15);
	expect(portfolioA_AAPL.averageCost).toBeCloseTo(93.3333333333);
	
	// Verifica Portfolio B após a Compra (Recebe as 5 ações ao preço de $98.00)
	// B tinha 0 AAPL. Recebe 5@98.00.
	portfolioB_TSLA = stockLedger.getPortfolioOfAddress(walletB.publicKey, ASSET1);
	expect(portfolioB_TSLA.quantity).toBe(5);
	expect(portfolioB_TSLA.averageCost).toBeCloseTo(98.00);
	
	// Validade da cadeia
	expect(stockLedger.isValid()).toBe(true);
});