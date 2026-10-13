import { useMemo, useState } from "react";
import { useApp } from "../store";
import { Icon } from "../icons";
import { Companion, Seg, Pup } from "../ui";
import { ago, uid } from "../util";
import { moderateNote, moderateReply, NOTE_MAX, REPLY_MAX, type Verdict } from "../engine/moderation";
import { ASKS, DEMO_REPLIES, NOTE_PROMPTS, newAlias, REPLY_STARTERS, SAMPLE_NOTES, type SampleNote } from "../data/notes";
import { analyze, TOPIC_BY_ID, type TopicId } from "../engine/topics";
import { checkSafety } from "../engine/safety";
import type { NoteAsk } from "../types";

type View = "write" | "read" | "inbox" | "mine";
const askLabel = (a: NoteAsk) => ASKS.find((x) => x.id === a)?.label ?? a;

export function Notes() {
  const { p, setP, setThread, openCrisis, toast, nav, clearNav } = useApp();
  const [view, setView] = useState<View>(() => (nav?.open === "inbox" ? "inbox" : "write"));
  if (nav) clearNav();
  const n = p.notes;
  const unread = n.sent.reduce((a, s) => a + s.replies.filter((r) => !r.read).length, 0);

  const setNotes = (fn: (x: typeof n) => typeof n) => setP((x) => ({ ...x, notes: fn(x.notes) }));

  return (
    <div className="page">
      <div className="page__head">
        <Companion tab="notes" />
        <div>
          <h1>Notes</h1>
          <p>Write what you haven't said out loud, anonymously. Or read someone else's note and answer it. No names, no followers, nothing to perform.</p>
        </div>
      </div>

      <div className="sample-note" role="note">
        <Icon n="info" size={20} />
        <span>
          <b>Prototype.</b> Nothing leaves this device yet, so no one will read what you write, and the notes you read here are <b>examples written by the HEARD team</b>, not posts from real people. In a live version, notes travel through a moderated service and replies come from people who agreed to the listener guidelines.
        </span>
      </div>

      <div className="tabs" style={{ margin: "1rem 0" }}>
        <Seg<View>
          label="Notes sections"
          value={view}
          onChange={setView}
          options={[
            { id: "write", label: "Write" },
            { id: "read", label: "Read" },
            { id: "inbox", label: "Inbox", n: unread || undefined },
            { id: "mine", label: "Mine" },
          ]}
        />
      </div>

      {view === "write" && <Write setView={setView} setNotes={setNotes} setThread={setThread} openCrisis={openCrisis} />}
      {view === "read" && <Read />}
      {view === "inbox" && <Inbox setNotes={setNotes} toast={toast} />}
      {view === "mine" && <Mine setNotes={setNotes} setView={setView} />}
    </div>
  );
}

type Setter = (fn: (x: import("../types").NotesState) => import("../types").NotesState) => void;

