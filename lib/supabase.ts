import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mnhgpnqkwuqzpvfrwftp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaGdwbnFrd3VxenB2ZnJ3ZnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MTk4NTUsImV4cCI6MjA4MTI5NTg1NX0.DBYmhgiZoCmA0AlejJRsTh85HxRDEnG_ihkEQ2cXcpk";

/**
 * Ajustes para migração HashRouter -> BrowserRouter
 * - PKCE: evita conflitos com URL hash/fragment e é o fluxo recomendado para SPAs
 * - detectSessionInUrl: permite capturar o retorno do OAuth
 * - persistSession/autoRefreshToken: mantém a sessão estável em refresh/reabertura
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
