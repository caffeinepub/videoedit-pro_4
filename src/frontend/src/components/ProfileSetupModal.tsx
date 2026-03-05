import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Film, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppUserRole } from "../backend";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  open: boolean;
}

export function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const saveMutation = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveMutation.mutateAsync({
        name: name.trim(),
        appRole: AppUserRole.client,
      });
      toast.success("Profile created! Welcome to VideoEdit Pro.");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <Dialog open={open} modal>
      <DialogContent
        data-ocid="profile.dialog"
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground">
              <Film className="w-5 h-5" />
            </div>
            <DialogTitle className="font-display text-xl">
              Welcome aboard!
            </DialogTitle>
          </div>
          <DialogDescription>
            Set up your profile to get started with VideoEdit Pro. You'll be
            registered as a client and can start submitting videos for editing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              data-ocid="profile.input"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <Button
            data-ocid="profile.submit_button"
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={saveMutation.isPending || !name.trim()}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Create profile"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
