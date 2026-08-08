import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { AuthField, AuthLayout } from "@/components/january/AuthLayout";
import { updatePassword } from "@/hooks/useAuth";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new JANUARY password" },
      {
        name: "description",
        content: "Choose a new password for your JANUARY intelligent workspace account.",
      },
      { property: "og:title", content: "Set a new JANUARY password" },
      {
        property: "og:description",
        content: "Complete your password reset and return to the JANUARY workspace.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <AuthLayout>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (password !== confirm) {
            setError("Passwords do not match");
            return;
          }
          setBusy(true);
          try {
            await updatePassword(password);
            navigate({ to: "/dashboard" });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update password");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">New Password</h2>
          <p className="mt-1 text-xs text-muted-foreground">Choose a strong new password</p>
        </div>

        <AuthField label="New Password" icon={KeyRound} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a new password" />
        <AuthField label="Confirm Password" icon={ShieldCheck} type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter the password" />

        {error ? <p className="text-[11.5px] text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="amber-gradient glow-ring flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Update Password
        </button>
      </form>
    </AuthLayout>
  );
}
