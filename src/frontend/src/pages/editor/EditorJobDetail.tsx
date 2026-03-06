import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Film,
  Loader2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../../components/StatusBadge";
import { VideoUpload } from "../../components/VideoUpload";
import { useGetJob, useSubmitFinalVideo } from "../../hooks/useQueries";

interface EditorJobDetailProps {
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

export function EditorJobDetail({ jobId }: EditorJobDetailProps) {
  const navigate = useNavigate();
  const { data: job, isLoading, error } = useGetJob(jobId);
  const [finalVideoFile, setFinalVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const submitFinalVideo = useSubmitFinalVideo();

  const handleSubmitFinal = async () => {
    if (!finalVideoFile) {
      toast.error("Please select the final edited video to upload.");
      return;
    }
    try {
      await submitFinalVideo.mutateAsync({
        jobId,
        videoFile: finalVideoFile,
        onProgress: setUploadProgress,
      });
      toast.success("Final video submitted! The client will be notified.");
      navigate({ to: "/editor" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit video.",
      );
    }
  };

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
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center py-16">
        <p className="text-destructive font-display font-bold mb-4">
          Job not found
        </p>
        <Button asChild variant="outline">
          <Link to="/editor">← Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isAlreadyCompleted = job.status === "completed";

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
          onClick={() => navigate({ to: "/editor" })}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to workspace
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight mb-1">
              Editing Job
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              #{job.jobId.slice(0, 24)}…
            </p>
          </div>
          <StatusBadge status={job.status} className="text-sm px-3 py-1" />
        </div>

        <div className="space-y-4">
          {/* Job info */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                Job Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">
                    SUBMITTED
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {formatDate(job.createdAt)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">
                    PRICE
                  </p>
                  <span className="text-primary font-display font-semibold">
                    ₹{(Number(job.price) / 100).toLocaleString("en-IN")}
                  </span>
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

          {/* Source videos to download */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                Videos to Work With
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
                  <Film className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Source Video</p>
                    <p className="text-xs text-muted-foreground">
                      The video to edit
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 pointer-events-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </a>

              <a
                href={job.referenceVideo.getDirectURL()}
                target="_blank"
                rel="noopener noreferrer"
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
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Upload final video */}
          {isAlreadyCompleted ? (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-[oklch(0.75_0.18_148)]">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-display font-bold">
                    Final video already submitted
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  Submit Final Edited Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <VideoUpload
                  label="Final Edited Video"
                  onFileSelect={(f) => setFinalVideoFile(f)}
                  selectedFile={finalVideoFile}
                  progress={uploadProgress}
                  uploading={submitFinalVideo.isPending}
                  data-ocid="editor.final_video.upload_button"
                />
                <Button
                  data-ocid="editor.submit_button"
                  onClick={handleSubmitFinal}
                  disabled={!finalVideoFile || submitFinalVideo.isPending}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold gap-2"
                >
                  {submitFinalVideo.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Submit Final Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}
