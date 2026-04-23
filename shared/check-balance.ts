import "dotenv/config";
import { createPublicClient, http, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from "@solana/spl-token";
import bs58 from "bs58";
import { SOLANA_RPC, USDC_BALANCE_ABI, USDC_CONTRACT_BASE, USDC_MINT_SOLANA } from "./constants";

const { AGENT_PRIVATE_KEY, AGENT_SOLANA_PRIVATE_KEY } = process.env;

if (!AGENT_PRIVATE_KEY && !AGENT_SOLANA_PRIVATE_KEY) {
  throw new Error("Set AGENT_PRIVATE_KEY (Base) and/or AGENT_SOLANA_PRIVATE_KEY (Solana) in .env");
}

async function checkBase(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  const client = createPublicClient({ chain: base, transport: http() });

  const [ethBalance, usdcBalance, ethPriceRes] = await Promise.all([
    client.getBalance({ address: account.address }),
    client.readContract({
      address: USDC_CONTRACT_BASE,
      abi: USDC_BALANCE_ABI,
      functionName: "balanceOf",
      args: [account.address],
    }),
    fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot").then((r) => r.json()),
  ]);

  const ethUsd = parseFloat((ethPriceRes as any)?.data?.amount ?? "0");
  const ethAmount = parseFloat(formatUnits(ethBalance, 18));
  const usdcAmount = parseFloat(formatUnits(usdcBalance, 6));

  console.log("=== Base (EVM) ===");
  console.log("Address:", account.address);
  console.log("ETH:    ", `$${(ethAmount * ethUsd).toFixed(2)} (${ethAmount.toFixed(6)} ETH @ $${ethUsd.toFixed(0)})`);
  console.log("USDC:   ", `$${usdcAmount.toFixed(2)}`);
}

async function checkSolana(secretBase58: string) {
  const keypair = Keypair.fromSecretKey(bs58.decode(secretBase58));
  const connection = new Connection(SOLANA_RPC, "confirmed");

  const [solLamports, solPriceRes] = await Promise.all([
    connection.getBalance(keypair.publicKey),
    fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot").then((r) => r.json()),
  ]);

  const ata = await getAssociatedTokenAddress(USDC_MINT_SOLANA, keypair.publicKey);
  let usdcAmount = 0;
  try {
    const account = await getAccount(connection, ata);
    usdcAmount = Number(account.amount) / 1e6;
  } catch (err) {
    if (!(err instanceof TokenAccountNotFoundError)) throw err;
  }

  const solUsd = parseFloat((solPriceRes as any)?.data?.amount ?? "0");
  const solAmount = solLamports / LAMPORTS_PER_SOL;

  console.log("=== Solana ===");
  console.log("Address:", keypair.publicKey.toBase58());
  console.log("SOL:    ", `$${(solAmount * solUsd).toFixed(2)} (${solAmount.toFixed(6)} SOL @ $${solUsd.toFixed(0)})`);
  console.log("USDC:   ", `$${usdcAmount.toFixed(2)}`);
}

if (AGENT_PRIVATE_KEY) await checkBase(AGENT_PRIVATE_KEY as `0x${string}`);
if (AGENT_PRIVATE_KEY && AGENT_SOLANA_PRIVATE_KEY) console.log("");
if (AGENT_SOLANA_PRIVATE_KEY) await checkSolana(AGENT_SOLANA_PRIVATE_KEY);
