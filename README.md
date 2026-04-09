# x402-demo

A Node.js agent that purchases products via the [Rye Checkout Intent API](https://rye.com) using x402 stablecoin payments.

**Non-production version** — uses Stripe's test helper to simulate USDC deposits instead of sending real crypto on-chain.

## How it works

1. Creates a checkout intent via the Rye API
2. Polls until a price offer is ready
3. Requests x402 payment details — receives a `402` response with a USDC deposit address and Stripe PaymentIntent ID
4. Simulates USDC deposit via Stripe's `simulate_crypto_deposit` test helper
5. Confirms the purchase with a test transaction hash
6. Polls until the order is completed

## Requirements

- Node.js 18+
- A Rye API key with Checkout Intents access
- A Stripe test mode secret key (e.g. `rk_test_...`)

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
CHECKOUT_INTENTS_BASE_URL=https://api.rye.com
STRIPE_SECRET_KEY=rk_test_...  # Stripe test mode key
AGENT_PRIVATE_KEY=0x...     # Optional, only for check-balance script
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

## How settlement works

This demo uses Stripe's `simulate_crypto_deposit` test helper to fulfill the PaymentIntent without sending real USDC. Stripe settles the simulated payment asynchronously, typically within 10-20 seconds in test mode.
