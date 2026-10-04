Build a React + TypeScript + Tailwind "Secret Key Field" for API keys and tokens. No extra libraries.

Props (typed): value and onChange (controlled), label, expects ("secret" | "publishable" | "any" — where the value ends up), visibleChars (default 4), peekMs (default 3000), clearClipboardMs (default 30000, 0 turns it off), placeholder, disabled, previewRevealed (render shown, for docs and tests) and className.

Behaviour:
- A real <input type="password"> with autocomplete off and spellcheck off; beside it "ends a9F2" shows the last visibleChars so you can tell keys apart without revealing them.
- Recognise well-known key shapes by prefix (Stripe sk_/rk_/pk_ live and test, GitHub ghp_/github_pat_, AWS AKIA…, Slack xox…, Google AIza…) and show a badge with the key's name and LIVE / TEST.
- Hold-to-peek button: pointer down or holding Space/Enter shows the key; letting go hides it, and it hides itself after peekMs even if still held. A ring around the eye drains (Web Animations API) to show the time left.
- Copy button copies without revealing, then overwrites the clipboard after clearClipboardMs with a visible countdown and a "Keep it" button.
- On paste, clean what sneaks in — spaces at the ends, wrapping quotes, line breaks — and say exactly what was removed.
- Guard rails in a role="status" region: a secret key in a field that expects "publishable" is an error (red border, aria-invalid, explains it would ship to every visitor); a publishable key in a secret field and any live key get an amber warning.

Look: control-room style — dark #121614 field with a 1px #3A433F border and rounded corners, mono font for the key, coral-tinted badge for secret kinds and a neutral one for publishable, lime #C6FF3D focus ring and peek countdown, coral #FF6B57 errors, amber #FFB547 warnings. Real buttons with aria-labels, visible focus, AA contrast on dark, works at 375 px. Never log or render the full key except while peeking.

Look props: accent (focus ring and countdown colour, via a CSS variable), drain ("ring" around the eye | "bar" under the field | "none") and size ("sm" | "md" | "lg"). With previewRevealed the countdown is drawn part-drained so a still preview shows it.
