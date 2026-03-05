import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  DollarSign,
  FileVideo,
  Loader2,
  StickyNote,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { VideoUpload } from "../../components/VideoUpload";
import { useSubmitJob } from "../../hooks/useQueries";

export function SubmitJobPage() {
  const navigate = useNavigate();
  const [sourceVideo, setSourceVideo] = useState<File | null>(null);
  const [referenceVideo, setReferenceVideo] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [sourceProgress, setSourceProgress] = useState(0);
  const [refProgress, setRefProgress] = useState(0);

  const submitJob = useSubmitJob();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceVideo || !referenceVideo) {
      toast.error("Please upload both videos before submitting.");
      return;
    }

    try {
      const checkoutUrl = await submitJob.mutateAsync({
        sourceVideoFile: sourceVideo,
        referenceVideoFile: referenceVideo,
        notes,
        onSourceProgress: setSourceProgress,
        onRefProgress: setRefProgress,
      });

      if (!checkoutUrl) {
        toast.error("Failed to get checkout URL.");
        return;
      }

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to submit job. Please try again.",
      );
    }
  };

  const isUploading = submitJob.isPending;

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

        <div className="mb-8">
          <h1 className="font-display text-3xl font-black tracking-tight mb-2">
            Submit a new editing job
          </h1>
          <p className="text-muted-foreground">
            Upload your source video and a reference video, add your notes, and
            complete payment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Videos */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-primary" />
                Videos
              </CardTitle>
              <CardDescription>
                Upload the video you want edited, and a reference video showing
                your desired style.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <VideoUpload
                label="Source Video (video to edit)"
                onFileSelect={(f) => setSourceVideo(f)}
                selectedFile={sourceVideo}
                progress={sourceProgress}
                uploading={isUploading && sourceProgress < 100}
                data-ocid="job.source_video.upload_button"
              />
              <VideoUpload
                label="Reference Video (inspiration/style example)"
                onFileSelect={(f) => setReferenceVideo(f)}
                selectedFile={referenceVideo}
                progress={refProgress}
                uploading={isUploading && refProgress < 100}
                data-ocid="job.reference_video.upload_button"
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-primary" />
                Editing Notes
              </CardTitle>
              <CardDescription>
                Describe what you want — transitions, color grading, music sync,
                pacing, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes" className="sr-only">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  data-ocid="job.notes.textarea"
                  placeholder="e.g. Match the fast-paced cuts from the reference video. Keep the color grading warm and cinematic. Add transitions between each scene..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[140px] bg-input resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="font-display font-semibold">
                    Editing fee
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-black text-gradient-amber">
                    $29.99
                  </p>
                  <p className="text-xs text-muted-foreground">
                    charged via Stripe
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            data-ocid="job.submit_button"
            type="submit"
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold text-base amber-glow"
            disabled={isUploading || !sourceVideo || !referenceVideo}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading & processing…
              </>
            ) : (
              <>
                Submit &amp; Pay $29.99
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
