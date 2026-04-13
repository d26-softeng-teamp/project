import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import { prisma } from "./lib/prisma";
import { createSupabaseClient } from "./lib/supabase";

/**
 * Inner context builder — adapter-agnostic. Takes an auth token directly.
 */
async function createContextInner(authToken: string | null) {
  const supabase = createSupabaseClient();

  let user = null;

  if (authToken) {
    try {
      const { data, error } = await supabase.auth.getUser(authToken);
      if (error) {
        console.warn("[context] auth.getUser:", error.message);
      } else {
        user = data.user;
      }
    } catch (err) {
      console.warn("[context] auth.getUser failed:", err);
    }
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
 * Context for the standalone Node.js dev server (IncomingMessage).
 */
export async function createContext({ req }: CreateHTTPContextOptions) {
  const authHeader = req.headers.authorization;
  return createContextInner(extractBearerToken(authHeader));
}

export type Context = Awaited<ReturnType<typeof createContextInner>>;
