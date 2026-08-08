import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

import { AuthField, AuthLayout } from "@/components/january/AuthLayout";
import { signUp } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your JANUARY account" },
      {
        name: "description",
        content:
          "Sign up for JANUARY and get an AI workspace for automation, simulation, IoT and robotics.",
      },
      { property: "og:title", content: "Create your JANUARY account" },
      {
        property: "og:description",
        content: "Join JANUARY — the premium AI operating system for builders and engineers.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthLayout>
      {sent ? (
        <div className="space-y-3 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">Check your email</h2>
          <p className="text-xs text-muted-foreground">
            We sent a confirmation link to <span className="text-amber">{form.email}</span>. Confirm
            it to activate your JANUARY workspace.
          </p>
          <Link to="/" className="inline-block text-[11.5px] text-amber hover:underline">
            Back to login
          </Link>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            if (form.password !== form.confirm) {
              setError("Passwords do not match");
              return;
            }
            if (form.password.length < 6) {
              setError("Password must be at least 6 characters");
              return;
            }
            setBusy(true);
            try {
              await signUp(form.email, form.password, form.name);
              const { data } = await supabase.auth.getSession();
              if (data.session) navigate({ to: "/dashboard" });
              else setSent(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Unable to sign up");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-foreground">Create Account</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Start building with January in seconds
            </p>
          </div>

          <AuthField label="Full Name" icon={User} required value={form.name} onChange={set("name")} placeholder="Enter your full name" />
          <AuthField label="Email Address" icon={Mail} type="email" required value={form.email} onChange={set("email")} placeholder="Enter your email" />
          <AuthField label="Password" icon={Lock} type="password" required value={form.password} onChange={set("password")} placeholder="Create a password" />
          <AuthField label="Confirm Password" icon={ShieldCheck} type="password" required value={form.confirm} onChange={set("confirm")} placeholder="Re-enter your password" />

          {error ? <p className="text-[11.5px] text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="amber-gradient glow-ring flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Create Account <ArrowRight className="size-4" />
          </button>

          <p className="text-center text-[11.5px] text-muted-foreground">
            Already have an account?{" "}
            <Link to="/" className="font-medium text-amber hover:underline">
              Log In
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
