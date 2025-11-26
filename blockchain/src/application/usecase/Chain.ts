import Block from "../../domain/Block";
import Blockchain from "../../domain/Blockchain";
import { Inject } from "../../infra/di/Registry";

export default class Chain {
    @Inject("blockchain")
    blockchain!: Blockchain;

    public async execute (): Promise<Output> {
        return this.blockchain.chain;
    }
}

type Output = Block[];