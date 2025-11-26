import Blockchain from "./domain/Blockchain";
import BlockchainController from "./infra/controller/BlockchainController";
import Registry from "./infra/di/Registry";
import { HttpServer } from "./infra/http/HttpServer";
import Chain from "./application/usecase/Chain";
import Portfolio from "./application/usecase/Portfolio";
import Mempool from "./application/usecase/Mempool";
import UseCaseTransaction from "./application/usecase/useCaseTransaction";
import Mine from "./application/usecase/Mine";

const main = async () => {
    const HTTP = new HttpServer();
    Registry.getInstance().provide("chain", new Chain());
    Registry.getInstance().provide("portfolio", new Portfolio());
    Registry.getInstance().provide("mempool", new Mempool());
    Registry.getInstance().provide("useCaseTransaction", new UseCaseTransaction());
    Registry.getInstance().provide("mine", new Mine());
    Registry.getInstance().provide("blockchain", new Blockchain(Date.now()));
    Registry.getInstance().provide("BROKER_ADDRESS", "broker-addres");
    const controller = new BlockchainController();
    HTTP.registerRoutes(controller);
    HTTP.listen(3000);
}

main();