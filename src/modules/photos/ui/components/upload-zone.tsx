import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { IMAGE_SIZE_LIMIT } from "@/constants";

interface UploadZoneProps {
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
  uploadProgress: number;
  multiple?: boolean;
}

export function UploadZone({
  isUploading,
  onUpload,
  uploadProgress,
  multiple = false,
}: UploadZoneProps) {
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: async (acceptedFiles) => {
      for (const file of acceptedFiles) {
        await onUpload(file);
      }
    },
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    multiple,
  });

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-full size-32 bg-muted cursor-pointer",
          { "opacity-50": isUploading },
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="flex flex-col items-center justify-center pt-5 pb-6 relative size-32">
          <UploadCloud className="size-20 opacity-70" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h1 className={cn(isUploading && "opacity-50")}>
          Fotos per Drag & Drop hier ablegen
        </h1>
        <p className="text-xs text-muted-foreground">
          Deine Fotos bleiben privat, bis du sie veröffentlichst.
        </p>
        <p className="text-xs text-muted-foreground">
          Maximale Dateigröße: {IMAGE_SIZE_LIMIT / 1024 / 1024} MB
        </p>
      </div>
      {isUploading ? (
        <Button
          disabled
          className="relative"
          style={{
            background: `linear-gradient(to right, rgb(34 197 94) ${uploadProgress}%, rgb(15 23 42) ${uploadProgress}%)`,
          }}
        >
          Wird hochgeladen... {uploadProgress}%
        </Button>
      ) : (
        <Button type="button" disabled={isUploading} onClick={open}>
          Datei auswählen
        </Button>
      )}
    </div>
  );
}
