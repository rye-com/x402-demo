import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { generateKeyPairSigner } from "@solana/kit";
import {
  executeFetch,
  PaymentProtocol,
  isAgentCashFetchError,
  HttpFetchError,
} from "@agentcash/fetch";
import { Network } from "@agentcash/networks";

const PROXY_URL = process.env.LOCAL_PROXY_URL ?? process.env.X402_PROXY_URL ?? "http://localhost:3000";

const productUrl = "https://rye-protocol.myshopify.com/products/50-cents-t-shirt";
const quantity = 1;
const buyer = {
  firstName: "Hanyu",
  lastName: "Zhu",
  email: "hanyu@rye.com",
  phone: "+13608783128",
  address1: "235 Olson Way",
  address2: "Apt 247",
  city: "Sunnyvale",
  province: "CA",
  country: "US",
  postalCode: "94086",
};

async function probeRaw(url: string, body: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const header = res.headers.get("PAYMENT-REQUIRED");
    const text = await res.text();
    return [
      `status: ${res.status} ${res.statusText}`,
      `PAYMENT-REQUIRED header: ${header ?? "(missing)"}`,
      `body: ${text}`,
    ].join("\n");
  } catch (err) {
    return `(probe failed: ${err instanceof Error ? err.message : String(err)})`;
  }
}

async function checkProxyUp(url: string) {
  try {
    await fetch(url, { method: "HEAD" });
  } catch (err) {
    console.error(`FAIL: proxy at ${url} is not reachable.`);
    console.error("Start it first: cd ../x402-proxy && pnpm dev");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

async function run() {
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    console.error("FAIL: AGENT_PRIVATE_KEY is not set in .env");
    process.exit(1);
  }

  const evmAccount = privateKeyToAccount(privateKey as `0x${string}`);
  const svmSigner = await generateKeyPairSigner();

  console.log(`Proxy:  ${PROXY_URL}`);
  console.log(`Wallet: ${evmAccount.address} (Base mainnet)`);
  console.log(`SDK:    @agentcash/fetch executeFetch (x402 v2)\n`);

  await checkProxyUp(PROXY_URL);

  const url = `${PROXY_URL}/v1/checkout-intents`;
  const body = JSON.stringify({
    productUrl,
    quantity,
    buyer,
    paymentMethod: { type: "x402", network: "base" },
  });

  console.log("[1] POST /v1/checkout-intents — letting AgentCash SDK handle the 402 loop");

  let result;
  try {
    result = await executeFetch(
      { url, method: "POST", headers: {}, body },
      {
        wallets: { evm: evmAccount, svm: svmSigner },
        params: {
          paymentProtocol: PaymentProtocol.X402,
          paymentNetwork: Network.BASE,
        },
        pickProtocol: async () => PaymentProtocol.X402,
      },
    );
  } catch (err) {
    console.error("\nFAIL: AgentCash SDK rejected the proxy's 402 challenge.");
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
    if (isAgentCashFetchError(err)) {
      console.error(`type:  ${err.type}`);
      console.error(`cause: ${err.cause}`);
      if (err instanceof HttpFetchError) {
        console.error(`http status: ${err.statusCode}`);
        try {
          console.error(`http body: ${await err.response.text()}`);
        } catch {}
      }
    }
    console.error("\nRaw 402 from a fresh probe (for debugging the wire format):");
    console.error(await probeRaw(url, body));
    process.exit(1);
  }

  const { response, paymentInfo } = result;
  const text = await response.text();

  if (!response.ok) {
    console.error(`\nFAIL: retry after payment did not succeed: ${response.status} ${response.statusText}`);
    console.error(text);
    process.exit(1);
  }

  let intent;
  try {
    intent = JSON.parse(text);
  } catch {
    console.error("FAIL: response was not JSON");
    console.error(text);
    process.exit(1);
  }

  if (paymentInfo?.payment?.transactionHash) {
    console.log(`    paid:  ${paymentInfo.price} via ${paymentInfo.protocol} on ${paymentInfo.network}`);
    console.log(`    tx:    ${paymentInfo.payment.transactionHash}`);
  } else {
    console.log("    (no payment info — proxy did not require payment?)");
  }

  console.log(`    intent: ${intent.id}`);
  console.log(`    state:  ${intent.state}`);
  console.log("\nOK — AgentCash SDK successfully parsed and paid the v2 x402 challenge.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
