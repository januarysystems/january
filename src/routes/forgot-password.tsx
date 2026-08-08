import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Mail, SendHorizonal } from "lucide-react";
import { useState } from "react";

import { AuthField, AuthLayout } from "@/components/january/AuthLayout";
import { requestPasswordReset } from "@/hooks/useAuth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your JANUARY password" },
      {
        name: "description",
        content: "Request a password reset link for your JANUARY intelligent workspace account.",
      },
      { property: "og:title", content: "Reset your JANUARY password" },
      {
        property: "og:description",
        content: "Send yourself a reset link and get back into your JANUARY workspace.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <AuthLayout>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setBusy(true);
          try {
            await requestPasswordReset(email);
            setSent(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to send reset link");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">Forgot Password?</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
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

        {sent ? (
          <p className="text-[11.5px] text-ok">Reset link sent. Check your inbox.</p>
        ) : null}
        {error ? <p className="text-[11.5px] text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="amber-gradient glow-ring flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Reset Password <SendHorizonal className="size-4" />
        </button>

        <Link
          to="/"
          className="flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground transition-colors hover:text-amber"
        >
          <ArrowLeft className="size-3.5" /> Back to Login
        </Link>
      </form>
    </AuthLayout>
  );
}
