import { payOnBase, getBaseAccount } from "./base";
import { payOnSolana, getSolanaKeypair } from "./solana";
import type { Network, PaymentRequired } from "./types";

export function parsePaymentRequired(headerValue: string): PaymentRequired {
  return JSON.parse(Buffer.from(headerValue, "base64").toString());
}

export function buildPaymentSignature(network: Network, txHash: string): string {
  return Buffer.from(
    JSON.stringify({ signature: txHash, network, transactionHash: txHash }),
  ).toString("base64");
}

export async function pay(network: Network, paymentRequired: PaymentRequired): Promise<string> {
  return network === "solana" ? payOnSolana(paymentRequired) : payOnBase(paymentRequired);
}

export function getAgentAddress(network: Network): string {
  return network === "solana"
    ? getSolanaKeypair().publicKey.toBase58()
    : getBaseAccount().address;
}
