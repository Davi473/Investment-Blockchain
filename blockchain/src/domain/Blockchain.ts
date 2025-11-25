// Blockchain.ts

import { ec as EC } from "elliptic";
import Block from "./Block";
import Transaction from "./Transaction";
import UTXO from "./UTXO"; // Ajuste o caminho se necessário
const ec = new EC("secp256k1");

// REMOVIDO: interface AssetConfig
// REMOVIDO: propriedade assets

// Interface para o resultado da análise de portfólio
interface PortfolioResult {
	quantity: number;
	averageCost: number; // Custo médio por ação
	totalCost: number; // Custo total investido
}

export default class Blockchain {
	chain: Block[];
	difficulty = 2;
	mempool: Transaction[] = [];
	utxos: Record<string, Set<UTXO>> = {};
	// REMOVIDO: assets: Record<string, AssetConfig> = {};

	constructor (timestamp: number) {
		// REMOVIDO: Definição de ativos e suas taxas
		this.chain = [this.createGenesis(timestamp)];
	}

	createGenesis (timestamp: number) {
		return new Block("", 0, timestamp, [], "");
	}

	getLastBlock () {
		return this.chain[this.chain.length - 1];
	}

	minePendingTransactions (producerAddress: string, asset: string) {
		// O 'asset' ainda é necessário para saber qual conjunto de UTXOs limpar e qual bloco registrar.
		if (!this.utxos[asset]) throw new Error(`Asset ${asset} not initialized.`);
		
		const transactionsToInclude = this.mempool; 
		
		const previousBlock = this.chain[this.chain.length - 1];
		
		const block = new Block(producerAddress, 0, Date.now(), transactionsToInclude, previousBlock.hash);
		block.mine(this.difficulty);
		this.chain.push(block);
		
		this.mempool = [];
	}

	createTransaction (transaction: Transaction) {
		const asset = transaction.currency;
		
		if (!transaction.toAddress) throw new Error("Invalid destination address.");
		
		// 1. COMPRA (fromAddress === null):
		if (transaction.fromAddress === null) {
			if (!this.utxos[asset]) this.utxos[asset] = new Set();
			
			// Cuidado com transações de compra sem preço. Devemos garantir que o preço esteja correto.
			if (transaction.price <= 0) throw new Error("Price must be greater than zero for a purchase.");

			const newUTXO = new UTXO(transaction.toAddress, transaction.amount, asset, transaction.price);
			transaction.outputs.push(newUTXO);
			this.utxos[asset].add(newUTXO);
			this.mempool.push(transaction);
			return;
		}

		// Validação de assinatura para VENDA/REGISTRO
		if (!transaction.isValid()) {
			throw new Error("Invalid transaction signature for sale/registro.");
		}
		
		// 2. VENDA (fromAddress === toAddress):
		if (transaction.fromAddress === transaction.toAddress) {
			
			const ownerAddress = transaction.fromAddress;
			const { quantity: oldQuantity, totalCost: oldTotalCost, averageCost: oldAverageCost } = this.getPortfolioOfAddress(ownerAddress, asset);
			
			if (oldQuantity < transaction.amount) {
				throw new Error(`Insufficient quantity of ${asset} to sell. Needs: ${transaction.amount}, Has: ${oldQuantity}`);
			}
			
			const amountSold = transaction.amount;
			const newQuantity = oldQuantity - amountSold;
			
			// Cálculo do novo Custo Total, preservando o Custo Médio.
			const totalCostReduction = amountSold * oldAverageCost;
			let newTotalCost = oldTotalCost - totalCostReduction;
			
			// Garante que se o saldo for 0, o custo total também é 0.
			if (newQuantity === 0) {
				newTotalCost = 0;
			} else if (newTotalCost < 0) {
				newTotalCost = 0; // Previne erros de arredondamento
			}
			
			// Consumimos TODAS AS UTXOs e criamos UMA NOVA UTXO com o saldo restante (Output).
			if (!this.utxos[asset]) this.utxos[asset] = new Set();
			
			const utxosToConsume = Array.from(this.utxos[asset]).filter(utxo => utxo.owner === ownerAddress);
			for (const utxo of utxosToConsume) {
				this.utxos[asset].delete(utxo);
				transaction.inputs.push(utxo);
			}

			// Cria uma única UTXO de output que representa o novo saldo.
			if (newQuantity > 0) {
				// O preço da nova UTXO é o custo médio antigo, garantindo que o custo médio NUNCA mude com a venda.
				const newUTXO = new UTXO(ownerAddress, newQuantity, asset, oldAverageCost);
				this.utxos[asset].add(newUTXO);
				transaction.outputs.push(newUTXO);
			}
			
			this.mempool.push(transaction);
			return;
		}

		// 3. TRANSFERÊNCIA (fromAddress !== toAddress):
		throw new Error("Only 'Buy' (fromAddress=null) or 'Sell/Registro' (fromAddress=toAddress) transactions are supported for portfolio tracking.");
	}

	getPortfolioOfAddress (address: string, asset: string): PortfolioResult {
		let totalQuantity = 0;
		let totalCost = 0;
		
		if (!this.utxos[asset]) {
			return { quantity: 0, averageCost: 0, totalCost: 0 };
		}
		
		for (const utxo of this.utxos[asset]) {
			if (utxo.owner === address) {
				totalQuantity += utxo.amount;
				totalCost += utxo.amount * utxo.price;
			}
		}
		
		let averageCost = 0;
		if (totalQuantity > 0) {
			averageCost = totalCost / totalQuantity;
		} else {
			// Regra do usuário: se a quantidade é 0, o custo médio e o custo total são 0
			averageCost = 0;
			totalCost = 0;
		}
		
		return {
			quantity: totalQuantity,
			averageCost: averageCost,
			totalCost: totalCost
		};
	}

	isValid () {
		// ... (lógica de validação da cadeia permanece a mesma)
		for (const [index, block ] of this.chain.entries()) {
			if (index === 0) continue;
			const previousBlock = this.chain[index - 1];
			if (!block.hasValidTransactions()) {
				return false;
			}
			if (block.hash !== block.calculateHash()) {
				return false;
			}
			if (previousBlock.hash !== block.previousHash) {
				return false;
			}
		}
		return true;
	}
}