import Blockchain from "../../domain/Blockchain";
import Transaction from "../../domain/Transaction";
import { Inject } from "../../infra/di/Registry";

export default class UseCaseTransaction {
    @Inject("blockchain")
    blockchain!: Blockchain;

    public async execute(input: Input): Promise<Output> {
        const { fromAddress, toAddress, amount, currency, price, signature } = input;
        if (!toAddress || amount === undefined || !currency || price === undefined) 
            throw new Error("Missing required transaction fields (toAddress, amount, currency, price).");
        const tx = new Transaction(fromAddress || null, toAddress, amount, currency.toUpperCase(), price);
        if (fromAddress && signature) {
            tx.sign(signature);
        } else if (fromAddress) {
            throw new Error("Transaction requires a signature (for sales/registro).");
        }
        this.blockchain.createTransaction(tx);
        const output = { message: 'Transaction added to mempool successfully.', transaction: tx };
        return output;
    }
}

type Input = {
    fromAddress: string,
    toAddress: string,
    amount: number, 
    currency: string,
    price: number,
    signature: string
}

type Output = {
    message: string,
    transaction: Transaction
}