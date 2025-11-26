import request from 'supertest';
import Wallet from '../src/domain/Wallet'; // Necessário para gerar assinaturas
import Transaction from '../src/domain/Transaction';
import { HttpServer } from '../src/infra/http/HttpServer';
import Blockchain from '../src/domain/Blockchain';
import BlockchainController from '../src/infra/controller/BlockchainController';
import Registry from '../src/infra/di/Registry';
import Chain from '../src/application/usecase/Chain';
import Portfolio from '../src/application/usecase/Portfolio';
import Mempool from '../src/application/usecase/Mempool';
import UseCaseTransaction from '../src/application/usecase/useCaseTransaction';
import Mine from '../src/application/usecase/Mine';

const ASSET1 = 'AAPL';
// REMOVIDO: CORRETAGEM

// Setup de carteiras para o teste
const walletA = Wallet.setup();
const walletB = Wallet.setup();

const HTTP = new HttpServer();
const timestamp = Date.now();
const blockchain = new Blockchain(timestamp);
Registry.getInstance().provide("chain", new Chain());
Registry.getInstance().provide("portfolio", new Portfolio());
Registry.getInstance().provide("mempool", new Mempool());
Registry.getInstance().provide("useCaseTransaction", new UseCaseTransaction());
Registry.getInstance().provide("mine", new Mine());
Registry.getInstance().provide("blockchain", new Blockchain(Date.now()));
Registry.getInstance().provide("BROKER_ADDRESS", "broker-addres");
HTTP.registerRoutes(new BlockchainController());
const app = HTTP.app;
// Nota: Em um ambiente real, seria necessário um setup/teardown para limpar o estado
// da Blockchain entre os testes, mas assumimos que a execução sequencial funcionará.

