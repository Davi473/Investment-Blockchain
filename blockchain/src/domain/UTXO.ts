// UTXO.ts (MODIFICADO)

import crypto from "crypto";

export default class UTXO {
	id: string;
	blockHash?: string;

	// 'amount' é a QUANTIDADE de ações.
	// Adicionamos 'price' (preço por ação na compra) e mantemos 'currency' (o ticker da ação).
	constructor (readonly owner: string, readonly amount: number, readonly currency: string, readonly price: number) {
		this.id = crypto.randomUUID();
	}

	setBlockHash (blockHash: string) {
		this.blockHash = blockHash;
	}
}