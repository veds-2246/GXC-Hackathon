"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = [
  ".reveal-on-scroll",
  ".admin-section",
  "main > section",
  "main article",
  "main .card-hover",
  "main .surface-glass-01",
  "main .surface-glass-02",
  "main .surface-glass-panel",
].join(",");

export function ScrollEffects() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            element.classList.add("is-revealed");
          } else {
            // Re-arm the reveal so it plays again when scrolling back into view.
            element.classList.remove("is-revealed");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );

    const observeWithin = (root: ParentNode) => {
      if (root instanceof Element && root.matches(REVEAL_SELECTOR) && !observed.has(root)) {
        root.classList.add("scroll-reveal");
        observer.observe(root);
        observed.add(root);
      }
      root.querySelectorAll?.(REVEAL_SELECTOR).forEach((element) => {
        if (observed.has(element)) return;
        element.classList.add("scroll-reveal");
        observer.observe(element);
        observed.add(element);
      });
    };

    observeWithin(document);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof Element) observeWithin(node);
      }));
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}
