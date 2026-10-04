"use client";

import { UndoFuseButton } from "@/library/undo-fuse-button/UndoFuseButton";

// Do the real delete in onCommit only. Until the fuse burns out nothing has happened,
// so "undo" never has to put anything back.
export function DeleteFolderButton({ folder, onDeleted }: { folder: { id: string; name: string }; onDeleted: () => void }) {
  return (
    <UndoFuseButton
      delayMs={5000}
      labels={{ idle: `Delete ${folder.name}`, done: "Deleted" }}
      onCommit={async () => {
        await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
        onDeleted();
      }}
      onUndo={() => console.info("Kept", folder.name)}
    />
  );
}
