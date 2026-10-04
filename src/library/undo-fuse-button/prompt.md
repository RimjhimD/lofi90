Build a React + TypeScript + Tailwind "Undo Fuse Button": a destructive button with its own undo window, drawn as a fuse burning around the button's border. No extra libraries.

Props (typed): onCommit (runs when the fuse burns out), onUndo (runs if the user cancels in time), delayMs (default 5000), labels (partial overrides for idle, burning with a {s} seconds placeholder, paused, done, undone), disabled, previewState ("idle" | "burning" | "done" | "undone" — render one state without running anything; "burning" drawn ~60% burnt) and className. Nothing is hard-coded.

Behaviour:
- First press starts the fuse. Nothing has happened yet — the real action only runs in onCommit when the fuse reaches the end.
- Pressing again (or Esc) while it burns cancels: label "Kept ↺", onUndo fires, nothing changed.
- The fuse is an SVG rect hugging the outside of the button (sized from a ResizeObserver on the border box), pathLength=1, showing only the unburnt part via stroke-dasharray/dashoffset. A glowing spark sits at the burning end, positioned with getPointAtLength.
- A 50 ms timer advances the fuse (measured with performance.now). It waits while the pointer is over the button ("Paused · move away to resume") and while the tab is hidden, so it never finishes while you're not looking.
- Label counts down: "Deleting in 3s · undo". When it burns out: "Deleted ✓" with a short flash.

Look: switchboard style — 2px #1A1A17 border, hard 3px offset shadow, signal red #D7263D idle, warm #FFF4E5 while burning with an amber #A86A00 fuse and #FFB547 spark, bottle green #0E3B2E when kept, ink when done. Status text in a role="status" region linked with aria-describedby, visible focus ring, reduced motion respected (no flash, no pulsing spark).

Look props: color (button colour before it's pressed), fuseColor, spark ("pulse" | "steady" | "none") and size ("sm" | "md" | "lg"), so the site can show colour, motion and size variants and a live controls panel.
