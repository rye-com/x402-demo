# x402-demo

A Node.js agent that purchases products via the Rye Checkout Intent API using x402 stablecoin payments (USDC on Base).

## What this does

**Non-production version** — uses Stripe's test helper to simulate USDC deposits instead of sending real crypto.

The agent:
1. Creates a checkout intent via the Rye API
2. Polls until an offer is ready
3. Requests x402 payment details (gets a 402 with a USDC deposit address and Stripe PaymentIntent ID)
4. Simulates USDC deposit via Stripe's `simulate_crypto_deposit` test helper
5. Confirms the purchase with a test transaction hash
6. Polls until the order is completed

## Stack

- TypeScript + Node.js (ESM)
- Stripe test helpers — simulated crypto deposit settlement
- Rye Checkout Intent API with x402 payment method

## Key files

- `src/index.ts` — main agent purchase flow
- `src/check-balance.ts` — check ETH + USDC balance of agent wallet
- `src/generate-wallet.ts` — one-time script to generate a new private key

## Commands

```bash
npm run generate-wallet   # generate a new agent wallet
npm run check-balance     # check ETH + USDC balance on Base
npm start                 # run the purchase agent
```

## Environment

Copy `.env.example` to `.env` and fill in:

```
CHECKOUT_INTENTS_API_KEY=   # Rye API key
CHECKOUT_INTENTS_BASE_URL=https://api.rye.com
STRIPE_SECRET_KEY=rk_test_...  # Stripe test mode key
AGENT_PRIVATE_KEY=0x...     # optional, only for check-balance script
```

## x402 payment flow (non-production)

The Rye API implements the x402 protocol. The confirm endpoint:
- Returns `402` with a `PAYMENT-REQUIRED` header (base64 JSON) containing the deposit address, USDC amount, and Stripe PaymentIntent ID
- Instead of sending real USDC on-chain, this demo calls Stripe's `simulate_crypto_deposit` test helper to fulfill the PaymentIntent
- Accepts a `PAYMENT-SIGNATURE` header on retry containing the test tx hash
- Settles asynchronously via Stripe crypto PaymentIntent polling

## Related

- Rye API docs and x402 PRD: `../checkout-agent/docs/prd-x402-integration.md`
