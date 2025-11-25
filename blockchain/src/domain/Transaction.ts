// Transaction.ts

import crypto from "crypto";
import { ec as EC } from "elliptic";
import UTXO from "./UTXO";
const ec = new EC("secp256k1");

export default class Transaction {
	signature?: string;

	// REMOVIDO: readonly fee: number
	constructor (
		readonly fromAddress: string | null,
		readonly toAddress: string,
		readonly amount: number, // Quantidade de ações
		readonly currency: string, // Ticker da Ação (ex: AAPL, TSLA)
		readonly price: number, // Preço da ação na transação
		readonly inputs: UTXO[] = [],
		readonly outputs: UTXO[] = []
	) {}

	calculateHash () {
		// REMOVIDO: + this.fee
		return crypto.createHash("sha256").update(this.fromAddress + this.toAddress + this.amount + this.currency + this.price).digest("hex");
	}

	sign (signature: string) {
		this.signature = signature;
	}

	isValid () {
		// ... (lógica de validação de assinatura permanece a mesma)
		if (this.fromAddress === null) return true;
		if (!this.signature || this.signature.length === 0) return false;
		const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
		return publicKey.verify(this.calculateHash(), this.signature);
	}
}