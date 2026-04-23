# rye-x402-demo

Direct integration: an agent that purchases products via the [Rye Checkout Intent API](https://rye.com) using x402 stablecoin payments. Supports **USDC on Base** (EVM) and **USDC on Solana**.

Requires a Rye `CHECKOUT_INTENTS_API_KEY`.

## Flow

1. Creates a checkout intent via the Rye API (authenticated with `CHECKOUT_INTENTS_API_KEY`)
2. Polls until a price offer is ready
3. Requests x402 payment details — receives a `402` response with a USDC deposit address
4. Signs and sends a USDC transfer on the selected network
5. Confirms the purchase with the transaction hash
6. Polls until the order is completed

Only one x402 loop (on `/confirm`).

## Usage

Run from the repo root:

```bash
npm run rye -- [--network base|solana] <product-url> <quantity> '<buyer-json>'
```

`--network` defaults to `base`.

**Example (Solana):**

```bash
npm run rye -- --network solana "https://www.amazon.com/dp/B0011FJPAY" 1 '{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "+15551234567",
  "address1": "123 Main St",
  "address2": "Apt 1",
  "city": "San Francisco",
  "province": "CA",
  "country": "US",
  "postalCode": "94105"
}'
```

## As a Claude Code skill

The repo includes a `/purchase` Claude Code skill wired to this demo. From the repo root:

```
/purchase https://www.amazon.com/dp/B0011FJPAY
```
