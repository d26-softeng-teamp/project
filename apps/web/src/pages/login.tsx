import { LoginLayout } from "@myapp/ui/components/login-layout";
import { TextInput } from "@myapp/ui/components/text-input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";

function LoginFormPage({ bannerText }: { bannerText?: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="rounded-2xl border border-white/25 bg-card/95 p-8 text-card-foreground shadow-2xl shadow-black/20 backdrop-blur-md transition-shadow duration-300 hover:shadow-black/30 dark:border-white/10 dark:shadow-black/35">
        {bannerText ? (
          <div className="mb-6 animate-fade-in-down rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-border bg-background px-4 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-hanover-green"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {login.isError && (
            <div className="animate-fade-in-down rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {login.error?.message ?? "Sign in failed."}
            </div>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-hanover-green py-3 font-semibold text-white shadow-md shadow-hanover-green/25 transition-all duration-200 hover:bg-hanover-green/90 hover:shadow-lg hover:shadow-hanover-green/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hanover-deepblue"
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
