# Razorpay setup for GenXCode Tech Fest

## Vercel environment variables

Add these variables to the Vercel project for Preview and Production as appropriate:

- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Razorpay Key ID (safe for browser use)
- `RAZORPAY_KEY_SECRET`: Razorpay Key Secret (server-only)
- `RAZORPAY_WEBHOOK_SECRET`: the webhook secret configured for this endpoint
- `SUPABASE_SECRET_KEY`: Supabase server-side secret key (server-only). The legacy service-role key is accepted as a fallback.

Never add the Razorpay Key Secret, webhook secret or Supabase secret to a `NEXT_PUBLIC_` variable or commit real values to Git.

## Razorpay Dashboard

1. Start with Test Mode credentials.
2. Enable automatic payment capture for the account.
3. Add a webhook pointing to `https://YOUR_PRODUCTION_HOST/api/payments/webhook`.
4. Subscribe to `payment.captured` and `order.paid`.
5. Set a webhook secret and put the same value in `RAZORPAY_WEBHOOK_SECRET`.
6. After testing the complete flow, configure Live Mode credentials separately.

## Payment flow

The server creates a Razorpay Order for INR 79 (7,900 paise). The browser receives only the public Key ID and order details. The server verifies the checkout HMAC and independently fetches the payment from Razorpay, requiring the expected order, INR 7,900 and captured status. The webhook independently verifies Razorpay's HMAC signature and reconciles captured/paid events.

The participant dashboard is gated by a `payment_orders.status = 'paid'` row. The registration RPC checks the authenticated owner, verified payment, required profile fields and organizer-published problem statement before generating the application number and creating the individual registration.

## Before opening registrations

- Publish the real organizer-defined problem statements in the admin workflow/database. The current problem statement table is empty, so participant registration cannot be completed until organizers add them.
- Confirm the production hostname and use it in the webhook URL.
- Coupon discount rules remain an SRS decision and are not enabled in this fixed INR 79 checkout implementation.
- Prompt Wars integration remains deferred until after the MVP.
