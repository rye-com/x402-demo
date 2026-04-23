import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const network = process.argv[2] === "solana" ? "solana" : "base";

if (network === "solana") {
  const keypair = Keypair.generate();
  const secret = bs58.encode(keypair.secretKey);

  console.log("=== New Agent Wallet (Solana) ===");
  console.log("Private key:", secret);
  console.log("Address:    ", keypair.publicKey.toBase58());
  console.log("");
  console.log("Add to .env:");
  console.log(`AGENT_SOLANA_PRIVATE_KEY=${secret}`);
  console.log("");
  console.log("Import the private key into Phantom (Solana) to fund it with USDC on Solana.");
} else {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  console.log("=== New Agent Wallet (Base/EVM) ===");
  console.log("Private key:", privateKey);
  console.log("Address:    ", account.address);
  console.log("");
  console.log("Add to .env:");
  console.log(`AGENT_PRIVATE_KEY=${privateKey}`);
  console.log("");
  console.log("Import the private key into Phantom (Ethereum) to fund it with USDC on Base.");
}
