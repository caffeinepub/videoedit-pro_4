import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Film,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { JobStatus, VideoType } from "../../backend";
import { StatusBadge } from "../../components/StatusBadge";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useGetAllJobs, useGetCallerUserProfile } from "../../hooks/useQueries";

function formatDate(ns: bigint) {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function JobSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
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

  const editedJobs = myJobs.filter(
    (job) => job.status === JobStatus.completed && job.finalVideo,
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

        {/* Edited Videos Ready */}
        <AnimatePresence>
          {editedJobs.length > 0 && (
            <motion.div
              key="edited-videos-section"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
            >
              <Card
                data-ocid="edited.videos.section"
                className="relative overflow-hidden border-2 border-emerald-500/40 bg-card shadow-[0_0_32px_-4px_oklch(0.75_0.18_148/0.25)]"
              >
                {/* animated shimmer background strip */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <motion.div
                    className="absolute -inset-x-full top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
                    animate={{ x: ["0%", "200%"] }}
                    transition={{
                      duration: 2.8,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                      repeatDelay: 1.2,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-transparent" />
                </div>

                <CardHeader className="pb-3 relative">
                  <CardTitle className="font-display text-lg flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                      <Download className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-emerald-400">
                      Edited Videos Ready
                    </span>
                    <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-2.5 h-2.5" />
                      {editedJobs.length} ready
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-10">
                    Your edited videos are ready to download — click to save
                    them.
                  </p>
                </CardHeader>

                <CardContent className="relative">
                  <div className="space-y-2.5">
                    {editedJobs.map((job, index) => (
                      <motion.div
                        key={job.jobId}
                        data-ocid={`edited.videos.item.${index + 1}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.07 }}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] hover:border-emerald-500/35 transition-all duration-200 group"
                      >
                        {/* Left: icon + meta */}
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-muted-foreground mb-0.5 truncate">
                              #{job.jobId.slice(0, 16)}…
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {formatDate(job.completedAt ?? job.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: badge + download */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {job.videoType === VideoType.small ? (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                              <Zap className="w-2.5 h-2.5" />
                              Small
                            </span>
                          ) : job.videoType === VideoType.medium ? (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                              <Film className="w-2.5 h-2.5" />
                              Medium
                            </span>
                          ) : (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25">
                              <Clock className="w-2.5 h-2.5" />
                              Long
                            </span>
                          )}

                          <Button
                            data-ocid={`edited.videos.download_button.${index + 1}`}
                            asChild
                            size="sm"
                            className="gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25 hover:text-emerald-300 hover:border-emerald-400/50 font-semibold transition-all duration-200 shadow-none"
                            variant="outline"
                          >
                            <a
                              href={job.finalVideo!.getDirectURL()}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Jobs list */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              My Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <JobSkeleton key={i} />
                ))}
              </div>
            ) : myJobs.length === 0 ? (
              <div
                data-ocid="job.list.empty_state"
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
              <div className="space-y-2">
                {myJobs.map((job, index) => (
                  <motion.div
                    key={job.jobId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    data-ocid={`job.list.item.${index + 1}`}
                  >
                    <Link
                      to="/client/jobs/$id"
                      params={{ id: job.jobId }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-card/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Film className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-muted-foreground mb-0.5 truncate">
                            #{job.jobId.slice(0, 16)}…
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(job.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {job.videoType === VideoType.small ? (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                            <Zap className="w-2.5 h-2.5" />
                            Small
                          </span>
                        ) : job.videoType === VideoType.medium ? (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            <Film className="w-2.5 h-2.5" />
                            Medium
                          </span>
                        ) : (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25">
                            <Clock className="w-2.5 h-2.5" />
                            Long
                          </span>
                        )}
                        <StatusBadge status={job.status} />
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
