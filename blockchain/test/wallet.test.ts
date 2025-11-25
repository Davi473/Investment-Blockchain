import Wallet from "../src/domain/Wallet";

// O teste de recuperação de carteira não precisa de alterações
test("Should test wallet recover.", function () {
	const walletA = Wallet.setup();
	const walletB = Wallet.restore(walletA.seed);
	expect(walletA.privateKey).toBe(walletB.privateKey);
});