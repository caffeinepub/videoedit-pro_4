import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, XCircle } from "lucide-react";
import { motion } from "motion/react";

export function PaymentFailure() {
  const navigate = useNavigate();

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
          className="w-20 h-20 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="w-10 h-10 text-destructive" />
        </motion.div>

        <h1 className="font-display text-3xl font-black tracking-tight mb-3">
          Payment cancelled
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your payment was not completed. No charge has been made. You can try
          again or return to the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            data-ocid="payment.retry_button"
            onClick={() => navigate({ to: "/client/submit" })}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            data-ocid="payment.back_button"
            onClick={() => navigate({ to: "/client" })}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
