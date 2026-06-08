import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MIGRATION_FUNCTION = 'run_onboarding_step_7_8_swap';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const { data, error } = await supabaseAdmin.rpc(MIGRATION_FUNCTION);

  if (error) {
    const message = String(error.message || error);
    if (message.toLowerCase().includes(MIGRATION_FUNCTION.toLowerCase())) {
      console.error(`Missing database function "${MIGRATION_FUNCTION}". Apply the latest Supabase migrations first, then rerun this command.`);
      process.exit(1);
    }

    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    console.log('Migration returned no result. No onboarding progress rows were changed.');
    return;
  }

  if (result.already_ran) {
    console.log('Onboarding Step 7/8 remap already completed earlier. No changes applied.');
    return;
  }

  console.log(`Remapped ${Number(result.affected_count || 0)} operator_progress rows for the Step 7/8 order change.`);
  console.log('This migration is guarded in the database and is safe to rerun.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
