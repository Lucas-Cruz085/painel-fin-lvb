import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAuthConfig } from "@/lib/auth/server";

let cliente: SupabaseClient | null = null;
let pendente: Promise<SupabaseClient | null> | null = null;

export async function obterCliente() {
  if (cliente) return cliente;
  if (!pendente) {
    pendente = (async () => {
      try {
        const { url, publishableKey } = await getAuthConfig();
        if (!url || !publishableKey) return null;
        cliente = createClient(url, publishableKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        });
        return cliente;
      } catch (error) {
        pendente = null;
        throw error;
      }
    })();
  }
  return pendente;
}