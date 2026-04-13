import { LoginLayout } from "@myapp/ui/components/login-layout";
import { TextInput } from "@myapp/ui/components/text-input";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";

function LoginFormPage({ bannerText }: { bannerText?: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = trpc.login.login.useMutation({
    async onSuccess(data) {
      if (!data?.session) return;
      const { error } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (error) {
        console.error("[login] setSession:", error);
        return;
      }
      navigate("/hero", { replace: true });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <LoginLayout title="Sign in" subtitle="Sign in with your Hanover account.">
      <div className="rounded-2xl border border-white/25 bg-card/95 p-8 text-card-foreground shadow-2xl shadow-black/20 backdrop-blur-md dark:border-white/10 dark:shadow-black/35">
        {bannerText ? (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {bannerText}
          </div>
        ) : null}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextInput
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {login.isError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {login.error?.message ?? "Sign in failed."}
            </div>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-hanover-green py-3 font-semibold text-white shadow-md shadow-hanover-green/25 transition-colors hover:bg-hanover-green/90 disabled:opacity-60"
          >
            {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>
      </div>
    </LoginLayout>
  );
}

export default LoginFormPage;
