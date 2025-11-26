import Blockchain from "../../domain/Blockchain";
import Transaction from "../../domain/Transaction";
import { Inject } from "../../infra/di/Registry";

export default class Mempool {
    @Inject("blockchain")
    blockchain!: Blockchain;

    public async execute(): Promise<Output> {
        const output = this.blockchain.mempool;
        return output;
    }
}

type Output = Transaction[];