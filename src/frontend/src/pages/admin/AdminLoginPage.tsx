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
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useSetAdminPasskey,
  useVerifyAdminPasskey,
} from "../../hooks/useQueries";
import {
  authenticateFingerprint,
  hasFingerprintRegistered,
  isWebAuthnSupported,
} from "../../hooks/useWebAuthn";

const ADMIN_EMAIL = "Vijayanr181@gmail.com";

export function AdminLoginPage() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  // After II bypass succeeds, show a "set new credentials" form instead of going straight to admin
  const [showSetCredentials, setShowSetCredentials] = useState(false);
  const [newEmail, setNewEmail] = useState(ADMIN_EMAIL);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  // track whether we're waiting for II login to complete before doing bypass
  const pendingBypassRef = useRef(false);
  // track whether we're waiting for II login to complete before re-trying sign-in
  const pendingSignInRef = useRef(false);
  // Store latest email/password in refs so the actor useEffect can access them without deps
  const emailRef = useRef(ADMIN_EMAIL);
  const passwordRef = useRef("");

  const { identity, login, loginStatus, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const verifyPasskey = useVerifyAdminPasskey();
  const setAdminPasskey = useSetAdminPasskey();
  const { actor } = useActor();
  const navigate = useNavigate();

  const fingerprintAvailable =
    isWebAuthnSupported() && hasFingerprintRegistered();

  // Keep refs in sync with state
  emailRef.current = email;
  passwordRef.current = password;

  const doNavigate = () => {
    sessionStorage.setItem("adminAuthenticated", "true");
    toast.success("Welcome to the Admin Portal");
    navigate({ to: "/admin" });
  };

  // When actor becomes available after a pending bypass or pending sign-in, run the relevant check
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional – all other values read via stable refs
  useEffect(() => {
    if (!actor) return;

    // Pending bypass: verify II identity and show reset form
    if (pendingBypassRef.current) {
      pendingBypassRef.current = false;
      void (async () => {
        setBypassLoading(true);
        try {
          const isAdmin = await actor.isCallerAdmin();
          if (isAdmin) {
            setShowSetCredentials(true);
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
      })();
      return;
    }

    // Pending sign-in: try passkey again, then fall back to isCallerAdmin
    if (pendingSignInRef.current) {
      pendingSignInRef.current = false;
      const savedEmail = emailRef.current;
      const savedPassword = passwordRef.current;
      void (async () => {
        setLoginLoading(true);
        try {
          const combinedKey = `${savedEmail.trim()}:${savedPassword}`;
          const isValid = await verifyPasskey.mutateAsync(combinedKey);
          if (isValid) {
            doNavigate();
            return;
          }
          // Passkey may be null after redeploy — check if caller is admin
          const isAdmin = await actor.isCallerAdmin();
          if (isAdmin) {
            // Auto-open reset form so they can set credentials
            setShowSetCredentials(true);
            toast.info(
              "Credentials were reset after a redeploy. Please set a new password.",
              { duration: 6000 },
            );
          } else {
            setError("Incorrect email or password.");
          }
        } catch {
          setError("Verification failed. Please try again.");
        } finally {
          setLoginLoading(false);
        }
      })();
    }
  }, [actor]);

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
        setShowSetCredentials(true);
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

  const handleSaveNewCredentials = async () => {
    setSaveError(null);
    if (!newEmail.trim()) {
      setSaveError("Please enter your new admin email.");
      return;
    }
    if (!newPassword) {
      setSaveError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSaveError("Passwords do not match.");
      return;
    }
    try {
      await setAdminPasskey.mutateAsync(`${newEmail.trim()}:${newPassword}`);
      sessionStorage.setItem("adminAuthenticated", "true");
      toast.success("Credentials saved! Welcome to the Admin Portal.");
      navigate({ to: "/admin" });
    } catch {
      setSaveError("Failed to save credentials. Please try again.");
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

    setLoginLoading(true);

    try {
      const combinedKey = `${email.trim()}:${password}`;
      const isValid = await verifyPasskey.mutateAsync(combinedKey);
      if (isValid) {
        doNavigate();
        return;
      }

      // Passkey may be null (after redeploy). If actor is ready, check isCallerAdmin.
      if (actor) {
        const isAdmin = await actor.isCallerAdmin();
        if (isAdmin) {
          // Auto-open reset form
          setShowSetCredentials(true);
          toast.info(
            "Credentials were reset after a redeploy. Please set your new password.",
            { duration: 6000 },
          );
        } else {
          // Not signed in with II yet — prompt II login then re-check
          setError(
            "Credentials not found. This can happen after a redeploy. Sign in with Internet Identity to reset your credentials.",
          );
        }
      } else {
        // Actor not ready — trigger II login if not authenticated, then retry
        if (!isAuthenticated) {
          pendingSignInRef.current = true;
          login();
        } else {
          setError("Incorrect email or password.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoginLoading(false);
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
            <CardTitle className="font-display text-lg">
              {showSetCredentials ? "Set New Admin Credentials" : "Sign in"}
            </CardTitle>
            <CardDescription>
              {showSetCredentials
                ? "Identity verified. Set a new email and password for admin login."
                : !isAuthenticated
                  ? "Sign in with your admin email and password."
                  : "Enter your admin email and password to access the portal."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Set new credentials after II bypass */}
            {showSetCredentials && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Identity verified via Internet Identity. Set your new login
                    credentials below.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="new-admin-email"
                    className="text-sm font-medium"
                  >
                    New Admin Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-admin-email"
                      data-ocid="admin_reset.email.input"
                      type="email"
                      placeholder="your@gmail.com"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setSaveError(null);
                      }}
                      className="bg-input border-border focus:border-primary pl-10"
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="new-admin-password"
                    className="text-sm font-medium"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-admin-password"
                      data-ocid="admin_reset.password.input"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setSaveError(null);
                      }}
                      className="bg-input border-border focus:border-primary pl-10"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-admin-password"
                    className="text-sm font-medium"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-admin-password"
                      data-ocid="admin_reset.confirm_password.input"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setSaveError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveNewCredentials();
                      }}
                      className="bg-input border-border focus:border-primary pl-10"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {saveError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    data-ocid="admin_reset.error_state"
                    className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2"
                  >
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    {saveError}
                  </motion.p>
                )}

                <Button
                  data-ocid="admin_reset.save.button"
                  type="button"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2"
                  onClick={handleSaveNewCredentials}
                  disabled={
                    setAdminPasskey.isPending ||
                    !newEmail.trim() ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {setAdminPasskey.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save & Enter Admin Portal
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Email + Password flow (shown once II is authenticated or not yet needed) */}
            {!showSetCredentials && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Step 1: II login prompt (only when not yet authenticated) */}
                {!isAuthenticated && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground">
                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                    <p>
                      Sign in with Internet Identity to enable all admin
                      features.{" "}
                      <button
                        type="button"
                        className="text-primary underline hover:no-underline font-medium"
                        onClick={login}
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? "Signing in…" : "Sign in now"}
                      </button>
                    </p>
                  </div>
                )}

                {/* Fingerprint button — shown when registered and II authenticated */}
                {fingerprintAvailable && isAuthenticated && (
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
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      data-ocid="admin_login.error_state"
                      className="rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2 space-y-2"
                    >
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                        {error}
                      </p>
                      {/* If credentials not found (post-redeploy), offer quick reset */}
                      {error.includes("reset") && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full gap-2 text-xs border-destructive/30 text-destructive hover:bg-destructive/5"
                          onClick={handleForgotPasskey}
                          disabled={bypassLoading || isLoggingIn}
                        >
                          {bypassLoading || isLoggingIn ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Verifying…
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              Reset credentials via Internet Identity
                            </>
                          )}
                        </Button>
                      )}
                    </motion.div>
                  )}

                  <Button
                    data-ocid="admin_login.signin.button"
                    type="button"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2"
                    onClick={handleSignIn}
                    disabled={
                      loginLoading ||
                      verifyPasskey.isPending ||
                      !email.trim() ||
                      !password
                    }
                  >
                    {loginLoading || verifyPasskey.isPending ? (
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

                {/* Forgot / Reset credentials */}
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">
                      forgot credentials?
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Post-redeploy warning */}
                  <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-1">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      After every redeploy, credentials reset
                    </p>
                    <p className="text-xs text-muted-foreground">
                      If login fails after a new version is deployed, click the
                      button below to verify your identity and set a fresh
                      password.
                    </p>
                  </div>

                  {/* Admin credentials hint box */}
                  <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Saved Admin Credentials
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          Email:
                        </span>
                        <span className="text-xs font-mono font-medium text-foreground select-all">
                          {ADMIN_EMAIL}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          Password:
                        </span>
                        <span className="text-xs font-mono font-medium text-foreground select-all">
                          Vij9633188098
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    data-ocid="admin_login.forgot_passkey.button"
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-border text-muted-foreground hover:text-foreground hover:border-primary/40 font-display text-sm"
                    onClick={handleForgotPasskey}
                    disabled={bypassLoading || isLoggingIn}
                  >
                    {bypassLoading || isLoggingIn ? (
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
                    Verify you are the app admin via Internet Identity, then set
                    a new email and password right here.
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
