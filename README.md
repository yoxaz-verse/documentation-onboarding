# OBAOL Operator Onboarding Portal

This project provides a full onboarding and training flow with:

- Custom SMTP Email OTP login (no password auth)
- Server-side HTTP-only session cookies
- Sectioned onboarding progression (Onboarding + Courses)
- Embedded Typebot profile form
- Sequential course modules with required per-video quiz pass
- In-app Step 3 email credential submission (encrypted at rest)
- Final completion submission with stored completion code
- Supabase as onboarding data store keyed by operator email
- Admin dashboard with env-based credentials and operator progress reporting

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

3. Apply Supabase migrations in order:

- `supabase/migrations/20260529_smtp_otp_email_keyed.sql`
- `supabase/migrations/20260529_email_keyed_rls_idempotent.sql`
- `supabase/migrations/20260529_operator_profiles.sql`
- `supabase/migrations/20260529_operator_profiles_backfill.sql`
- `supabase/migrations/20260530_operator_profiles_experience_fields.sql`
- `supabase/migrations/20260530_operator_credentials.sql`
- `supabase/migrations/20260601_course_submodule_state.sql`
- `supabase/migrations/20260602_operator_profiles_email_fk_reconciliation.sql`
- `supabase/migrations/20260603_operator_onboarding_profile_fields.sql`
- `supabase/migrations/20260603_operator_progress_10_step_range.sql`
- `supabase/migrations/20260608_onboarding_step_swap_guard.sql`
- `supabase/migrations/20260616_operator_journey_milestones.sql`

Do not apply `supabase/migrations/20260527_operator_onboarding.sql` to an existing
email-keyed database. That migration targets the older `auth.users` / `user_id`
schema and is superseded by `20260529_smtp_otp_email_keyed.sql`.

If you use Supabase CLI, prefer running all pending migrations with:

```bash
supabase db push
```

If your environment already deployed the 11-step onboarding flow with registration before
email setup, run the guarded progress remap once after applying migrations:

```bash
npm run migrate:onboarding-registration-step
```

4. Run the dev server:

```bash
pnpm dev
```

## Environment Variables

Create `.env.local` with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SESSION_SECRET`
- `CREDENTIALS_ENCRYPTION_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET` (optional, falls back to `SESSION_SECRET`)

## Admin Panel

- Admin routes are under `/admin`.
- Admin authentication is fully separate from operator OTP auth and uses its own cookie (`obaol_admin_session`).
- Access is controlled by env credentials only (`ADMIN_USERNAME`/`ADMIN_PASSWORD`).
- v1 is read-only and includes:
  - Overview KPIs and completion funnel
  - Searchable/paginated operator list
  - Per-operator detail drill-down (profile, progress, quiz summary, submission)

### Security Notes

- Use long, random values for `SESSION_SECRET` and `ADMIN_SESSION_SECRET`.
- Use a strong `ADMIN_PASSWORD` and rotate it periodically.
- Keep `.env.local` out of source control.

## Troubleshooting

If the profile page shows:

- `Could not find the table 'public.operator_profiles' in the schema cache`

your database is missing one or more migrations. Run all pending migrations (recommended):

```bash
supabase db push
```

or manually apply the SQL files in `supabase/migrations/` in filename order.
