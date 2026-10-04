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
