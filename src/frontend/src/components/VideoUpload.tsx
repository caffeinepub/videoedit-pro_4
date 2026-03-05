import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, Film, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface VideoUploadProps {
  label: string;
  accept?: string;
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  progress?: number;
  uploading?: boolean;
  "data-ocid"?: string;
}

export function VideoUpload({
  label,
  accept = "video/*",
  onFileSelect,
  selectedFile,
  progress,
  uploading,
  "data-ocid": dataOcid,
}: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const dropzoneId = `dropzone-${dataOcid || "upload"}`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={dropzoneId}
        className="text-sm font-medium text-foreground font-display"
      >
        {label}
      </label>
      <button
        type="button"
        id={dropzoneId}
        data-ocid={dataOcid}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!uploading) inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative w-full cursor-pointer rounded-lg border-2 border-dashed p-6 transition-all duration-200",
          "flex flex-col items-center gap-3 text-center",
          dragOver
            ? "border-primary bg-primary/5"
            : selectedFile
              ? "border-[oklch(0.68_0.18_148/0.6)] bg-[oklch(0.68_0.18_148/0.05)]"
              : "border-border hover:border-primary/50 hover:bg-primary/5",
          uploading && "opacity-60 cursor-not-allowed",
        )}
        disabled={uploading}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
          disabled={uploading}
        />

        {selectedFile ? (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[oklch(0.68_0.18_148/0.15)]">
              <CheckCircle2 className="w-6 h-6 text-[oklch(0.75_0.18_148)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatSize(selectedFile.size)}
              </p>
            </div>
            {!uploading && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  if (inputRef.current) inputRef.current.value = "";
                  onFileSelect(null as unknown as File);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <Film className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop video here or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, MOV, AVI, MKV — up to 2GB
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Upload className="w-3.5 h-3.5" />
              <span>Click or drag &amp; drop</span>
            </div>
          </>
        )}
      </button>

      {uploading && progress !== undefined && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
