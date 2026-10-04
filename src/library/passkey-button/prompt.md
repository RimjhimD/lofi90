Build a React + TypeScript + Tailwind "Passkey Button" component for passwordless sign-in. No extra libraries.

Props (typed interface): intent ("signin" | "register"), onSignIn and onRegister (async functions that run the WebAuthn ceremony and throw on failure), optional onUseOtherDevice (phone / security key) and onFallback (e.g. use a password), labels (partial overrides for every piece of text), disabled, supportOverride ("supported" | "unsupported"), previewState (render one state without running anything, for docs and tests) and className. Nothing is hard-coded.

Look: board-game style. Thick #20201C outlines, a hard offset shadow, a yellow #FFB800 button with a round badge on the left holding a fingerprint drawn from 8 separate SVG ridge paths (pathLength=1 so each can be "drawn" with stroke-dashoffset).

Behaviour and states:
- Detect support with window.PublicKeyCredential. If unsupported, show a disabled grey state that says so, and keep the fallback link visible.
- Idle: the fingerprint is fully drawn over faint ghost ridges; on hover it tilts and grows slightly.
- Working: the ridges redraw themselves one after another from the centre outwards, in a loop (Web Animations API on stroke-dashoffset), a spinner shows, aria-busy is true, and the label reads "Waiting for your device…".
- Success: badge turns into a check, button goes mint, a small pop animation.
- Error: shake, red ridges, and a friendly message mapped from the DOMException name (NotAllowedError = cancelled or timed out, InvalidStateError on register = already has a passkey, SecurityError = needs https). The label becomes "Try again".
- Disabled: no hover lift, not clickable.
Use the Web Animations API for the shake and pop so the component needs no global CSS. Put status text in a role="status" aria-live region linked with aria-describedby. Visible focus ring, works at 375 px, and respect prefers-reduced-motion.
