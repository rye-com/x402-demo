import "dotenv/config";
import { createPublicClient, http, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const USDC_CONTRACT_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const { AGENT_PRIVATE_KEY } = process.env;
if (!AGENT_PRIVATE_KEY) throw new Error("Missing AGENT_PRIVATE_KEY in .env");

const account = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`);
const client = createPublicClient({ chain: base, transport: http() });

const [ethBalance, usdcBalance, ethPriceRes] = await Promise.all([
  client.getBalance({ address: account.address }),
  client.readContract({
    address: USDC_CONTRACT_BASE,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [account.address],
  }),
  fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot").then((r) => r.json()),
]);

const ethUsd = parseFloat(ethPriceRes?.data?.amount ?? "0");
const ethAmount = parseFloat(formatUnits(ethBalance, 18));
const usdcAmount = parseFloat(formatUnits(usdcBalance, 6));

console.log("Address:", account.address);
console.log("ETH:    ", `$${(ethAmount * ethUsd).toFixed(2)} (${ethAmount.toFixed(6)} ETH @ $${ethUsd.toFixed(0)})`);
console.log("USDC:   ", `$${usdcAmount.toFixed(2)}`);
