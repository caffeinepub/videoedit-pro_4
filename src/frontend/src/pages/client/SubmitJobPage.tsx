import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Film,
  IndianRupee,
  Loader2,
  Phone,
  Upload,
  Video,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useSubmitJob } from "../../hooks/useQueries";

type VideoType = "small" | "medium" | "long";
type PaymentMethod = "stripe" | "googlepay" | "phonepe";

const VIDEO_TYPES = {
  small: {
    label: "Small Video",
    price: 100,
    priceLabel: "₹100",
    description: "Short clips up to ~5 minutes",
    detail: "Perfect for social media reels, quick promos, and short clips.",
    icon: Zap,
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  medium: {
    label: "Medium Video",
    price: 500,
    priceLabel: "₹500",
    description: "5–20 minute videos",
    detail: "Great for tutorials, vlogs, event highlights, and brand videos.",
    icon: Film,
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  long: {
    label: "Long Video",
    price: 2000,
    priceLabel: "₹2,000",
    description: "Full-length videos & feature edits",
    detail:
      "Ideal for full films, documentaries, wedding videos, and long-form content.",
    icon: Clock,
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
} as const;

// ── File Dropzone ──────────────────────────────────────────────────────────────

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  uploading?: boolean;
  "data-upload-ocid"?: string;
  "data-dropzone-ocid"?: string;
  "data-success-ocid"?: string;
  accentColor?: "blue" | "amber" | "purple";
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Dropzone({
  onFileSelect,
  selectedFile,
  uploading,
  "data-upload-ocid": uploadOcid,
  "data-dropzone-ocid": dropzoneOcid,
  "data-success-ocid": successOcid,
  accentColor = "amber",
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const accentMap = {
    blue: {
      ring: "border-blue-400/60 bg-blue-500/5",
      text: "text-blue-400",
      bg: "bg-blue-500/15",
      icon: "text-blue-300",
    },
    amber: {
      ring: "border-primary/60 bg-primary/5",
      text: "text-primary",
      bg: "bg-primary/15",
      icon: "text-primary",
    },
    purple: {
      ring: "border-purple-400/60 bg-purple-500/5",
      text: "text-purple-400",
      bg: "bg-purple-500/15",
      icon: "text-purple-300",
    },
  };
  const accent = accentMap[accentColor];

  return (
    <div className="relative">
      {selectedFile && (
        <div
          data-ocid={successOcid}
          className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 mb-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatSize(selectedFile.size)} · Ready to upload
            </p>
          </div>
          {!uploading && (
            <button
              type="button"
              onClick={() => onFileSelect(null as unknown as File)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors flex-shrink-0"
            >
              Change
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        data-ocid={dropzoneOcid}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className={cn(
          "w-full rounded-xl border-2 border-dashed p-6 transition-all duration-200",
          "flex flex-col items-center gap-3 cursor-pointer text-center",
          dragOver
            ? accent.ring
            : selectedFile
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-border hover:border-border/80 hover:bg-muted/20",
          uploading && "opacity-50 cursor-not-allowed",
        )}
        disabled={uploading}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
          disabled={uploading}
        />

        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            selectedFile ? "bg-emerald-500/15" : "bg-muted",
          )}
        >
          {selectedFile ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          ) : (
            <Upload className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">
            {selectedFile ? (
              "Replace video"
            ) : (
              <>
                Drop video here or{" "}
                <span className={accent.text}>browse files</span>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            MP4, MOV, AVI, MKV — up to 100 GB
          </p>
        </div>
      </button>

      {/* Upload button below dropzone */}
      <Button
        type="button"
        data-ocid={uploadOcid}
        variant="outline"
        size="sm"
        className={cn(
          "w-full mt-2 border-border/60 text-muted-foreground hover:text-foreground",
          selectedFile &&
            "border-emerald-500/30 text-emerald-400 hover:text-emerald-300",
        )}
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
      >
        <Upload className="w-3.5 h-3.5 mr-1.5" />
        {selectedFile ? "Choose different file" : "Select video file"}
      </Button>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────

interface StepProps {
  number: number;
  label: string;
  sublabel?: string;
  isCompleted: boolean;
  isActive: boolean;
  icon: React.ReactNode;
}

function StepHeader({
  number,
  label,
  sublabel,
  isCompleted,
  isActive,
  icon,
}: StepProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
          isCompleted
            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
            : isActive
              ? "bg-primary/15 border-primary/50 text-primary"
              : "bg-muted/30 border-border/50 text-muted-foreground",
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <span className="text-sm font-display font-bold">{number}</span>
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
            isCompleted
              ? "bg-emerald-500/15 text-emerald-400"
              : isActive
                ? "bg-primary/15 text-primary"
                : "bg-muted/30 text-muted-foreground",
          )}
        >
          {icon}
        </div>
        <div>
          <p
            className={cn(
              "font-display font-semibold text-sm transition-colors",
              isActive || isCompleted
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            {label}
          </p>
          {sublabel && (
            <p className="text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Payment method card ────────────────────────────────────────────────────────

interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function PaymentMethodCard({
  method,
  selected,
  onSelect,
  disabled,
}: PaymentMethodCardProps) {
  const configs: Record<
    PaymentMethod,
    {
      label: string;
      sublabel: string;
      icon: React.ReactNode;
      accentBorder: string;
      accentBg: string;
      accentGlow: string;
      accentText: string;
      ocid: string;
    }
  > = {
    stripe: {
      label: "Card / Stripe",
      sublabel: "Credit & debit cards",
      icon: <CreditCard className="w-5 h-5" />,
      accentBorder: "border-blue-500/60",
      accentBg: "bg-blue-500/10",
      accentGlow: "shadow-[0_0_14px_oklch(0.62_0.22_254/0.25)]",
      accentText: "text-blue-400",
      ocid: "submit.payment.stripe_card",
    },
    googlepay: {
      label: "Google Pay",
      sublabel: "UPI / Google Pay",
      icon: (
        <span className="font-display font-black text-sm leading-none select-none">
          <span className="text-blue-400">G</span>
          <span className="text-green-400">P</span>
          <span className="text-amber-400">a</span>
          <span className="text-red-400">y</span>
        </span>
      ),
      accentBorder: "border-green-500/60",
      accentBg: "bg-green-500/10",
      accentGlow: "shadow-[0_0_14px_oklch(0.74_0.2_145/0.25)]",
      accentText: "text-green-400",
      ocid: "submit.payment.googlepay_card",
    },
    phonepe: {
      label: "PhonePe",
      sublabel: "UPI / PhonePe",
      icon: <Phone className="w-5 h-5" />,
      accentBorder: "border-purple-500/60",
      accentBg: "bg-purple-500/10",
      accentGlow: "shadow-[0_0_14px_oklch(0.55_0.25_295/0.25)]",
      accentText: "text-purple-400",
      ocid: "submit.payment.phonepe_card",
    },
  };

  const cfg = configs[method];

  return (
    <button
      type="button"
      data-ocid={cfg.ocid}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? cn(cfg.accentBorder, cfg.accentBg, cfg.accentGlow)
          : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {/* Selected checkmark */}
      {selected && (
        <span className={cn("absolute top-1.5 right-1.5", cfg.accentText)}>
          <CheckCircle2 className="w-3.5 h-3.5" />
        </span>
      )}

      {/* Icon badge */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          selected
            ? cn(cfg.accentBg, cfg.accentText)
            : "bg-muted text-muted-foreground",
        )}
      >
        {cfg.icon}
      </div>

      <div>
        <p
          className={cn(
            "text-xs font-display font-bold",
            selected ? cfg.accentText : "text-foreground",
          )}
        >
          {cfg.label}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {cfg.sublabel}
        </p>
      </div>
    </button>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface StepFormProps {
  videoType: VideoType;
  onSuccess: (url: string) => void;
}

function StepForm({ videoType, onSuccess }: StepFormProps) {
  const navigate = useNavigate();
  const [sourceVideo, setSourceVideo] = useState<File | null>(null);
  const [referenceVideo, setReferenceVideo] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [sourceProgress, setSourceProgress] = useState(0);
  const [refProgress, setRefProgress] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [upiInitiated, setUpiInitiated] = useState(false);

  const submitJob = useSubmitJob();
  const config = VIDEO_TYPES[videoType];

  // Step logic
  const step1Done = !!sourceVideo;
  const step2Done = !!referenceVideo;
  const step3Active = step1Done && step2Done;

  const submitJobPayload = useCallback(async () => {
    if (!sourceVideo || !referenceVideo) {
      toast.error("Please upload both videos before submitting.");
      return null;
    }
    return submitJob.mutateAsync({
      sourceVideoFile: sourceVideo,
      referenceVideoFile: referenceVideo,
      notes,
      videoType,
      onSourceProgress: setSourceProgress,
      onRefProgress: setRefProgress,
    });
  }, [sourceVideo, referenceVideo, notes, videoType, submitJob]);

  const handleStripePayment = async () => {
    try {
      const checkoutUrl = await submitJobPayload();
      if (!checkoutUrl) {
        toast.error("Failed to get checkout URL.");
        return;
      }
      onSuccess(checkoutUrl);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to submit job. Please try again.",
      );
    }
  };

  const handleUpiPayment = async (method: "googlepay" | "phonepe") => {
    try {
      await submitJobPayload();

      const price = config.price;
      const deepLink =
        method === "googlepay"
          ? `upi://pay?pa=vijayanr07051998@oksbi&pn=videru&am=${price}&cu=INR&tn=Video+Editing+Job`
          : `phonepe://pay?pa=vijayanr07051998@oksbi&pn=videru&am=${price}&cu=INR&tn=Video+Editing+Job`;

      window.location.href = deepLink;

      setTimeout(() => {
        setUpiInitiated(true);
      }, 1500);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to submit job. Please try again.",
      );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "stripe") {
      void handleStripePayment();
    } else {
      void handleUpiPayment(paymentMethod);
    }
  };

  const isUploading = submitJob.isPending;
  const isStripe = paymentMethod === "stripe";

  return (
    <form onSubmit={handleFormSubmit}>
      {/* ── Steps ─────────────────────────────────────────────────────────── */}
      <div className="relative space-y-0">
        {/* ── Step 1: Source Video ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="relative"
        >
          <div className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-px flex-1 mt-1 min-h-[60px] transition-colors duration-500",
                  step1Done ? "bg-emerald-500/40" : "bg-border/40",
                )}
              />
            </div>

            <div
              className={cn(
                "flex-1 rounded-2xl border p-5 mb-4 transition-all duration-300",
                step1Done
                  ? "bg-card border-emerald-500/20 shadow-[0_2px_16px_oklch(0.68_0.18_148/0.08)]"
                  : "bg-card border-border",
              )}
            >
              <div className="mb-4">
                <StepHeader
                  number={1}
                  label="Upload Source Video"
                  sublabel="The video you want edited"
                  isCompleted={step1Done}
                  isActive={!step1Done}
                  icon={<Video className="w-4 h-4" />}
                />
              </div>

              <Dropzone
                onFileSelect={(f) => setSourceVideo(f)}
                selectedFile={sourceVideo}
                uploading={isUploading}
                data-upload-ocid="submit.source_video.upload_button"
                data-dropzone-ocid="submit.source_video.dropzone"
                data-success-ocid="submit.source_video.success_state"
                accentColor="amber"
              />

              {isUploading && sourceProgress > 0 && sourceProgress < 100 && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading source…</span>
                    <span className="font-mono">
                      {Math.round(sourceProgress)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${sourceProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Step 2: Reference Video ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: step1Done ? 1 : 0.45, x: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="relative"
        >
          <div className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-px flex-1 mt-1 min-h-[60px] transition-colors duration-500",
                  step2Done ? "bg-emerald-500/40" : "bg-border/40",
                )}
              />
            </div>

            <div
              className={cn(
                "flex-1 rounded-2xl border p-5 mb-4 transition-all duration-300",
                !step1Done && "pointer-events-none",
                step2Done
                  ? "bg-card border-emerald-500/20 shadow-[0_2px_16px_oklch(0.68_0.18_148/0.08)]"
                  : step1Done
                    ? "bg-card border-border"
                    : "bg-card/60 border-border/50",
              )}
            >
              <div className="mb-4">
                <StepHeader
                  number={2}
                  label="Upload Reference Video"
                  sublabel="Your style inspiration example"
                  isCompleted={step2Done}
                  isActive={step1Done && !step2Done}
                  icon={<Film className="w-4 h-4" />}
                />
              </div>

              <AnimatePresence>
                {step1Done && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Dropzone
                      onFileSelect={(f) => setReferenceVideo(f)}
                      selectedFile={referenceVideo}
                      uploading={isUploading}
                      data-upload-ocid="submit.reference_video.upload_button"
                      data-dropzone-ocid="submit.reference_video.dropzone"
                      data-success-ocid="submit.reference_video.success_state"
                      accentColor={
                        videoType === "small"
                          ? "blue"
                          : videoType === "medium"
                            ? "amber"
                            : "purple"
                      }
                    />

                    {isUploading && refProgress > 0 && refProgress < 100 && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Uploading reference…</span>
                          <span className="font-mono">
                            {Math.round(refProgress)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${refProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Optional notes */}
                    <div className="mt-4 space-y-2">
                      <Label
                        htmlFor="notes-field"
                        className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                      >
                        Editing notes{" "}
                        <span className="normal-case font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Textarea
                        id="notes-field"
                        data-ocid="submit.notes.textarea"
                        placeholder="Describe your style: transitions, color grading, music sync, pacing…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[80px] bg-input resize-none text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!step1Done && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Complete Step 1 first
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Step 3: Payment ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: step3Active ? 1 : 0.45, x: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="relative"
        >
          <div className="flex gap-4">
            {/* No connector after last step */}
            <div className="w-px" />

            <div
              className={cn(
                "flex-1 rounded-2xl border p-5 transition-all duration-300",
                !step3Active && "pointer-events-none",
                isUploading && isStripe
                  ? "bg-card border-primary/20 shadow-amber"
                  : step3Active
                    ? "bg-card border-border"
                    : "bg-card/60 border-border/50",
              )}
            >
              <div className="mb-4">
                <StepHeader
                  number={3}
                  label="Payment"
                  sublabel={`Choose your payment method · ${config.priceLabel}`}
                  isCompleted={false}
                  isActive={step3Active}
                  icon={<IndianRupee className="w-4 h-4" />}
                />
              </div>

              <AnimatePresence>
                {step3Active && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* UPI initiated confirmation state */}
                    <AnimatePresence>
                      {upiInitiated && (
                        <motion.div
                          data-ocid="submit.payment.success_state"
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          transition={{ duration: 0.25 }}
                          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-display font-bold text-foreground">
                                Payment initiated in{" "}
                                {paymentMethod === "googlepay"
                                  ? "Google Pay"
                                  : "PhonePe"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Complete the payment in the app, then come back
                                here. Our team will verify and confirm your job
                                within a few hours.
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                            onClick={() => void navigate({ to: "/client" })}
                          >
                            Go to Dashboard
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!upiInitiated && (
                      <>
                        {/* Payment method selector */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Select payment method
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <PaymentMethodCard
                              method="stripe"
                              selected={paymentMethod === "stripe"}
                              onSelect={() => setPaymentMethod("stripe")}
                              disabled={isUploading}
                            />
                            <PaymentMethodCard
                              method="googlepay"
                              selected={paymentMethod === "googlepay"}
                              onSelect={() => setPaymentMethod("googlepay")}
                              disabled={isUploading}
                            />
                            <PaymentMethodCard
                              method="phonepe"
                              selected={paymentMethod === "phonepe"}
                              onSelect={() => setPaymentMethod("phonepe")}
                              disabled={isUploading}
                            />
                          </div>
                        </div>

                        {/* Price summary */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Video editing service
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {config.label} · {config.description}
                            </p>
                          </div>
                          <p className="font-display text-2xl font-black text-gradient-amber">
                            {config.priceLabel}
                          </p>
                        </div>

                        {isUploading && isStripe ? (
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/25">
                            <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Uploading & processing…
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                You'll be redirected to Stripe to complete
                                payment
                              </p>
                            </div>
                          </div>
                        ) : isUploading && !isStripe ? (
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/25">
                            <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Uploading & processing…
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Opening{" "}
                                {paymentMethod === "googlepay"
                                  ? "Google Pay"
                                  : "PhonePe"}{" "}
                                shortly…
                              </p>
                            </div>
                          </div>
                        ) : (
                          <Button
                            data-ocid="submit.payment.submit_button"
                            type="submit"
                            size="lg"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold text-base amber-glow"
                            disabled={isUploading || !step3Active}
                          >
                            <IndianRupee className="w-4 h-4 mr-1" />
                            {paymentMethod === "stripe"
                              ? `Pay ${config.priceLabel} with Card`
                              : paymentMethod === "googlepay"
                                ? `Pay ${config.priceLabel} with Google Pay`
                                : `Pay ${config.priceLabel} with PhonePe`}
                          </Button>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!step3Active && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Complete Steps 1 & 2 first
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SubmitJobPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<VideoType>("small");

  const handleSuccess = (checkoutUrl: string) => {
    window.location.href = checkoutUrl;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate({ to: "/client" })}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to dashboard
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-3xl font-black tracking-tight mb-2">
            Submit a new video
          </h1>
          <p className="text-muted-foreground text-sm">
            Upload your videos step by step, then complete payment to start
            editing.
          </p>
        </div>

        {/* Video type tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as VideoType)}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-3 w-full bg-muted/30 border border-border h-auto p-1 gap-1">
            <TabsTrigger
              value="small"
              data-ocid="submit.small_video.tab"
              className="flex flex-col items-center gap-1.5 py-3 px-2 h-auto data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-300 data-[state=active]:border-blue-500/30 data-[state=active]:shadow-none rounded-lg transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span className="font-display font-bold text-sm">Small</span>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-mono bg-blue-500/10 text-blue-400 border-blue-500/25 px-2"
              >
                ₹100
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:block">
                Up to ~5 min
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="medium"
              data-ocid="submit.medium_video.tab"
              className="flex flex-col items-center gap-1.5 py-3 px-2 h-auto data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300 data-[state=active]:border-amber-500/30 data-[state=active]:shadow-none rounded-lg transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Film className="w-4 h-4" />
                <span className="font-display font-bold text-sm">Medium</span>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-mono bg-amber-500/10 text-amber-400 border-amber-500/25 px-2"
              >
                ₹500
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:block">
                5–20 minutes
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="long"
              data-ocid="submit.long_video.tab"
              className="flex flex-col items-center gap-1.5 py-3 px-2 h-auto data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-300 data-[state=active]:border-purple-500/30 data-[state=active]:shadow-none rounded-lg transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span className="font-display font-bold text-sm">Long</span>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-mono bg-purple-500/10 text-purple-400 border-purple-500/25 px-2"
              >
                ₹2,000
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:block">
                Full-length
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Animated tab swap */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <StepForm videoType={activeTab} onSuccess={handleSuccess} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
