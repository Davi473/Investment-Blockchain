import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils";
import App from "../App.vue";
import { AccountGatewayHttp, AccountGatewayMemory } from "@/AccountGateway";

function sleep (time: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
}

describe("App.vue", () => {
    it ("Deve criar uma conta", async () => {
        const accountGateway = new AccountGatewayMemory();
        const wrapper = mount(App, { 
            global: {
                provide: {
                    accountGateway
                }
            }
        });
        const input = {
            name: "John Doe",
            email: "john.doe@gmail.com",
            document: "97456321558",
            password: "asdQWE123"
        }
        await wrapper.get(".input-name").setValue(input.name);
        await wrapper.get(".input-email").setValue(input.email);
        await wrapper.get(".input-document").setValue(input.document);
        await wrapper.get(".input-password").setValue(input.password);
        await wrapper.get(".button-signup").trigger("click");
        await sleep(200);
        expect(wrapper.get(".span-message").text()).toBe("success");
        expect(wrapper.get(".span-account-id").text()).toBeDefined();
    });

    it ("Não deve criar uma conta se o nome for inválido", async () => {
        const accountGateway = new AccountGatewayMemory();
        const wrapper = mount(App, { 
            global: {
                provide: {
                    accountGateway
                }
            }
        });
        const input = {
            name: "John",
            email: "john.doe@gmail.com",
            document: "97456321558",
            password: "asdQWE123"
        }
        await wrapper.get(".input-name").setValue(input.name);
        await wrapper.get(".input-email").setValue(input.email);
        await wrapper.get(".input-document").setValue(input.document);
        await wrapper.get(".input-password").setValue(input.password);
        await wrapper.get(".button-signup").trigger("click");
        await sleep(200);
        expect(wrapper.get(".span-message").text()).toBe("Invalid name");
    });
});