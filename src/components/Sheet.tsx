import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons";

const QUERY = "(max-width: 900px)";

/** True on phones and small tablets, where the layout is one column. Desktop never matches. */
export function useCompact(): boolean {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(QUERY).matches : false);
  const [c, setC] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return;
    const m = window.matchMedia(QUERY);
    const on = () => setC(m.matches);
    on();
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return c;
}

// Only the top-most open sheet reacts to Escape, and the page behind stops scrolling while any is open.
const stack: number[] = [];
let ids = 0;
let locked = 0;

/**
 * On desktop this renders its children in place, with no wrapper box (so nothing changes there).
 * On phones it becomes a full-screen page with a title and an X, so people don't have to scroll
 * to find what they just opened.
 *
 * overlay=false keeps it inline even on phones. open=false hides it on phones until opened.
 */
export function Sheet({
  title,
  onClose,
  children,
  overlay = true,
  open = true,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  overlay?: boolean;
  open?: boolean;
}) {
  const compact = useCompact();
  const state = !compact || !overlay ? "inline" : open ? "active" : "hidden";
  const closeRef = useRef<HTMLButtonElement>(null);
  const me = useRef(0);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (state !== "active") return;
    me.current = ++ids;
    stack.push(me.current);
    if (locked++ === 0) document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stack[stack.length - 1] === me.current) close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(me.current), 1);
      if (--locked === 0) document.body.style.overflow = "";
    };
  }, [state]);

  const box = (
    <div className="msheet" data-state={state} role={state === "active" ? "dialog" : undefined} aria-modal={state === "active" ? true : undefined} aria-label={state === "active" ? title : undefined}>
      <div className="msheet__bar">
        <b>{title}</b>
        <button ref={closeRef} type="button" className="msheet__x" aria-label={`Close ${title}`} onClick={onClose}>
          <Icon n="x" size={22} />
        </button>
      </div>
      <div className="msheet__body">{children}</div>
    </div>
  );
  // On phones the open sheet is moved to the page root so no animated card above it can pin it in place.
  return state === "active" ? createPortal(box, document.body) : box;
}

/** A small round arrow that appears after scrolling down on phones. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      type="button"
      className="totop"
      data-show={show}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
    >
      <Icon n="chevron" size={22} className="totop__i" />
    </button>
  );
}
