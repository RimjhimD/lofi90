"use client";

import { useEffect, useRef } from "react";

/**
 * Hovering or focusing a line card ([data-line="<type>"]) swings a red cable down from that
 * type's header lamp ([data-lamp]) into the card's jack ([data-jack]). Decorative only.
 */
export function HoverCable() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = svg.current;
    if (!layer) return;
    let current: SVGPathElement | null = null;

    const unplug = () => {
      const old = current;
      current = null;
      if (!old) return;
      old.animate([{ strokeDashoffset: "0px" }, { strokeDashoffset: "1px" }], { duration: 260, easing: "ease-in", fill: "forwards" }).onfinish = () => old.remove();
    };

    const plug = (card: HTMLElement) => {
      unplug();
      // The sidebar renders twice (mobile drawer + desktop column); use whichever lamp is on screen.
      const lamp = Array.from(document.querySelectorAll<HTMLElement>(`aside [data-lamp="${card.dataset.line}"] .lamp`)).find((l) => l.offsetParent);
      const jack = card.querySelector<HTMLElement>("[data-jack]");
      if (!jack) return;
      const to = jack.getBoundingClientRect();
      const tx = to.left + to.width / 2;
      const ty = to.top + to.height / 2;
      // No visible sidebar (small screens): drop the cable from the top edge above the card instead.
      const from = lamp ? lamp.getBoundingClientRect() : null;
      const fx = from ? from.right : tx;
      const fy = from ? from.top + from.height / 2 : 0;
      const sag = Math.min(260, Math.abs(ty - fy) * 0.5 + 60);
      const side = !!from;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", side ? `M ${fx} ${fy} C ${fx + sag} ${fy + 40}, ${tx - sag} ${ty + 60}, ${tx} ${ty}` : `M ${fx} ${fy} C ${fx} ${fy + sag}, ${tx} ${ty - sag}, ${tx} ${ty}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#D7263D");
      path.setAttribute("stroke-width", "4");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("pathLength", "1");
      path.setAttribute("stroke-dasharray", "1");
      layer.appendChild(path);
      path.animate(
        [{ strokeDashoffset: "1px" }, { strokeDashoffset: "0px" }],
        { duration: 480, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" },
      );
      current = path;
    };

    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-line]"));
    const handlers = cards.map((card) => {
      const on = () => plug(card);
      card.addEventListener("pointerenter", on);
      card.addEventListener("focus", on);
      card.addEventListener("pointerleave", unplug);
      card.addEventListener("blur", unplug);
      return () => {
        card.removeEventListener("pointerenter", on);
        card.removeEventListener("focus", on);
        card.removeEventListener("pointerleave", unplug);
        card.removeEventListener("blur", unplug);
      };
    });
    window.addEventListener("scroll", unplug, { passive: true });
    return () => {
      handlers.forEach((off) => off());
      window.removeEventListener("scroll", unplug);
    };
  }, []);

  return <svg ref={svg} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 h-full w-full overflow-visible" />;
}
