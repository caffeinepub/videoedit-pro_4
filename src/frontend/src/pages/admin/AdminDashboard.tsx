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
import { Label } from "@/components/ui/label";
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
  Eye,
  EyeOff,
  Film,
  Fingerprint,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  X,
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
  useGetRevenueSummary,
  useIsStripeConfigured,
  useSetAdminPasskey,
} from "../../hooks/useQueries";
import {
  hasFingerprintRegistered,
  isWebAuthnSupported,
  registerFingerprint,
  removeFingerprint,
} from "../../hooks/useWebAuthn";
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
      <TableCell className="font-mono text-xs">
        <Link
          to="/admin/jobs/$id"
          params={{ id: job.jobId }}
          className="text-primary hover:underline"
        >
          #{job.jobId.slice(0, 12)}…
        </Link>
      </TableCell>
      <TableCell>
        <StatusBadge status={job.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatDate(job.createdAt)}
      </TableCell>
      <TableCell className="text-xs text-primary font-display font-semibold">
        ₹{(Number(job.price) / 100).toLocaleString("en-IN")}
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

function truncatePrincipal(p: { toString(): string }) {
  const s = p.toString();
  if (s.length <= 20) return s;
  return `${s.slice(0, 12)}…${s.slice(-6)}`;
}

function RevenueTab({ allJobs }: { allJobs: Job[] }) {
  const { data: summary, isLoading } = useGetRevenueSummary();

  const paidJobs = allJobs.filter(
    (j) => j.status !== JobStatus.pending_payment,
  );

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
                Total Revenue
              </p>
              <IndianRupee className="w-4 h-4 text-[oklch(0.75_0.18_148)]" />
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className="font-display text-2xl font-black text-[oklch(0.75_0.18_148)]">
                ₹
                {(Number(summary?.totalRevenue ?? 0) / 100).toLocaleString(
                  "en-IN",
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
                Paid Jobs
              </p>
              <CreditCard className="w-4 h-4 text-[oklch(0.85_0.16_82)]" />
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="font-display text-3xl font-black text-[oklch(0.85_0.16_82)]">
                {summary?.paidJobsCount?.toString() ?? "0"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
                Completed Jobs
              </p>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="font-display text-3xl font-black text-primary">
                {summary?.completedJobsCount?.toString() ?? "0"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Paid jobs table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary" />
            Payment Received Jobs
          </CardTitle>
          <CardDescription>
            All jobs where payment has been confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paidJobs.length === 0 ? (
            <div
              data-ocid="admin.revenue.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <IndianRupee className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No paid jobs yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="admin.revenue.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-mono text-muted-foreground">
                      JOB ID
                    </TableHead>
                    <TableHead className="text-xs font-mono text-muted-foreground">
                      CLIENT
                    </TableHead>
                    <TableHead className="text-xs font-mono text-muted-foreground">
                      AMOUNT
                    </TableHead>
                    <TableHead className="text-xs font-mono text-muted-foreground">
                      STATUS
                    </TableHead>
                    <TableHead className="text-xs font-mono text-muted-foreground">
                      DATE
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidJobs.map((job) => (
                    <TableRow
                      key={job.jobId}
                      className="border-border hover:bg-muted/20"
                    >
                      <TableCell className="font-mono text-xs">
                        <Link
                          to="/admin/jobs/$id"
                          params={{ id: job.jobId }}
                          className="text-primary hover:underline"
                        >
                          #{job.jobId.slice(0, 12)}…
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {truncatePrincipal(job.clientId)}
                      </TableCell>
                      <TableCell className="text-xs font-display font-semibold text-[oklch(0.75_0.18_148)]">
                        ₹{(Number(job.price) / 100).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(job.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const [newPasskey, setNewPasskey] = useState("");
  const [confirmPasskey, setConfirmPasskey] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fingerprintRegistered, setFingerprintRegistered] = useState(
    hasFingerprintRegistered,
  );
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const setAdminPasskey = useSetAdminPasskey();
  const webAuthnSupported = isWebAuthnSupported();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasskey.trim()) {
      toast.error("Passkey cannot be empty.");
      return;
    }
    if (newPasskey !== confirmPasskey) {
      toast.error("Passkeys do not match.");
      return;
    }
    try {
      await setAdminPasskey.mutateAsync(newPasskey.trim());
      toast.success("Admin passkey updated successfully.");
      setNewPasskey("");
      setConfirmPasskey("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update passkey.",
      );
    }
  };

  const handleRegisterFingerprint = async () => {
    setFingerprintLoading(true);
    try {
      const generatedPasskey = await registerFingerprint();
      await setAdminPasskey.mutateAsync(generatedPasskey);
      setFingerprintRegistered(true);
      toast.success(
        "Fingerprint registered! You can now log in with your fingerprint.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fingerprint registration failed.",
      );
    } finally {
      setFingerprintLoading(false);
    }
  };

  const handleRemoveFingerprint = () => {
    removeFingerprint();
    setFingerprintRegistered(false);
    toast.success("Fingerprint removed from this device.");
  };

  return (
    <div className="max-w-lg space-y-6">
      {/* Fingerprint Section */}
      {webAuthnSupported && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-primary" />
              Fingerprint Login
            </CardTitle>
            <CardDescription>
              Use your device fingerprint sensor to log in instantly without
              typing a passkey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fingerprintRegistered ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[oklch(0.75_0.18_148)]/10 border border-[oklch(0.75_0.18_148)]/20">
                  <Fingerprint className="w-5 h-5 text-[oklch(0.75_0.18_148)] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[oklch(0.75_0.18_148)]">
                      Fingerprint registered on this device
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You can use your fingerprint to access the admin portal.
                    </p>
                  </div>
                </div>
                <Button
                  data-ocid="admin.security.remove_fingerprint.button"
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                  onClick={handleRemoveFingerprint}
                >
                  <X className="w-4 h-4" />
                  Remove Fingerprint from this Device
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
                  <Fingerprint className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                  <p>
                    Registering your fingerprint will generate a new secure
                    passkey and link it to your fingerprint on this device. This
                    replaces your current passkey.
                  </p>
                </div>
                <Button
                  data-ocid="admin.security.register_fingerprint.button"
                  type="button"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2"
                  onClick={handleRegisterFingerprint}
                  disabled={fingerprintLoading}
                >
                  {fingerprintLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering…
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      Register Fingerprint
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Passkey Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Manual Passkey
          </CardTitle>
          <CardDescription>
            Set or change the text passkey used as a fallback when fingerprint
            is not available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            {/* New Passkey */}
            <div className="space-y-2">
              <Label htmlFor="new-passkey" className="text-sm font-medium">
                New Passkey
              </Label>
              <div className="relative">
                <Input
                  id="new-passkey"
                  data-ocid="admin.security.new_passkey.input"
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new passkey…"
                  value={newPasskey}
                  onChange={(e) => setNewPasskey(e.target.value)}
                  className="pr-10 bg-input border-border"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showNew ? "Hide passkey" : "Show passkey"}
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Passkey */}
            <div className="space-y-2">
              <Label htmlFor="confirm-passkey" className="text-sm font-medium">
                Confirm Passkey
              </Label>
              <div className="relative">
                <Input
                  id="confirm-passkey"
                  data-ocid="admin.security.confirm_passkey.input"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new passkey…"
                  value={confirmPasskey}
                  onChange={(e) => setConfirmPasskey(e.target.value)}
                  className="pr-10 bg-input border-border"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? "Hide passkey" : "Show passkey"}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Note */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
              <p>
                This passkey is required every new browser session when
                fingerprint is not available. Store it somewhere safe.
              </p>
            </div>

            <Button
              data-ocid="admin.security.save_passkey.button"
              type="submit"
              disabled={
                setAdminPasskey.isPending ||
                !newPasskey.trim() ||
                !confirmPasskey.trim()
              }
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2"
            >
              {setAdminPasskey.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Save Passkey
                </>
              )}
            </Button>

            {setAdminPasskey.isSuccess && (
              <p
                data-ocid="admin.security.success_state"
                className="text-sm text-center text-[oklch(0.75_0.18_148)]"
              >
                ✓ Passkey updated successfully
              </p>
            )}
            {setAdminPasskey.isError && (
              <p
                data-ocid="admin.security.error_state"
                className="text-sm text-center text-destructive"
              >
                Failed to update passkey. Try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
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
              value="revenue"
              data-ocid="admin.revenue.tab"
              className="gap-2"
            >
              <IndianRupee className="w-4 h-4" />
              Revenue
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
            <TabsTrigger
              value="security"
              data-ocid="admin.security.tab"
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              Security
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

          {/* Revenue tab */}
          <TabsContent value="revenue" className="mt-0">
            <RevenueTab allJobs={allJobs || []} />
          </TabsContent>

          {/* Users tab */}
          <TabsContent value="users" className="mt-0">
            <ManageUsers />
          </TabsContent>

          {/* Stripe tab */}
          <TabsContent value="stripe" className="mt-0">
            <StripeSetup />
          </TabsContent>

          {/* Security tab */}
          <TabsContent value="security" className="mt-0">
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
