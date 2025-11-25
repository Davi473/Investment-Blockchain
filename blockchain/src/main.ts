import Blockchain from "./domain/Blockchain";
import BlockchainController from "./infra/controller/BlockchainController";
import Registry from "./infra/di/Registry";
import { HttpServer } from "./infra/http/HttpServer";



const main = async () => {
    const HTTP = new HttpServer();
    const timestamp = Date.now();
    const blockchain = new Blockchain(timestamp);
    Registry.getInstance().provide("blockchain", blockchain);
    HTTP.registerRoutes(new BlockchainController());
    HTTP.listen(3000);
}

main();