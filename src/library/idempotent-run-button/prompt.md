Build a React + TypeScript + Tailwind "Idempotent Run Button" for actions that must never happen twice, like sending an SMS campaign, charging a card or firing a webhook. No extra libraries.

Props (typed interface): runKey (string that names this exact action, e.g. "promo-oct-04"), onRun (async function that receives the key, returns an optional result string like "Sent to 400 contacts", and throws on failure), windowMs (how long a finished key stays locked, default 60000), storage ("memory" | "session": session also blocks repeats after a page refresh), labels (partial overrides for run, running, done, blocked, retry), onBlocked (called with { runKey, ranAt } every time a repeat is stopped), disabled, previewState (render one state without running anything, for docs and tests) and className. Nothing is hard-coded.

Rules: keep finished keys in a module-level Map (plus sessionStorage when storage is "session") and an in-flight Set, so two buttons with the same key on one page still run once. Only write the key after onRun succeeds, so a failed run can be retried safely. Changing runKey resets the button to Ready.

Look: board-game style. Thick #20201C outlines, hard offset shadow, a red #FF5D5D button with a round cream badge holding a play icon, the label, and a small mono tag under it that shows "key: <runKey>".

States:
- Ready: play icon grows on hover; status line says "Same key within 60s runs only once."
- Running: yellow, a white stripe sweeps across the button in a loop, spinner, aria-busy, extra presses ignored.
- Done: mint, check icon, shows the result string, a small pop; status says how long the key is locked.
- Blocked (same key pressed again inside the window): light blue, a shield with a check slams down into the badge from above (overshoot and settle), and the button jumps and bounces off it. Label: "Already done · 12s ago". Status: what was stopped and when it is free again. Count down every second; when the window ends the shield cracks away (drops and spins out) and the button is ready again.
- Error: pale red, "!" badge, shake, label "Try again", status says nothing was saved so retrying is safe.
- Disabled: grey, no hover lift, not clickable.

Use the Web Animations API for every motion so no global CSS is needed. Status text goes in a role="status" aria-live region linked with aria-describedby. Visible focus ring, works at 375 px, and respect prefers-reduced-motion (no slam, sweep, shake or crack, only colour and text changes).
