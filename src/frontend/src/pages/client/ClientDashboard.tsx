import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Film,
  IndianRupee,
  Play,
  Plus,
  Sparkles,
  Upload,
  Wallet,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { JobStatus, VideoType } from "../../backend";
import { StatusBadge } from "../../components/StatusBadge";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useGetAllJobs, useGetCallerUserProfile } from "../../hooks/useQueries";

const UPI_ID = "vijayanr07051998@oksbi";
const PAYEE_NAME = "videru";

function formatDate(ns: bigint) {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRupees(paise: bigint) {
  return `₹${(Number(paise) / 100).toLocaleString("en-IN")}`;
}

function VideoTypeBadge({ type }: { type: VideoType }) {
  if (type === VideoType.small) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
        <Zap className="w-2.5 h-2.5" />
        Small
      </span>
    );
  }
  if (type === VideoType.medium) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
        <Film className="w-2.5 h-2.5" />
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25">
      <Clock className="w-2.5 h-2.5" />
      Long
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy UPI ID"
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/25 hover:bg-amber-500/20 transition-colors duration-150"
    >
      {copied ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      {copied ? "Copied!" : text}
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className="p-5 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <div className="p-5 space-y-4 bg-card/50">
        <Skeleton className="h-3 w-24 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface JobCardProps {
  job: {
    jobId: string;
    status: JobStatus;
    videoType: VideoType;
    createdAt: bigint;
    completedAt?: bigint;
    price: bigint;
    sourceVideo: { getDirectURL(): string };
    referenceVideo: { getDirectURL(): string };
    finalVideo?: { getDirectURL(): string };
  };
  index: number;
}

