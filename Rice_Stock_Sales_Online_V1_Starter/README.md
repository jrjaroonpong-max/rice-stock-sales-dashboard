# Rice Stock & Sales Dashboard — Online V1

Pilot branch: Store 29 Trang  
Stack: Next.js 14 + Supabase (Auth/Postgres) + Vercel  
Update method: Excel upload

## Included
- Email/password login
- Role-aware profile display: admin, store_manager, department_user
- Executive overview
- OOS & Replenishment view
- Slow Moving / Aging proxy view
- Sales Opportunity view
- Excel upload API for the existing `Product List` sheet
- Supabase schema with store-scoped Row Level Security

## 1. Create Supabase project
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Authentication, enable Email provider.
4. Create the first user in Authentication > Users.
5. Add that user's profile row in SQL Editor (replace UUID):
   ```sql
   insert into public.user_profiles(id,display_name,role,store_code)
   values ('YOUR_AUTH_USER_UUID','Store 29 Admin','admin','29');
   ```
6. Copy Project URL and anon key from Project Settings > API.

## 2. Configure environment
Copy `.env.example` to `.env.local` and fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never use NEXT_PUBLIC prefix)

## 3. Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## 4. Deploy public website
1. Push this project to a private GitHub repository.
2. Import the repository into Vercel.
3. Add all three environment variables in Vercel Project Settings.
4. Deploy.
5. In Supabase Authentication > URL Configuration, add the Vercel production URL to Site URL and Redirect URLs.
6. Test login, upload, and store-scoped data access.

## Excel upload format
The upload API reads the `Product List` sheet and expects the original headers:
`Item No`, `Description`, `Selling Price`, `ASOH`, `USOH`, `On Order`, `In Transit`, `Avg Sale 28 Days`, `Last Month Sold Qty`, `Curr Month Sold Qty`, `LY This Month Sold Qty`.

The snapshot date is currently assigned from the server date at import time. For production, add an explicit Snapshot Date field to the upload template and validate it before import.

## Important production hardening before real business use
- Confirm whether `On Order` and `In Transit` overlap; do not double count inbound stock.
- Confirm USOH business meaning and whether reserved/blocked stock should reduce available inventory.
- Set actual lead time, safety stock, MOQ, order cycle and confirmed delivery date by SKU.
- Add file-size limits, audit logs, import preview/approval, and rollback.
- The current Aging page uses Stock Cover as a slow-moving proxy, not actual inventory age. Add receiving/lot history for true FIFO aging.
- Suggested order is not yet enabled as an automatic purchase recommendation. Do not place orders from proxy thresholds without validating purchasing rules.
- Before public launch, configure MFA for admins, strong passwords, backups, rate limits, and review RLS policies with the organization's IT/security owner.
