import { useMemo, useState } from "react";
import { useApp } from "../store";
import { Icon } from "../icons";
import { Companion } from "../ui";
import { copyText, uid } from "../util";
import { forAge, teenFirst } from "./../age";
import { Sheet } from "../components/Sheet";
import { CALL_SCRIPT, QUESTIONS_FOR_FIRST_VISIT, RESOURCES, WANTS, type Method, type Res, type Want } from "../data/resources";

const METHODS: { id: Method; label: string }[] = [
  { id: "call", label: "Call" },
  { id: "text", label: "Text" },
  { id: "chat", label: "Chat" },
  { id: "online", label: "Online" },
];

export function Help() {
  const { p, setP, toast, openCrisis, go } = useApp();
  const [want, setWant] = useState<Want | "all">("all");
  const [methods, setMethods] = useState<Method[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [q, setQ] = useState("");
  const [zip, setZip] = useState("");
  const [school, setSchool] = useState("");
  const [adding, setAdding] = useState(false);
  const [fOpen, setFOpen] = useState(false);
  const [form, setForm] = useState({ name: "", how: "", note: "" });

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return teenFirst(forAge(RESOURCES, p.age), p.age)
      .filter((r) => (want === "all" ? true : r.want.includes(want)))
      .filter((r) => (methods.length ? methods.some((m) => r.methods.includes(m)) : true))
      .filter((r) => (freeOnly ? r.free : true))
      .filter((r) => (t ? `${r.name} ${r.what} ${r.forWho ?? ""}`.toLowerCase().includes(t) : true));
  }, [want, methods, freeOnly, q, p.age]);

  const copy = async (text: string, what: string) => toast((await copyText(text)) ? `Copied ${what}.` : "Couldn't copy here. You can select the text instead.");
  const toggleMethod = (m: Method) => setMethods((x) => (x.includes(m) ? x.filter((y) => y !== m) : [...x, m]));
  const pinned = (r: Res) => p.myResources.some((x) => x.name === r.name);
  const pin = (r: Res) => {
    if (pinned(r)) return;
    setP((x) => ({ ...x, myResources: [{ id: uid(), name: r.name, how: r.how, note: "" }, ...x.myResources] }));
    toast("Saved to your list.");
  };
  const addOwn = () => {
    if (!form.name.trim()) return;
    setP((x) => ({ ...x, myResources: [{ id: uid(), name: form.name.trim(), how: form.how.trim(), note: form.note.trim() }, ...x.myResources] }));
    setForm({ name: "", how: "", note: "" });
    setAdding(false);
    toast("Added to your list.");
  };
  const removeOwn = (id: string) => {
    const prev = p.myResources;
    setP((x) => ({ ...x, myResources: x.myResources.filter((r) => r.id !== id) }));
    toast("Removed.", { label: "Undo", run: () => setP((x) => ({ ...x, myResources: prev })) });
  };

  const zipOk = /^\d{5}$/.test(zip.trim());
  const schoolQ = school.trim() ? `https://www.google.com/search?q=${encodeURIComponent(`${school.trim()} student counseling center`)}` : "";

  const act = (r: Res) => {
    const out: JSX.Element[] = [];
    if (r.tel) out.push(<a key="c" className="btn btn--sm btn--line" href={`tel:${r.tel}`}>Call</a>);
    if (r.sms) out.push(<a key="t" className="btn btn--sm btn--line" href={`sms:${r.sms.to}${r.sms.body ? `?&body=${encodeURIComponent(r.sms.body)}` : ""}`}>Text</a>);
    if (r.url) out.push(<a key="o" className="btn btn--sm btn--line" href={r.url} target="_blank" rel="noreferrer">Open site</a>);
    return out;
  };

  return (
    <div className="page">
      <div className="page__head">
        <Companion tab="help" />
        <div>
          <h1>Help</h1>
          <p>Real services run by real people. Pick what you need and HEARD narrows the list. If it can't wait, the button on the right is faster than any search.</p>
        </div>
        <button type="button" className="btn btn--coral" onClick={() => openCrisis(true)}>
          <Icon n="phone" size={17} />
          I need someone now
        </button>
      </div>

      {p.age === "teen" && (
        <div className="teenbar" role="note">
          <Icon n="shieldcheck" size={20} />
          <p>
            <b>For ages 13 to 17.</b> You can call or text 988, Crisis Text Line, Teen Line and The Trevor Project on your own. For ongoing counseling, the first step is usually a parent, guardian or your school counselor, and who can say yes to treatment depends on your state.
          </p>
        </div>
      )}

      <div className="helpgrid">
        <div>
          <button type="button" className="btn btn--line m-only filterbtn" onClick={() => setFOpen(true)}>
            <Icon n="sliders" size={17} />
            Search and filter
            {want !== "all" || methods.length > 0 || freeOnly || q ? <span className="chip chip--coral" style={{ padding: "0 0.5rem", fontSize: "0.8rem" }}>On</span> : null}
            <span className="nums grow" style={{ textAlign: "right" }}>{list.length} {list.length === 1 ? "service" : "services"}</span>
          </button>
          <Sheet title="Search and filter" open={fOpen} onClose={() => setFOpen(false)}>
          <div className="filterbar panel">
            <div className="field">
              <label htmlFor="h-q">Search</label>
              <input id="h-q" type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. therapist, veteran, housing" />
            </div>
            <div className="field">
              <span className="lbl" id="h-want">I need…</span>
              <div className="row" role="group" aria-labelledby="h-want" style={{ gap: "0.4rem" }}>
                {WANTS.map((w) => (
                  <button key={w.id} type="button" className="chip chip--btn" aria-pressed={want === w.id} onClick={() => setWant(w.id)}>
                    {w.label}
                  </button>
                ))}
              </div>
              {want !== "all" && <p className="tiny">{WANTS.find((w) => w.id === want)?.hint}</p>}
            </div>
            <div className="field">
              <span className="lbl" id="h-how">I'd rather…</span>
              <div className="row" role="group" aria-labelledby="h-how" style={{ gap: "0.4rem" }}>
                {METHODS.map((m) => (
                  <button key={m.id} type="button" className="chip chip--btn" aria-pressed={methods.includes(m.id)} onClick={() => toggleMethod(m.id)}>
                    {m.label}
                  </button>
                ))}
                <button type="button" className="chip chip--btn" aria-pressed={freeOnly} onClick={() => setFreeOnly((f) => !f)}>
                  Free only
                </button>
              </div>
            </div>
          </div>
          <div className="m-only sheetdone">
            <button type="button" className="btn btn--primary" onClick={() => setFOpen(false)}>Show {list.length} {list.length === 1 ? "service" : "services"}</button>
          </div>
          </Sheet>

          <p className="small muted" role="status" aria-live="polite" style={{ margin: "0.9rem 0 0.5rem" }}>
            {list.length} {list.length === 1 ? "service" : "services"} {want !== "all" || methods.length || freeOnly || q ? "match" : "listed"}.
          </p>

          <ul className="res res--cards">
            {list.map((r) => (
              <li key={r.id} data-primary={r.want.includes("now") && r.id === "988" ? "true" : "false"}>
                <div className="res__top">
                  <div>
                    <div className="res__name">{r.name}</div>
                    <div className="res__how">{r.how}</div>
                  </div>
                  <div className="res__tags">
                    <span className="chip chip--plain">{r.hours}</span>
                    <span className="chip chip--plain">{r.free ? "Free" : "Has a fee"}</span>
                    {r.forWho && <span className="chip chip--topic">{r.forWho}</span>}
                  </div>
                </div>
                <p className="res__detail" style={{ gridColumn: "1 / -1" }}>{r.what}</p>
                <div className="res__acts">
                  {act(r)}
                  <button type="button" className="btn btn--sm btn--quiet" onClick={() => copy(r.copy, r.copy)} aria-label={`Copy ${r.name}`}>
                    <Icon n="copy" size={16} />
                    Copy
                  </button>
                  <button type="button" className="btn btn--sm btn--quiet" onClick={() => pin(r)} disabled={pinned(r)}>
                    <Icon n="heart" size={16} />
                    {pinned(r) ? "In your list" : "Save"}
                  </button>
                </div>
              </li>
            ))}
            {list.length === 0 && (
              <li className="empty">
                <h3>Nothing matches all of that</h3>
                <p>Try removing a filter. You can also dial 211 and say what you need.</p>
                <button type="button" className="btn btn--line btn--sm" onClick={() => { setWant("all"); setMethods([]); setFreeOnly(false); setQ(""); }}>
                  Clear filters
                </button>
              </li>
            )}
          </ul>
        </div>

        <aside className="helpside" aria-label="Closer to home">
          <section className="panel">
            <div className="panel__head"><h2 style={{ fontSize: "1.05rem" }}>Closer to home</h2></div>
            <div className="panel__body">
              <p className="small muted">HEARD doesn't have a local directory, so it points you to ones that do.</p>
              <div className="field" style={{ marginTop: "0.7rem" }}>
                <label htmlFor="h-zip">Your ZIP code</label>
                <input id="h-zip" className="input" inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} placeholder="5 digits" />
              </div>
              <div className="row" style={{ gap: "0.4rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn--sm btn--line" disabled={!zipOk} onClick={() => { copy(zip.trim(), "your ZIP"); window.open("https://findtreatment.gov", "_blank", "noopener"); }}>
                  Open FindTreatment.gov
                </button>
                <a className="btn btn--sm btn--line" href="tel:211">Call 211</a>
              </div>
              <p className="tiny" style={{ marginTop: "0.4rem" }}>Your ZIP is copied so you can paste it on the site. HEARD doesn't send it anywhere.</p>

              <div className="field" style={{ marginTop: "1rem" }}>
                <label htmlFor="h-school">Your school or workplace</label>
                <input id="h-school" className="input" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Hartwell Community College" />
              </div>
              <a className="btn btn--sm btn--line" style={{ marginTop: "0.5rem" }} aria-disabled={!schoolQ} href={schoolQ || undefined} target="_blank" rel="noreferrer" onClick={(e) => !schoolQ && e.preventDefault()}>
                Search for their counseling center
              </a>
              <p className="tiny" style={{ marginTop: "0.4rem" }}>Many schools offer free sessions. Employers often have an assistance program (EAP) too. It's worth asking HR.</p>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head"><h2 style={{ fontSize: "1.05rem" }}>Your list</h2></div>
            <div className="panel__body">
              {p.myResources.length === 0 && <p className="small muted">Save services from the list, or add your own: a campus counselor, a clinic, a friend's number.</p>}
              <ul className="mylist">
                {p.myResources.map((r) => (
                  <li key={r.id}>
                    <div>
                      <b>{r.name}</b>
                      {r.how && <div className="small">{r.how}</div>}
                      {r.note && <div className="tiny">{r.note}</div>}
                    </div>
                    <span className="row" style={{ gap: "0.1rem", flexWrap: "nowrap" }}>
                      {r.how && (
                        <button type="button" className="btn btn--quiet btn--sm" onClick={() => copy(r.how, "it")} aria-label={`Copy details for ${r.name}`}>
                          <Icon n="copy" size={15} />
                        </button>
                      )}
                      <button type="button" className="btn btn--quiet btn--sm" onClick={() => removeOwn(r.id)} aria-label={`Remove ${r.name}`}>
                        <Icon n="x" size={15} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              {adding ? (
                <form style={{ display: "grid", gap: "0.5rem", marginTop: "0.6rem" }} onSubmit={(e) => { e.preventDefault(); addOwn(); }}>
                  <div className="field">
                    <label htmlFor="mr-name">Name</label>
                    <input id="mr-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campus counseling center" />
                  </div>
                  <div className="field">
                    <label htmlFor="mr-how">Number, address or link</label>
                    <input id="mr-how" className="input" value={form.how} onChange={(e) => setForm({ ...form, how: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="mr-note">Note (optional)</label>
                    <input id="mr-note" className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Walk-ins until 4" />
                  </div>
                  <div className="row" style={{ gap: "0.4rem" }}>
                    <button type="submit" className="btn btn--primary btn--sm" disabled={!form.name.trim()}>Add</button>
                    <button type="button" className="btn btn--quiet btn--sm" onClick={() => setAdding(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <button type="button" className="btn btn--line btn--sm" style={{ marginTop: "0.6rem" }} onClick={() => setAdding(true)}>
                  <Icon n="plus" size={15} />
                  Add your own
                </button>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel__head"><h2 style={{ fontSize: "1.05rem" }}>When you make the call</h2></div>
            <div className="panel__body">
              <p className="small muted">Calling is the hard part. Here is something to read from.</p>
              <blockquote className="script">{CALL_SCRIPT}</blockquote>
              <button type="button" className="btn btn--sm btn--line" onClick={() => copy(CALL_SCRIPT, "the script")}>
                <Icon n="copy" size={15} />
                Copy
              </button>
              <h3 className="small" style={{ margin: "1rem 0 0.3rem" }}>Questions for a first visit</h3>
              <ul className="small bullets">
                {QUESTIONS_FOR_FIRST_VISIT.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <button type="button" className="btn btn--sm btn--quiet" style={{ marginTop: "0.5rem" }} onClick={() => {
                  setP((x) => ({ ...x, steps: [{ id: uid(), text: "Make the call to set up a first appointment", when: "week", done: false }, ...x.steps] }));
                  toast("Added to your plan.", { label: "Open plan", run: () => go("plan") });
                }}>
                Add "make the call" to my plan
              </button>
            </div>
          </section>
        </aside>
      </div>
      <p className="tiny" style={{ marginTop: "1.4rem", maxWidth: "70ch" }}>
        HEARD isn't affiliated with these services. This is a short list of national US services, checked while building this version. Hours and details can change, so confirm on their own site.
      </p>
    </div>
  );
}
