import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  Send,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { JobStatus, VideoType } from "../../backend";
import { StatusBadge } from "../../components/StatusBadge";
import { VideoUpload } from "../../components/VideoUpload";
import { useAdminSubmitFinalVideo, useGetJob } from "../../hooks/useQueries";

interface AdminJobDetailProps {
  jobId: string;
}

function formatDate(ns: bigint) {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncatePrincipal(p: { toString(): string }) {
  const s = p.toString();
  if (s.length <= 20) return s;
  return `${s.slice(0, 12)}…${s.slice(-6)}`;
}

export function AdminJobDetail({ jobId }: AdminJobDetailProps) {
  const { data: job, isLoading, error } = useGetJob(jobId);
  const [finalVideoFile, setFinalVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const adminSubmit = useAdminSubmitFinalVideo();

  const handleSubmit = async () => {
    if (!finalVideoFile) {
      toast.error("Please select the edited video to upload.");
      return;
    }
    try {
      await adminSubmit.mutateAsync({
        jobId,
        videoFile: finalVideoFile,
        onProgress: setUploadProgress,
      });
      toast.success("Edited video sent to client!");
      setFinalVideoFile(null);
      setUploadProgress(0);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload video.",
      );
    }
  };

  if (isLoading) {
    return (
      <div
        data-ocid="admin.job_detail.loading_state"
        className="container mx-auto px-4 py-8 max-w-3xl"
      >
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div
        data-ocid="admin.job_detail.error_state"
        className="container mx-auto px-4 py-8 max-w-3xl text-center py-16"
      >
        <p className="text-destructive font-display font-bold mb-4">
          Job not found
        </p>
        <Button asChild variant="outline">
          <Link to="/admin" data-ocid="admin.job_detail.back_button">
            ← Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const isPaid = job.status !== JobStatus.pending_payment;
  const hasFinalVideo = !!job.finalVideo;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back button */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
        >
          <Link to="/admin" data-ocid="admin.job_detail.back_button">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="font-display text-2xl font-black tracking-tight">
                Admin Job Detail
              </h1>
              {job.videoType === VideoType.small ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  <Zap className="w-3 h-3" />
                  Small Video
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25">
                  <Clock className="w-3 h-3" />
                  Long Video
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              #{job.jobId.slice(0, 24)}…
            </p>
          </div>
          <StatusBadge status={job.status} className="text-sm px-3 py-1" />
        </div>

        <div className="space-y-4">
          {/* Job meta */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1 uppercase tracking-wide">
                    Submitted
                  </p>
                  <div className="flex items-center gap-1.5 text-foreground">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {formatDate(job.createdAt)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1 uppercase tracking-wide">
                    Client
                  </p>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      {truncatePrincipal(job.clientId)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment info */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1 uppercase tracking-wide">
                    Amount
                  </p>
                  <p className="font-display text-2xl font-black text-primary">
                    ₹{(Number(job.price) / 100).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-mono mb-1 uppercase tracking-wide">
                    Payment Status
                  </p>
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[oklch(0.75_0.18_148)]">
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmed
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      Awaiting Payment
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client notes */}
          {job.notes && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Client Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border border-border">
                  {job.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Download videos */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                Client Videos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href={job.sourceVideo.getDirectURL()}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="admin.job_detail.source_video.button"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Film className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Source Video</p>
                    <p className="text-xs text-muted-foreground">
                      Original video uploaded by client
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 pointer-events-none"
                  tabIndex={-1}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </a>

              <a
                href={job.referenceVideo.getDirectURL()}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="admin.job_detail.reference_video.button"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Film className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Reference Video</p>
                    <p className="text-xs text-muted-foreground">
                      Client's style inspiration
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 pointer-events-none"
                  tabIndex={-1}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Final video panel — always shown, even for completed jobs */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload Edited Final Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasFinalVideo && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[oklch(0.68_0.18_148/0.08)] border border-[oklch(0.68_0.18_148/0.3)]">
                  <div className="flex items-center gap-2.5 text-[oklch(0.75_0.18_148)]">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm font-medium font-display">
                      Final video already sent to client
                    </p>
                  </div>
                  <a
                    href={job.finalVideo!.getDirectURL()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-[oklch(0.75_0.18_148)] border-[oklch(0.68_0.18_148/0.4)] hover:bg-[oklch(0.68_0.18_148/0.1)]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      View
                    </Button>
                  </a>
                </div>
              )}

              <VideoUpload
                label={
                  hasFinalVideo
                    ? "Re-upload Edited Video (replaces previous)"
                    : "Final Edited Video"
                }
                onFileSelect={(f) => setFinalVideoFile(f)}
                selectedFile={finalVideoFile}
                progress={uploadProgress}
                uploading={adminSubmit.isPending}
                data-ocid="admin.job_detail.final_video.upload_button"
              />

              <Button
                data-ocid="admin.job_detail.submit_button"
                onClick={handleSubmit}
                disabled={!finalVideoFile || adminSubmit.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold gap-2"
              >
                {adminSubmit.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {hasFinalVideo
                      ? "Resend Edited Video to Client"
                      : "Send Edited Video to Client"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
