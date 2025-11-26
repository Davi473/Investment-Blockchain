import Chain from "../../application/usecase/Chain";
import Mempool from "../../application/usecase/Mempool";
import Mine from "../../application/usecase/Mine";
import Portfolio from "../../application/usecase/Portfolio";
import UseCaseTransaction from "../../application/usecase/useCaseTransaction";
import Blockchain from "../../domain/Blockchain";
import { Inject } from "../di/Registry";
import { Body, Controller, Get, Params, Post } from "../http/HttpServer";

@Controller()
export default class BlockchainController {
    @Inject("blockchain")
    blockchain!: Blockchain;
    @Inject("chain")
    useChain!: Chain;
    @Inject("portfolio")
    usePortfollio!: Portfolio;
    @Inject("mempool")
    useMempool!: Mempool;
    @Inject("useCaseTransaction")
    useCaseTransaction!: UseCaseTransaction;
    @Inject("mine")
    useCaseMine!: Mine;
    @Inject("BROKER_ADDRESS")
    BROKER_ADDRESS!: string;

    @Get("/chain")
    public async chain() {
        const output = await this.useChain.execute();
        return output;
    }

    @Get("/portfolio/:address/:asset")
    public async portfolio(@Params() { address, asset }: any) {
        const input = { address, asset };
        const output = await this.usePortfollio.execute(input);
        return output;
    }

    @Get("/mempool")
    public async mempool() {
        const output = this.useMempool.execute();
        return output;
    }

    @Post("/transaction")
    public async transaction(@Body() { fromAddress, toAddress, amount, currency, price, signature }: any) {
        const input = { fromAddress, toAddress, amount, currency, price, signature };
        const output = await this.useCaseTransaction.execute(input);
        return output;
    }

    @Post("/mine/:asset")
    public async mine(@Params() { asset }: any) {
        const input = { asset };
        const output = await this.useCaseMine.execute(input);
        return output;
    }
}


