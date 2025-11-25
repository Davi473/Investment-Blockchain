// api.test.ts

import request from 'supertest';
import Wallet from '../src/domain/Wallet'; // Necessário para gerar assinaturas
import Transaction from '../src/domain/Transaction';
import { HttpServer } from '../src/infra/http/HttpServer';
import Blockchain from '../src/domain/Blockchain';
import BlockchainController from '../src/infra/controller/BlockchainController';
import Registry from '../src/infra/di/Registry';

const ASSET1 = 'AAPL';
// REMOVIDO: CORRETAGEM

// Setup de carteiras para o teste
const walletA = Wallet.setup();
const walletB = Wallet.setup();

const HTTP = new HttpServer();
const timestamp = Date.now();
const blockchain = new Blockchain(timestamp);
Registry.getInstance().provide("blockchain", blockchain);
HTTP.registerRoutes(new BlockchainController());
const app =  HTTP.app;
// Nota: Em um ambiente real, seria necessário um setup/teardown para limpar o estado
// da Blockchain entre os testes, mas assumimos que a execução sequencial funcionará.

describe('Blockchain Portfolio API Test', () => {

    // --- Setup Inicial ---

    test('1. Setup: Compra 1 (A): 5 ações @ $100.00', async () => {
        const PRICE_TX1 = 100.00;
        // REMOVIDO: fee: CORRETAGEM
        const txPurchase = { fromAddress: null, toAddress: walletA.publicKey, amount: 5, currency: ASSET1, price: PRICE_TX1 };

        await request(app).post('/api/transaction').send(txPurchase);
        await request(app).post(`/api/mine/${ASSET1}`);

        const portfolioResponse = await request(app).get(`/api/portfolio/${walletA.publicKey}/${ASSET1}`);
        expect(portfolioResponse.body.quantity).toBe(5);
        expect(portfolioResponse.body.averageCost).toBeCloseTo(100.00);
    });

    test('2. Setup: Compra 2 (A): 5 ações @ $200.00 (Calcula Custo Médio Ponderado)', async () => {
        const PRICE_TX2 = 200.00;
        // REMOVIDO: fee: CORRETAGEM
        const txPurchase2 = { fromAddress: null, toAddress: walletA.publicKey, amount: 5, currency: ASSET1, price: PRICE_TX2 };

        await request(app).post('/api/transaction').send(txPurchase2);
        await request(app).post(`/api/mine/${ASSET1}`);

        // Quantidade Total: 10
        // Custo Total: 1500.00
        // Custo Médio: 150.00
        const portfolioResponse = await request(app).get(`/api/portfolio/${walletA.publicKey}/${ASSET1}`);
        expect(portfolioResponse.body.quantity).toBe(10);
        expect(portfolioResponse.body.averageCost).toBeCloseTo(150.00);
        expect(portfolioResponse.body.totalCost).toBeCloseTo(1500.00);
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
        expect(portfolioA.body.averageCost).toBeCloseTo(oldAverageCost);
        expect(portfolioA.body.totalCost).toBeCloseTo(750.00);
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
        expect(portfolioA.body.averageCost).toBe(0);
        expect(portfolioA.body.totalCost).toBe(0);
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