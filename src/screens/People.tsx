import { useState } from "react";
import { Sheet } from "../components/Sheet";
import { useApp } from "../store";
import type { Person, Reach } from "../types";
import type { Need } from "../engine/topics";
import { shortName } from "../engine/compose";
import { Draft } from "../components/Draft";
import { Icon } from "../icons";
import { Avatar, Pup, Companion } from "../ui";
import { ago, copyText, uid } from "../util";
import { cleanEmail, cleanPhone, telHref } from "../contact";

const NEED_LABEL: Record<Need, string> = {
  listening: "Listens well",
  practical: "Practical help",
  humor: "Makes me laugh",
  perspective: "Gives perspective",
  company: "Good company",
  professional: "Trained to help",
};
const NEEDS = Object.keys(NEED_LABEL) as Need[];

const SUGGEST: Omit<Person, "id">[] = [
  { name: "Campus counseling center", relation: "Counseling", kind: "professional", goodFor: ["professional", "listening"], reach: "email", note: "" },
  { name: "Primary care clinic", relation: "Doctor or nurse", kind: "professional", goodFor: ["professional", "practical"], reach: "call", note: "" },
  { name: "A teacher or advisor I trust", relation: "Teacher", kind: "professional", goodFor: ["practical", "perspective"], reach: "email", note: "" },
];

const SUGGEST_TEEN: Omit<Person, "id">[] = [
  { name: "School counselor", relation: "School counselor", kind: "professional", goodFor: ["professional", "listening"], reach: "in person", note: "", adult: true },
  { name: "A parent or guardian", relation: "Parent", kind: "person", goodFor: ["listening", "practical"], reach: "in person", note: "", adult: true },
  { name: "A teacher or coach I trust", relation: "Teacher", kind: "person", goodFor: ["practical", "perspective"], reach: "in person", note: "", adult: true },
];

const blank = (): Omit<Person, "id"> => ({ name: "", relation: "", kind: "person", goodFor: ["listening"], reach: "text", note: "" });

