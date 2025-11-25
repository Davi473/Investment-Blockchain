import Blockchain from "../../domain/Blockchain";
import Transaction from "../../domain/Transaction";
import { Inject } from "../di/Registry";
import { Body, Controller, Get, Params, Post } from "../http/HttpServer";

@Controller()
export default class BlockchainController {
    @Inject("blockchain")
    blockchain!: Blockchain;

    BROKER_ADDRESS = 'broker-producer-address';

    @Get("/chain")
    public async chain() {
        return this.blockchain.chain;
    }

    @Get("/portfolio/:address/:asset")
    public async portfolio(@Params() { address, asset }: any) {
        return this.blockchain.getPortfolioOfAddress(address, asset.toUpperCase());
    }

    @Get("/mempool")
    public async mempool() {
        this.blockchain.mempool;
    }

    @Post("/transaction")
    public async transaction(@Body() { fromAddress, toAddress, amount, currency, price, signature }: any) {
        if (!toAddress || amount === undefined || !currency || price === undefined) {
            throw new Error("Missing required transaction fields (toAddress, amount, currency, price).");
        }
        const tx = new Transaction(fromAddress || null, toAddress, amount, currency.toUpperCase(), price);
        if (fromAddress && signature) {
            tx.sign(signature);
        } else if (fromAddress) {
            throw new Error("Transaction requires a signature (for sales/registro).");
        }
        this.blockchain.createTransaction(tx);
        return { message: 'Transaction added to mempool successfully.', transaction: tx };
    }

    @Post("/mine/:asset")
    public async mine(@Params() { asset }: any) {
        const ticker = asset.toUpperCase();

        if (this.blockchain.mempool.length === 0) {
            throw new Error("Mempool is empty. No transactions to mine.");
        }

        this.blockchain.minePendingTransactions(this.BROKER_ADDRESS, ticker);
        const newBlock = this.blockchain.getLastBlock();
        return { 
            message: `Block for ${ticker} successfully processed!`, 
            blockHash: newBlock.hash,
            producer: this.BROKER_ADDRESS,
            transactionsProcessed: newBlock.transactions.length
        };
    }
}