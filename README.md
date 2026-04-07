# x402-demo

A Node.js agent that purchases products via the [Rye Checkout Intent API](https://rye.com) using x402 stablecoin payments (USDC on Base).

## How it works

1. Creates a checkout intent via the Rye API
2. Polls until a price offer is ready
3. Requests x402 payment details — receives a `402` response with a USDC deposit address
4. Signs and sends a USDC transfer on Base
5. Confirms the purchase with the transaction hash
6. Polls until the order is completed

## Requirements

- Node.js 18+
- A Rye API key with Checkout Intents access
- An EVM wallet funded with USDC and a small amount of ETH on Base (for gas)

## Setup

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env
```

### Environment variables

```
CHECKOUT_INTENTS_API_KEY=   # Rye API key
AGENT_PRIVATE_KEY=0x...     # Agent wallet private key
```

### Generate a wallet

```bash
npm run generate-wallet
```

This prints a new private key and address. Add the private key to `.env` as `AGENT_PRIVATE_KEY`.

### Fund the wallet

The agent wallet needs:
- **USDC on Base** — to pay for purchases
- **ETH on Base** — a small amount (~0.001 ETH) for gas fees

```bash
npm run check-balance
```

## Usage

### As a Claude Code skill

This repo includes a `/purchase` Claude Code skill. Open the repo in Claude Code and run:

```
/purchase https://www.amazon.com/dp/B0011FJPAY
```

Claude will prompt you for buyer details, check your wallet balance, run the purchase, and report the order ID and USDC spent.

## Supported products

Any product URL supported by the Rye API — Amazon, Shopify stores, and more.

## Network

All payments use **USDC on Base** (EVM). Base offers ~1s on-chain confirmation and low gas fees. Stripe settles the payment asynchronously, typically within 2 minutes of the on-chain transfer confirming.
