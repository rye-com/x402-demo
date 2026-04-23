import { createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { USDC_CONTRACT_BASE, USDC_TRANSFER_ABI } from "./constants";
import type { PaymentRequired } from "./types";

export function getBaseAccount() {
  const key = process.env.AGENT_PRIVATE_KEY;
  if (!key) throw new Error("Missing AGENT_PRIVATE_KEY for base network");
  return privateKeyToAccount(key as `0x${string}`);
}

export async function payOnBase(paymentRequired: PaymentRequired): Promise<string> {
  const account = getBaseAccount();
  const walletClient = createWalletClient({ account, chain: base, transport: http() });
  console.log("Agent wallet address:", account.address);

  const amountUnits = parseUnits(paymentRequired.maxAmountRequired, 6);
  const txHash = await walletClient.writeContract({
    address: USDC_CONTRACT_BASE,
    abi: USDC_TRANSFER_ABI,
    functionName: "transfer",
    args: [paymentRequired.recipient as `0x${string}`, amountUnits],
  });
  console.log("Transaction hash:", txHash);
  return txHash;
}
