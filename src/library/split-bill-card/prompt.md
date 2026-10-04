Build a React + TypeScript + Tailwind "Split-the-Bill Card". No extra libraries.

Props (typed): items (id, name, cents — integer cents so totals are exact), people (id, name, avatar colour), taxRate (default 0.08), tipRate (default 0.15), currency and locale (Intl.NumberFormat), initialAssignments (item id → person ids), onChange(assignments, totals), title, className.

Behaviour:
- A row of people as toggle buttons. Pick who is choosing, then tap receipt lines to add or remove them; or drag a person straight onto a line (HTML drag and drop, with the line highlighting as you hover it).
- Each line shows the avatars of whoever had it, popping in as they're added, or "unclaimed" in red.
- A shared item is split evenly; tax and tip are spread in proportion to what each person ate.
- All splitting uses a largest-remainder allocation in cents, so the shares always add back to the exact total — say so ("Adds up to the cent").
- Unclaimed items: show how much is left over with a "Share between everyone" button.
- Under the receipt, each person's total as a stack of coins that drop in, scaled to the biggest total, with the amount and name below.
Look: switchboard style — paper receipt with a zig-zag torn bottom edge (clip-path), mono figures with tabular numbers, 2px #1A1A17 ink, signal red #D7263D, bottle green #0E3B2E, gold coins. Every action is a real button with aria-pressed; changes are announced in a role="status" region; drag and drop is optional (tap works everywhere); reduced motion turns off the pops and coin drops.
