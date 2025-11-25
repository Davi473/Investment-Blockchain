export default interface AccountGateway {
    save (input: any): Promise<any>;
}

export class AccountGatewayHttp implements AccountGateway {

    async save(input: any): Promise<any> {
        const response = await fetch("http://localhost:3000/signup", {
            method: "post",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(input)
        });
        const output = await response.json();
        return output;
    }

}

export class AccountGatewayMemory implements AccountGateway {

    async save(input: any): Promise<any> {
        if (input.name === "John") return { message: "Invalid name"};
        return { accountId: "123" };
    }

}