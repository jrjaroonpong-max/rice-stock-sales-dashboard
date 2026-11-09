# Public deployment checklist — Store 29 Trang

- [ ] Create Supabase project under an organization-approved account.
- [ ] Run `supabase/schema.sql`.
- [ ] Enable Email/Password authentication.
- [ ] Create initial Auth user and matching `user_profiles` row with role `admin`.
- [ ] Set `.env.local` locally; keep service role key server-side only.
- [ ] Test with a non-admin account to confirm upload is denied.
- [ ] Test upload using a copy of the current Excel workbook.
- [ ] Confirm import count equals the expected unique SKU count.
- [ ] Verify snapshot date, duplicate Item No handling and inventory totals.
- [ ] Confirm Lead Time, Safety Stock, On Order/In Transit semantics with store purchasing team.
- [ ] Push to private GitHub repository and import into Vercel.
- [ ] Set Vercel environment variables for Production, Preview and Development as appropriate.
- [ ] Add Vercel URL to Supabase Auth Site URL and Redirect URLs.
- [ ] Test login, logout, access control, upload, refresh, mobile layout and backup/restore.
- [ ] Obtain IT/security approval before sharing the public URL.
