import { CheckInCard, DueCheckIn, OUTCOME_LABEL } from "../components/CheckIn";
import { useMemo, useState } from "react";
import { useApp } from "../store";
import type { Reach, When } from "../types";
import { Icon } from "../icons";
import { fmtDay, Pup, Companion } from "../ui";
import { ago, monthCount, uid } from "../util";

const GROUPS: { id: When; label: string; hint: string }[] = [
  { id: "today", label: "Today", hint: "Small enough to do now" },
  { id: "week", label: "This week", hint: "Has a day attached" },
  { id: "later", label: "Later", hint: "Not urgent, not forgotten" },
];

const todayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export function Plan() {
  const { p, setP, toast } = useApp();
  const [text, setText] = useState("");
  const [when, setWhen] = useState<When>("week");
  const [who, setWho] = useState("");
  const [check, setCheck] = useState<string | null>(null);
  const [logWho, setLogWho] = useState("");
  const [logHow, setLogHow] = useState<Reach>("text");
  const [logDate, setLogDate] = useState(todayStr());
  const [showAll, setShowAll] = useState(false);

  const nameOf = (id?: string) => p.people.find((x) => x.id === id)?.name;
  const done = p.steps.filter((s) => s.done);

  const addStep = () => {
    const t = text.trim();
    if (!t) return;
    setP((x) => ({ ...x, steps: [{ id: uid(), text: t, when, personId: who || undefined, done: false }, ...x.steps] }));
    setText("");
  };
  const toggle = (id: string) => {
    const s = p.steps.find((x) => x.id === id);
    setP((x) => ({ ...x, steps: x.steps.map((y) => (y.id === id ? { ...y, done: !y.done } : y)) }));
    if (s && !s.done) {
      const pid = s.personId;
      const n = nameOf(pid);
      toast(n ? `Done. Want to log that you reached ${n.split(" ")[0]}?` : "Done.", n ? { label: "Log it", run: () => logFor(n, pid) } : undefined);
    }
  };
  const logFor = (name: string, pid?: string) => {
    const person = p.people.find((x) => x.id === pid);
    setP((x) => ({ ...x, reachouts: [{ id: uid(), name, how: person?.reach ?? "text", at: new Date().toISOString() }, ...x.reachouts] }));
    toast(`Logged: ${name.split(" ")[0]}. That counts.`);
  };
  const del = (id: string) => {
    const prev = p.steps;
    setP((x) => ({ ...x, steps: x.steps.filter((y) => y.id !== id) }));
    toast("Step removed.", { label: "Undo", run: () => setP((x) => ({ ...x, steps: prev })) });
  };
  const clearDone = () => {
    const prev = p.steps;
    setP((x) => ({ ...x, steps: x.steps.filter((y) => !y.done) }));
    toast(`Cleared ${done.length} finished.`, { label: "Undo", run: () => setP((x) => ({ ...x, steps: prev })) });
  };

  const addLog = () => {
    const name = logWho.trim();
    if (!name) return;
    const at = new Date(`${logDate}T12:00:00`);
    const when = at.getTime() > Date.now() ? new Date() : at;
    setP((x) => ({ ...x, reachouts: [{ id: uid(), name, how: logHow, at: when.toISOString() }, ...x.reachouts] }));
    setLogWho("");
    setLogDate(todayStr());
    toast(`Logged: ${name.split(" ")[0]}. That counts.`);
  };
  const delLog = (id: string) => {
    const prev = p.reachouts;
    setP((x) => ({ ...x, reachouts: x.reachouts.filter((r) => r.id !== id) }));
    toast("Entry removed.", { label: "Undo", run: () => setP((x) => ({ ...x, reachouts: prev })) });
  };

  const weeks = useMemo(() => {
    const out: number[] = [];
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    for (let i = 7; i >= 0; i--) {
      const hi = end.getTime() - i * 7 * 86400000;
      const lo = hi - 7 * 86400000;
      out.push(p.reachouts.filter((r) => { const t = new Date(r.at).getTime(); return t > lo && t <= hi; }).length);
    }
    return out;
  }, [p.reachouts]);
  const wmax = Math.max(1, ...weeks);
  const month = monthCount(p.reachouts.map((r) => r.at));
  const sorted = [...p.reachouts].sort((a, b) => b.at.localeCompare(a.at));
  const visible = showAll ? sorted : sorted.slice(0, 6);
  const open = p.steps.filter((s) => !s.done).length;

  return (
    <div className="page">
      <div className="page__head">
        <Companion tab="plan" />
        <div>
          <h1>Plan</h1>
          <p>Small steps toward real people, and a record of the conversations you've had. Both stay in this browser.</p>
        </div>
        <span className="count nums">{open} open</span>
      </div>

      <DueCheckIn />
      <div className="plan">
        <section className="panel" aria-labelledby="steps-h">
          <div className="panel__head">
            <h2 id="steps-h" style={{ fontSize: "1.05rem" }}>Next steps</h2>
            {done.length > 0 && (
              <button type="button" className="btn btn--quiet btn--sm" onClick={clearDone}>
                Clear {done.length} finished
              </button>
            )}
          </div>
          <div className="panel__body">
            <form
              className="addstep"
              onSubmit={(e) => {
                e.preventDefault();
                addStep();
              }}
            >
              <input className="input" aria-label="New step" placeholder="Add a step" value={text} onChange={(e) => setText(e.target.value)} />
              <select className="select" aria-label="When" value={when} onChange={(e) => setWhen(e.target.value as When)}>
                {GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
              <select className="select" aria-label="With" value={who} onChange={(e) => setWho(e.target.value)}>
                <option value="">With: anyone</option>
                {p.people.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn--primary" disabled={!text.trim()}>
                Add
              </button>
            </form>

            {p.steps.length === 0 && (
              <div className="empty">
                <Pup mood="happy" size={90} />
                <h3>An empty plan is fine</h3>
                <p>When you write a message on Talk, "Add to my plan" puts the next step here.</p>
              </div>
            )}

            {GROUPS.map((g) => {
              const items = p.steps.filter((s) => s.when === g.id).sort((a, b) => Number(a.done) - Number(b.done));
              if (items.length === 0) return null;
              return (
                <div className="group" key={g.id}>
                  <h3>
                    {g.label} <span className="count nums">{items.filter((s) => !s.done).length}</span>
                    <span className="tiny" style={{ fontWeight: 600 }}>{g.hint}</span>
                  </h3>
                  <ul>
                    {items.map((s) => (
                      <li key={s.id} className="step" data-done={s.done}>
                        <button type="button" className="check" role="checkbox" aria-checked={s.done} aria-label={`${s.done ? "Mark not done" : "Mark done"}: ${s.text}`} onClick={() => toggle(s.id)}>
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                          </svg>
                        </button>
                        <div>
                          <div className="step__text">{s.text}</div>
                          {(s.personId || s.example) && (
                            <div className="step__meta">
                              {nameOf(s.personId) && <span className="chip chip--plain" style={{ fontSize: "0.8rem", padding: "0 0.55rem" }}>{nameOf(s.personId)}</span>}
                              {s.example && <span className="tiny">Example</span>}
                            </div>
                          )}
                        </div>
                        <button type="button" className="btn btn--quiet btn--sm" aria-label={`Delete step: ${s.text}`} onClick={() => del(s.id)}>
                          <Icon n="trash" size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel" aria-labelledby="log-h">
          <div className="panel__head">
            <h2 id="log-h" style={{ fontSize: "1.05rem" }}>Conversations with real people</h2>
          </div>
          <div className="panel__body">
            <div className="stat">
              <span className="stat__n nums">{month}</span>
              <div>
                <div className="bars" role="img" aria-label={`Conversations per week, last 8 weeks: ${weeks.join(", ")}`}>
                  {weeks.map((n, i) => (
                    <i key={i} data-now={i === weeks.length - 1} style={{ height: `${Math.max(3, (n / wmax) * 46)}px` }} />
                  ))}
                </div>
                <div className="tiny" style={{ marginTop: "0.25rem" }}>this month · last 8 weeks</div>
              </div>
            </div>

            <form
              style={{ display: "grid", gap: "0.6rem", marginTop: "1.1rem", paddingTop: "1rem", borderTop: "1px solid var(--line-soft)" }}
              onSubmit={(e) => {
                e.preventDefault();
                addLog();
              }}
            >
              <div className="field">
                <label htmlFor="log-who">I talked with</label>
                <input
                  id="log-who"
                  className="input"
                  list="log-people"
                  value={logWho}
                  placeholder="Pick from your circle or type a name"
                  onChange={(e) => {
                    setLogWho(e.target.value);
                    const m = p.people.find((x) => x.name === e.target.value);
                    if (m) setLogHow(m.reach);
                  }}
                />
                <datalist id="log-people">
                  {p.people.map((x) => (
                    <option key={x.id} value={x.name} />
                  ))}
                </datalist>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="log-how">How</label>
                  <select id="log-how" className="select" value={logHow} onChange={(e) => setLogHow(e.target.value as Reach)}>
                    <option value="text">Text</option>
                    <option value="call">Call</option>
                    <option value="in person">In person</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="log-date">When</label>
                  <input id="log-date" className="input" type="date" max={todayStr()} value={logDate} onChange={(e) => setLogDate(e.target.value || todayStr())} />
                </div>
              </div>
              <button type="submit" className="btn btn--primary" disabled={!logWho.trim()}>
                <Icon n="plus" size={16} />
                Log it
              </button>
            </form>

            <ul className="log" style={{ marginTop: "1rem" }}>
              {visible.length === 0 && <li className="muted">Nothing logged yet. The first one is the hardest.</li>}
              {visible.map((r) => (
                <li key={r.id}>
                  <span>
                    <b>{r.name}</b>
                    <span className="muted"> · {r.how}</span>
                    {r.followUp && <span className="chip chip--plain" style={{ marginLeft: "0.5rem", fontSize: "0.8rem", padding: "0 0.55rem" }} data-outcome={r.followUp.outcome}>{OUTCOME_LABEL[r.followUp.outcome]}</span>}
                    {!r.followUp && !r.example && (
                      <button type="button" className="btn btn--quiet btn--sm" style={{ marginLeft: "0.3rem" }} onClick={() => setCheck(check === r.id ? null : r.id)}>
                        How did it go?
                      </button>
                    )}
                    {r.followUp?.note && <span className="tiny" style={{ display: "block" }}>“{r.followUp.note}”</span>}
                  </span>
                  <span className="row" style={{ gap: "0.2rem", flexWrap: "nowrap" }}>
                    <span className="tiny" title={fmtDay(r.at)}>{ago(r.at)}</span>
                    <button type="button" className="btn btn--quiet btn--sm" aria-label={`Remove entry for ${r.name}`} onClick={() => delLog(r.id)}>
                      <Icon n="x" size={14} />
                    </button>
                  </span>
                  {check === r.id && (
                    <div className="checkin-wrap">
                      <CheckInCard r={r} compact onDone={() => setCheck(null)} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {sorted.length > 6 && (
              <button type="button" className="btn btn--quiet btn--sm" onClick={() => setShowAll((s) => !s)}>
                {showAll ? "Show fewer" : `Show all ${sorted.length}`}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
