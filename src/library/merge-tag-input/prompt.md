Build a React + TypeScript + Tailwind "Merge Tag Input" for writing SMS or email templates with merge fields like {{contact.first_name}}. No extra libraries.

Props (typed): value and onChange (controlled), fields (the merge fields the message may use: key, plain label, optional per-field fallback such as "there" or "our team"), samples (two or three contacts to preview against: a label + a values map), label, suggestedFallback (default "there"), disabled, className. Nothing is hard-coded.

Behaviour:
- Parse tags with the syntax {{key}} and {{key | fallback}}.
- Typing {{ opens a suggestion list of fields under the field; ↑ ↓ move, Enter or Tab inserts {{key}}, Esc closes. Proper listbox / option roles.
- Paint every tag inside the text field itself using a backdrop layer behind a transparent textarea (scroll-synced): green when fine, amber when it would be blank for someone, red when the key is not a real field.
- Below the field, list problems in a role="status" region, each with a one-click fix:
  - unknown field → "Use contact.first_name" (closest field by edit distance, max 3)
  - blank for some contacts (names them) → "Add fallback “there”" rewrites the tag to {{key | there}}, using the field's own fallback when it has one
  - a {{ that is never closed.
  When there are none, say "Every message below reads right."
- Under that, render the message once per sample contact as an SMS bubble: real values in bold, fallbacks highlighted amber, blanks shown as ⟨blank⟩ in red, unknown tags crossed out in red.

Look: switchboard style — 2px #1A1A17 ink border, white field, signal red #D7263D focus ring and problem bar, bottle green #0E3B2E success text, bone #E8E2D2 message bubbles, mono font for tags. Visible focus, AA contrast, works at 375 px.
