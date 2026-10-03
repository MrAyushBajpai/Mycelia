import { createBrowserClient } from "@supabase/ssr"

// Standard unauthenticated client (public reads, Clerk-Supabase integration handles RLS)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Clerk-authenticated client: injects Clerk JWT so Supabase RLS sees auth.uid() = clerk user id
export async function createAuthenticatedClient(getToken: () => Promise<string | null>) {
  const token = await getToken()
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  )
}