export function People() {
  const { p, setP, thread, toast, teen } = useApp();
  const [selId, setSelId] = useState<string | null>(p.people[0]?.id ?? null);
  const [mode, setMode] = useState<"view" | "edit" | "new">("view");
  const [form, setForm] = useState<Omit<Person, "id">>(blank());
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [writing, setWriting] = useState(false);
  // Phones only: the details open as their own full-screen page instead of sitting below the list.
  const [sheet, setSheet] = useState(false);

  const sel = p.people.find((x) => x.id === selId) ?? null;
  const hasPro = p.people.some((x) => x.kind === "professional");
  const examples = p.people.filter((x) => x.example).length;

  const startNew = (preset?: Omit<Person, "id">) => {
    setForm(preset ?? blank());
    setMode("new");
    setError("");
    setWriting(false);
    setSheet(true);
  };
  const startEdit = () => {
    if (!sel) return;
    const { id: _id, example: _ex, ...rest } = sel;
    setForm(rest);
    setMode("edit");
    setError("");
    setWriting(false);
  };
  const save = () => {
    const name = form.name.trim();
    if (!name) {
      setError("Add a name so you can find them later.");
      return;
    }
    if (form.goodFor.length === 0) {
      setError("Pick at least one thing they're good for. It helps match them to what you're dealing with.");
      return;
    }
    const em = cleanEmail(form.email ?? "");
    const ph = cleanPhone(form.phone ?? "");
    if (!em.ok || !ph.ok) {
      setError(em.error ?? ph.error ?? "Check the contact details.");
      return;
    }
    const clean = { ...form, email: em.value || undefined, phone: ph.value || undefined, other: (form.other ?? "").trim() || undefined, name, relation: form.relation.trim() || (form.kind === "professional" ? "Professional" : "Someone I trust"), note: form.note.trim() };
    if (mode === "edit" && sel) {
      setP((x) => ({ ...x, people: x.people.map((y) => (y.id === sel.id ? { ...y, ...clean, example: false } : y)) }));
      toast("Saved.");
    } else {
      const id = uid();
      setP((x) => ({ ...x, people: [...x.people, { id, ...clean }] }));
      setSelId(id);
      toast(`${shortName(name)} is in your circle.`);
    }
    setMode("view");
  };
  const remove = () => {
    if (!sel) return;
    const prev = p.people;
    const idx = prev.findIndex((x) => x.id === sel.id);
    setP((x) => ({ ...x, people: x.people.filter((y) => y.id !== sel.id) }));
    setSelId(prev[idx + 1]?.id ?? prev[idx - 1]?.id ?? null);
    setConfirmDel(false);
    setSheet(false);
    toast(`${shortName(sel.name)} removed.`, { label: "Undo", run: () => (setP((x) => ({ ...x, people: prev })), setSelId(sel.id)) });
  };
  const clearExamples = () => {
    const prev = p.people;
    setP((x) => ({ ...x, people: x.people.filter((y) => !y.example) }));
    setSelId(null);
    toast(`Removed ${examples} example ${examples === 1 ? "person" : "people"}.`, { label: "Undo", run: () => setP((x) => ({ ...x, people: prev })) });
  };
  const logConversation = () => {
    if (!sel) return;
    setP((x) => ({ ...x, reachouts: [{ id: uid(), name: sel.name, how: sel.reach, at: new Date().toISOString() }, ...x.reachouts] }));
    toast(`Logged: you reached ${shortName(sel.name)}. That counts.`);
  };

  const toggleNeed = (n: Need) => setForm((f) => ({ ...f, goodFor: f.goodFor.includes(n) ? f.goodFor.filter((x) => x !== n) : [...f.goodFor, n] }));
  const last = sel ? p.reachouts.filter((r) => r.name === sel.name).sort((a, b) => b.at.localeCompare(a.at))[0] : undefined;

  return (
    <div className="page">
      <div className="page__head">
        <Companion tab="people" />
        <div>
          <h1>Your circle</h1>
          <p>{teen ? "The people you could turn to, with trusted adults suggested first. HEARD only uses this list to suggest who might fit and to write a first message. It never contacts anyone." : "The people and places you could turn to. HEARD only uses this list to suggest who might fit and to write a first message. It never contacts anyone."}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => startNew()}>
          <Icon n="plus" size={17} />
          Add someone
        </button>
      </div>

      <div className="people">
        <section className="panel" aria-labelledby="circle-h">
          <div className="panel__head">
            <h2 id="circle-h" style={{ fontSize: "1.05rem" }}>
              {p.people.length} {p.people.length === 1 ? "person" : "people"}
            </h2>
            {examples > 0 && (
              <button type="button" className="btn btn--quiet btn--sm" onClick={clearExamples}>
                Remove {examples} {examples === 1 ? "example" : "examples"}
              </button>
            )}
          </div>
          <div className="panel__body" style={{ paddingTop: "0.4rem" }}>
            {p.people.length === 0 ? (
              <div className="empty">
                <Pup mood="listening" size={90} />
                <h3>No one here yet</h3>
                <p>Start with one person. It can be someone you only half trust, or a place like a counseling center.</p>
              </div>
            ) : (
              <ul>
                {p.people.map((x) => (
                  <li key={x.id}>
                    <div
                      className="prow"
                      data-sel={x.id === selId && mode !== "new"}
                      role="button"
                      tabIndex={0}
                      onClick={() => (setSelId(x.id), setMode("view"), setConfirmDel(false), setWriting(false), setSheet(true))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelId(x.id);
                          setMode("view");
                          setConfirmDel(false);
                          setWriting(false);
                          setSheet(true);
                        }
                      }}
                    >
                      <Avatar name={x.name} pro={x.kind === "professional"} />
                      <div>
                        <div className="prow__name">
                          {x.name} {x.example && <span className="chip chip--plain" style={{ fontSize: "0.75rem", padding: "0 0.5rem" }}>Example</span>}
                        </div>
                        <div className="prow__meta">
                          {x.relation} · {x.reach}
                          {x.adult && teen && <span className="chip chip--plain" style={{ fontSize: "0.75rem", padding: "0 0.5rem", marginLeft: "0.4rem" }}>Trusted adult</span>}
                        </div>
                        {x.note && <div className="prow__note">{x.note}</div>}
                      </div>
                      <Icon n="chevron" size={16} className="rot" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!hasPro && (
              <div style={{ marginTop: "1rem", paddingTop: "0.9rem", borderTop: "1px solid var(--line-soft)" }}>
                <p className="small muted" style={{ marginBottom: "0.5rem" }}>
                  No professional in your circle. Trained help is worth having on the list.
                </p>
                <div className="row" style={{ gap: "0.4rem" }}>
                  {(teen ? SUGGEST_TEEN : SUGGEST).map((s) => (
                    <button key={s.name} type="button" className="chip chip--add" onClick={() => startNew(s)}>
                      <Icon n="plus" size={14} />
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <Sheet title={mode === "new" ? "Add someone" : mode === "edit" ? "Edit" : sel ? sel.name : "Details"} open={sheet} onClose={() => (setSheet(false), setMode("view"))}>
        <section className="panel" aria-live="polite" aria-label="Details">
          {mode !== "view" ? (
            <form
              className="panel__body"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <h2 style={{ fontSize: "1.15rem", marginBottom: "0.9rem" }}>{mode === "new" ? "Add to your circle" : `Edit ${shortName(form.name || "this person")}`}</h2>
              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="pf-name">Name</label>
                  <input id="pf-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="First name is fine" autoFocus />
                </div>
                <div className="field">
                  <label htmlFor="pf-rel">Who they are to you</label>
                  <input id="pf-rel" className="input" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} placeholder={teen ? "Friend, aunt, coach, teacher…" : "Cousin, lab partner, coach…"} />
                </div>
                <div className="field">
                  <label htmlFor="pf-kind">Kind</label>
                  <select id="pf-kind" className="select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Person["kind"] })}>
                    <option value="person">Someone I know</option>
                    <option value="professional">A professional or service</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="pf-reach">Easiest way to reach them</label>
                  <select id="pf-reach" className="select" value={form.reach} onChange={(e) => setForm({ ...form, reach: e.target.value as Reach })}>
                    <option value="text">Text</option>
                    <option value="call">Call</option>
                    <option value="in person">In person</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                {teen && form.kind === "person" && (
                  <label className="agree full">
                    <input type="checkbox" checked={!!form.adult} onChange={(e) => setForm({ ...form, adult: e.target.checked })} />
                    <span>A trusted adult, like a parent, relative, teacher or coach. HEARD suggests these first.</span>
                  </label>
                )}
                <fieldset className="field full contactset">
                  <legend className="lbl">Their contact details (optional)</legend>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="pf-email">Email</label>
                      <input id="pf-email" className="input" type="email" inputMode="email" autoComplete="off" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
                    </div>
                    <div className="field">
                      <label htmlFor="pf-phone">Phone number</label>
                      <input id="pf-phone" className="input" type="tel" inputMode="tel" autoComplete="off" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 555-5555" />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="pf-other">Anything else</label>
                    <input id="pf-other" className="input" value={form.other ?? ""} onChange={(e) => setForm({ ...form, other: e.target.value })} placeholder="An app handle, a contact-form link, office hours" />
                  </div>
                </fieldset>
                <div className="field full">
                  <span className="lbl" id="pf-good">What are they good for?</span>
                  <div className="needs" role="group" aria-labelledby="pf-good">
                    {NEEDS.map((n) => (
                      <button key={n} type="button" className="chip" aria-pressed={form.goodFor.includes(n)} onClick={() => toggleNeed(n)}>
                        {NEED_LABEL[n]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field full">
                  <label htmlFor="pf-note">A note for yourself</label>
                  <textarea id="pf-note" className="textarea" rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Best times, how they like to be asked, anything that makes it easier." />
                </div>
              </div>
              {error && (
                <p role="alert" className="small" style={{ color: "var(--coral-text)", fontWeight: 800, marginTop: "0.7rem" }}>
                  {error}
                </p>
              )}
              <div className="row" style={{ marginTop: "1rem" }}>
                <button type="submit" className="btn btn--primary">
                  {mode === "new" ? "Add to circle" : "Save changes"}
                </button>
                <button type="button" className="btn btn--line" onClick={() => setMode("view")}>
                  Cancel
                </button>
              </div>
              <p className="tiny" style={{ marginTop: "0.8rem" }}>
                Stored in this browser only (encrypted if you have an account). HEARD uses contact details for one thing: filling in the "Email", "Text" and "Call" buttons when you write to them. It never contacts anyone itself.
              </p>
            </form>
          ) : sel ? (
            <div className="panel__body">
              <div className="row" style={{ alignItems: "flex-start", gap: "0.9rem", flexWrap: "nowrap" }}>
                <Avatar name={sel.name} pro={sel.kind === "professional"} />
                <div className="grow">
                  <h2 style={{ fontSize: "1.25rem" }}>{sel.name}</h2>
                  <p className="muted small">
                    {sel.relation} · easiest by {sel.reach}
                  </p>
                </div>
              </div>
              {(sel.email || sel.phone || sel.other) && (
                <ul className="contacts" aria-label={`Contact details for ${sel.name}`}>
                  {sel.email && (
                    <li>
                      <span className="contacts__k">Email</span>
                      <span className="contacts__v">{sel.email}</span>
                      <button type="button" className="btn btn--quiet btn--sm" onClick={async () => toast((await copyText(sel.email!)) ? "Copied their email." : "Couldn't copy here. Select the text instead.")} aria-label={`Copy ${sel.name}'s email`}>
                        <Icon n="copy" size={15} />
                      </button>
                    </li>
                  )}
                  {sel.phone && (
                    <li>
                      <span className="contacts__k">Phone</span>
                      <span className="contacts__v">{sel.phone}</span>
                      <a className="btn btn--quiet btn--sm" href={telHref(sel.phone)} aria-label={`Call ${sel.name}`}>Call</a>
                      <button type="button" className="btn btn--quiet btn--sm" onClick={async () => toast((await copyText(sel.phone!)) ? "Copied their number." : "Couldn't copy here. Select the text instead.")} aria-label={`Copy ${sel.name}'s number`}>
                        <Icon n="copy" size={15} />
                      </button>
                    </li>
                  )}
                  {sel.other && (
                    <li>
                      <span className="contacts__k">Also</span>
                      <span className="contacts__v">{sel.other}</span>
                    </li>
                  )}
                </ul>
              )}
              {sel.note && <p style={{ marginTop: "0.8rem" }}>{sel.note}</p>}
              <div className="needs" style={{ marginTop: "0.8rem" }}>
                {sel.goodFor.map((n) => (
                  <span key={n} className="chip chip--plain">
                    {NEED_LABEL[n]}
                  </span>
                ))}
              </div>
              <p className="small muted" style={{ marginTop: "0.8rem" }}>
                {last ? `You last reached out ${ago(last.at)} (${last.how}).` : "You haven't logged a conversation with them yet."}
              </p>
              <div className="row person-acts" style={{ marginTop: "1rem" }}>
                <button type="button" className="btn btn--primary" aria-expanded={writing} onClick={() => setWriting((w) => !w)}>
                  <Icon n="send" size={16} />
                  {writing ? "Hide draft" : `Write to ${shortName(sel.name)}`}
                </button>
                <button type="button" className="btn btn--line" onClick={logConversation}>
                  <Icon n="check" size={16} />
                  Log a conversation
                </button>
                <button type="button" className="btn btn--quiet" onClick={startEdit}>
                  <Icon n="edit" size={16} />
                  Edit
                </button>
                <button type="button" className="btn btn--quiet" onClick={() => setConfirmDel(true)}>
                  <Icon n="trash" size={16} />
                  Remove
                </button>
              </div>
              {confirmDel && (
                <div className="confirm" role="alertdialog" aria-label="Confirm remove" style={{ marginTop: "0.9rem" }}>
                  <p>Remove {sel.name} from your circle? Steps and logged conversations stay.</p>
                  <div className="row">
                    <button type="button" className="btn btn--coral btn--sm" onClick={remove}>
                      Remove
                    </button>
                    <button type="button" className="btn btn--line btn--sm" onClick={() => setConfirmDel(false)}>
                      Keep
                    </button>
                  </div>
                </div>
              )}
              {writing && (
                <Sheet title={`Message to ${shortName(sel.name)}`} onClose={() => setWriting(false)}>
                  <Draft key={sel.id} person={sel} topics={thread.topics} onClose={() => setWriting(false)} />
                </Sheet>
              )}
              {writing && thread.topics.length === 0 && (
                <p className="tiny" style={{ marginTop: "0.6rem" }}>
                  The draft is generic because you haven't written anything on Talk yet. After you do, it will mention what you're dealing with.
                </p>
              )}
            </div>
          ) : (
            <div className="empty">
              <Pup mood="happy" size={96} />
              <h3>Pick someone</h3>
              <p>Select a name on the left to see details, write to them, or log that you talked.</p>
            </div>
          )}
        </section>
        </Sheet>
      </div>
    </div>
  );
}
