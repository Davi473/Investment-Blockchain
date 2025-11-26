import Blockchain from "../../domain/Blockchain";
import { Inject } from "../../infra/di/Registry";

export default class Mine {
    @Inject("blockchain")
    blockchain!: Blockchain;
    @Inject("BROKER_ADDRESS")
    BROKER_ADDRESS!: string;

    public async execute(input: Input): Promise<Output> {
        const { asset } = input;
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

type Input = {
    asset: string
}

type Output = {
    message: string,
    blockHash: string,
    producer: string,
    transactionsProcessed: number
}