# MiDuka Pre-Launch Checklist

Ensure all items are checked before going live.

## 🔑 Environment & Security
- [ ] **Vercel Env Vars:** All variables from `.env.example` mirrored in Vercel project settings.
- [ ] **Auth Secret:** Generated unique 32-char base64 string for `AUTH_SECRET`.
- [ ] **Database URLs:** Pooling URL used for `DATABASE_URL`, Direct URL for `DIRECT_URL`.
- [ ] **SSL:** Domain connected and SSL certificate active.

## 💳 Payments
- [ ] **Stripe Live Mode:** `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` updated to live keys.
- [ ] **Stripe Webhook:** Webhook secret from Stripe Dashboard set as `STRIPE_WEBHOOK_SECRET`.
- [ ] **M-Pesa Production:** Daraja credentials switched to production URLs and keys.
- [ ] **M-Pesa Callback:** Callback URL verified to be reachable and HTTPS.

## 🛍️ Content & SEO
- [ ] **Seeding:** `npm run seed` executed on production database.
- [ ] **Static Pages:** About Us, Contact, and Policies reviewed and edited in Seller Dashboard.
- [ ] **Favicon/Logos:** Custom store logo and manifest icons uploaded.
- [ ] **Analytics:** Vercel Analytics enabled or GA4 tracking ID set.

## 📱 Performance & PWA
- [ ] **PWA Installable:** Tested on Chrome (Android) and Safari (iOS) "Add to Home Screen".
- [ ] **Lighthouse Audit:** Score > 90 across all categories.
- [ ] **Image Optimization:** All products have `blurDataUrl` for LQIP placeholders.

## ✉️ Notifications
- [ ] **Resend Setup:** Domain verified in Resend and `EMAIL_FROM` set correctly.
- [ ] **Test Order:** Successful test checkout performed to verify order email delivery.
