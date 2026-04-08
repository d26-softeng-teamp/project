import type { AppRouter } from "@myapp/api/routers";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient(getToken: () => Promise<string | null>) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${import.meta.env.VITE_API_URL}/trpc`,
        async headers() {
          const token = await getToken();
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
