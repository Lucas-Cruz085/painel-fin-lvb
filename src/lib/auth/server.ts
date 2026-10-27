import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const getAuthConfig = createServerFn({ method: "GET" }).handler(async () => {
  return {
    url: process.env["SUPABASE_URL"] ?? "",
    publishableKey: process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "",
  };
});

export const concluirPrimeiroAcesso = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const token =
      data != null && typeof data === "object" && "accessToken" in data
        ? (data as { accessToken?: unknown }).accessToken
        : undefined;
    if (typeof token !== "string" || token.length < 10) {
      throw new Error("Sessão inválida.");
    }
    return { accessToken: token };
  })
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"];
    const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !serviceKey) return { ok: false as const };

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error } = await admin.auth.getUser(data.accessToken);
    if (error || !userData.user) return { ok: false as const };

    const user = userData.user;
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, must_change_password: false },
      user_metadata: { ...user.user_metadata, must_change_password: false },
    });
    if (updateError) return { ok: false as const };
    await admin.from("profiles").update({ must_change_password: false }).eq("id", user.id);
    return { ok: true as const };
  });