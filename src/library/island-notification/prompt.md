Build a React + TypeScript + Tailwind "Island Notification": notifications that live in a small black pill at the top of the screen, in the spirit of a phone's dynamic island. No extra libraries.

Props (typed): items (queue of { id, title, body?, icon?, tone? "info" | "success" | "warning" | "error", action? { label, onClick }, progress? 0–1 }), onDismiss(id), duration (default 4000, how long a card stays open), morphMs (default 520), holdWhileTyping (default true), accent (idle glow and info colour), position ("fixed" | "absolute"), preview ("open" | "held" — freeze one look without timers, for docs) and className.

Behaviour:
- Idle: a 132×36 black pill with a glowing dot and a short status ("quiet", "+2", "1 waiting").
- A new notification makes the pill morph — width, height and corner radius animate on a springy cubic-bezier — into a card sized to its content (measured with a ResizeObserver): icon in a tone-tinted circle, title, body, optional action button. The content fades in partway through the morph. After `duration` it shrinks back and calls onDismiss; the next one in the queue then takes its turn.
- Hovering pauses the timer. Swipe the card up (pointer drag) or press Esc to dismiss; Enter runs the action.
- An item with progress < 1 is a live activity: it stays inside a wider pill as a progress ring with its title, and turns into a normal notification when it reaches 1.
- holdWhileTyping: while the person is typing in an input, textarea or contenteditable (any keydown in the last 1.2 s), nothing opens — the dot turns amber and the pill says "N waiting"; when they pause, the queue resumes.
- Announce each notification in a polite live region; the action is a real button; reduced motion turns the morph off.

Look: control-room style — pure black island with a faint white ring, #E9EDE8 text, #8A938D secondary text, glow tinted by tone (lime #C6FF3D success, amber #FFB547 warning, coral #FF6B57 error, accent for info), rounded-full action buttons.

The full-width wrapper is pointer-events: none so it never blocks the page under it; only the island takes clicks. Swipe-up uses pointer capture, and pointercancel (the browser taking the gesture for a scroll) puts the card back instead of leaving it stuck.
