import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  Film,
  Fingerprint,
  Image,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { JobStatus, VideoType } from "../../backend";
import type { Job } from "../../backend";
import { StatusBadge } from "../../components/StatusBadge";
import { VideoUpload } from "../../components/VideoUpload";
import {
  useAdminSubmitFinalVideo,
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
      <TableCell>
        {job.videoType === VideoType.photo_to_video ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <Image className="w-2.5 h-2.5" />
            Photo→Video
          </span>
        ) : job.videoType === VideoType.small ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
            <Zap className="w-2.5 h-2.5" />
            Small
          </span>
        ) : job.videoType === VideoType.medium ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <Film className="w-2.5 h-2.5" />
            Medium
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25">
            <Clock className="w-2.5 h-2.5" />
            Long
          </span>
        )}
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
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [fingerprintRegistered, setFingerprintRegistered] = useState(
    hasFingerprintRegistered,
  );
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const setAdminPasskey = useSetAdminPasskey();
  const webAuthnSupported = isWebAuthnSupported();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      toast.error("Please enter your admin email address.");
      return;
    }
    if (adminPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    try {
      await setAdminPasskey.mutateAsync(
        `${adminEmail.trim()}:${adminPassword}`,
      );
      toast.success("Admin email and password updated successfully.");
      setAdminEmail("");
      setAdminPassword("");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update admin credentials.",
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
      {/* Info banner */}
      <div
        data-ocid="admin.security.info_panel"
        className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/25 text-sm"
      >
        <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
        <div>
          <p className="font-medium text-blue-300 mb-0.5">
            Set your admin email and password below.
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            These will be used to log in to the admin portal. If you have
            forgotten your credentials, use "Reset via Internet Identity" on the
            login page to reach this tab.
          </p>
        </div>
      </div>

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
              entering your email and password.
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
                    replaces your current admin email and password passkey.
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

      {/* Admin Credentials Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Set Admin Credentials
          </CardTitle>
          <CardDescription>
            Set the email and password used to log in to the admin portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            {/* Email input */}
            <div className="space-y-2">
              <Label
                htmlFor="security-admin-email"
                className="text-sm font-medium"
              >
                Admin Email
              </Label>
              <Input
                id="security-admin-email"
                data-ocid="admin.security.email.input"
                type="email"
                placeholder="your@gmail.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="bg-input border-border"
                autoComplete="email"
              />
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <Label
                htmlFor="security-admin-password"
                className="text-sm font-medium"
              >
                Admin Password
              </Label>
              <Input
                id="security-admin-password"
                data-ocid="admin.security.password.input"
                type="password"
                placeholder="Min. 6 characters"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="bg-input border-border"
                autoComplete="new-password"
              />
            </div>

            {/* Note */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
              <p>
                You will use this email and password every time you log in to
                the admin portal. Keep them safe and do not share them.
              </p>
            </div>

            <Button
              data-ocid="admin.security.save_passkey.button"
              type="submit"
              disabled={
                setAdminPasskey.isPending ||
                !adminEmail.trim() ||
                adminPassword.length < 6
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
                  <Mail className="w-4 h-4" />
                  Save Admin Credentials
                </>
              )}
            </Button>

            {setAdminPasskey.isSuccess && (
              <p
                data-ocid="admin.security.success_state"
                className="text-sm text-center text-[oklch(0.75_0.18_148)]"
              >
                ✓ Admin email and password updated successfully
              </p>
            )}
            {setAdminPasskey.isError && (
              <p
                data-ocid="admin.security.error_state"
                className="text-sm text-center text-destructive"
              >
                Failed to update credentials. Try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Uploaders Tab ─────────────────────────────────────────────────────────────

function VideoTypeBadge({ videoType }: { videoType: VideoType }) {
  if (videoType === VideoType.photo_to_video) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
        <Image className="w-2.5 h-2.5" />
        Photo→Video
      </span>
    );
  }
  if (videoType === VideoType.small) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
        <Zap className="w-2.5 h-2.5" />
        Small
      </span>
    );
  }
  if (videoType === VideoType.medium) {
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

function UploaderJobRow({ job }: { job: Job }) {
  const [editedVideoFile, setEditedVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const adminSubmit = useAdminSubmitFinalVideo();

  const handleResend = async () => {
    if (!editedVideoFile) {
      toast.error("Please select a video file first.");
      return;
    }
    try {
      await adminSubmit.mutateAsync({
        jobId: job.jobId,
        videoFile: editedVideoFile,
        onProgress: setUploadProgress,
      });
      toast.success("Edited video sent to uploader successfully!");
      setEditedVideoFile(null);
      setUploadProgress(0);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send edited video.",
      );
    }
  };

  const sourceUrl = job.sourceVideo.getDirectURL();
  const referenceUrl = job.referenceVideo.getDirectURL();
  const finalUrl = job.finalVideo?.getDirectURL();

  return (
    <div className="p-4 space-y-4 bg-muted/10 rounded-lg border border-border">
      {/* Job header row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          <Link
            to="/admin/jobs/$id"
            params={{ id: job.jobId }}
            className="text-primary hover:underline"
          >
            #{job.jobId.slice(0, 14)}…
          </Link>
        </span>
        <VideoTypeBadge videoType={job.videoType} />
        <StatusBadge status={job.status} />
        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
          <Calendar className="w-3 h-3" />
          {formatDate(job.createdAt)}
        </span>
        <span className="text-xs font-display font-semibold text-[oklch(0.75_0.18_148)]">
          ₹{(Number(job.price) / 100).toLocaleString("en-IN")}
        </span>
      </div>

      {/* Video download row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Source Video */}
        <div className="flex flex-col gap-1.5 p-3 rounded-md bg-card border border-border">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Video className="w-3 h-3" />
            Source Video
          </p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            data-ocid="admin.uploaders.source_video.button"
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors w-fit"
          >
            <Download className="w-3.5 h-3.5" />
            Download Source
          </a>
        </div>

        {/* Reference Video */}
        <div className="flex flex-col gap-1.5 p-3 rounded-md bg-card border border-border">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-3 h-3" />
            Reference Video
          </p>
          <a
            href={referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            data-ocid="admin.uploaders.reference_video.button"
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md bg-[oklch(0.65_0.16_230/0.15)] text-[oklch(0.75_0.16_230)] border border-[oklch(0.65_0.16_230/0.3)] hover:bg-[oklch(0.65_0.16_230/0.25)] transition-colors w-fit"
          >
            <Download className="w-3.5 h-3.5" />
            Download Reference
          </a>
        </div>
      </div>

      {/* Resend Edited Video */}
      <div className="p-3 rounded-md bg-card border border-border space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Send className="w-3 h-3" />
            Resend Edited Video to Uploader
          </p>
          {finalUrl && (
            <a
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[oklch(0.68_0.18_148/0.15)] text-[oklch(0.75_0.18_148)] border border-[oklch(0.68_0.18_148/0.3)] hover:bg-[oklch(0.68_0.18_148/0.25)] transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" />
              Already sent · View
            </a>
          )}
        </div>

        {finalUrl && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" />
            Re-upload below to send a new version:
          </p>
        )}

        <VideoUpload
          label="Upload Edited Video"
          onFileSelect={setEditedVideoFile}
          selectedFile={editedVideoFile}
          progress={uploadProgress}
          uploading={adminSubmit.isPending}
          data-ocid="admin.uploaders.resend.dropzone"
        />

        <Button
          data-ocid="admin.uploaders.resend.submit_button"
          size="sm"
          onClick={handleResend}
          disabled={!editedVideoFile || adminSubmit.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold gap-2 w-full sm:w-auto"
        >
          {adminSubmit.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Sending… {uploadProgress > 0 && `${Math.round(uploadProgress)}%`}
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Send to Uploader
            </>
          )}
        </Button>

        {adminSubmit.isSuccess && !adminSubmit.isPending && (
          <p
            data-ocid="admin.uploaders.resend.success_state"
            className="text-xs text-[oklch(0.75_0.18_148)] flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Video sent successfully to uploader.
          </p>
        )}
        {adminSubmit.isError && (
          <p
            data-ocid="admin.uploaders.resend.error_state"
            className="text-xs text-destructive flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Failed to send video. Try again.
          </p>
        )}
      </div>
    </div>
  );
}

interface UploaderGroup {
  clientId: string;
  jobs: Job[];
  totalPaid: number;
}

function UploaderCard({
  group,
  index,
}: {
  group: UploaderGroup;
  index: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-ocid={`admin.uploaders.uploader_card.${index}`}
    >
      <Card className="bg-card border-border overflow-hidden">
        {/* Card header with collapse toggle */}
        <CollapsibleTrigger asChild>
          <button type="button" className="w-full text-left">
            <CardHeader className="pb-3 hover:bg-muted/10 transition-colors cursor-pointer">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
                    <UserCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-foreground truncate">
                      {group.clientId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Uploader ID
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
                      Jobs
                    </p>
                    <p className="font-display text-lg font-black text-primary">
                      {group.jobs.length}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
                      Total Paid
                    </p>
                    <p className="font-display text-lg font-black text-[oklch(0.75_0.18_148)]">
                      ₹{group.totalPaid.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:hidden">
                    <span className="text-xs text-muted-foreground">
                      {group.jobs.length} job
                      {group.jobs.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs font-semibold text-[oklch(0.75_0.18_148)]">
                      ₹{group.totalPaid.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {open ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <Separator className="mb-4 bg-border" />
            <div className="space-y-4">
              {group.jobs.map((job, jobIdx) => (
                <div key={job.jobId}>
                  {jobIdx > 0 && <Separator className="mb-4 bg-border/50" />}
                  <UploaderJobRow job={job} />
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function UploadersTab({ allJobs }: { allJobs: Job[] }) {
  // Group jobs by clientId
  const uploaderMap = new Map<string, Job[]>();
  for (const job of allJobs) {
    const key = job.clientId.toString();
    const existing = uploaderMap.get(key);
    if (existing) {
      existing.push(job);
    } else {
      uploaderMap.set(key, [job]);
    }
  }

  const uploaderGroups: UploaderGroup[] = Array.from(uploaderMap.entries()).map(
    ([clientId, jobs]) => ({
      clientId: truncatePrincipal({ toString: () => clientId }),
      jobs,
      totalPaid: jobs.reduce((sum, j) => {
        if (j.status !== JobStatus.pending_payment) {
          return sum + Number(j.price) / 100;
        }
        return sum;
      }, 0),
    }),
  );

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Individual Uploaders
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each uploader's videos, downloads, and resend controls in one place.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
            Total Uploaders
          </p>
          <p className="font-display text-2xl font-black text-primary">
            {uploaderGroups.length}
          </p>
        </div>
      </div>

      {/* Uploader cards or empty state */}
      {uploaderGroups.length === 0 ? (
        <div
          data-ocid="admin.uploaders.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No uploaders yet</p>
          <p className="text-xs mt-1 opacity-60">
            Uploader sections will appear here once jobs are submitted.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {uploaderGroups.map((group, index) => (
            <UploaderCard
              key={group.clientId}
              group={group}
              index={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Job Status Filter Tabs ─────────────────────────────────────────────────────

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
              value="uploaders"
              data-ocid="admin.uploaders.tab"
              className="gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Uploaders
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
                            TYPE
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

          {/* Uploaders tab */}
          <TabsContent value="uploaders" className="mt-0">
            {jobsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <UploadersTab allJobs={allJobs || []} />
            )}
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
