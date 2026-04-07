import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("=== New Agent Wallet ===");
console.log("Private key:", privateKey);
console.log("Address:    ", account.address);
console.log("");
console.log("Add to .env:");
console.log(`AGENT_PRIVATE_KEY=${privateKey}`);
console.log("");
console.log("Import the private key into Phantom (Ethereum) to fund it with USDC on Base.");
