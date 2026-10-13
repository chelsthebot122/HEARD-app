export const uid = () => Math.random().toString(36).slice(2, 9);

export function ago(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.floor(d / 7)} weeks ago`;
  return `${Math.floor(d / 30)} months ago`;
}

export function monthCount(isos: string[]): number {
  const cutoff = Date.now() - 30 * 86400000;
  return isos.filter((i) => new Date(i).getTime() >= cutoff).length;
}

/** Copy text. Resolves true if the clipboard accepted it. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Selects the contents of an element so the person can press copy themselves. */
export function selectNode(el: HTMLElement | null) {
  if (!el) return;
  try {
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
  } catch {
    /* ignore */
  }
}

export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");
