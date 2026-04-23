# x402 Edge Case Test Notes

## Environment
- Agent wallet: `0x6aBD1Ba14443F1ac5302F8279Ee7b17edd6426eF`
- Network: Base (USDC)

---

## Test 1: Underpayment
**Date:** 2026-04-07  
**Intent:** `ci_62c0451e61d44761be6248fbb7b653f4`  
**Product:** Amazon Q-tips Travel Pack ($1.64)  
**Required:** 1.670000 USDC | **Sent:** 1.000000 USDC  

**Finding:**
- Rye API accepts the tx hash at confirm time and moves to `placing_order` — no immediate validation
- Worker detects underpayment asynchronously and sets intent to `failed`
- Stripe PI gets stuck in `processing`, becomes `failed` and cancellable after ~3 hours
- $1 USDC is **not automatically refunded** — money sits at Stripe deposit address until manually resolved

**Open question:** Does Rye's worker trigger a refund on underpayment failure?

---

## Test 2: Overpayment
**Date:** 2026-04-07  
**Intent:** `ci_53a2a61d791b4295bbb7ca055a268943`  
**Product:** Amazon Q-tips Travel Pack ($1.65)  
**Required:** 1.680000 USDC | **Sent:** 3.000000 USDC  

**Finding:**
- Same behavior as underpayment — intent moves to `placing_order` then `failed`
- Stripe PI validates exact amount; overpayment is also rejected
- $3 USDC sent on-chain, not automatically refunded

**Open question:** Does Rye refund overpayments? Is there a tolerance/threshold?

---
