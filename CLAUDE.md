# x402-demos

A multi-demo repo for x402 stablecoin-payment agent flows. All demos share a single `package.json`, one set of wallets, and common utilities under `shared/`.

## Layout

```
shared/                  # wallet setup, USDC transfer, x402 header helpers (used by all demos)
demos/
├── rye-x402-demo/       # agent that calls Rye's Checkout Intent API directly (needs Rye API key)
└── x402-proxy-demo/     # agent that calls the x402 proxy at x402.rye.com (no API key; wallet is identity)
```

## Demos

- **`demos/rye-x402-demo`** — agent calls `api.rye.com` directly, authenticates with a Rye `CHECKOUT_INTENTS_API_KEY`, one x402 402 loop on `/confirm`. This is the original demo from the pre-reorg project.
- **`demos/x402-proxy-demo`** — smoke test that validates a third-party buyer SDK ([`@agentcash/fetch`](https://www.npmjs.com/package/@agentcash/fetch)) can parse and pay the proxy's v2 x402 challenge. Targets a local proxy at `http://localhost:3000` by default (`pnpm dev` in `../x402-proxy`); override via `LOCAL_PROXY_URL`/`X402_PROXY_URL`. Stops after the 2¢ gate on `POST /v1/checkout-intents` — handshake validation only, not a full purchase.

## Stack

- TypeScript + Node.js (ESM, `tsx`)
- `viem` — Base/EVM wallet + USDC transfers
- `@solana/web3.js` + `@solana/spl-token` — Solana wallet + SPL USDC transfers

## Commands (run from repo root)

```bash
npm run generate-wallet              # generate a new Base/EVM wallet
npm run generate-wallet solana       # generate a new Solana wallet
npm run check-balance                # show balance for whichever networks are configured
npm run rye -- [--network base|solana] <product-url> <quantity> '<buyer-json>'
npm run proxy -- ...                 # (once x402-proxy-demo is implemented)
```

## Environment

One `.env` at the repo root, shared by all demos. Copy `.env.example` to `.env` and fill in:

```
CHECKOUT_INTENTS_API_KEY=    # Rye API key (rye-x402-demo only)
LOCAL_PROXY_URL=             # Local proxy URL (x402-proxy-demo, default http://localhost:3000)
X402_PROXY_URL=              # Deployed proxy URL (x402-proxy-demo, optional override)
AGENT_PRIVATE_KEY=0x...      # Base/EVM wallet
AGENT_SOLANA_PRIVATE_KEY=    # Solana wallet (base58)
```

Only the wallet for the network you're using needs to be set.

## Wallets

Two independent wallets, funded independently. Both demos share the same wallet keys.

**Base (EVM)** — needs USDC + small ETH for gas. Import into Phantom (Ethereum) to fund.
**Solana** — needs USDC (SPL) + small SOL for fees and ATA rent. Import base58 key into Phantom (Solana).

## x402 payment flow

The Rye API (and the proxy) implement the x402 protocol:

- `402` response with a `PAYMENT-REQUIRED` header (base64 JSON) containing deposit address + USDC amount
- Retry with a `PAYMENT-SIGNATURE` header containing the signed tx hash
- Settles asynchronously via Stripe crypto PaymentIntent polling on Rye's side

Supported networks: `base`, `solana`, `tempo`. Base and Solana are implemented in `shared/`.

## Related

- Rye API + x402 PRD: `../checkout-agent/docs/prd-x402-integration.md`
- x402 proxy: `../x402-proxy` (CLAUDE.md at that root)
