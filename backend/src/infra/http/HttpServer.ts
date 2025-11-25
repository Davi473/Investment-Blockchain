import express, { Request, Response, NextFunction, Handler } from 'express';
import cors from 'cors';

// ----------------------
// 1. Tipos e Interfaces
// ----------------------

// Define a fonte de onde o parâmetro deve ser injetado no Express
// Adicionado 'user' para injeção de dados de autenticação (e.g., req.user)
type ParamSource = 'body' | 'params' | 'query' | 'req' | 'res' | 'user';

// Metadados do parâmetro: qual índice (posição na função) e qual fonte
interface ParamMetadata {
    index: number;
    source: ParamSource;
}

// Define a estrutura de uma rota registrada pelo decorator
interface RouteDefinition {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    middlewares: Handler[];
    // Metadados dos parâmetros: chave é o nome da propriedade, valor é a lista de metadados
    parameters: ParamMetadata[];
}

// O tipo de construtor do Controller
type ControllerConstructor = {
    new (...args: any[]): any;
    prefix?: string;
    routes?: { [key: string]: RouteDefinition };
};

// ----------------------
// 2. Decorators
// ----------------------

// Helper para inicializar metadados de rota
function initializeRouteMetadata(constructor: ControllerConstructor, propertyKey: string | symbol): RouteDefinition {
    if (!constructor.routes) {
        constructor.routes = {};
    }
    const key = propertyKey as string;
    if (!constructor.routes[key]) {
        constructor.routes[key] = {
            path: "",
            method: 'get', // Default method, will be overwritten by specific decorators
            middlewares: [],
            parameters: [],
        };
    }
    return constructor.routes[key];
}

// Class Decorator
export function Controller(prefix: string = ""): ClassDecorator {
    return (target: any) => {
        (target as ControllerConstructor).prefix = prefix;
    };
}

// Method Decorators (GET, POST, PUT, DELETE, PATCH)
function createMethodDecorator(method: RouteDefinition['method']) {
    return (path: string = ""): MethodDecorator => {
        return (target: any, propertyKey: string | symbol) => {
            const constructor = target.constructor as ControllerConstructor;
            const route = initializeRouteMetadata(constructor, propertyKey);
            route.method = method;
            route.path = path;
        };
    };
}

export const Get: any = createMethodDecorator('get');
export const Post: any = createMethodDecorator('post');
export const Put: any = createMethodDecorator('put');
export const Delete: any = createMethodDecorator('delete');
export const Patch: any = createMethodDecorator('patch');

// Middleware Decorator
export function Use(...middlewares: Handler[]): MethodDecorator {
    return (target: any, propertyKey: string | symbol) => {
        const constructor = target.constructor as ControllerConstructor;
        const route = initializeRouteMetadata(constructor, propertyKey);
        route.middlewares.push(...middlewares);
    };
}

/**
 * NOVO DECORATOR: Auth - Adiciona um middleware de autenticação.
 * O método original do usuário foi adaptado para receber o middleware como argumento,
 * tornando-o reutilizável (similar ao @Use, mas semanticamente focado em Auth).
 */
export function Auth(middleware: Handler): MethodDecorator {
    return (target: any, propertyKey: string | symbol) => {
        const constructor = target.constructor as ControllerConstructor;
        const route = initializeRouteMetadata(constructor, propertyKey);
        // Adiciona o middleware de autenticação
        route.middlewares.push(middleware);
    };
}

// Parameter Decorators
function createParamDecorator(source: ParamSource) {
    return (): any => {
        return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
            const constructor = target.constructor as ControllerConstructor;
            const route = initializeRouteMetadata(constructor, propertyKey);

            // Adiciona os metadados do parâmetro: índice e fonte
            route.parameters.push({
                index: parameterIndex,
                source: source,
            });
            // O sort garante que os parâmetros sejam injetados na ordem correta
            route.parameters.sort((a, b) => a.index - b.index);
        };
    };
}

export const Body: any = createParamDecorator('body');
export const Params: any = createParamDecorator('params');
export const Query: any = createParamDecorator('query');
export const Req: any = createParamDecorator('req'); // Para injetar o objeto Request
export const Res: any = createParamDecorator('res'); // Para injetar o objeto Response
export const User: any = createParamDecorator('user'); // NOVO: Para injetar req.user

// ----------------------
// 3. Classe HttpServer
// ----------------------

export class HttpServer {
    app: express.Application;

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(cors());
    }

    /**
     * Registra todas as rotas de um Controller
     * @param controllerInstance A instância do Controller a ser registrada
     */
    public async registerRoutes(controllerInstance: any): Promise<void> {
        const constructor = controllerInstance.constructor as ControllerConstructor;
        const prefix = constructor.prefix || "";

        if (!constructor.routes) {
            return;
        }

        console.log(`\n================== ${prefix} ==================`);
        
        for (const methodName in constructor.routes) {
            const routeDefinition = constructor.routes[methodName];
            const fullPath = prefix + routeDefinition.path;
            const handler: Function = controllerInstance[methodName].bind(controllerInstance);

            this.register(
                routeDefinition,
                fullPath,
                handler
            );
        }
    }

    /**
     * Registra uma rota individual no Express
     */
    private register(
        routeDefinition: RouteDefinition,
        fullPath: string,
        handler: Function
    ): void {
        const { method, middlewares, parameters } = routeDefinition;
        const expressPath = `/api${fullPath}`;

        this.app[method](expressPath, ...middlewares, async (req: Request, res: Response, next: NextFunction) => {
            try {
                // 1. Cria o array de argumentos que será injetado no método do Controller
                // O array é preenchido com base nos metadados de parâmetro.
                const args: any[] = [];
                
                for (const param of parameters) {
                    let value: any;
                    
                    switch (param.source) {
                        case 'body':
                            value = req.body;
                            break;
                        case 'params':
                            value = req.params;
                            break;
                        case 'query':
                            value = req.query;
                            break;
                        case 'req':
                            value = req;
                            break;
                        case 'res':
                            value = res;
                            break;
                        case 'user': // NOVO: Injeta req.user
                            value = (req as any).user;
                            break;
                    }

                    // Coloca o valor na posição (índice) correta da assinatura da função
                    args[param.index] = value;
                }
                
                // 2. Chama o método do Controller com os argumentos injetados
                const result = await handler(...args);

                // 3. Envia o resultado, se o Response não tiver sido manipulado explicitamente (e.g., pelo decorator @Res())
                if (result && !res.headersSent) {
                    res.json(result);
                } else if (!res.headersSent) {
                    // Responde 204 No Content se não houver resultado e a resposta não foi enviada
                    res.status(204).end();
                }
            } catch (e) {
                const error = e as Error;
                console.error(`❌ Erro na rota ${method.toUpperCase()} ${expressPath}: ${error.message}`);
                // Melhoria: o status code 422 é mais específico para erros de entidade (validação)
                res.status(422).json({ 
                    message: error.message || "Ocorreu um erro desconhecido.",
                    errorName: error.name || "Error"
                });
            }
        });

        console.log(`✅ [${method.toUpperCase().padEnd(5)}] ${expressPath}`);
    }

    /**
     * Inicia o servidor na porta especificada
     * @param port A porta para escutar
     */
    public async listen(port: number): Promise<void> {
        this.app.listen(port, () => {
            console.log(`\n🚀 Servidor rodando em http://localhost:${port}`);
        });
    }
}