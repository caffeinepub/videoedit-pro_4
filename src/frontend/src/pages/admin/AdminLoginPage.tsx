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
import {
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useVerifyAdminPasskey } from "../../hooks/useQueries";
import {
  authenticateFingerprint,
  hasFingerprintRegistered,
  isWebAuthnSupported,
} from "../../hooks/useWebAuthn";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);
  // track whether we're waiting for II login to complete before doing bypass
  const pendingBypassRef = useRef(false);

  const { identity, login, loginStatus, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const verifyPasskey = useVerifyAdminPasskey();
  const { actor } = useActor();
  const navigate = useNavigate();

  const fingerprintAvailable =
    isWebAuthnSupported() && hasFingerprintRegistered();

  const doNavigate = () => {
    sessionStorage.setItem("adminAuthenticated", "true");
    toast.success("Welcome to the Admin Portal");
    navigate({ to: "/admin" });
  };

  // When actor becomes available after a pending bypass, run the check
  useEffect(() => {
    if (!pendingBypassRef.current || !actor) return;
    pendingBypassRef.current = false;

    void (async () => {
      setBypassLoading(true);
      try {
        const isAdmin = await actor.isCallerAdmin();
        if (isAdmin) {
          sessionStorage.setItem("adminAuthenticated", "true");
          toast.success(
            "You're in — please set your admin email and password in the Security tab.",
            { duration: 6000 },
          );
          navigate({ to: "/admin" });
        } else {
          setError(
            "Only the app admin can reset credentials. Make sure you sign in with the same Internet Identity account that owns this app.",
          );
          setBypassLoading(false);
        }
      } catch {
        setError("Could not verify admin identity. Please try again.");
        setBypassLoading(false);
      }
    })();
  }, [actor, navigate]);

  const handleForgotPasskey = async () => {
    setError(null);

    if (!isAuthenticated) {
      // Need to login with Internet Identity first, then the useEffect above will run
      pendingBypassRef.current = true;
      setBypassLoading(true);
      login();
      return;
    }

    // Already authenticated — check directly via actor
    if (!actor) {
      setError("Actor not ready. Please wait a moment and try again.");
      return;
    }

    setBypassLoading(true);
    try {
      const isAdmin = await actor.isCallerAdmin();
      if (isAdmin) {
        sessionStorage.setItem("adminAuthenticated", "true");
        toast.success(
          "You're in — please set your admin email and password in the Security tab.",
          { duration: 6000 },
        );
        navigate({ to: "/admin" });
      } else {
        setError(
          "Only the app admin can reset credentials. Make sure you sign in with the same Internet Identity account that owns this app.",
        );
      }
    } catch {
      setError("Could not verify admin identity. Please try again.");
    } finally {
      setBypassLoading(false);
    }
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

  const handleSignIn = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Please enter your admin email address.");
      return;
    }
    if (!password) {
      setError("Please enter your admin password.");
      return;
    }
    try {
      const isValid = await verifyPasskey.mutateAsync(
        `${email.trim()}:${password}`,
      );
      if (isValid) {
        doNavigate();
      } else if (actor) {
        // Check if this is admin with no credentials set (first-time setup or after redeploy)
        const isAdmin = await actor.isCallerAdmin();
        if (isAdmin) {
          sessionStorage.setItem("adminAuthenticated", "true");
          toast.success(
            "You're in — please set your admin email and password in the Security tab.",
            { duration: 7000 },
          );
          navigate({ to: "/admin" });
        } else {
          setError("Incorrect email or password.");
        }
      } else {
        setError("Incorrect email or password.");
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
                : "Enter your admin email and password to access the portal."}
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
                  disabled={isLoggingIn || bypassLoading}
                >
                  {isLoggingIn || (bypassLoading && !isAuthenticated) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign in with Internet Identity"
                  )}
                </Button>

                {/* Forgot credentials — visible even before II login */}
                <div className="pt-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">
                      forgot credentials?
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    data-ocid="admin_login.forgot_passkey.button"
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-border text-muted-foreground hover:text-foreground hover:border-primary/40 font-display text-sm"
                    onClick={handleForgotPasskey}
                    disabled={bypassLoading || isLoggingIn}
                  >
                    {bypassLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying identity…
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Reset credentials via Internet Identity
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Sign in with Internet Identity to verify you are the app
                    admin, then reset your credentials in the Security tab.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Email + Password flow */}
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
                        or sign in with email and password
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="admin-email"
                      className="text-sm font-medium"
                    >
                      Admin Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="admin-email"
                        data-ocid="admin_login.email.input"
                        type="email"
                        placeholder="your@gmail.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        className="bg-input border-border focus:border-primary pl-10"
                        autoFocus={!fingerprintAvailable}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="admin-password"
                      className="text-sm font-medium"
                    >
                      Admin Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="admin-password"
                        data-ocid="admin_login.password.input"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSignIn();
                        }}
                        className="bg-input border-border focus:border-primary pl-10"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

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
                    data-ocid="admin_login.signin.button"
                    type="button"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2"
                    onClick={handleSignIn}
                    disabled={
                      verifyPasskey.isPending || !email.trim() || !password
                    }
                  >
                    {verifyPasskey.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Forgot credentials bypass */}
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">
                      forgot credentials?
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    data-ocid="admin_login.forgot_passkey.button"
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-border text-muted-foreground hover:text-foreground hover:border-primary/40 font-display text-sm"
                    onClick={handleForgotPasskey}
                    disabled={bypassLoading}
                  >
                    {bypassLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying identity…
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Reset credentials via Internet Identity
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    If you are the app admin, this will let you set a new email
                    and password in the Security tab.
                  </p>
                </div>
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
