Build a React + TypeScript + Tailwind "Plucked String Nav": navigation links that sit on a taut string, like a guitar string. No extra libraries.

Props (typed): items ({ id, label, href? }[]), value (active id), onChange(id), accent (bead and glow colour, default #C6FF3D), tension (1–10, default 5: how stiff the string is — higher rings faster and dies sooner), wobble (pluck strength in px, 0–16, default 9; 0 turns the ring off), size ("sm" | "md" | "lg"), label (the nav's accessible name, default "Main"), preview ({ pull?: { x 0–1, y px }, plucked?: boolean } — freeze one look without physics, for docs) and className.

Look:
- A row of links in an equal-width grid (so four short labels fit at 375px), and under them a thin SVG string stretched between two small pegs, one at each end. The string has a soft sheen: a userSpaceOnUse gradient that is brighter in the middle of the span.
- A glowing accent bead (solid dot, blurred halo, tiny white highlight) sits on the string under the active link. Active link text is full colour, the others muted until hovered.

Behaviour:
- Pull: when the pointer moves over the band just under the links, the string bends toward it — a soft tent shape anchored at the pegs, with the tip under the cursor — and springs back (with a small overshoot) when the pointer leaves.
- Pluck: clicking a link (or Enter / Space) plucks the string at that link. The ring is a sum of four harmonics, mode n weighted sin(nπ·u)/n² like a real plucked string, each a damped sine; frequency and decay come from tension, amplitude from wobble, higher harmonics die faster. While it rings the string glows in the accent colour.
- The bead slides to the new link on a spring and rides the string's curve, so it bobs with the vibration and stretches slightly in the direction it's moving. It also makes a tiny dip in the string where it sits.
- Hovering a link lifts a small local bend under it.
- All motion runs in one requestAnimationFrame loop that writes the SVG path and bead transform directly (no React re-render per frame) and stops when everything settles. Pointer positions are converted to layout px, so the nav still lines up inside a scaled preview. A soft tanh limit keeps big pulls from reaching the links.

Accessibility: a real <nav> with a list of buttons (or links when href is given; plain clicks call onChange, Cmd/Ctrl-click opens normally). aria-current="page" on the active item, roving tabindex with ←/→/Home/End, Enter/Space activates. Lime focus ring. Reduced motion: no pull, no ring, the bead jumps straight to the new link.

Look style: control-room — stage text colour for the string, muted pegs, 1px lines, colours from stage CSS variables so it works on dark and light pages.