function Write({ setView, setNotes, setThread, openCrisis }: { setView: (v: View) => void; setNotes: Setter; setThread: ReturnType<typeof useApp>["setThread"]; openCrisis: (b: boolean) => void }) {
  const { p, toast } = useApp();
  const [text, setText] = useState("");
  const [ask, setAsk] = useState<NoteAsk>("listen");
  const [v, setV] = useState<Verdict | null>(null);
  const alias = p.notes.alias;

  const send = () => {
    const out = moderateNote(text);
    setV(out);
    if (out.action === "crisis") {
      setThread((t) => ({ ...t, safety: out.safety }));
      openCrisis(true);
      return;
    }
    if (out.action !== "allow") return;
    const id = uid();
    setNotes((x) => ({ ...x, sent: [{ id, alias, text: out.text, ask, at: new Date().toISOString(), replies: [] }, ...x.sent] }));
    setText("");
    setV(null);
    toast("Your note is on its way. In this prototype it stays on your device.", { label: "See it", run: () => setView("mine") });
  };
  const keepPrivate = () => {
    if (!v) return;
    setNotes((x) => ({ ...x, private: [{ id: uid(), text: v.text, at: new Date().toISOString() }, ...x.private] }));
    setText("");
    setV(null);
    toast("Kept private, just for you.");
    setView("mine");
  };
  const showCrisis = () => {
    if (v) setThread((t) => ({ ...t, safety: v.safety.level === "none" ? checkSafety("I want to die") : v.safety }));
    openCrisis(true);
  };

  return (
    <div className="notes-write">
      <section className="paper" aria-labelledby="w-h">
        <h2 id="w-h" style={{ fontSize: "1.15rem" }}>Write a note to the wild</h2>
        <p className="small muted" style={{ marginTop: "0.2rem" }}>
          You'll appear as <b>{alias}</b>.{" "}
          <button type="button" className="linkbtn" onClick={() => setNotes((x) => ({ ...x, alias: newAlias() }))}>Pick another name</button>
        </p>
        <div className="field" style={{ marginTop: "0.8rem" }}>
          <label htmlFor="n-text">Your note</label>
          <textarea id="n-text" className="textarea" rows={6} maxLength={NOTE_MAX + 200} value={text} onChange={(e) => { setText(e.target.value); setV(null); }} placeholder="Say it the way you'd say it to nobody in particular." />
          <div className="row" style={{ justifyContent: "space-between", gap: "0.5rem" }}>
            <span className="tiny nums" data-over={text.length > NOTE_MAX}>{text.length} / {NOTE_MAX}</span>
          </div>
        </div>
        <div className="row" style={{ gap: "0.4rem", marginBottom: "0.8rem" }} role="group" aria-label="Starting points">
          {NOTE_PROMPTS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => setText((t) => (t ? t : s + " "))}>{s}</button>
          ))}
        </div>
        <div className="field">
          <span className="lbl" id="n-ask">What would help?</span>
          <div className="row" role="group" aria-labelledby="n-ask" style={{ gap: "0.4rem" }}>
            {ASKS.map((a) => (
              <button key={a.id} type="button" className="chip chip--btn" aria-pressed={ask === a.id} onClick={() => setAsk(a.id)} title={a.hint}>{a.label}</button>
            ))}
          </div>
          <p className="tiny">{ASKS.find((a) => a.id === ask)?.hint}</p>
        </div>

        {v && v.action === "block" && (
          <div className="care" role="alert" style={{ marginTop: "1rem" }}>
            <Pup mood="listening" size={48} />
            <div>
              <h3>Not quite yet</h3>
              <ul className="small bullets">{v.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          </div>
        )}
        {v && v.action === "hold" && (
          <div className="care" role="status" style={{ marginTop: "1rem" }}>
            <Pup mood="worried" size={56} />
            <div>
              <h3>I'm keeping this one close</h3>
              <p>{v.reasons[0]}</p>
              <div className="care__acts">
                <button type="button" className="btn btn--coral btn--sm" onClick={showCrisis}><Icon n="phone" size={16} />See who to call or text</button>
                <button type="button" className="btn btn--line btn--sm" onClick={keepPrivate}>Keep it private</button>
              </div>
            </div>
          </div>
        )}
        {v && v.action === "allow" && v.nudges.length > 0 && (
          <ul className="small bullets" style={{ marginTop: "0.8rem" }}>{v.nudges.map((r) => <li key={r}>{r}</li>)}</ul>
        )}

        <div className="row" style={{ marginTop: "1rem", gap: "0.6rem" }}>
          <button type="button" className="btn btn--primary" onClick={send} disabled={!text.trim()}>
            <Icon n="send" size={17} />
            Send it to the wild
          </button>
        </div>
      </section>

      <aside className="panel">
        <div className="panel__head"><h2 style={{ fontSize: "1.05rem" }}>How notes work</h2></div>
        <div className="panel__body">
          <ul className="small bullets">
            <li>Anonymous. Names, emails, numbers and addresses are hidden before a note is shared.</li>
            <li>Notes that sound serious aren't shared with strangers. You'll be shown people who are trained to help instead.</li>
            <li>No likes, no follower counts, no public comments. Replies come to your inbox, privately.</li>
            <li>You can report or block any note or reply.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Read() {
  const { p, setP, toast } = useApp();
  const [topic, setTopic] = useState<TopicId | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const hidden = new Set([...p.notes.hidden, ...p.notes.reported]);
  const blocked = new Set(p.notes.blocked);
  const topics = [...new Set(SAMPLE_NOTES.map((s) => s.topic))];
  const list = SAMPLE_NOTES.filter((s) => !hidden.has(s.id) && !blocked.has(s.alias)).filter((s) => topic === "all" || s.topic === topic);

  const mutate = (fn: (n: typeof p.notes) => typeof p.notes) => setP((x) => ({ ...x, notes: fn(x.notes) }));
  const undoable = (msg: string, prev: typeof p.notes) => toast(msg, { label: "Undo", run: () => setP((x) => ({ ...x, notes: prev })) });

  return (
    <div>
      <div className="row" style={{ gap: "0.4rem", marginBottom: "1rem" }} role="group" aria-label="Filter by topic">
        <button type="button" className="chip chip--btn" aria-pressed={topic === "all"} onClick={() => setTopic("all")}>All</button>
        {topics.map((t) => (
          <button key={t} type="button" className="chip chip--btn" aria-pressed={topic === t} onClick={() => setTopic(t)}>{TOPIC_BY_ID[t].label}</button>
        ))}
      </div>
      <ul className="notelist">
        {list.map((s) => (
          <NoteCard
            key={s.id}
            s={s}
            open={open === s.id}
            setOpen={(b) => setOpen(b ? s.id : null)}
            onSkip={() => { const prev = p.notes; mutate((n) => ({ ...n, hidden: [...n.hidden, s.id] })); undoable("Skipped.", prev); }}
            onReport={() => { const prev = p.notes; mutate((n) => ({ ...n, reported: [...n.reported, s.id] })); undoable("Reported and hidden. Thank you.", prev); }}
            onBlock={() => { const prev = p.notes; mutate((n) => ({ ...n, blocked: [...n.blocked, s.alias] })); undoable(`Blocked ${s.alias}.`, prev); }}
          />
        ))}
        {list.length === 0 && (
          <li className="empty">
            <Pup mood="happy" size={80} />
            <h3>You've read them all for now</h3>
            <p>Write one of your own, or check back later.</p>
            {(p.notes.hidden.length > 0 || p.notes.blocked.length > 0 || p.notes.reported.length > 0) && (
              <button type="button" className="btn btn--line btn--sm" onClick={() => mutate((n) => ({ ...n, hidden: [], blocked: [], reported: [] }))}>Bring back skipped notes</button>
            )}
          </li>
        )}
      </ul>
    </div>
  );
}

function NoteCard({ s, open, setOpen, onSkip, onReport, onBlock }: { s: SampleNote; open: boolean; setOpen: (b: boolean) => void; onSkip: () => void; onReport: () => void; onBlock: () => void }) {
  const { p, setP, toast } = useApp();
  const [text, setText] = useState("");
  const [v, setV] = useState<Verdict | null>(null);
  const [menu, setMenu] = useState(false);
  const mine = p.notes.replies.filter((r) => r.noteId === s.id);
  const live = useMemo(() => (text.trim() ? moderateReply(text) : null), [text]);

  const send = () => {
    const out = moderateReply(text);
    setV(out);
    if (out.action !== "allow") return;
    setP((x) => ({ ...x, notes: { ...x.notes, replies: [{ id: uid(), noteId: s.id, excerpt: s.text.slice(0, 90), text: out.text, at: new Date().toISOString() }, ...x.notes.replies] } }));
    setText("");
    setV(null);
    setOpen(false);
    toast("Reply saved. In this prototype no one receives it.");
  };

  return (
    <li className="note">
      <div className="note__top">
        <span className="note__who"><span className="avatar" aria-hidden="true">{s.alias.charAt(0)}</span>{s.alias}</span>
        <span className="row" style={{ gap: "0.35rem" }}>
          <span className="chip chip--topic" style={{ animation: "none" }}>{TOPIC_BY_ID[s.topic].label}</span>
          <span className="chip chip--plain">{askLabel(s.ask)}</span>
          <span className="chip chip--sample" title="Written by the HEARD team as an example. Not from a real person.">Example</span>
        </span>
      </div>
      <p className="note__text">{s.text}</p>
      {mine.length > 0 && <p className="tiny">You replied {ago(mine[0].at)}.</p>}
      <div className="note__acts">
        <button type="button" className="btn btn--sm btn--primary" aria-expanded={open} onClick={() => setOpen(!open)}>
          Reply
        </button>
        <button type="button" className="btn btn--sm btn--quiet" onClick={onSkip}>Skip</button>
        <span className="note__more">
          <button type="button" className="btn btn--sm btn--quiet" aria-expanded={menu} aria-label={`More options for note by ${s.alias}`} onClick={() => setMenu((m) => !m)}>More</button>
          {menu && (
            <span className="note__menu">
              <button type="button" className="btn btn--sm btn--quiet" onClick={() => { setMenu(false); onReport(); }}>Report this note</button>
              <button type="button" className="btn btn--sm btn--quiet" onClick={() => { setMenu(false); onBlock(); }}>Block {s.alias}</button>
            </span>
          )}
        </span>
      </div>

      {open && (
        <div className="note__reply">
          <p className="small"><b>Before you reply:</b> listen first. Say what you've lived rather than what they should do. Don't diagnose or give medication advice. If you're worried about their safety, mention 988.</p>
          <div className="row" style={{ gap: "0.4rem", margin: "0.5rem 0" }}>
            {REPLY_STARTERS.map((r) => (
              <button key={r} type="button" className="chip" onClick={() => setText((t) => (t ? t : r + " "))}>{r}</button>
            ))}
          </div>
          <label className="sr" htmlFor={`rt-${s.id}`}>Your reply to {s.alias}</label>
          <textarea id={`rt-${s.id}`} className="textarea" rows={4} value={text} onChange={(e) => { setText(e.target.value); setV(null); }} placeholder="Write like you're talking to one person." />
          <div className="tiny nums" data-over={text.length > REPLY_MAX}>{text.length} / {REPLY_MAX}</div>
          {live && live.nudges.length > 0 && <ul className="small bullets">{live.nudges.map((x) => <li key={x}>{x}</li>)}</ul>}
          {v && v.action === "block" && <ul className="small bullets" role="alert" style={{ color: "var(--coral-text)" }}>{v.reasons.map((x) => <li key={x}>{x}</li>)}</ul>}
          <div className="row" style={{ gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" className="btn btn--primary btn--sm" disabled={!text.trim()} onClick={send}>Send reply</button>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </li>
  );
}

function Inbox({ setNotes, toast }: { setNotes: Setter; toast: ReturnType<typeof useApp>["toast"] }) {
  const { p } = useApp();
  const withReplies = p.notes.sent.filter((s) => s.replies.length > 0);
  const markAll = () => setNotes((x) => ({ ...x, sent: x.sent.map((s) => ({ ...s, replies: s.replies.map((r) => ({ ...r, read: true })) })) }));
  const unread = p.notes.sent.reduce((a, s) => a + s.replies.filter((r) => !r.read).length, 0);

  const drop = (noteId: string, id: string, why: string) => {
    const prev = p.notes;
    setNotes((x) => ({ ...x, sent: x.sent.map((s) => (s.id === noteId ? { ...s, replies: s.replies.filter((r) => r.id !== id) } : s)) }));
    toast(why, { label: "Undo", run: () => setNotes(() => prev) });
  };

  if (withReplies.length === 0)
    return (
      <div className="empty panel">
        <Pup mood="mail" size={96} />
        <h3>No replies yet</h3>
        <p>When someone answers one of your notes, it shows up here. In this prototype nobody can reply, so you can ask for a <b>demo reply</b> from a note under <b>Mine</b> to see how it will look.</p>
      </div>
    );

  return (
    <div>
      {unread > 0 && <button type="button" className="btn btn--line btn--sm" onClick={markAll} style={{ marginBottom: "0.8rem" }}>Mark all read</button>}
      <ul className="notelist">
        {withReplies.map((s) => (
          <li key={s.id} className="note">
            <p className="tiny">Your note · {ago(s.at)}</p>
            <p className="note__text note__text--mine">{s.text}</p>
            <ul className="replies">
              {s.replies.map((r) => (
                <li key={r.id} data-unread={!r.read}>
                  <div className="note__top">
                    <span className="note__who">{!r.read && <i className="dot" aria-label="Unread" />}{r.alias}</span>
                    {r.origin === "demo" && <span className="chip chip--sample">Demo reply · not a real person</span>}
                  </div>
                  <p>{r.text}</p>
                  <div className="note__acts">
                    <button type="button" className="btn btn--quiet btn--sm" onClick={() => setNotes((x) => ({ ...x, sent: x.sent.map((n) => (n.id === s.id ? { ...n, replies: n.replies.map((y) => (y.id === r.id ? { ...y, read: true } : y)) } : n)) }))} disabled={r.read}>{r.read ? "Read" : "Mark read"}</button>
                    <button type="button" className="btn btn--quiet btn--sm" onClick={() => drop(s.id, r.id, "Reported and removed. Thank you.")}>Report</button>
                    <button type="button" className="btn btn--quiet btn--sm" onClick={() => drop(s.id, r.id, "Removed.")}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mine({ setNotes, setView }: { setNotes: Setter; setView: (v: View) => void }) {
  const { p, toast } = useApp();
  const n = p.notes;
  const demo = (id: string, text: string) => {
    const topic = analyze(text).topics[0]?.id;
    const pool = (topic && DEMO_REPLIES[topic]) || DEMO_REPLIES._;
    const reply = pool[Math.floor(Math.random() * pool.length)];
    setNotes((x) => ({ ...x, sent: x.sent.map((s) => (s.id === id ? { ...s, replies: [{ id: uid(), text: reply, at: new Date().toISOString(), alias: "Demo listener", origin: "demo", read: false }, ...s.replies] } : s)) }));
    toast("Added a demo reply to your inbox.", { label: "Open inbox", run: () => setView("inbox") });
  };
  const del = (id: string, kind: "sent" | "private" | "reply") => {
    const prev = n;
    setNotes((x) => (kind === "sent" ? { ...x, sent: x.sent.filter((s) => s.id !== id) } : kind === "private" ? { ...x, private: x.private.filter((s) => s.id !== id) } : { ...x, replies: x.replies.filter((s) => s.id !== id) }));
    toast("Deleted.", { label: "Undo", run: () => setNotes(() => prev) });
  };
  const none = n.sent.length + n.private.length + n.replies.length === 0;

  if (none)
    return (
      <div className="empty panel">
        <Pup mood="mail" size={96} />
        <h3>Nothing here yet</h3>
        <p>Notes you send, notes you keep private, and replies you write all live here, on this device.</p>
      </div>
    );

  return (
    <div className="mine">
      {n.sent.length > 0 && (
        <section>
          <h2 className="small" style={{ marginBottom: "0.5rem" }}>Notes you sent</h2>
          <ul className="notelist">
            {n.sent.map((s) => (
              <li key={s.id} className="note">
                <div className="note__top">
                  <span className="tiny">{ago(s.at)} · as {s.alias} · {askLabel(s.ask)}</span>
                  <span className="chip chip--plain">{s.replies.length ? `${s.replies.length} repl${s.replies.length > 1 ? "ies" : "y"}` : "Waiting"}</span>
                </div>
                <p className="note__text">{s.text}</p>
                <div className="note__acts">
                  <button type="button" className="btn btn--sm btn--line" onClick={() => demo(s.id, s.text)}>Show me a demo reply</button>
                  <button type="button" className="btn btn--sm btn--quiet" onClick={() => del(s.id, "sent")}><Icon n="trash" size={15} />Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {n.private.length > 0 && (
        <section>
          <h2 className="small" style={{ margin: "1rem 0 0.5rem" }}>Kept private</h2>
          <ul className="notelist">
            {n.private.map((s) => (
              <li key={s.id} className="note">
                <p className="tiny">{ago(s.at)} · only you can see this</p>
                <p className="note__text">{s.text}</p>
                <div className="note__acts"><button type="button" className="btn btn--sm btn--quiet" onClick={() => del(s.id, "private")}><Icon n="trash" size={15} />Delete</button></div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {n.replies.length > 0 && (
        <section>
          <h2 className="small" style={{ margin: "1rem 0 0.5rem" }}>Replies you wrote</h2>
          <ul className="notelist">
            {n.replies.map((r) => (
              <li key={r.id} className="note">
                <p className="tiny">To: “{r.excerpt}…” · {ago(r.at)} · saved on this device only</p>
                <p className="note__text">{r.text}</p>
                <div className="note__acts"><button type="button" className="btn btn--sm btn--quiet" onClick={() => del(r.id, "reply")}><Icon n="trash" size={15} />Delete</button></div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
