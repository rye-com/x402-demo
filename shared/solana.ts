import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";
import { SOLANA_RPC, USDC_MINT_SOLANA } from "./constants";
import type { PaymentRequired } from "./types";

export function getSolanaKeypair() {
  const key = process.env.AGENT_SOLANA_PRIVATE_KEY;
  if (!key) throw new Error("Missing AGENT_SOLANA_PRIVATE_KEY for solana network");
  return Keypair.fromSecretKey(bs58.decode(key));
}

export async function payOnSolana(paymentRequired: PaymentRequired): Promise<string> {
  const keypair = getSolanaKeypair();
  const connection = new Connection(SOLANA_RPC, "confirmed");
  console.log("Agent wallet address:", keypair.publicKey.toBase58());

  const recipient = new PublicKey(paymentRequired.recipient);
  const senderAta = await getAssociatedTokenAddress(USDC_MINT_SOLANA, keypair.publicKey);
  const recipientAta = await getAssociatedTokenAddress(USDC_MINT_SOLANA, recipient);

  const amountUnits = BigInt(Math.round(parseFloat(paymentRequired.maxAmountRequired) * 1e6));

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      keypair.publicKey,
      recipientAta,
      recipient,
      USDC_MINT_SOLANA,
    ),
    createTransferCheckedInstruction(
      senderAta,
      USDC_MINT_SOLANA,
      recipientAta,
      keypair.publicKey,
      amountUnits,
      6,
    ),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [keypair]);
  console.log("Transaction signature:", signature);
  return signature;
}
