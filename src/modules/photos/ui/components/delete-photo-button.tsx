"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "@/hooks/use-confirm";

interface DeletePhotoButtonProps {
  photoId: string;
  photoTitle: string;
}

export function DeletePhotoButton({
  photoId,
  photoTitle,
}: DeletePhotoButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [ConfirmDialog, confirm] = useConfirm(
    "Foto löschen",
    `Möchtest du "${photoTitle}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden. Das Foto wird dauerhaft gelöscht.`,
  );

  const deletePhoto = useMutation(trpc.photos.remove.mutationOptions());

  const handleDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

    deletePhoto.mutate(
      { id: photoId },
      {
        onSuccess: async () => {
          // Invalidate queries to refetch photos list
          await queryClient.invalidateQueries(
            trpc.photos.getMany.queryOptions({}),
          );
          toast.success("Foto erfolgreich gelöscht");
        },
        onError: (error) => {
          toast.error(error.message || "Fehler beim Löschen des Fotos");
        },
      },
    );
  };

  return (
    <>
      <ConfirmDialog />
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        title="Foto löschen"
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}
