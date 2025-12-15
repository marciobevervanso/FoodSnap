import { createClient } from "@supabase/supabase-js";

// Credentials provided in the prompt
const SUPABASE_URL = "https://mnhgpnqkwuqzpvfrwftp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaGdwbnFrd3VxenB2ZnJ3ZnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MTk4NTUsImV4cCI6MjA4MTI5NTg1NX0.DBYmhgiZoCmA0AlejJRsTh85HxRDEnG_ihkEQ2cXcpk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);