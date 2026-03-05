import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Film,
  LayoutDashboard,
  Loader2,
  UserCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { JobStatus } from "../../backend";
import type { Job } from "../../backend";
import { StatusBadge } from "../../components/StatusBadge";
import {
  useAssignJob,
  useGetAllJobs,
  useIsStripeConfigured,
} from "../../hooks/useQueries";
import { ManageUsers } from "./ManageUsers";
import { StripeSetup } from "./StripeSetup";

function formatDate(ns: bigint) {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function AssignJobRow({ job }: { job: Job }) {
  const [editorPrincipal, setEditorPrincipal] = useState("");
  const assignJob = useAssignJob();

  const handleAssign = async () => {
    if (!editorPrincipal.trim()) {
      toast.error("Enter an editor's principal ID.");
      return;
    }
    try {
      await assignJob.mutateAsync({
        jobId: job.jobId,
        editorId: editorPrincipal.trim(),
      });
      toast.success("Job assigned successfully!");
      setEditorPrincipal("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign job.");
    }
  };

  return (
    <TableRow className="border-border hover:bg-muted/20">
      <TableCell className="font-mono text-xs text-muted-foreground">
        #{job.jobId.slice(0, 12)}…
      </TableCell>
      <TableCell>
        <StatusBadge status={job.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatDate(job.createdAt)}
      </TableCell>
      <TableCell className="text-xs text-primary font-display font-semibold">
        ${(Number(job.price) / 100).toFixed(2)}
      </TableCell>
      <TableCell>
        {job.status === JobStatus.pending ? (
          <div className="flex items-center gap-2">
            <Input
              data-ocid="admin.assign_job.select"
              placeholder="Editor principal ID"
              value={editorPrincipal}
              onChange={(e) => setEditorPrincipal(e.target.value)}
              className="h-8 text-xs bg-input w-52"
            />
            <Button
              data-ocid="admin.assign_job.button"
              size="sm"
              onClick={handleAssign}
              disabled={assignJob.isPending || !editorPrincipal.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs gap-1.5"
            >
              {assignJob.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <UserCheck className="w-3 h-3" />
              )}
              Assign
            </Button>
          </div>
        ) : job.assignedEditorId ? (
          <span className="font-mono text-xs text-muted-foreground">
            {job.assignedEditorId.toString().slice(0, 20)}…
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

const TABS = [
  { value: "all", label: "All" },
  { value: JobStatus.pending_payment, label: "Pending Payment" },
  { value: JobStatus.pending, label: "Pending" },
  { value: JobStatus.assigned, label: "Assigned" },
  { value: JobStatus.in_progress, label: "In Progress" },
  { value: JobStatus.completed, label: "Completed" },
] as const;

export function AdminDashboard() {
  const { data: allJobs, isLoading: jobsLoading } = useGetAllJobs();
  const { data: stripeConfigured } = useIsStripeConfigured();
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredJobs = (allJobs || []).filter((job) =>
    activeTab === "all" ? true : job.status === activeTab,
  );

  const stats = {
    total: (allJobs || []).length,
    pending: (allJobs || []).filter((j) => j.status === JobStatus.pending)
      .length,
    inProgress: (allJobs || []).filter(
      (j) =>
        j.status === JobStatus.in_progress || j.status === JobStatus.assigned,
    ).length,
    completed: (allJobs || []).filter((j) => j.status === JobStatus.completed)
      .length,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight mb-1">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage all editing jobs and users
            </p>
          </div>
          {stripeConfigured === false && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Stripe not configured
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Jobs",
              value: stats.total,
              icon: Film,
              color: "text-primary",
            },
            {
              label: "Awaiting Assignment",
              value: stats.pending,
              icon: Clock,
              color: "text-[oklch(0.85_0.16_82)]",
            },
            {
              label: "Active",
              value: stats.inProgress,
              icon: LayoutDashboard,
              color: "text-[oklch(0.80_0.18_55)]",
            },
            {
              label: "Completed",
              value: stats.completed,
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

        {/* Main tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="bg-muted/30 border border-border">
            <TabsTrigger
              value="jobs"
              data-ocid="admin.jobs.tab"
              className="gap-2"
            >
              <Film className="w-4 h-4" />
              Jobs
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-ocid="admin.users.tab"
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="stripe"
              data-ocid="admin.stripe.tab"
              className="gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Stripe
            </TabsTrigger>
          </TabsList>

          {/* Jobs tab */}
          <TabsContent value="jobs" className="mt-0">
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" />
                  All Editing Jobs
                </CardTitle>
                <CardDescription>
                  Assign pending jobs to editors and monitor progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Status filter tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="mb-4"
                >
                  <TabsList className="bg-muted/20 border border-border flex-wrap h-auto gap-1 p-1">
                    {TABS.map(({ value, label }) => (
                      <TabsTrigger
                        key={value}
                        value={value}
                        data-ocid={`admin.jobs.${value}.tab`}
                        className="text-xs h-7"
                      >
                        {label}
                        {value !== "all" && (
                          <Badge
                            variant="secondary"
                            className="ml-1.5 h-4 px-1 text-xs font-mono"
                          >
                            {
                              (allJobs || []).filter((j) => j.status === value)
                                .length
                            }
                          </Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {jobsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div
                    data-ocid="admin.jobs.empty_state"
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Film className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No jobs in this category</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table data-ocid="admin.jobs.table">
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-xs font-mono text-muted-foreground">
                            JOB ID
                          </TableHead>
                          <TableHead className="text-xs font-mono text-muted-foreground">
                            STATUS
                          </TableHead>
                          <TableHead className="text-xs font-mono text-muted-foreground">
                            DATE
                          </TableHead>
                          <TableHead className="text-xs font-mono text-muted-foreground">
                            PRICE
                          </TableHead>
                          <TableHead className="text-xs font-mono text-muted-foreground">
                            ACTION / EDITOR
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredJobs.map((job) => (
                          <AssignJobRow key={job.jobId} job={job} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users tab */}
          <TabsContent value="users" className="mt-0">
            <ManageUsers />
          </TabsContent>

          {/* Stripe tab */}
          <TabsContent value="stripe" className="mt-0">
            <StripeSetup />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
