import { useState } from "react";
import { useApp } from "../store";
import { Icon } from "../icons";
import { Companion } from "../ui";
import { ago, uid } from "../util";
import { redact } from "../engine/redact";
import { checkSafety } from "../engine/safety";
import { NOTE_MAX } from "../engine/moderation";

/** The 13 to 17 version of Notes. Nothing here is shared with anyone: no feed, no replies, no strangers. */
export function TeenNotes() {
  const { p, setP, setThread, openCrisis, toast, go } = useApp();
  const [text, setText] = useState("");
  const mine = p.notes.private;

  const keep = () => {
    const t = text.trim();
    if (!t) return;
    const s = checkSafety(t);
    if (s.level !== "none") {
      setThread((x) => ({ ...x, safety: s }));
      openCrisis(true);
      return;
    }
    const safe = redact(t).text;
    setP((x) => ({ ...x, notes: { ...x.notes, private: [{ id: uid(), text: safe, at: new Date().toISOString() }, ...x.notes.private] } }));
    setText("");
    toast("Saved here, just for you.");
  };
  const del = (id: string) => {
    const prev = p.notes.private;
    setP((x) => ({ ...x, notes: { ...x.notes, private: x.notes.private.filter((n) => n.id !== id) } }));
    toast("Deleted.", { label: "Undo", run: () => setP((x) => ({ ...x, notes: { ...x.notes, private: prev } })) });
  };

  return (
    <div className="page">
      <div className="page__head">
        <Companion tab="notes" />
        <div>
          <h1>Notes</h1>
          <p>A private place to get it out of your head. Nobody else can read these.</p>
        </div>
      </div>

      <div className="teenbar" role="note">
        <Icon n="shieldcheck" size={20} />
        <p>
          <b>Why there's no feed.</b> Posting to strangers and getting replies from them is only for people 18 and up, because you can't know who's on the other end. When you're ready to be heard by a real person, pick one you trust.{" "}
          <button type="button" className="linkbtn" onClick={() => go("people")}>Open People</button>
        </p>
      </div>

      <section className="paper" aria-labelledby="tn-h">
        <h2 id="tn-h" style={{ fontSize: "1.15rem" }}>Write it down</h2>
        <div className="field" style={{ marginTop: "0.6rem" }}>
          <label htmlFor="tn-text">What's on your mind?</label>
          <textarea id="tn-text" className="textarea" rows={6} maxLength={NOTE_MAX} value={text} onChange={(e) => setText(e.target.value)} placeholder="It doesn't have to make sense. Names, numbers and addresses are hidden before it's saved." />
          <span className="tiny nums">{text.length} / {NOTE_MAX}</span>
        </div>
        <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" className="btn btn--primary" onClick={keep} disabled={!text.trim()}>
            <Icon n="lock" size={16} />
            Save privately
          </button>
          <button type="button" className="btn btn--line" onClick={() => go("talk", { prefill: text.trim() || undefined })}>
            Talk it through
          </button>
        </div>
        <p className="tiny" style={{ marginTop: "0.6rem" }}>Saved on this device only. If what you write sounds serious, HEARD will show you who to call or text.</p>
      </section>

      <h2 className="small" style={{ margin: "1.4rem 0 0.5rem" }}>Your saved notes</h2>
      {mine.length === 0 ? (
        <p className="muted small">Nothing here yet.</p>
      ) : (
        <ul className="notelist">
          {mine.map((n) => (
            <li key={n.id} className="note">
              <p className="tiny">{ago(n.at)} · only you can see this</p>
              <p className="note__text">{n.text}</p>
              <div className="note__acts">
                <button type="button" className="btn btn--sm btn--quiet" onClick={() => go("people")}>Tell someone</button>
                <button type="button" className="btn btn--sm btn--quiet" onClick={() => del(n.id)}>
                  <Icon n="trash" size={15} />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
