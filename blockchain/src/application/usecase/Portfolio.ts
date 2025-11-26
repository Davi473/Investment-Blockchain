import Blockchain from "../../domain/Blockchain";
import { Inject } from "../../infra/di/Registry";

export default class Portfolio {
    @Inject("blockchain")
    blockchain!: Blockchain;

    public async execute(input: Input): Promise<Output> {
        const { address, asset } = input;
        const portfolio = this.blockchain.getPortfolioOfAddress(address, asset.toUpperCase());
        const output = {
            quantity: portfolio.quantity,
            average: portfolio.averageCost
        }
        return output;
    }
}

type Input = {
    address: string,
    asset: string
}

type Output = {
    quantity: number,
    average: number,
}