"use client";

import { useEffect } from "react";

/**
 * Watches every [data-reveal] element and adds .is-in when it scrolls into view, so it drifts up and
 * pulls into focus in slow motion. Siblings are staggered. Elements that arrive later (streamed pages,
 * client navigation, tab switches) are picked up by a MutationObserver.
 */
export function AutoReveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (items) =>
        items.forEach((it) => {
          if (!it.isIntersecting) return;
          it.target.classList.add("is-in");
          io.unobserve(it.target);
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const watched = new WeakSet<Element>();

    const scan = () => {
      const fresh = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)")).filter((el) => !watched.has(el));
      const order = new Map<Element | null, number>();
      for (const el of fresh) {
        watched.add(el);
        if (reduce) {
          el.classList.add("is-in");
          continue;
        }
        // stagger elements that share a parent, so rows of cards arrive one after another
        const i = order.get(el.parentElement) ?? 0;
        order.set(el.parentElement, i + 1);
        if (!el.style.getPropertyValue("--reveal-delay")) el.style.setProperty("--reveal-delay", `${Math.min(i, 6) * 110}ms`);
        io.observe(el);
      }
    };

    scan();
    let queued = 0;
    // Live previews re-render many times a second; only rescan when a [data-reveal] element arrived.
    const mo = new MutationObserver((records) => {
      const fresh = records.some((r) =>
        Array.from(r.addedNodes).some((n) => n instanceof Element && (n.hasAttribute("data-reveal") || n.querySelector("[data-reveal]"))),
      );
      if (!fresh) return;
      cancelAnimationFrame(queued);
      queued = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
      cancelAnimationFrame(queued);
    };
  }, []);
  return null;
}
