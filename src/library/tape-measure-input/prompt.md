Build a React + TypeScript + Tailwind "Tape Measure Input": a number input you pull out like a metal tape measure. No extra libraries.

Props (typed): value, onChange(value) (live, always on the step grid), onSettle(value) (once a value is chosen: drag let go, track click, key press), min (default 0), max (default 200), step (default 1), unit (default "cm"), label (default "Length"), accent (tape colour, default lime #C6FF3D), size ("sm" | "md" | "lg"), disabled, preview ({ value, pulling? } — freeze one look without interaction, for docs) and className.

Look:
- On the left, a chunky rounded case with a small screw, an accent pill and an inset readout window showing the value big in tabular monospace numbers with the unit. A dark slot on its right edge is where the tape comes out.
- From the slot, a tape strip in the accent colour runs right, with a soft metal sheen, minor and major ticks hanging from its top edge and numbers on the majors (dark #0B0D0C print). It ends in a metal end hook: a small grey gradient tab, taller than the tape.
- Behind the tape, a faint dotted line shows how far it can reach, with an end stop and the max number.
- Tick spacing adapts to the width (1-2-5 steps, minor ticks at least ~5 px apart, labels at least ~30 px apart), so the scale stays readable at 375 px and at 1000 px. The ticks are fixed to the tape: a mark's number is min plus its distance from the hook, so the number at the slot is always the reading, and the marks slide out of the slot as you pull.

Behaviour:
- Drag the hook (pointer events with capture) to pull the tape out or push it in. The readout counts live and onChange fires on every new step. Past max the tape gives a little with heavy resistance.
- Let go and it snaps to the nearest step on an under-damped spring with a small fixed release kick, so it always overshoots a hair and settles.
- Click anywhere on the track and the tape slides there on a softer spring.
- Fast moves make the tape flex: a quick, decaying sway (rotation about the slot, at most ~1.6°) driven by speed.
- Going back to min zips the tape in with an ease-in (it speeds up and slams home), and the case jolts.
- All motion runs in one requestAnimationFrame loop in fractions of the track, writing state once per frame; it stops when everything is at rest.
- Keyboard: the hook is role="slider" with aria-valuemin/max/now and aria-valuetext ("32 cm"), labelled by the label. Arrows ±step, Shift+arrow ±10 steps, PageUp/PageDown ±10 steps, Home/End to min/max.
- Disabled dims to 50% and locks pointer and keys. Reduced motion jumps straight to values with no spring, wobble or jolt.

Colours come from stage variables with dark defaults (--k-panel-2 case, --k-bg readout window, --k-line borders, --k-text / --k-mute text, --k-acc-text for the readout while moving and the focus ring), so it reads on dark and light pages.
