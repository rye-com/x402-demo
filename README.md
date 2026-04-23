# x402-demos

A collection of x402 stablecoin-payment agent demos against Rye's checkout APIs. Supports **USDC on Base** (EVM) and **USDC on Solana**.

## Demos

| Demo | Target | API key? | x402 loops |
|---|---|---|---|
| [`demos/rye-x402-demo`](demos/rye-x402-demo) | `api.rye.com` (direct) | Yes — Rye dev key | 1 (on `/confirm`) |
| [`demos/x402-proxy-demo`](demos/x402-proxy-demo) | `x402.rye.com` (proxy) | No — wallet is identity | 2 (create + confirm) — *not yet implemented* |

Both demos share wallets and the utilities under `shared/`.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in whichever keys apply to the demo you want to run. See `.env.example`.

### Generate a wallet

```bash
npm run generate-wallet           # Base/EVM
npm run generate-wallet solana    # Solana
```

### Fund the wallet

The Base wallet needs USDC + a small amount of ETH for gas. The Solana wallet needs USDC (SPL) + a small amount of SOL for fees and ATA rent. Use [Coinbase](https://coinbase.com) to withdraw USDC directly to Base or Solana.

```bash
npm run check-balance
```

## Run a demo

```bash
# Direct Rye API
npm run rye -- [--network base|solana] <product-url> <quantity> '<buyer-json>'

# Via x402 proxy (not yet implemented)
npm run proxy -- ...
```

See each demo's README for details.

## Networks

- **Base (EVM)** — ~1s on-chain confirmation, low gas
- **Solana** — ~1s confirmation, sub-cent fees; first transfer to a new recipient also pays ATA rent (~0.002 SOL)

Stripe settles the payment asynchronously on Rye's side, typically within 2 minutes of on-chain confirmation.
