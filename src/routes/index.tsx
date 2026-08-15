import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthField, AuthLayout } from "@/components/january/AuthLayout";
import { signIn, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JANUARY — Login to your intelligent workspace" },
      {
        name: "description",
        content:
          "Sign in to JANUARY, the premium AI operating system for automation, simulations, IoT and robotics.",
      },
      { property: "og:title", content: "JANUARY — Your Intelligent Assistant" },
      {
        property: "og:description",
        content: "Login to the JANUARY AI workspace for automation, simulation and robotics.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) {
      // Small delay to ensure session is fully established
      const timer = setTimeout(() => {
        navigate({ to: "/dashboard", replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [session, navigate]);

  return (
    <AuthLayout>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setBusy(true);
          try {
            await signIn(email, password);

            // Wait for session to be established
            await new Promise(resolve => setTimeout(resolve, 500));

            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
              navigate({ to: "/dashboard", replace: true });
            } else {
              setError("Login successful, but session not established. Please try again.");
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to sign in");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">Welcome Back!</h2>
          <p className="mt-1 text-xs text-muted-foreground">Login to continue to your workspace</p>
        </div>

        <AuthField
          label="Email Address"
          icon={Mail}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <AuthField
          label="Password"
          icon={Lock}
          type={show ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          trailing={
            <button
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShow((v) => !v)}
              className="text-muted-foreground transition-colors hover:text-amber"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
        />

        {error ? <p className="text-[11.5px] text-danger">{error}</p> : null}

        <div className="flex items-center justify-between text-[11.5px]">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="size-3.5 accent-[var(--amber)]" aria-label="Remember me" />
            Remember Me
          </label>
          <Link to="/forgot-password" className="text-amber hover:underline">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="amber-gradient glow-ring flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Log In <ArrowRight className="size-4" />
        </button>

        <p className="text-center text-[11.5px] text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-amber hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
