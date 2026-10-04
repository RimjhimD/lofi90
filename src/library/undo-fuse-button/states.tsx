import { UndoFuseButton } from "./UndoFuseButton";

const noop = () => {};

/** Every state, rendered with previewState (nothing actually runs). */
export const UNDO_FUSE_BUTTON_STATES = [
  { id: "idle", label: "Ready", note: "A plain destructive button until you press it.", node: <UndoFuseButton onCommit={noop} previewState="idle" /> },
  { id: "burning", label: "Fuse burning", note: "The fuse burns around the border; the spark marks how much time is left.", node: <UndoFuseButton onCommit={noop} previewState="burning" /> },
  { id: "undone", label: "Undone", note: "Pressed again in time: nothing happens, it says so.", node: <UndoFuseButton onCommit={noop} previewState="undone" /> },
  { id: "done", label: "Done", note: "The fuse reached the end and the action ran.", node: <UndoFuseButton onCommit={noop} previewState="done" /> },
  { id: "disabled", label: "Disabled", note: "Nothing selected, so nothing to delete.", node: <UndoFuseButton onCommit={noop} disabled /> },
];

/** The same button in other colours, motions and sizes. */
export const UNDO_FUSE_BUTTON_VARIANTS = [
  { group: "Colour", label: "Lime", node: <UndoFuseButton onCommit={noop} previewState="idle" color="#C6FF3D" /> },
  { group: "Colour", label: "Coral", node: <UndoFuseButton onCommit={noop} previewState="idle" color="#FF6B57" /> },
  { group: "Colour", label: "Cyan", node: <UndoFuseButton onCommit={noop} previewState="idle" color="#3DD9FF" /> },
  { group: "Colour", label: "Coral fuse", node: <UndoFuseButton onCommit={noop} previewState="burning" fuseColor="#FF6B57" /> },
  { group: "Colour", label: "Cyan fuse", node: <UndoFuseButton onCommit={noop} previewState="burning" fuseColor="#3DD9FF" /> },
  { group: "Colour", label: "White fuse", node: <UndoFuseButton onCommit={noop} previewState="burning" fuseColor="#E9EDE8" /> },
  { group: "Motion", label: "Pulsing spark", node: <UndoFuseButton onCommit={noop} previewState="burning" spark="pulse" /> },
  { group: "Motion", label: "Steady spark", node: <UndoFuseButton onCommit={noop} previewState="burning" spark="steady" /> },
  { group: "Motion", label: "No spark", node: <UndoFuseButton onCommit={noop} previewState="burning" spark="none" /> },
  { group: "Size", label: "Small", node: <UndoFuseButton onCommit={noop} previewState="idle" size="sm" /> },
  { group: "Size", label: "Medium", node: <UndoFuseButton onCommit={noop} previewState="idle" size="md" /> },
  { group: "Size", label: "Large", node: <UndoFuseButton onCommit={noop} previewState="idle" size="lg" /> },
];
