import { useMemo, useState } from "react";
import { useApp } from "../store";
import { Icon } from "../icons";
import { analyze, TOPICS, type TopicId } from "../engine/topics";
import { checkSafety } from "../engine/safety";
import { redact } from "../engine/redact";
import { cleanUrl, NOTE_MAX } from "../links";
import { TYPE_HELP, TYPE_LABEL, type SourceType } from "../data/library";
import { uid } from "../util";

/** Save a link (an article, a post, a video) with a note in your own words. Only the link and the note are kept. */
export function AddLink({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const { p, setP, setThread, openCrisis, toast } = useApp();
  const [raw, setRaw] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<SourceType>("experience");
  const [picked, setPicked] = useState<TopicId[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const c = useMemo(() => (raw.trim() ? cleanUrl(raw) : null), [raw]);
  const suggested = useMemo(() => analyze(`${title} ${note}`).topics.slice(0, 3).map((t) => t.id), [title, note]);
  const topics = picked ?? suggested;
  const toggle = (id: TopicId) => setPicked((cur) => {
    const base = cur ?? suggested;
    return base.includes(id) ? base.filter((x) => x !== id) : base.length >= 3 ? base : [...base, id];
  });

  const save = () => {
    setErr(null);
    const cl = cleanUrl(raw);
    if (!cl.ok) return setErr(cl.error ?? "Check the link.");
    if (!title.trim()) return setErr("Give it a short title so you can find it later.");
    if (p.links.some((l) => l.url === cl.url)) return setErr("You've already saved that link.");
    const safety = checkSafety(`${title} ${note}`);
    if (safety.level === "emergency") {
      setThread((t) => ({ ...t, safety }));
      openCrisis(true);
      return;
    }
    // Names, emails and numbers in a note are hidden before it is stored, same as everywhere else.
    const safeNote = redact(note.trim()).text.slice(0, NOTE_MAX);
    const safeTitle = redact(title.trim()).text.slice(0, 120);
    setP((x) => ({ ...x, links: [{ id: uid(), url: cl.url, host: cl.host, title: safeTitle, note: safeNote, topics, kind, at: new Date().toISOString() }, ...x.links] }));
    toast("Saved. It will show up in your results when it matches.");
    onSaved?.();
    onClose();
  };

  return (
    <section className="panel addlink" aria-labelledby="al-h">
      <div className="panel__head">
        <h2 id="al-h" style={{ fontSize: "1.05rem" }}>Save a link</h2>
        <button type="button" className="btn btn--quiet btn--sm" onClick={onClose}>
          <Icon n="x" size={15} />
          Close
        </button>
      </div>
      <form className="panel__body addlink__form" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <p className="small muted">
          Found something that helped, like an article, a video, or a post someone shared? Save the link here and say why it helped. HEARD keeps only the link and your note, never the page's text, and it stays on this device.
        </p>
        <div className="field">
          <label htmlFor="al-url">Link</label>
          <input id="al-url" className="input" inputMode="url" autoComplete="off" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="https://" />
          {c && !c.ok && <p className="tiny" style={{ color: "var(--coral-text)" }}>{c.error}</p>}
          {c?.ok && <p className="tiny">Will save: <b>{c.host}</b>{c.url.length > 60 ? "" : ` · ${c.url.replace(/^https?:\/\//, "")}`}</p>}
          {c?.ok && c.social && (
            <p className="tiny addlink__warn" role="note">
              This is on social media. Posts can be deleted or made private, so the link may stop working. Check that the link doesn't include someone's username you wouldn't want stored. HEARD never copies posts, and you shouldn't paste someone else's private post.
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="al-title">Title</label>
          <input id="al-title" className="input" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A few words, in your own words" />
        </div>
        <div className="field">
          <label htmlFor="al-note">Why it helped (optional)</label>
          <textarea id="al-note" className="textarea" rows={3} maxLength={NOTE_MAX + 100} value={note} onChange={(e) => setNote(e.target.value)} placeholder="In your own words. Names, emails and numbers are hidden before saving." />
          <span className="tiny nums" data-over={note.length > NOTE_MAX}>{note.length} / {NOTE_MAX}</span>
        </div>
        <div className="field">
          <span className="lbl" id="al-kind">What kind of thing is it?</span>
          <div className="row" role="group" aria-labelledby="al-kind" style={{ gap: "0.4rem" }}>
            {(Object.keys(TYPE_LABEL) as SourceType[]).map((k) => (
              <button key={k} type="button" className="chip chip--btn" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {TYPE_LABEL[k]}
              </button>
            ))}
          </div>
          <p className="tiny">{TYPE_HELP[kind]}</p>
        </div>
        <div className="field">
          <span className="lbl" id="al-topics">Topics (up to 3){picked === null && suggested.length > 0 ? " · suggested from your words" : ""}</span>
          <div className="row" role="group" aria-labelledby="al-topics" style={{ gap: "0.4rem" }}>
            {TOPICS.map((t) => (
              <button key={t.id} type="button" className="chip chip--btn" aria-pressed={topics.includes(t.id)} onClick={() => toggle(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {err && <p className="authf__err" role="alert"><Icon n="info" size={17} /> {err}</p>}
        <div className="row" style={{ gap: "0.5rem" }}>
          <button type="submit" className="btn btn--primary">Save link</button>
          <button type="button" className="btn btn--quiet" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
