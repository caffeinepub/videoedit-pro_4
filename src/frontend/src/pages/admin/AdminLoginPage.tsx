import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Fingerprint, Loader2, Lock, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useVerifyAdminPasskey } from "../../hooks/useQueries";
import {
  authenticateFingerprint,
  hasFingerprintRegistered,
  isWebAuthnSupported,
} from "../../hooks/useWebAuthn";

export function AdminLoginPage() {
  const [passkey, setPasskey] = useState("");
  const [showPasskey, setShowPasskey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);

  const { identity, login, loginStatus, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const verifyPasskey = useVerifyAdminPasskey();
  const navigate = useNavigate();

  const fingerprintAvailable =
    isWebAuthnSupported() && hasFingerprintRegistered();

  const doNavigate = () => {
    sessionStorage.setItem("adminAuthenticated", "true");
    toast.success("Welcome to the Admin Portal");
    navigate({ to: "/admin" });
  };

  const handleFingerprintLogin = async () => {
    setError(null);
    setFingerprintLoading(true);
    try {
      const storedPasskey = await authenticateFingerprint();
      const isValid = await verifyPasskey.mutateAsync(storedPasskey);
      if (isValid) {
        doNavigate();
      } else {
        setError(
          "Fingerprint verified but passkey mismatch. Try re-registering your fingerprint in the Security tab.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Fingerprint authentication failed.",
      );
    } finally {
      setFingerprintLoading(false);
    }
  };

  const handlePasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;

    setError(null);
    try {
      const isValid = await verifyPasskey.mutateAsync(passkey.trim());
      if (isValid) {
        doNavigate();
      } else {
        setError("Incorrect passkey. Try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-mono">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      {/* Background accent */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/3 blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        {/* Icon header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight mb-1">
            Admin Portal
          </h1>
          <p className="text-muted-foreground text-sm">
            Restricted access — authorised personnel only
          </p>
        </div>

        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">Sign in</CardTitle>
            <CardDescription>
              {!isAuthenticated
                ? "You must sign in first, then verify your identity."
                : fingerprintAvailable
                  ? "Use your fingerprint or enter your passkey."
                  : "Enter your admin passkey to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1 — Internet Identity */}
            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                  <p>
                    You need to sign in with your Internet Identity account
                    before accessing the admin section.
                  </p>
                </div>
                <Button
                  data-ocid="admin_login.signin_button"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2"
                  onClick={login}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign in with Internet Identity"
                  )}
                </Button>
              </motion.div>
            )}

            {/* Step 2 — Fingerprint or Passkey */}
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Fingerprint button — shown when registered */}
                {fingerprintAvailable && (
                  <div className="space-y-3">
                    <Button
                      data-ocid="admin_login.fingerprint_button"
                      type="button"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2 h-12 text-base"
                      onClick={handleFingerprintLogin}
                      disabled={fingerprintLoading || verifyPasskey.isPending}
                    >
                      {fingerprintLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Scanning…
                        </>
                      ) : (
                        <>
                          <Fingerprint className="w-5 h-5" />
                          Login with Fingerprint
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground">
                        or use passkey
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                )}

                {/* Passkey form */}
                <form onSubmit={handlePasskeySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="passkey"
                      className="text-sm font-medium flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      Admin Passkey
                    </Label>
                    <div className="relative">
                      <Input
                        id="passkey"
                        data-ocid="admin_login.passkey.input"
                        type={showPasskey ? "text" : "password"}
                        placeholder="Enter passkey…"
                        value={passkey}
                        onChange={(e) => {
                          setPasskey(e.target.value);
                          if (error) setError(null);
                        }}
                        className="pr-10 bg-input border-border focus:border-primary"
                        autoFocus={!fingerprintAvailable}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasskey((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showPasskey ? "Hide passkey" : "Show passkey"
                        }
                      >
                        {showPasskey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error state */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      data-ocid="admin_login.error_state"
                      className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2"
                    >
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </motion.p>
                  )}

                  <Button
                    data-ocid="admin_login.submit_button"
                    type="submit"
                    className="w-full bg-primary/80 text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2"
                    disabled={verifyPasskey.isPending || !passkey.trim()}
                  >
                    {verifyPasskey.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Continue with Passkey
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Not an admin?{" "}
          <a href="/" className="text-primary hover:underline">
            Return to home
          </a>
        </p>
      </motion.div>
    </div>
  );
}
