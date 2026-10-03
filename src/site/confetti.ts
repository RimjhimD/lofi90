const COLORS = ["#FF5D5D", "#FFB800", "#3BB2F6", "#9B5DE5", "#00C49A"];

/** Small confetti burst in the five piece colours. Skipped for reduced motion. */
export function confetti(x: number, y: number, count = 26) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < count; i++) {
    const d = document.createElement("div");
    const angle = Math.random() * Math.PI * 2;
    const r = 80 + Math.random() * 160;
    Object.assign(d.style, {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      width: "12px",
      height: "12px",
      zIndex: "300",
      pointerEvents: "none",
      border: "2px solid #20201C",
      borderRadius: i % 3 === 0 ? "50%" : "3px",
      background: COLORS[i % COLORS.length],
      animation: "confetti 1s cubic-bezier(.2,.6,.4,1) forwards",
    });
    d.style.setProperty("--x", `${Math.cos(angle) * r}px`);
    d.style.setProperty("--y", `${Math.sin(angle) * r + 120}px`);
    d.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    document.body.appendChild(d);
    window.setTimeout(() => d.remove(), 1050);
  }
}
