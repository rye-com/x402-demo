import "dotenv/config";
import { buildPaymentSignature, parsePaymentRequired, pay } from "../../../shared/x402";
import type { Buyer, Network } from "../../../shared/types";

const { CHECKOUT_INTENTS_API_KEY } = process.env;
const CHECKOUT_INTENTS_BASE_URL = "https://api.rye.com";

if (!CHECKOUT_INTENTS_API_KEY) {
  throw new Error("Missing CHECKOUT_INTENTS_API_KEY. Copy .env.example to .env and fill in values.");
}

async function purchaseWithX402(
  productUrl: string,
  quantity: number,
  buyer: Buyer,
  network: Network,
) {
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
  console.log(`\n[3] Requesting x402 payment details (network=${network})...`);
  const confirmRes = await fetch(
    `${CHECKOUT_INTENTS_BASE_URL}/api/v1/checkout-intents/${intent.id}/confirm`,
    {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({ paymentMethod: { type: "x402", network } }),
    }
  );

  if (confirmRes.status !== 402) {
    throw new Error(`Expected 402, got ${confirmRes.status}`);
  }

  const paymentRequiredHeader = confirmRes.headers.get("PAYMENT-REQUIRED");
  if (!paymentRequiredHeader) throw new Error("Missing PAYMENT-REQUIRED header");

  const paymentRequired = parsePaymentRequired(paymentRequiredHeader);
  console.log("Deposit address:", paymentRequired.recipient);
  console.log("Amount required:", paymentRequired.maxAmountRequired, "USDC");

  // Step 4: Sign and send USDC transfer
  console.log(`\n[4] Sending USDC on ${network}...`);
  const txHash = await pay(network, paymentRequired);

  // Step 5: Retry confirm with payment signature
  console.log("\n[5] Confirming with payment signature...");
  const finalRes = await fetch(
    `${CHECKOUT_INTENTS_BASE_URL}/api/v1/checkout-intents/${intent.id}/confirm`,
    {
      method: "POST",
      headers: {
        ...baseHeaders,
        "PAYMENT-SIGNATURE": buildPaymentSignature(network, txHash),
      },
      body: JSON.stringify({ paymentMethod: { type: "x402", network } }),
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

const args = process.argv.slice(2);
let network: Network = "base";
const netIdx = args.indexOf("--network");
if (netIdx !== -1) {
  const value = args[netIdx + 1];
  if (value !== "base" && value !== "solana") {
    console.error(`Invalid --network value: ${value} (expected base|solana)`);
    process.exit(1);
  }
  network = value;
  args.splice(netIdx, 2);
}

const productUrl = args[0];
const quantity = parseInt(args[1] ?? "1", 10);
const buyerJson = args[2];

if (!productUrl || !buyerJson) {
  console.error("Usage: npm run rye -- [--network base|solana] <product-url> <quantity> '<buyer-json>'");
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

purchaseWithX402(productUrl, quantity, buyer, network).catch(console.error);
