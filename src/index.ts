import "dotenv/config";
import { createWalletClient, http, parseUnits, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const USDC_CONTRACT_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = [
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

const { CHECKOUT_INTENTS_API_KEY, AGENT_PRIVATE_KEY } = process.env;
const CHECKOUT_INTENTS_BASE_URL = "https://api.rye.com";

if (!CHECKOUT_INTENTS_API_KEY || !AGENT_PRIVATE_KEY) {
  throw new Error("Missing required env vars. Copy .env.example to .env and fill in values.");
}

const account = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

console.log("Agent wallet address:", account.address);

type Buyer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
};

async function purchaseWithX402(productUrl: string, quantity: number, buyer: Buyer) {
  const baseHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CHECKOUT_INTENTS_API_KEY}`,
  };

  // Step 1: Create checkout intent
  console.log("\n[1] Creating checkout intent...");
  const createRes = await fetch(`${CHECKOUT_INTENTS_BASE_URL}/api/v1/checkout-intents`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ productUrl, quantity, buyer }),
  });
  const intent = await createRes.json();
  console.log("Intent ID:", intent.id);

  // Step 2: Poll until offer is ready
  console.log("\n[2] Polling for offer...");
  let offer;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 3_000));
    const res = await fetch(`${CHECKOUT_INTENTS_BASE_URL}/api/v1/checkout-intents/${intent.id}`, {
      headers: baseHeaders,
    });
    const data = await res.json();
    console.log("  State:", data.state);
    if (data.state === "awaiting_confirmation") {
      offer = data.offer;
      break;
    }
    if (data.state === "failed") throw new Error("Intent failed during offer retrieval");
  }
  if (!offer) throw new Error("Timed out waiting for offer");
  console.log("Offer total:", offer.cost.total, "cents");

  // Step 3: First confirm call — get 402 with deposit address
  console.log("\n[3] Requesting x402 payment details...");
  const confirmRes = await fetch(
    `${CHECKOUT_INTENTS_BASE_URL}/api/v1/checkout-intents/${intent.id}/confirm`,
    {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({ paymentMethod: { type: "x402", network: "base" } }),
    }
  );

  if (confirmRes.status !== 402) {
    throw new Error(`Expected 402, got ${confirmRes.status}`);
  }

  const paymentRequiredHeader = confirmRes.headers.get("PAYMENT-REQUIRED");
  if (!paymentRequiredHeader) throw new Error("Missing PAYMENT-REQUIRED header");

  const paymentRequired = JSON.parse(Buffer.from(paymentRequiredHeader, "base64").toString());
  console.log("Deposit address:", paymentRequired.recipient);
  console.log("Amount required:", paymentRequired.maxAmountRequired, "USDC");

  // Step 4: Sign and send USDC transfer on Base
  console.log("\n[4] Sending USDC transfer on Base...");
  const amountUnits = parseUnits(paymentRequired.maxAmountRequired, 6); // USDC has 6 decimals

  const txHash = await walletClient.writeContract({
    address: USDC_CONTRACT_BASE,
    abi: USDC_ABI,
    functionName: "transfer",
    args: [paymentRequired.recipient, amountUnits],
  });
  console.log("Transaction hash:", txHash);

  // Step 5: Retry confirm with payment signature
  console.log("\n[5] Confirming with payment signature...");
  const paymentSignature = Buffer.from(
    JSON.stringify({ signature: txHash, network: "base", transactionHash: txHash })
  ).toString("base64");

  const finalRes = await fetch(
    `${CHECKOUT_INTENTS_BASE_URL}/api/v1/checkout-intents/${intent.id}/confirm`,
    {
      method: "POST",
      headers: {
        ...baseHeaders,
        "PAYMENT-SIGNATURE": paymentSignature,
      },
      body: JSON.stringify({ paymentMethod: { type: "x402", network: "base" } }),
    }
  );
  const finalData = await finalRes.json();
  console.log("Response:", finalData.state);

  // Step 6: Poll for completion
  console.log("\n[6] Polling for order completion...");
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5_000));
    const res = await fetch(
      `${CHECKOUT_INTENTS_BASE_URL}/api/v1/checkout-intents/${intent.id}`,
      { headers: baseHeaders }
    );
    const data = await res.json();
    console.log("  State:", data.state);
    if (data.state === "completed") {
      console.log("\nOrder placed! Order ID:", data.orderId);
      return data;
    }
    if (data.state === "failed") throw new Error("Order failed");
  }
  throw new Error("Timed out waiting for order completion");
}

const productUrl = process.argv[2];
const quantity = parseInt(process.argv[3] ?? "1", 10);
const buyerJson = process.argv[4];

if (!productUrl || !buyerJson) {
  console.error("Usage: npm start <product-url> <quantity> '<buyer-json>'");
  console.error("Example buyer JSON:");
  console.error(JSON.stringify({
    firstName: "Jane", lastName: "Doe", email: "jane@example.com",
    phone: "+15551234567", address1: "123 Main St", address2: "Apt 1",
    city: "San Francisco", province: "CA", country: "US", postalCode: "94105",
  }));
  process.exit(1);
}

let buyer: Buyer;
try {
  buyer = JSON.parse(buyerJson);
} catch {
  console.error("Invalid buyer JSON:", buyerJson);
  process.exit(1);
}

purchaseWithX402(productUrl, quantity, buyer).catch(console.error);
