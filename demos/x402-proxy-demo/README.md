# x402-proxy-demo

Smoke test that validates a third-party x402 buyer SDK can parse and pay our [x402 proxy](../../../x402-proxy)'s v2 challenge. The point is the SDK — not our own client agreeing with our own server.

Buyer SDK: [`@agentcash/fetch`](https://www.npmjs.com/package/@agentcash/fetch). Its `executeFetch()` handles the 402 loop end-to-end: probe → parse `PAYMENT-REQUIRED` → sign USDC transfer → retry with `PAYMENT-SIGNATURE`.

Targets the **local** proxy by default (`http://localhost:3000`). Override with `LOCAL_PROXY_URL` or `X402_PROXY_URL`.

## What it does

1. POST `/v1/checkout-intents` via `@agentcash/fetch`.
2. Proxy returns `402` with a v2 `PAYMENT-REQUIRED` header (atomic-unit `maxAmountRequired`, `payTo`, `eip155:8453`).
3. SDK pays ~2¢ USDC on Base and retries with `PAYMENT-SIGNATURE`.
4. Proxy returns `201` with the created intent.
5. Demo prints the intent id + state and exits 0.

Stops there. Doesn't poll for offer; doesn't call `/confirm`. This is a handshake validation, not a full purchase.

If the SDK fails to parse the 402, the script dumps the raw 402 body + the SDK error and exits non-zero — that's the signal we're hunting for.

## Prerequisites

The local proxy must be running:

```bash
cd ../x402-proxy && pnpm dev
```

If it's not reachable, this demo fails fast.

## Run

```bash
npm run proxy
```

Reads `AGENT_PRIVATE_KEY` from the repo-root `.env`. Burns ~2¢ USDC + a tiny amount of ETH gas on Base mainnet **per successful run** — the proxy hardcodes Base mainnet USDC, so there's no testnet path.
