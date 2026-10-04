Build a React + TypeScript + Tailwind "Vinyl Crate Carousel": a carousel where the slides are albums standing in a record crate, and you flip through them like in a record shop. No extra libraries, no images.

Props (typed): records ({ id, title, artist, year?, colors: [string, string], pattern? "sun" | "bands" | "rings" | "split" | "grid" | "wave" }), label (accessible name), index + onChange (optional controlled), initialIndex, onPlay(record), onPutBack(record), accent (default #C6FF3D), rpm (33 | 45), flipMs (default 450), size ("sm" | "md" | "lg"), preview ({ index, pulled? } — freeze one look without input, for docs) and className.

Look:
- A dark wooden crate seen slightly from above with CSS perspective: a floor, a back wall, two sloping side walls and a front lip lower than the back, with slats and a hand-hold slot. The wood is a fixed colour on any page.
- Up to six square sleeves stand inside it, front to back, each a little further back in z so their top edges stack away. The ones behind get darker and lean a hair to either side.
- Every cover is generated from its two colours with CSS gradients (a sun on a horizon, diagonal bands, rings, a split with a dot, a checker, waves), with the artist and title printed small on it. If no pattern is given, one is picked from the id.
- Under the crate, a small tag: "03 / 08 · Title · Artist". Below that: previous, Play and next buttons and a one-line hint.
- Everything is sized in "cover sizes" from one CSS variable, min(size px, 42% of the component's width), so it fits a 375px phone and still looks right at 1000px.

Behaviour:
- Flip with the buttons, a sideways trackpad swipe or Shift + wheel over the crate, a drag, or ← → (Home / End jump to the ends). Each flip tips the front sleeve toward you (rotateX) until it leans over the front lip, revealing the next one; going back lifts it upright again. Flips use a slightly springy cubic-bezier, and the sleeve's paint order switches part-way through so it falls over the lip instead of through it.
- Only a sideways wheel (or Shift + wheel) flips, so a normal vertical scroll always moves the page; that sideways gesture is claimed with a native non-passive listener.
- Pull out (click the front record, Enter, or Play): the sleeve rises out of the crate and toward you, then slides left while the black vinyl disc slides out of it to the right. The disc has grooves from a repeating-radial-gradient, a still light reflection on top, a centre label in the album's colours and a spindle hole. A tonearm swings onto it, a soft accent glow appears behind it, and it spins at the chosen rpm. The crate dims, and the tag becomes "Now playing · 33 rpm" with the title large.
- Esc or Put back reverses it: slide back, drop into the crate.
- Lift is done with the CSS `translate` property and the slide with `transform`, each with its own delay, so the move is "up, then sideways" rather than diagonal.

Accessibility: a section with aria-roledescription="carousel"; each sleeve is a group with aria-roledescription="slide" and "3 of 8: Title — Artist"; real buttons; a polite live region announcing "3 of 8: Title — Artist" or "Now playing …". With reduced motion, flips and pull-outs become a quick crossfade and the disc doesn't spin.

Colours: panel, line, text and mute colours come from stage CSS variables with dark fallbacks, so it reads on dark and light pages; the record is always black vinyl and the covers use their own colours.
