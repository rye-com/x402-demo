import { PublicKey } from "@solana/web3.js";

export const USDC_CONTRACT_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const USDC_MINT_SOLANA = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

export const USDC_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const USDC_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;