function JobCard({ job, index }: JobCardProps) {
  const amountRupees = Number(job.price) / 100;
  const googlePayLink = `upi://pay?pa=${UPI_ID}&pn=${PAYEE_NAME}&am=${amountRupees}&cu=INR`;
  const phonePeLink = `phonepe://pay?pa=${UPI_ID}&pn=${PAYEE_NAME}&am=${amountRupees}&cu=INR`;
  const isCompleted = job.status === JobStatus.completed;
  const hasFinalVideo = isCompleted && job.finalVideo;
  const isPendingPayment = job.status === JobStatus.pending_payment;

  return (
    <motion.div
      data-ocid={`client.videos.item.${index + 1}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.38,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-300 bg-card"
    >
      {/* ── Card Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center border border-border">
            <Film className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground truncate leading-tight">
              #{job.jobId.slice(0, 20)}…
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{formatDate(job.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <VideoTypeBadge type={job.videoType} />
          <StatusBadge status={job.status} />
        </div>
      </div>

      {/* ── Section 1: Uploaded Videos ── */}
      <div
        data-ocid={`client.videos.item.${index + 1}.panel`}
        className="px-5 pt-4 pb-0"
      >
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.04] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-500/20 bg-blue-500/[0.05]">
            <div className="w-5 h-5 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Upload className="w-3 h-3 text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-blue-300 tracking-wide uppercase">
              Your Uploaded Videos
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {/* Original Video */}
            <a
              data-ocid={`client.source_video.button.${index + 1}`}
              href={job.sourceVideo.getDirectURL()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] hover:bg-blue-500/[0.12] hover:border-blue-400/40 transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                <Play className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-blue-300 leading-tight truncate">
                  Original Video
                </p>
                <p className="text-[10px] text-blue-400/70 mt-0.5">
                  View / Download
                </p>
              </div>
              <Download className="w-3.5 h-3.5 text-blue-400/50 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
            </a>

            {/* Reference Video */}
            <a
              data-ocid={`client.reference_video.button.${index + 1}`}
              href={job.referenceVideo.getDirectURL()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] hover:bg-indigo-500/[0.12] hover:border-indigo-400/40 transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                <Film className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-indigo-300 leading-tight truncate">
                  Reference Video
                </p>
                <p className="text-[10px] text-indigo-400/70 mt-0.5">
                  View / Download
                </p>
              </div>
              <Download className="w-3.5 h-3.5 text-indigo-400/50 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Section 2: Edited Video from Admin ── */}
      <AnimatePresence>
        {hasFinalVideo && (
          <motion.div
            key={`edited-${job.jobId}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 pt-3"
          >
            <div className="relative rounded-xl border border-emerald-500/35 bg-emerald-500/[0.05] overflow-hidden">
              {/* shimmer line */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                <motion.div
                  className="absolute -inset-x-full top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
                  animate={{ x: ["0%", "200%"] }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                    repeatDelay: 1.5,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-transparent" />
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-500/20 bg-emerald-500/[0.07] relative">
                <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">
                  Edited Video from Admin
                </span>
                <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Ready
                </span>
              </div>

              <div className="p-4 relative">
                <p className="text-xs text-emerald-300/70 mb-3">
                  Your edited video is ready. Click below to download it.
                </p>
                <a
                  data-ocid={`client.edited_video.download_button.${index + 1}`}
                  href={job.finalVideo!.getDirectURL()}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-bold text-sm hover:bg-emerald-500/25 hover:border-emerald-400/70 hover:text-emerald-200 transition-all duration-200 group"
                >
                  <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Download Edited Video
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Section 3: Payment ── */}
      <AnimatePresence>
        {isPendingPayment && (
          <motion.div
            key={`payment-${job.jobId}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 pt-3"
          >
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/[0.04] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-500/20 bg-amber-500/[0.07]">
                <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-amber-300 tracking-wide uppercase">
                  Complete Payment
                </span>
                <span className="ml-auto flex items-center gap-1 font-display font-black text-amber-300 text-sm">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {formatRupees(job.price).replace("₹", "")}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-amber-300/70">
                  Send payment to unlock editing. Tap to open your UPI app.
                </p>

                {/* UPI options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Google Pay */}
                  <a
                    data-ocid={`client.payment.googlepay_button.${index + 1}`}
                    href={googlePayLink}
                    className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] hover:bg-amber-500/[0.12] hover:border-amber-400/45 transition-all duration-200 group"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg border border-amber-500/25 bg-amber-500/10 flex items-center justify-center text-base font-bold text-amber-300 font-mono">
                      G
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-amber-200 leading-tight">
                        Google Pay
                      </p>
                      <p className="text-[10px] text-amber-400/70 mt-0.5">
                        Tap to pay {formatRupees(job.price)}
                      </p>
                    </div>
                    <IndianRupee className="w-3.5 h-3.5 text-amber-400/50 flex-shrink-0 group-hover:text-amber-400 transition-colors" />
                  </a>

                  {/* PhonePe */}
                  <a
                    data-ocid={`client.payment.phonepe_button.${index + 1}`}
                    href={phonePeLink}
                    className="flex items-center gap-3 p-3 rounded-xl border border-violet-500/25 bg-violet-500/[0.06] hover:bg-violet-500/[0.12] hover:border-violet-400/45 transition-all duration-200 group"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg border border-violet-500/25 bg-violet-500/10 flex items-center justify-center text-base font-bold text-violet-300 font-mono">
                      P
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-violet-200 leading-tight">
                        PhonePe
                      </p>
                      <p className="text-[10px] text-violet-400/70 mt-0.5">
                        Tap to pay {formatRupees(job.price)}
                      </p>
                    </div>
                    <IndianRupee className="w-3.5 h-3.5 text-violet-400/50 flex-shrink-0 group-hover:text-violet-400 transition-colors" />
                  </a>
                </div>

                {/* UPI ID copyable */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-amber-400/60">UPI ID:</span>
                  <CopyButton text={UPI_ID} />
                </div>

                {/* Card / Stripe fallback */}
                <div className="pt-1 border-t border-amber-500/15">
                  <Link
                    to="/client/jobs/$id"
                    params={{ id: job.jobId }}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay with Card instead
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* bottom padding */}
      <div className="h-4" />
    </motion.div>
  );
}

export function ClientDashboard() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { data: allJobs, isLoading } = useGetAllJobs();

  const myJobs = (allJobs || []).filter(
    (job) =>
      identity &&
      job.clientId.toString() === identity.getPrincipal().toString(),
  );

  const stats = {
    total: myJobs.length,
    inProgress: myJobs.filter(
      (j) =>
        j.status === JobStatus.in_progress || j.status === JobStatus.assigned,
    ).length,
    completed: myJobs.filter((j) => j.status === JobStatus.completed).length,
    pending: myJobs.filter(
      (j) =>
        j.status === JobStatus.pending ||
        j.status === JobStatus.pending_payment,
    ).length,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight mb-1">
              Welcome back
              {profile?.name ? `, ${profile.name}` : ""}
            </h1>
            <p className="text-muted-foreground">Manage your video uploads</p>
          </div>
          <Button
            data-ocid="job.submit_button"
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold gap-2"
          >
            <Link to="/client/submit">
              <Plus className="w-4 h-4" />
              New Upload
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Videos",
              value: stats.total,
              icon: Briefcase,
              color: "text-primary",
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              icon: Clock,
              color: "text-[oklch(0.80_0.18_55)]",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle2,
              color: "text-[oklch(0.75_0.18_148)]",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: AlertCircle,
              color: "text-[oklch(0.85_0.16_82)]",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
                    {label}
                  </p>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`font-display text-3xl font-black ${color}`}>
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My Videos section */}
        <Card
          data-ocid="client.videos.section"
          className="bg-card border-border"
        >
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              My Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : myJobs.length === 0 ? (
              <div
                data-ocid="client.videos.empty_state"
                className="text-center py-16"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Film className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">
                  No videos yet
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Submit your first video to get started.
                </p>
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold gap-2"
                >
                  <Link to="/client/submit">
                    <Plus className="w-4 h-4" />
                    Submit New Video
                  </Link>
                </Button>
              </div>
            ) : (
              <div data-ocid="client.videos.list" className="space-y-4">
                {myJobs.map((job, index) => (
                  <JobCard key={job.jobId} job={job} index={index} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
