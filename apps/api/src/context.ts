import { createClient } from "@supabase/supabase-js";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { prisma } from "./lib/prisma";

/**
 * Inner context builder — adapter-agnostic. Takes an auth token directly.
 */
async function createContextInner(authToken: string | null) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

  let user = null;

  if (authToken) {
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser(authToken);
    user = supabaseUser;
  }

  return { supabase, prisma, user };
}

/**
 * Extract Bearer token from an authorization header value.
 */
function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/**
 * Context for Express requests.
 */
export async function createContext({ req }: CreateExpressContextOptions) {
  const authHeader = req.headers.authorization;
  return createContextInner(extractBearerToken(authHeader));
}

export type Context = Awaited<ReturnType<typeof createContextInner>>;
