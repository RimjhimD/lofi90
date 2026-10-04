Build a React + TypeScript + Tailwind "Boarding Pass Card": a ticket whose stub you tear off along the perforation to check in. No extra libraries.

Props (typed): pass ({ from: { code, city }, to: { code, city }, passenger, flight, date, boards, gate, seat, group?, cabin?, gateChanged? }), airline, onTear() (check-in), onPeelStart(), onSnapBack(), torn (controlled) / defaultTorn, accent (default #C6FF3D), tearDistance (default 110, px you must pull before it rips), size ("sm" | "md" | "lg"), preview ("ready" | "tearing" | "torn" — freeze one look for docs) and className.

Look:
- A main panel and a stub, split by a dashed perforation with half-circle notches bitten out of both ends (radial-gradient masks, so the page shows through). A drop-shadow filter on the wrapper follows the cut-out shape.
- Main panel: airline and flight, big FROM → TO airport codes in mono with the city names under them, and a dotted arc between them with a small plane that glides along it on a slow loop (SVG animateMotion) and fades at each end. Then a grid of passenger, date, boards, gate and seat in tabular mono.
- Stub: seat big, gate and group, a barcode drawn from SVG bars (seeded from the pass so it never changes), and a small "Tear to check in" hint with an arrow.
- Layout is a container query: at 420px and wider the stub sits on the right and tears to the right; narrower (a 375px phone) it sits below with a horizontal perforation and tears downward.

Behaviour:
- Drag the stub away from the perforation (pointer capture). One registered CSS number, --p, drives the peel: the stub turns around the perforation corner and slides away, the main panel leans back a hair. The pull follows a resistance curve (sin) so it gets stiffer, and trembles just before it gives. As soon as it moves, both edges switch to a zigzag clip-path whose teeth are offset, so a jagged torn gap opens along the line.
- Let go before tearDistance: --p transitions back to 0 on an overshooting cubic-bezier, so it springs home. Past tearDistance it rips: the stub is thrown off with rotation and fades (Web Animations), the torn edge stays on the main panel, and a CHECKED IN stamp with the seat and gate scales down from big with a slight twist and lands with a small thump. onTear fires.
- A real button under the card, "Tear stub to check in", does the same for keyboard users and reads "Checked in ✓" afterwards. A polite live region says "Checked in. Seat 14A, gate B12."
- Reduced motion: no peel, no throw, no gliding plane; the stamp just appears.
- gateChanged shows the gate in amber with "new" on both halves.

Colours come from stage variables (--k-panel, --k-panel-2, --k-line, --k-text, --k-mute, --k-shadow) with dark defaults, so it reads on dark and light pages; the stamp, plane and hint arrow use the accent, darkened on light stages.