describe('Blockchain Portfolio API Test', () => {

    // --- Setup Inicial ---

    test('1. Setup: Compra 1 (A): 5 ações @ $100.00', async () => {
        const PRICE_TX1 = 100.00;

        const transaction = new Transaction(null, walletA.publicKey, 5, ASSET1, PRICE_TX1);
        walletA.sign(transaction);
        const txPurchase = {
            fromAddress: null, toAddress: walletA.publicKey,
            amount: transaction.amount, currency: ASSET1, price: transaction.price,
            signature: transaction.signature
        };
        await request(app).post('/api/transaction').send(txPurchase);
        await request(app).post(`/api/mine/${ASSET1}`);
        const portfolioResponse = await request(app).get(`/api/portfolio/${walletA.publicKey}/${ASSET1}`);
        expect(portfolioResponse.body.quantity).toBe(5);
        expect(portfolioResponse.body.average).toBeCloseTo(100.00);
    });

    test('2. Setup: Compra 2 (A): 5 ações @ $200.00 (Calcula Custo Médio Ponderado)', async () => {
        const PRICE_TX2 = 200.00;
        // REMOVIDO: fee: CORRETAGEM
        const transaction = new Transaction(null, walletA.publicKey, 5, ASSET1, PRICE_TX2);
        walletA.sign(transaction);
        const txPurchase2 = {
            fromAddress: null, toAddress: walletA.publicKey,
            amount: transaction.amount, currency: ASSET1, price: transaction.price,
            signature: transaction.signature
        };

        await request(app).post('/api/transaction').send(txPurchase2);
        await request(app).post(`/api/mine/${ASSET1}`);
        // Quantidade Total: 10
        // Custo Total: 1500.00
        // Custo Médio: 150.00
        const portfolioResponse = await request(app).get(`/api/portfolio/${walletA.publicKey}/${ASSET1}`);
        expect(portfolioResponse.body.quantity).toBe(10);
        expect(portfolioResponse.body.average).toBeCloseTo(150.00);
        const total = portfolioResponse.body.quantity * portfolioResponse.body.average;
        expect(total).toBeCloseTo(1500.00);
    });

    // --- Teste da Nova Lógica de Venda (Custo Médio Fixo) ---

    test('3. POST /transaction (Venda): Vende 5 ações. CUSTO MÉDIO DEVE PERMANECER.', async () => {
        const SALE_PRICE = 175.00;
        const amountToSell = 5;
        const oldAverageCost = 150.00;

        // Cria a transação sem 'fee'
        const tempTx = new Transaction(walletA.publicKey, walletA.publicKey, amountToSell, ASSET1, SALE_PRICE);
        walletA.sign(tempTx);

        const txSale = {
            fromAddress: walletA.publicKey,
            toAddress: walletA.publicKey,
            amount: amountToSell,
            currency: ASSET1,
            price: SALE_PRICE,
            // REMOVIDO: fee
            signature: tempTx.signature
        };

        await request(app).post('/api/transaction').send(txSale);
        await request(app).post(`/api/mine/${ASSET1}`);

        // Custo Médio: 150.00 (Permaneceu o mesmo!)
        const portfolioA = await request(app).get(`/api/portfolio/${walletA.publicKey}/${ASSET1}`);

        expect(portfolioA.body.quantity).toBe(5);
        expect(portfolioA.body.average).toBeCloseTo(oldAverageCost);
        const total = portfolioA.body.quantity * portfolioA.body.average;
        expect(total).toBeCloseTo(750.00);
    });

    test('4. POST /transaction (Venda Total): Vende as 5 ações restantes. Custo Médio deve ir a ZERO.', async () => {
        const SALE_PRICE = 160.00;
        const amountToSell = 5;

        // Cria a transação sem 'fee'
        const tempTx = new Transaction(walletA.publicKey, walletA.publicKey, amountToSell, ASSET1, SALE_PRICE);
        walletA.sign(tempTx);

        const txSale = {
            fromAddress: walletA.publicKey,
            toAddress: walletA.publicKey,
            amount: amountToSell,
            currency: ASSET1,
            price: SALE_PRICE,
            // REMOVIDO: fee
            signature: tempTx.signature
        };

        await request(app).post('/api/transaction').send(txSale);
        await request(app).post(`/api/mine/${ASSET1}`);

        // Quantidade: 0, Custo Médio: 0, Custo Total: 0
        const portfolioA = await request(app).get(`/api/portfolio/${walletA.publicKey}/${ASSET1}`);

        expect(portfolioA.body.quantity).toBe(0);
        expect(portfolioA.body.average).toBe(0);
        const total = portfolioA.body.quantity * portfolioA.body.average;
        expect(total).toBe(0);
    });

    test('5. POST /transaction (Venda Inválida): Deve falhar por falta de saldo', async () => {
        const SALE_PRICE = 160.00;
        const amountToSell = 1;

        // Cria a transação sem 'fee'
        const tempTx = new Transaction(walletA.publicKey, walletA.publicKey, amountToSell, ASSET1, SALE_PRICE);
        walletA.sign(tempTx);

        const txSale = {
            fromAddress: walletA.publicKey,
            toAddress: walletA.publicKey,
            amount: amountToSell,
            currency: ASSET1,
            price: SALE_PRICE,
            signature: tempTx.signature
        };

        const response = await request(app).post('/api/transaction').send(txSale);
        (() => expect(response.body.message).rejects.toThrow(new Error("Insufficient quantity of AAPL to sell")));
    });

    test('6. POST /transaction (Transferência Inválida): Deve falhar pois o modelo não suporta transferência', async () => {
        // Tenta transferir de A para B (fromAddress !== toAddress)
        // Cria a transação sem 'fee'
        const tempTx = new Transaction(walletA.publicKey, walletB.publicKey, 1, ASSET1, 100);
        walletA.sign(tempTx);

        const txInvalid = {
            fromAddress: walletA.publicKey,
            toAddress: walletB.publicKey,
            amount: 1,
            currency: ASSET1,
            price: 100,
            signature: tempTx.signature
        };

        const response = await request(app).post('/api/transaction').send(txInvalid);
        expect(response.statusCode).toBe(422);
        (() => expect(response.body.error).rejects.toThrow(new Error('Only \'Buy\' (fromAddress=null) or \'Sell/Registro\' (fromAddress=toAddress) transactions are supported')));
    });
});