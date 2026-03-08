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
  Timer,
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

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function AdminLoginPage() {
  // Step: "ii-gate" | "email" | "otp" | "set-credentials"
  const [step, setStep] = useState<
    "ii-gate" | "email" | "otp" | "set-credentials"
  >("ii-gate");

  // Email step
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // OTP step
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set credentials (after II bypass)
  const [newEmail, setNewEmail] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fingerprint + bypass state
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);
  const pendingBypassRef = useRef(false);

  const { identity, login, loginStatus, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  // Advance past the II gate once the user successfully authenticates
  useEffect(() => {
    if (isAuthenticated && step === "ii-gate") {
      setStep("email");
    }
  }, [isAuthenticated, step]);

  const verifyPasskey = useVerifyAdminPasskey();
  const setAdminPasskey = useSetAdminPasskey();
  const { actor } = useActor();
  const navigate = useNavigate();

  const fingerprintAvailable =
    isWebAuthnSupported() && hasFingerprintRegistered();

  const doNavigate = () => {
    sessionStorage.setItem("adminAuthenticated", "true");
    toast.success("Welcome to the Admin Portal");
    navigate({ to: "/admin" });
  };

  // OTP countdown timer — restart whenever step enters "otp"
  useEffect(() => {
    if (step !== "otp") return;
    setOtpSecondsLeft(OTP_EXPIRY_SECONDS);
    otpTimerRef.current = setInterval(() => {
      setOtpSecondsLeft((s) => {
        if (s <= 1) {
          if (otpTimerRef.current) clearInterval(otpTimerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    };
  }, [step]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // When actor becomes available after pending bypass
  useEffect(() => {
    if (!actor) return;
    if (pendingBypassRef.current) {
      pendingBypassRef.current = false;
      void (async () => {
        setBypassLoading(true);
        try {
          const isAdmin = await actor.isCallerAdmin();
          if (isAdmin) {
            setStep("set-credentials");
          } else {
            setEmailError(
              "Only the app admin can reset credentials. Make sure you sign in with the same Internet Identity account that owns this app.",
            );
          }
        } catch {
          setEmailError("Could not verify admin identity. Please try again.");
        } finally {
          setBypassLoading(false);
        }
      })();
    }
  }, [actor]);

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    setEmailError(null);
    if (!email.trim()) {
      setEmailError("Please enter your admin email address.");
      return;
    }

    setEmailLoading(true);
    try {
      // Check if email matches stored admin email
      let emailMatch = false;
      let noCredentials = false;
      try {
        emailMatch = await verifyPasskey.mutateAsync(email.trim());
      } catch {
        // Error means no credentials set yet (first-time setup)
        noCredentials = true;
      }

      if (!noCredentials && !emailMatch) {
        setEmailError("This email is not registered as admin email.");
        return;
      }

      // Generate and show OTP
      const otp = generateOtp();
      setGeneratedOtp(otp);
      setEnteredOtp("");
      setOtpError(null);
      setStep("otp");
    } catch {
      setEmailError("Failed to verify email. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = () => {
    setOtpError(null);
    if (!enteredOtp.trim()) {
      setOtpError("Please enter the OTP.");
      return;
    }
    if (otpSecondsLeft === 0) {
      setOtpError("OTP has expired. Please request a new one.");
      return;
    }
    if (enteredOtp.trim() !== generatedOtp) {
      setOtpError("Incorrect OTP. Please try again.");
      return;
    }
    doNavigate();
  };

  // Resend OTP
  const handleResendOtp = () => {
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setEnteredOtp("");
    setOtpError(null);
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    setOtpSecondsLeft(OTP_EXPIRY_SECONDS);
    toast.success("New OTP generated.");
  };

  // Fingerprint login
  const handleFingerprintLogin = async () => {
    setEmailError(null);
    setFingerprintLoading(true);
    try {
      const storedPasskey = await authenticateFingerprint();
      const isValid = await verifyPasskey.mutateAsync(storedPasskey);
      if (isValid) {
        doNavigate();
      } else {
        setEmailError(
          "Fingerprint verified but passkey mismatch. Try re-registering your fingerprint in the Security tab.",
        );
      }
    } catch (err) {
      setEmailError(
        err instanceof Error
          ? err.message
          : "Fingerprint authentication failed.",
      );
    } finally {
      setFingerprintLoading(false);
    }
  };

  // Reset credentials via Internet Identity
  const handleForgotPasskey = async () => {
    setEmailError(null);
    if (!isAuthenticated) {
      pendingBypassRef.current = true;
      setBypassLoading(true);
      login();
      return;
    }
    if (!actor) {
      setEmailError("Actor not ready. Please wait a moment and try again.");
      return;
    }
    setBypassLoading(true);
    try {
      const isAdmin = await actor.isCallerAdmin();
      if (isAdmin) {
        setStep("set-credentials");
      } else {
        setEmailError(
          "Only the app admin can reset credentials. Make sure you sign in with the same Internet Identity account that owns this app.",
        );
      }
    } catch {
      setEmailError("Could not verify admin identity. Please try again.");
    } finally {
      setBypassLoading(false);
    }
  };

  // Save new email (from reset flow)
  const handleSaveNewEmail = async () => {
    setSaveError(null);
    if (!newEmail.trim()) {
      setSaveError("Please enter your new admin email.");
      return;
    }
    try {
      await setAdminPasskey.mutateAsync(newEmail.trim());
      sessionStorage.setItem("adminAuthenticated", "true");
      toast.success("Admin email saved! Welcome to the Admin Portal.");
      navigate({ to: "/admin" });
    } catch {
      setSaveError("Failed to save admin email. Please try again.");
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
              {step === "set-credentials"
                ? "Set New Admin Email"
                : step === "otp"
                  ? "Verify OTP"
                  : step === "ii-gate"
                    ? "Verify Identity"
                    : "Sign in"}
            </CardTitle>
            <CardDescription>
              {step === "set-credentials"
                ? "Identity verified. Set your new admin email address."
                : step === "otp"
                  ? "Enter the OTP shown below to access the admin portal."
                  : step === "ii-gate"
                    ? "You must sign in with Internet Identity before accessing the admin portal."
                    : "Enter your admin email to receive an OTP."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ── II Gate (must authenticate before email step) ── */}
            {step === "ii-gate" && (
              <motion.div
                key="ii-gate-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
                data-ocid="admin_login.ii_gate.panel"
              >
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Internet Identity required
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                      Admin access requires you to first verify your identity
                      with Internet Identity. This ensures only authorised
                      personnel can log in.
                    </p>
                  </div>
                </div>

                <Button
                  data-ocid="admin_login.ii_gate.button"
                  type="button"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2 h-11"
                  onClick={login}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Sign in with Internet Identity
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Not an admin?{" "}
                  <a href="/" className="text-primary hover:underline">
                    Return to home
                  </a>
                </p>
              </motion.div>
            )}

            {/* ── Set credentials (after II bypass) ── */}
            {step === "set-credentials" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Identity verified via Internet Identity. Set your new admin
                    email below.
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveNewEmail();
                      }}
                      className="bg-input border-border focus:border-primary pl-10"
                      autoFocus
                      autoComplete="email"
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
                  onClick={handleSaveNewEmail}
                  disabled={setAdminPasskey.isPending || !newEmail.trim()}
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

            {/* ── OTP step ── */}
            {step === "otp" && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* OTP display box */}
                <div className="flex flex-col items-center gap-2 p-5 rounded-xl bg-primary/5 border-2 border-primary/25">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    Your OTP
                  </p>
                  <p
                    className="font-mono text-4xl font-black tracking-[0.25em] text-primary select-all"
                    data-ocid="admin_login.otp.panel"
                  >
                    {generatedOtp}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Copy and enter this code below
                  </p>
                </div>

                {/* Countdown */}
                <div
                  className={`flex items-center justify-center gap-2 text-sm font-mono ${
                    otpSecondsLeft <= 60
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  {otpSecondsLeft > 0 ? (
                    <span>
                      OTP expires in{" "}
                      <strong>{formatCountdown(otpSecondsLeft)}</strong>
                    </span>
                  ) : (
                    <span className="text-destructive font-semibold">
                      OTP has expired
                    </span>
                  )}
                </div>

                {/* OTP input */}
                <div className="space-y-2">
                  <Label htmlFor="otp-input" className="text-sm font-medium">
                    Enter OTP
                  </Label>
                  <Input
                    id="otp-input"
                    data-ocid="admin_login.otp.input"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => {
                      setEnteredOtp(e.target.value.replace(/\D/g, ""));
                      if (otpError) setOtpError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleVerifyOtp();
                    }}
                    className="bg-input border-border focus:border-primary text-center font-mono text-xl tracking-widest h-12"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>

                {otpError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    data-ocid="admin_login.otp.error_state"
                    className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2"
                  >
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    {otpError}
                  </motion.p>
                )}

                <Button
                  data-ocid="admin_login.otp.verify_button"
                  type="button"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2"
                  onClick={handleVerifyOtp}
                  disabled={enteredOtp.length !== 6 || otpSecondsLeft === 0}
                >
                  <Shield className="w-4 h-4" />
                  Verify OTP
                </Button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    data-ocid="admin_login.otp.resend_button"
                    className="text-sm text-primary hover:underline font-medium"
                    onClick={handleResendOtp}
                  >
                    <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setStep("email");
                      setOtpError(null);
                      setEnteredOtp("");
                    }}
                  >
                    ← Change email
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Email step ── */}
            {step === "email" && (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
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
                        or sign in with email OTP
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-sm font-medium">
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
                        if (emailError) setEmailError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendOtp();
                      }}
                      className="bg-input border-border focus:border-primary pl-10"
                      autoFocus={!fingerprintAvailable}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {emailError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    data-ocid="admin_login.error_state"
                    className="rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2"
                  >
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                      {emailError}
                    </p>
                  </motion.div>
                )}

                <Button
                  data-ocid="admin_login.send_otp.button"
                  type="button"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2"
                  onClick={handleSendOtp}
                  disabled={
                    emailLoading || verifyPasskey.isPending || !email.trim()
                  }
                >
                  {emailLoading || verifyPasskey.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send OTP
                    </>
                  )}
                </Button>

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
                      button below to verify your identity and set a new admin
                      email.
                    </p>
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
                    a new admin email right here.
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
