import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
  const { data: user, error: authError } = await supabase.auth.admin.createUser({
    email: "admin@inspiration-ai.com",
    password: "Inssigma@2",
    email_confirm: true,
  });

  if (authError) {
    console.error("Auth error:", authError.message);
    process.exit(1);
  }

  console.log("User created:", user.user.id);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.user.id);

  if (profileError) {
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: user.user.id, role: "admin", email: "admin@inspiration-ai.com" });

    if (upsertError) {
      console.error("Upsert error:", upsertError.message);
      process.exit(1);
    }
  }

  console.log("Admin role set successfully");
}

createAdmin();
