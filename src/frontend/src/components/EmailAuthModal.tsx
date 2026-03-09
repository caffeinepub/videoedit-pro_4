import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Film, Loader2, Lock, Mail, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppUserRole } from "../backend";
import { useEmailAuth } from "../hooks/useEmailAuth";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface EmailAuthModalProps {
  open: boolean;
}

export function EmailAuthModal({ open }: EmailAuthModalProps) {
  const { isRegistered, register, loginWithEmail, getStoredEmail } =
    useEmailAuth();
  const navigate = useNavigate();

  const saveMutation = useSaveCallerUserProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(isRegistered ? getStoredEmail() : "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const isLoginMode = isRegistered;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsPending(true);
    try {
      // Save profile to backend first
      await saveMutation.mutateAsync({
        name: name.trim(),
        appRole: AppUserRole.client,
      });

      // Register email auth (also sets session, triggers re-render)
      register(name.trim(), email.trim(), password);

      toast.success(`Welcome to Videro, ${name.trim()}!`);

      // Navigate to the client dashboard after successful registration
      navigate({ to: "/client" });
    } catch {
      setError("Failed to save profile. Please try again.");
      setIsPending(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const success = loginWithEmail(email, password);
    if (!success) {
      setError("Incorrect email or password. Please try again.");
    } else {
      // Navigate to the client dashboard after successful login
      navigate({ to: "/client" });
    }
  };

  return (
    <Dialog open={open} modal>
      <DialogContent
        data-ocid="email_auth.dialog"
        className="sm:max-w-md p-0 overflow-hidden border-border bg-card"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header accent */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none rounded-t-lg" />
          <div className="relative p-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground shadow-amber">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="font-display text-xl tracking-tight">
                    {isLoginMode ? "Welcome back" : "Create your account"}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    {isLoginMode
                      ? "Sign in to your videru account"
                      : "Join videru to start submitting videos"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {isLoginMode ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-email"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    data-ocid="email_auth.email_input"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="bg-input border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-password"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      data-ocid="email_auth.password_input"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="bg-input border-border pr-10"
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    data-ocid="email_auth.error_state"
                    className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  >
                    <span className="mt-0.5 flex-shrink-0">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  data-ocid="email_auth.submit_button"
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold amber-glow"
                >
                  Sign in
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-name"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Full name
                  </Label>
                  <Input
                    id="reg-name"
                    data-ocid="email_auth.name_input"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Arjun Sharma"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    className="bg-input border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-email"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Email address
                  </Label>
                  <Input
                    id="reg-email"
                    data-ocid="email_auth.email_input"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="bg-input border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-password"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      data-ocid="email_auth.password_input"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="bg-input border-border pr-10"
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-confirm"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-confirm"
                      data-ocid="email_auth.confirm_password_input"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      className="bg-input border-border pr-10"
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showConfirm ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    data-ocid="email_auth.error_state"
                    className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  >
                    <span className="mt-0.5 flex-shrink-0">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  data-ocid="email_auth.submit_button"
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold amber-glow"
                  disabled={isPending || saveMutation.isPending}
                >
                  {isPending || saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {isLoginMode
              ? "Your account is tied to your Internet Identity."
              : "By creating an account you agree to our terms of service."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
