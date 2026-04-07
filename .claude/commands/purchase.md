Purchase a product using the x402 USDC payment agent.

Arguments: $ARGUMENTS

## Collect required information

Parse $ARGUMENTS for a product URL. If not provided, ask for it.

Then prompt the user for the following buyer details if not already provided in $ARGUMENTS:
- First name
- Last name
- Email
- Phone (e.g. +15551234567)
- Address line 1
- Address line 2 (optional)
- City
- State/Province (2-letter code, e.g. CA)
- Country (2-letter code, e.g. US)
- Postal code
- Quantity (default: 1)

## Steps

1. Run `npm run check-balance` and report the current wallet state:
   - Wallet address
   - ETH balance (in USD and ETH) — needed for gas
   - USDC balance (in USD) — used for payment
   - Warn if ETH < $1 (may not have enough for gas) or USDC < $5 (may not have enough to cover the purchase)

2. Build the buyer JSON from the collected info and run:
   ```
   npm start "<product-url>" <quantity> '<buyer-json>'
   ```

3. Report the outcome:
   - If successful: order ID, amount charged in USDC, and transaction hash
   - If failed: the error and which step it failed at

4. Run `npm run check-balance` again and show the updated balances, including how much USDC was spent.
