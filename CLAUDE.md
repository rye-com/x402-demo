# x402-demo

A Node.js agent that purchases products via the Rye Checkout Intent API using x402 stablecoin payments (USDC on Base).

## What this does

The agent:
1. Creates a checkout intent via the Rye API
2. Polls until an offer is ready
3. Requests x402 payment details (gets a 402 with a USDC deposit address)
4. Signs and sends a USDC transfer on Base using a server-side wallet
5. Confirms the purchase with the transaction hash
6. Polls until the order is completed

## Stack

- TypeScript + Node.js (ESM)
- viem — wallet management and on-chain USDC transfers
- Base network (EVM, USDC stablecoin)
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
AGENT_PRIVATE_KEY=0x...     # agent wallet private key
```

## Wallet

- Agent wallet address: `0x6aBD1Ba14443F1ac5302F8279Ee7b17edd6426eF`
- Network: Base (EVM)
- Requires: USDC (for purchases) + a small amount of ETH (for gas)
- Import the private key into Phantom (Ethereum) to fund the wallet visually

## x402 payment flow

The Rye API implements the x402 protocol. The confirm endpoint:
- Returns `402` with a `PAYMENT-REQUIRED` header (base64 JSON) containing the deposit address and USDC amount
- Accepts a `PAYMENT-SIGNATURE` header on retry containing the signed tx hash
- Settles asynchronously via Stripe crypto PaymentIntent polling

Supported networks: `base`, `solana`, `tempo`. Base is recommended (lowest gas, ~2s settlement).

## Related

- Rye API docs and x402 PRD: `../checkout-agent/docs/prd-x402-integration.md`
