# x402-proxy-demo

Agent that purchases products through the [x402 proxy](https://x402.rye.com) — a wallet-native gateway that sits in front of Rye's Checkout Intent API.

**Status:** not yet implemented.

## What this demo will show

Unlike `rye-x402-demo`, the agent has **no Rye API key**. It authenticates purely by paying USDC on-chain; the proxy injects its own shared Rye `apiKey` when forwarding.

## Planned flow

1. `POST /v1/checkout-intents` → **402 (2¢ API gate)** → sign + retry with `PAYMENT-SIGNATURE`
2. Poll `GET /v1/checkout-intents/:id` (free; wallet identity via `X-Wallet-Address` header)
3. `POST /v1/checkout-intents/:id/confirm` → **402 (purchase + 3¢ fee)** → sign + retry
4. Poll to completion

Two x402 loops instead of one. See `/Users/hanyu/rye/x402-proxy` for the proxy itself.

## Env

Reuses the same wallet keys as `rye-x402-demo`. Adds:

```
X402_PROXY_URL=https://x402.rye.com   # or http://localhost:3000 when running the proxy locally
```
