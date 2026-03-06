import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Film,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
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

export function EditorDashboard() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { data: allJobs, isLoading } = useGetAllJobs();

  const myJobs = (allJobs || []).filter(
    (job) =>
      identity &&
      job.assignedEditorId?.toString() === identity.getPrincipal().toString() &&
      (job.status === JobStatus.assigned ||
        job.status === JobStatus.in_progress),
  );

  const completedJobs = (allJobs || []).filter(
    (job) =>
      identity &&
      job.assignedEditorId?.toString() === identity.getPrincipal().toString() &&
      job.status === JobStatus.completed,
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black tracking-tight mb-1">
            Editor Workspace
            {profile?.name ? ` — ${profile.name}` : ""}
          </h1>
          <p className="text-muted-foreground">Your assigned editing jobs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Active Jobs",
              value: myJobs.length,
              icon: Briefcase,
              color: "text-primary",
            },
            {
              label: "In Progress",
              value: myJobs.filter((j) => j.status === JobStatus.in_progress)
                .length,
              icon: Clock,
              color: "text-[oklch(0.80_0.18_55)]",
            },
            {
              label: "Completed",
              value: completedJobs.length,
              icon: CheckCircle2,
              color: "text-[oklch(0.75_0.18_148)]",
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

        {/* Active Jobs */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              Active Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : myJobs.length === 0 ? (
              <div
                data-ocid="editor.jobs.empty_state"
                className="text-center py-12"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Film className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-display font-bold mb-2">
                  No active assignments
                </h3>
                <p className="text-muted-foreground text-sm">
                  You'll see jobs here once the admin assigns them to you.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {myJobs.map((job, index) => (
                  <motion.div
                    key={job.jobId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link
                      to="/editor/jobs/$id"
                      params={{ id: job.jobId }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-card/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Film className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-muted-foreground mb-0.5">
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

        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[oklch(0.75_0.18_148)]" />
                Completed Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedJobs.slice(0, 5).map((job, index) => (
                  <div
                    key={job.jobId}
                    data-ocid={`editor.jobs.item.${index + 1}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-border opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-[oklch(0.75_0.18_148)]" />
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        #{job.jobId.slice(0, 20)}…
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
