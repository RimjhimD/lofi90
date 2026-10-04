Build a React + TypeScript + Tailwind "Undo Fuse Button": a destructive button with its own undo window, drawn as a fuse burning around the button's border. No extra libraries.

Props (typed): onCommit (runs when the fuse burns out; may return a Promise), onError (runs if onCommit throws or rejects), onUndo (runs if the user cancels in time), delayMs (default 5000), labels (partial overrides for every visible and announced string: idle, burning with a {s} seconds placeholder, paused, committing, done, undone, doneMark, undoneMark, hint, pausedHint, countdown, doneHint, undoneHint, error), disabled, pending (force the loading look), previewState ("idle" | "burning" | "committing" | "done" | "undone" — render one state without running anything; "burning" drawn ~60% burnt) and className. Nothing is hard-coded.

Behaviour:
- First press starts the fuse. Nothing has happened yet — the real action only runs in onCommit when the fuse reaches the end.
- Pressing again (or Esc) while it burns cancels: label "Kept ↺", onUndo fires, nothing changed.
- The fuse is an SVG rect hugging the outside of the button (sized from a ResizeObserver on the border box), pathLength=1, showing only the unburnt part via stroke-dasharray/dashoffset. A glowing spark sits at the burning end, positioned with getPointAtLength.
- A 50 ms timer advances the fuse (measured with performance.now). It waits while the pointer is over the button ("Paused · move away to resume") and while the tab is hidden, so it never finishes while you're not looking.
- Label counts down: "Deleting in 3s · undo". The status region announces a coarse countdown (at the start, then at 3s and 1s), not every tick.
- When it burns out: if onCommit returns a Promise, show "Deleting…" with aria-busy until it settles; on rejection go back to idle, show the error line for a few seconds and call onError. On success: "Deleted ✓" with a short flash, then the button is aria-disabled so a second press can't run onCommit again.

Look: control-room style — dark #121614 panel UI, 1px #3A433F borders, rounded corners, lime #C6FF3D idle button with text colour picked for contrast, amber #FFB547 fuse with a pale glowing spark, a faint tint of fuseColor while burning and of color when kept (color-mix), spark derived from fuseColor, #181D1B when done. Status text in a role="status" region linked with aria-describedby, visible focus ring in var(--k-acc-text) so it holds 3:1 on light and dark stages, clear hover (lift + brighten) and pressed (sink) states, reduced motion respected (no flash, no pulsing spark).

Look props: color (button colour before it's pressed), fuseColor, spark ("pulse" | "steady" | "none") and size ("sm" | "md" | "lg"), so the site can show colour, motion and size variants and a live controls panel.
