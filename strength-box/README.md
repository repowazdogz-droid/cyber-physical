# Strength Box Bristol

Gym management and personal training web app for **Strength Box Bristol** — 24-hour gym and PT studio in Bishopston, Bristol BS7.

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (auth, database, storage)
- **Stripe** (integration points ready; wire up when needed)
- **Vercel** (deploy target)

## Setup

1. **Clone and install**

   ```bash
   cd strength-box && npm install
   ```

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com).
   - Run the schema: copy contents of `supabase/migrations/001_schema.sql` into the SQL Editor and run it.
   - Run the seed: copy contents of `supabase/seed.sql` and run it.
   - In Authentication → Users, create a user with your email (for JK/admin). Then in SQL Editor run:
     ```sql
     update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'your@email.com');
     ```

3. **Environment**

   Copy `.env.example` to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Optionally `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `NEXT_PUBLIC_APP_URL`

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Log in with your admin user → you’ll be redirected to `/admin/dashboard`.

## Routes

- **Landing:** `/` — Log in / Register
- **Admin (JK):** `/admin/dashboard`, `/admin/members`, `/admin/classes`, `/admin/programmes`, `/admin/sessions`, `/admin/payments`, `/admin/alerts`, `/admin/settings`
- **Member:** `/home`, `/workouts`, `/workouts/log`, `/programme`, `/classes`, `/profile`, `/progress`

## Branding

- Primary: `#1a1a1a`
- Accent: `#c8a951` (gold/brass)
- Alert: `#e63946`
- Success: `#2a9d8f`
- Logo: replace the placeholder in the app (e.g. in layout or landing) with JK’s asset.

## Stripe

- Webhook placeholder: `POST /api/stripe/webhook`
- Member profile has a “Pay now — Coming soon” button; replace with Stripe Checkout when ready.
- `members.stripe_customer_id` and `payments.stripe_payment_id` are ready for Stripe data.

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add the same env vars as in `.env.local`.
3. In Supabase, add your Vercel URL to Authentication → URL configuration (Site URL / Redirect URLs).

---

**Strength Box Bristol** · Unit 5B, Merton Road, Bishopston, Bristol BS7 8TL
