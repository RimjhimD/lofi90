Build a React + TypeScript + Tailwind "Rolodex Carousel": a carousel that behaves like a desk rolodex. No extra libraries.

Props (typed): cards (id, title, optional subtitle, body as ReactNode, and tab — the A–Z letter, defaulting to the title's first letter), label (accessible name), initialIndex, onChange(index), className.

Look and motion:
- Cards hang from a rod between two red side wheels. The current card stands upright; the next four stack behind it, each a little higher, further back (translateZ), tilted and smaller; the card you just passed swings down over the hinge (rotateX about the bottom edge) and out of sight. Transitions use a springy cubic-bezier.
- Each card has a small A–Z tab sticking up from its top edge, positioned left-to-right by its letter like a real rolodex; ruled-paper lines, two punched holes at the bottom.
- The side wheels rotate as you flip.
Interaction:
- Mouse wheel (with a threshold), vertical drag (pointer capture, touch-none), ↑ ↓ ← → PageUp PageDown Home End on the focused carousel, plus ▲ ▼ buttons.
- Type any letter (or click it in the A–Z strip above, where letters with no cards are disabled) and the rolodex spins fast through every card in between to the first card under that tab.
Accessibility: section with aria-roledescription="carousel" and a label; each card role="group" aria-roledescription="card" with "3 of 16: Name"; only the current card is exposed (others aria-hidden + inert); a polite live region announces the current card after a spin; visible focus; prefers-reduced-motion jumps without the spin.

Look: switchboard style — 2px #1A1A17 borders, white cards on bone #F2EEE3 tabs, signal red #D7263D wheels and focus, mono numbers.
