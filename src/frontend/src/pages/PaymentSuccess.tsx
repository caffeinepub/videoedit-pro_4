import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useConfirmPayment } from "../hooks/useQueries";

export function PaymentSuccess() {
  const navigate = useNavigate();
  const confirmPayment = useConfirmPayment();

  // Extract session_id and jobId from URL
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const jobId = params.get("jobId");

  const confirmPaymentFn = confirmPayment.mutateAsync;
  useEffect(() => {
    if (sessionId && jobId) {
      confirmPaymentFn({ jobId, stripeSessionId: sessionId })
        .then(() => {
          toast.success("Payment confirmed! Your editing job is in the queue.");
        })
        .catch(() => {
          // Silently handle — the job might still process
        });
    }
  }, [sessionId, jobId, confirmPaymentFn]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-[oklch(0.68_0.18_148/0.15)] border-2 border-[oklch(0.68_0.18_148/0.4)] flex items-center justify-center mx-auto mb-6"
        >
          {confirmPayment.isPending ? (
            <Loader2 className="w-10 h-10 text-[oklch(0.75_0.18_148)] animate-spin" />
          ) : (
            <CheckCircle2 className="w-10 h-10 text-[oklch(0.75_0.18_148)]" />
          )}
        </motion.div>

        <h1 className="font-display text-3xl font-black tracking-tight mb-3">
          Payment successful!
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {confirmPayment.isPending
            ? "Confirming your payment…"
            : "Your editing job has been submitted and will be assigned to an editor shortly. You'll find your completed video in your dashboard."}
        </p>

        <div
          data-ocid="payment.checkout_loading_state"
          className={confirmPayment.isPending ? "block" : "hidden"}
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-4" />
        </div>

        <Button
          data-ocid="payment.dashboard_button"
          onClick={() => navigate({ to: "/client" })}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold gap-2"
          size="lg"
        >
          Go to My Jobs
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
}
