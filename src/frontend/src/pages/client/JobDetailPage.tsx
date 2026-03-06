import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Film,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { JobStatus } from "../../backend";
import { StatusBadge } from "../../components/StatusBadge";
import { useConfirmPayment, useGetJob } from "../../hooks/useQueries";

interface JobDetailPageProps {
  jobId: string;
}

function formatDate(ns: bigint) {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function JobDetailPage({ jobId }: JobDetailPageProps) {
  const navigate = useNavigate();
  const { data: job, isLoading, error } = useGetJob(jobId);
  const confirmPayment = useConfirmPayment();

  // Check for Stripe session_id in URL (payment success redirect)
  const search = useSearch({ strict: false });
  const sessionId = (search as Record<string, string>).session_id || null;

  const confirmPaymentRef = confirmPayment.mutateAsync;
  useEffect(() => {
    if (sessionId && job && job.status === JobStatus.pending_payment) {
      confirmPaymentRef({ jobId, stripeSessionId: sessionId })
        .then(() => {
          toast.success("Payment confirmed! Your job is now in the queue.");
          navigate({
            to: "/client/jobs/$id",
            params: { id: jobId },
            replace: true,
          });
        })
        .catch(() => {
          toast.error("Payment confirmation failed. Please contact support.");
        });
    }
  }, [sessionId, job, jobId, navigate, confirmPaymentRef]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div data-ocid="job.detail.error_state" className="text-center py-16">
          <p className="text-destructive font-display font-bold text-lg mb-2">
            Job not found
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            This job may not exist or you may not have permission to view it.
          </p>
          <Button asChild variant="outline">
            <Link to="/client">← Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCompleted = job.status === JobStatus.completed;
  const isPendingPayment = job.status === JobStatus.pending_payment;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
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

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight mb-1">
              Job Details
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              #{job.jobId.slice(0, 24)}…
            </p>
          </div>
          <StatusBadge status={job.status} className="text-sm px-3 py-1" />
        </div>

        {/* Payment confirmation loading */}
        {confirmPayment.isPending && (
          <div
            data-ocid="payment.checkout_loading_state"
            className="flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5 mb-6"
          >
            <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
            <p className="text-sm text-primary font-medium">
              Confirming your payment…
            </p>
          </div>
        )}

        {/* Pending payment notice */}
        {isPendingPayment && !confirmPayment.isPending && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-[oklch(0.85_0.16_82/0.3)] bg-[oklch(0.78_0.16_82/0.05)] mb-6">
            <Clock className="w-5 h-5 text-[oklch(0.85_0.16_82)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[oklch(0.85_0.16_82)]">
                Payment pending
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete payment to move your job to the editing queue.
              </p>
            </div>
          </div>
        )}

        <div data-ocid="job.detail.panel" className="space-y-4">
          {/* Info */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                Job Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">
                    SUBMITTED
                  </p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {formatDate(job.createdAt)}
                  </div>
                </div>
                {job.completedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground font-mono mb-1">
                      COMPLETED
                    </p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.75_0.18_148)]" />
                      {formatDate(job.completedAt)}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">
                    PRICE
                  </p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <IndianRupee className="w-3.5 h-3.5 text-primary" />
                    <span className="font-display font-semibold text-primary">
                      {(Number(job.price) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">
                    STATUS
                  </p>
                  <StatusBadge status={job.status} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {job.notes && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Your Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {job.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Videos */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                Videos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href={job.sourceVideo.getDirectURL()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Film className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Source Video</span>
                </div>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>

              <a
                href={job.referenceVideo.getDirectURL()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Film className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Reference Video</span>
                </div>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>

              {/* Final video */}
              {isCompleted && job.finalVideo && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-[oklch(0.75_0.18_148)]" />
                    <span className="text-sm font-display font-semibold text-[oklch(0.75_0.18_148)]">
                      Your edited video is ready!
                    </span>
                  </div>
                  <Button
                    data-ocid="job.download_button"
                    asChild
                    className="w-full bg-[oklch(0.68_0.18_148/0.9)] hover:bg-[oklch(0.68_0.18_148)] text-white font-display font-bold gap-2"
                  >
                    <a
                      href={job.finalVideo.getDirectURL()}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="w-4 h-4" />
                      Download Edited Video
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
