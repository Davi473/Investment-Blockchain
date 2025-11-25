export default class Account {
    constructor(
        private readonly id: string,
        private name: string, 
        private email: string,
        private password: string,
    ) {
        // Validar name
        // Validar email
    }

    public static create (name: string, email: string, password: string) {
        const id = crypto.randomUUID();
        // Fazer Gerar O Hash Da Senha
        return new Account(id, name, email, password);
    }
}