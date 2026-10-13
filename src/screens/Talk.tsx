import { linkToSource } from "../links";
import { DueCheckIn } from "../components/CheckIn";
import { useEffect, useMemo, useRef, useState } from "react";
import { emptyThread, useApp } from "../store";
import type { Session, Thread, Turn } from "../types";
import { analyze, highlight, manualTopic, TOPICS, type DetectedTopic, type TopicId } from "../engine/topics";
import { privacyLayer, type Mask } from "../engine/redact";
import { checkSafety, crisisCopy } from "../engine/safety";
import { countByType, GENERIC_CLOSERS, matchPeople, reflection, retrieve, shortName, topicStarters } from "../engine/compose";
import { STARTERS, STARTERS_TEEN } from "../data/seed";
import { TYPE_HELP, TYPE_LABEL, type SourceType } from "../data/library";
import { Icon, TypeIcon } from "../icons";
import { Avatar, Pup, Seg, Tokens } from "../ui";
import type { Mood } from "../Milo";
import { SourceItem } from "../components/SourceItem";
import { Draft } from "../components/Draft";
import { Sheet, useCompact } from "../components/Sheet";
import { ago, copyText, monthCount, uid } from "../util";

const RANK = { none: 0, support: 1, emergency: 2 } as const;
const WHEN_ORDER = { today: 0, week: 1, later: 2 } as const;
const WHEN_LABEL = { today: "Today", week: "This week", later: "Later" } as const;

function TurnView({ turn, phrases }: { turn: Turn; phrases: string[] }) {
  const segs = highlight(turn.text, phrases);
  const kinds = [...new Set(turn.masks.map((m) => m.kind))];
  return (
    <div className="turn">
      <p>
        {segs.map((s, i) =>
          s.hit ? (
            <mark key={i} className="hl">
              <Tokens text={s.text} />
            </mark>
          ) : (
            <Tokens key={i} text={s.text} />
          ),
        )}
      </p>
      <div className="turn__meta">
        <span className="nums">{new Date(turn.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
        {turn.masks.length > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <Icon n="lock" size={14} />
            Hid {turn.masks.length} detail{turn.masks.length === 1 ? "" : "s"} ({kinds.join(", ")})
          </span>
        )}
      </div>
    </div>
  );
}

/** Right column before anything is written: how it works, and the one number HEARD cares about. */
function Glance() {
  const { p, go } = useApp();
  const days = useMemo(() => {
    const out: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const end = d.getTime() + 86400000;
      out.push(p.reachouts.filter((r) => { const t = new Date(r.at).getTime(); return t >= d.getTime() && t < end; }).length);
    }
    return out;
  }, [p.reachouts]);
  const max = Math.max(1, ...days);
  const month = monthCount(p.reachouts.map((r) => r.at));
  const next = p.steps.filter((s) => !s.done).sort((a, b) => WHEN_ORDER[a.when] - WHEN_ORDER[b.when]).slice(0, 3);

  return (
    <div className="glance">
      <div className="glance__grid">
        <section className="paper" aria-labelledby="g-month">
          <h2 id="g-month" className="small muted" style={{ fontFamily: "var(--f-body)", fontSize: "0.9rem", fontWeight: 800 }}>
            Real conversations this month
          </h2>
          <div className="stat" style={{ marginTop: "0.5rem" }}>
            <span className="stat__n nums">{month}</span>
            <div className="bars" role="img" aria-label={`Conversations logged per day over the last 7 days: ${days.join(", ")}`}>
              {days.map((n, i) => (
                <i key={i} data-now={i === 6} style={{ height: `${Math.max(3, (n / max) * 46)}px` }} />
              ))}
            </div>
          </div>
          <p className="tiny" style={{ marginTop: "0.6rem" }}>
            This is the number HEARD is built around, not time spent here. You log them in Plan.
          </p>
        </section>
        <section className="paper" aria-labelledby="g-next">
          <h2 id="g-next" className="small muted" style={{ fontFamily: "var(--f-body)", fontSize: "0.9rem", fontWeight: 800 }}>
            Next on your plan
          </h2>
          {next.length === 0 ? (
            <p className="small muted" style={{ marginTop: "0.5rem" }}>Nothing waiting. Anything you add from a draft shows up here.</p>
          ) : (
            <ul className="log" style={{ marginTop: "0.3rem" }}>
              {next.map((s) => (
                <li key={s.id}>
                  <span>{s.text}</span>
                  <span className="tiny">{WHEN_LABEL[s.when]}</span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn btn--quiet btn--sm" style={{ marginTop: "0.4rem", marginLeft: "-0.5rem" }} onClick={() => go("plan")}>
            Open plan
          </button>
        </section>
      </div>
      <section className="paper" aria-labelledby="g-how">
        <h2 id="g-how" style={{ marginBottom: "0.9rem" }}>How this works</h2>
        <ol className="how">
          <li>
            <span>
              <b>Write what's going on.</b>
              <span className="muted">Plain words are fine. Names, emails, and phone numbers are hidden before anything is analysed.</span>
            </span>
          </li>
          <li>
            <span>
              <b>See that you're not the only one.</b>
              <span className="muted">Stories, plain-language information, and professional guidance, each clearly labelled so you know what you're reading.</span>
            </span>
          </li>
          <li>
            <span>
              <b>Choose someone to tell.</b>
              <span className="muted">Pick a person from your circle and get a first sentence you can change, copy, and send yourself.</span>
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}

export function Talk() {
  const { p, setP, thread, setThread, go, nav, clearNav, openCrisis, toast } = useApp();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const [view, setView] = useState<"others" | "people" | "words">("others");
  const [typeFilter, setTypeFilter] = useState<"all" | SourceType>("all");
  const [moreSources, setMoreSources] = useState(false);
  // Phones only: after the first message, the text box lives in a pop-up so results sit right under the message.
  const [addOpen, setAddOpen] = useState(false);
  const compact = useCompact();
  const [writeTo, setWriteTo] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const foundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nav?.prefill) {
      setDraft(nav.prefill);
      clearNav();
    }
  }, [nav, clearNav]);

  const hasTurns = thread.turns.length > 0;
  const reduce = p.settings.reduceMotion || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  const mine = useMemo(() => p.links.map(linkToSource), [p.links]);
  const ranked = useMemo(() => retrieve(thread.topics, p.dismissed, mine, p.age), [thread.topics, p.dismissed, mine, p.age]);
  const counts = useMemo(() => countByType(ranked), [ranked]);
  const matched = typeFilter === "all" ? ranked : ranked.filter((r) => r.source.type === typeFilter);
  const SHOW_FIRST = 3;
  const shown = moreSources ? matched : matched.slice(0, SHOW_FIRST);
  const matches = useMemo(() => matchPeople(thread.topics, p.people, p.age), [thread.topics, p.people, p.age]);
  const starters = useMemo(() => topicStarters(thread.topics), [thread.topics]);
  const phrases = useMemo(() => thread.topics.flatMap((t) => t.evidence), [thread.topics]);
  const read = reflection(thread.topics);

  const hour = new Date().getHours();
  const late = hour >= 23 || hour < 5;
  const greeting = late ? "Still up?" : hour < 12 ? "Good morning." : hour < 18 ? "Hi there." : "Good evening.";
  const mood: Mood = busy ? "thinking" : thread.safety.level !== "none" ? "worried" : focused || draft.length > 0 ? "listening" : late ? "sleepy" : "happy";

  const submit = async () => {
    const text = draft.trim();
    if (!text || busy) return;

    // 1. Safety first, on the raw words, with fixed rules. Nothing below runs for an emergency.
    const safety = checkSafety(text);
    const keepSafety = RANK[thread.safety.level] >= RANK[safety.level] ? thread.safety : safety;
    if (safety.level !== "none") {
      if (!crisisCopy(safety).canContinue) {
        setThread((t) => ({ ...t, safety }));
        openCrisis(true);
        return;
      }
    }

    // 2. Hide personal details, then analyse the hidden version.
    // Fails closed: if the privacy step errors, nothing is analysed or kept.
    setBusy(true);
    let shownText = text;
    let masks: Mask[] = [];
    if (p.settings.mask) {
      try {
        ({ text: shownText, masks } = await privacyLayer.redact(text));
      } catch {
        setBusy(false);
        toast("The privacy step failed, so nothing was analysed. Please try again.");
        return;
      }
    }
    const turn: Turn = { id: uid(), text: shownText, masks, at: new Date().toISOString() };
    const turns = [...thread.turns, turn];
    const a = analyze(turns.map((t) => t.text).join("\n"));
    const manual = thread.topics.filter((t) => t.manual && !thread.removed.includes(t.id));
    const auto = a.topics.filter((t) => !thread.removed.includes(t.id) && !manual.some((m) => m.id === t.id));
    const topics = [...manual, ...auto].sort((x, y) => y.score - x.score);
    const next: Thread = { ...thread, sessionId: thread.sessionId ?? uid(), turns, topics, safety: keepSafety, lastAnalyzedAt: Date.now() };

    window.setTimeout(() => {
      setThread(next);
      setDraft("");
      setBusy(false);
      setAddOpen(false);
      setTypeFilter("all");
      if (p.settings.keepHistory) {
        const session: Session = {
          id: next.sessionId!,
          title: turns[0].text.slice(0, 56),
          at: new Date().toISOString(),
          turns: turns.map((t) => ({ ...t, masks: t.masks.map((m) => ({ ...m, original: "" })) })),
          topics,
        };
        setP((x) => ({ ...x, history: [session, ...x.history.filter((h) => h.id !== session.id)].slice(0, 20) }));
      }
      if (window.innerWidth <= 900) foundRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, reduce ? 0 : 650);
  };

  const removeTopic = (id: TopicId) => setThread((t) => ({ ...t, topics: t.topics.filter((x) => x.id !== id), removed: [...t.removed, id] }));
  const addTopic = (id: TopicId) => {
    if (!id) return;
    setThread((t) => ({ ...t, topics: [...t.topics.filter((x) => x.id !== id), manualTopic(id)], removed: t.removed.filter((r) => r !== id) }));
  };
  const reset = () => {
    setThread(emptyThread());
    setDraft("");
    setWriteTo(null);
    setView("others");
    area.current?.focus();
  };
  const loadSession = (s: Session) => {
    setThread({ ...emptyThread(), sessionId: s.id, turns: s.turns, topics: s.topics });
    setView("others");
  };
  const copyLine = async (line: string) => toast((await copyText(line)) ? "Copied." : "Couldn't copy here. Select the line instead.");

  const available = TOPICS.filter((t) => !thread.topics.some((x) => x.id === t.id));
  const care = thread.safety.level !== "none" ? crisisCopy(thread.safety) : null;
  const typeOptions = [
    { id: "all" as const, label: "All", n: ranked.length },
    { id: "experience" as const, label: "Stories", n: counts.experience },
    { id: "general" as const, label: "Info", n: counts.general },
    { id: "professional" as const, label: "Guidance", n: counts.professional },
  ];

  return (
    <div className="page">
      <div className="talk">
        <div className="talk__left" data-long={hasTurns}>
          <div className="hello">
            <Pup mood={mood} size={84} label="Milo" />
            <div className="grow">
              <h1>{hasTurns ? "I'm listening." : `${greeting} What's on your mind?`}</h1>
              <p>{hasTurns ? <>Add more any time. What I found is <span className="d-only">on the right</span><span className="m-only">just below</span>.</> : "I'm a tool, not a person. I'll help you find words, and people to say them to."}</p>
            </div>
            {hasTurns && (
              <button type="button" className="btn btn--line btn--sm" onClick={reset}>
                Start over
              </button>
            )}
          </div>

          {hasTurns && (
            <div className="turns" aria-label="What you've written">
              {thread.turns.map((t) => (
                <TurnView key={t.id} turn={t} phrases={phrases} />
              ))}
            </div>
          )}

          {care && (
            <div className="care" role="status">
              <Pup mood="worried" size={56} />
              <div>
                <h3>{care.heading}</h3>
                <p>{care.canContinue ? care.body : "What you wrote is serious, so I'm not going to analyse it. The numbers are one tap away."}</p>
                <div className="care__acts">
                  <button type="button" className="btn btn--coral btn--sm" onClick={() => openCrisis(true)}>
                    <Icon n="phone" size={16} />
                    See who to call or text
                  </button>
                  <button
                    type="button"
                    className="btn btn--line btn--sm"
                    onClick={() => {
                      setThread((t) => ({ ...t, safety: checkSafety("") }));
                      area.current?.focus();
                    }}
                  >
                    {care.canContinue ? "Keep going" : "I want to change what I wrote"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasTurns && (
            <button type="button" className="btn btn--line m-only addmore" onClick={() => { setAddOpen(true); window.setTimeout(() => area.current?.focus(), 60); }}>
              <Icon n="plus" size={17} />
              Add more
            </button>
          )}
          <Sheet title="Add more" overlay={hasTurns} open={addOpen} onClose={() => setAddOpen(false)}>
          <form
            className="paper composer"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label className="sr" htmlFor="say">
              What's been going on?
            </label>
            <textarea
              id="say"
              ref={area}
              className="textarea"
              value={draft}
              placeholder={hasTurns ? "Add more, or tell me what I got wrong." : "Start anywhere. A few sentences is plenty."}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={hasTurns ? 4 : 6}
            />
            <div className="composer__foot">
              <span className="privacy-line">
                <Icon n="lock" size={16} />
                {p.settings.mask ? "Personal details are hidden first." : "Hiding details is off."}{" "}
                {p.settings.keepHistory ? "Kept on this device." : "Not kept."}
              </span>
              <button type="submit" className="btn btn--primary" disabled={!draft.trim() || busy}>
                <Icon n="send" size={16} />
                {busy ? "Reading…" : hasTurns ? "Add" : "Send"}
              </button>
            </div>
            {!hasTurns && (
              <div className="starters">
                <span className="lbl">Not sure how to start? Try one of these.</span>
                <div className="row">
                  {(p.age === "teen" ? STARTERS_TEEN : STARTERS).map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      className="chip"
                      onClick={() => {
                        setDraft(s.text);
                        area.current?.focus();
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
          </Sheet>

          {p.settings.keepHistory && p.history.length > 0 && (
            <section className="panel" aria-labelledby="earlier-h">
              <div className="panel__head">
                <h2 id="earlier-h" style={{ fontSize: "1rem" }}>Earlier on this device</h2>
                <button type="button" className="btn btn--quiet btn--sm" onClick={() => setP((x) => ({ ...x, history: [] }))}>
                  Clear
                </button>
              </div>
              <ul className="earlier" style={{ padding: "0.4rem 1.1rem 0.6rem" }}>
                {p.history.map((s) => (
                  <li key={s.id}>
                    <button type="button" className="t" onClick={() => loadSession(s)}>
                      {s.title || "Untitled"}
                    </button>
                    <span className="tiny">{ago(s.at)}</span>
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      aria-label="Delete this conversation"
                      onClick={() => setP((x) => ({ ...x, history: x.history.filter((h) => h.id !== s.id) }))}
                    >
                      <Icon n="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="found" ref={foundRef}>
          {!hasTurns ? (
            <>
              <DueCheckIn />
              <Glance />
            </>
          ) : (
            <>
              <section className="paper heard" aria-labelledby="heard-h">
                <h2 id="heard-h" className="sr">What I heard</h2>
                <p className="heard__lead">{read.lead}</p>
                <div className="topics">
                  {thread.topics.map((t: DetectedTopic) => (
                    <span key={t.id} className="chip chip--topic" title={t.manual ? "You added this" : t.strength}>
                      {t.label}
                      <span className="tiny" style={{ color: "inherit", opacity: 0.8 }}>{t.manual ? "added by you" : t.strength}</span>
                      <button type="button" className="x" aria-label={`Remove ${t.label}`} onClick={() => removeTopic(t.id)}>
                        <Icon n="x" size={14} />
                      </button>
                    </span>
                  ))}
                  {available.length > 0 && (
                    <span className="chip chip--add add-topic">
                      <Icon n="plus" size={14} />
                      Add a topic
                      <select aria-label="Add a topic" value="" onChange={(e) => addTopic(e.target.value as TopicId)}>
                        <option value="">Choose…</option>
                        {available.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </span>
                  )}
                </div>
                {phrases.length > 0 && (
                  <p className="evi">
                    Because you wrote: {phrases.slice(0, 4).map((x, i) => (<span key={i}>{i > 0 && ", "}<mark className="hl">{x}</mark></span>))}
                  </p>
                )}
                <p className="evi">{read.caveat}</p>
              </section>

              <div className="tabs">
                <Seg
                  label="What to look at"
                  value={view}
                  onChange={setView}
                  options={[
                    { id: "others", label: "Others like you", n: ranked.length },
                    { id: "people", label: "Who to tell", n: p.people.length },
                    { id: "words", label: "Words to use" },
                  ]}
                />
              </div>

              {view === "others" && (
                <section aria-label="Sources">
                  <div className="paper tellbar">
                    <Pup mood="happy" size={44} />
                    <p className="grow">
                      <b>Reading is a start. A person is the point.</b> Pick someone from your circle and I'll help with the first sentence.
                    </p>
                    <button type="button" className="btn btn--primary" onClick={() => setView("people")}>
                      Who could I tell?
                    </button>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <Seg label="Filter by kind" value={typeFilter} onChange={(v) => { setTypeFilter(v); setMoreSources(false); }} options={typeOptions} />
                  </div>
                  {(() => {
                    const legend = (
                      <div className="legend">
                        {(["experience", "general", "professional"] as SourceType[]).map((k) => (
                          <span key={k}>
                            <TypeIcon type={k} />
                            <b>{TYPE_LABEL[k]}:</b> {TYPE_HELP[k]}
                          </span>
                        ))}
                      </div>
                    );
                    return compact ? (
                      <details className="legend-m">
                        <summary>What do these labels mean?</summary>
                        {legend}
                      </details>
                    ) : (
                      legend
                    );
                  })()}
                  {shown.length === 0 ? (
                    <div className="empty">
                      <Pup mood="listening" size={90} />
                      <h3>{ranked.length === 0 ? "Nothing matched yet" : "Nothing of that kind"}</h3>
                      <p>
                        {ranked.length === 0
                          ? "Add a topic above, or write a little more about what's going on, and I'll look again. If nothing in the library fits, you can save a link you trust yourself."
                          : "Try All, or a different kind."}
                      </p>
                      {ranked.length === 0 && (
                        <button type="button" className="btn btn--line btn--sm" style={{ marginTop: "0.6rem" }} onClick={() => go("library", { addLink: true })}>
                          Save a link
                        </button>
                      )}
                    </div>
                  ) : (
                    <ul className="srcs">
                      {shown.map((r, i) => (
                        <SourceItem key={r.source.id} source={r.source} because={r.because} index={i} />
                      ))}
                    </ul>
                  )}
                  {matched.length > SHOW_FIRST && (
                    <button type="button" className="btn btn--line more" onClick={() => setMoreSources((m) => !m)} aria-expanded={moreSources}>
                      {moreSources ? "Show fewer" : `Show ${matched.length - SHOW_FIRST} more`}
                    </button>
                  )}
                  {p.dismissed.length > 0 && (
                    <p className="small muted" style={{ marginTop: "0.8rem" }}>
                      {p.dismissed.length} hidden.{" "}
                      <button type="button" className="btn btn--quiet btn--sm" onClick={() => setP((x) => ({ ...x, dismissed: [] }))}>
                        Show them again
                      </button>
                    </p>
                  )}
                </section>
              )}

              {view === "people" && (
                <section className="panel" aria-label="People you could tell">
                  <div className="panel__head">
                    <h2 style={{ fontSize: "1.05rem" }}>People in your circle, best fit first</h2>
                    <button type="button" className="btn btn--quiet btn--sm" onClick={() => go("people")}>
                      Edit circle
                    </button>
                  </div>
                  {p.age === "teen" && matches.length > 0 && (
                    <p className="small" style={{ margin: "0.2rem 1rem 0" }}>
                      <b>Tip:</b> people marked <i>Trusted adult</i> are listed first. If this is heavy, telling one of them is a strong next step.
                    </p>
                  )}
                  {matches.length === 0 ? (
                    <div className="empty">
                      <Pup mood="listening" size={90} />
                      <h3>Your circle is empty</h3>
                      <p>Add one or two people, even just "a friend from class," and I can help you write to them.</p>
                      <button type="button" className="btn btn--primary" style={{ marginTop: "0.8rem" }} onClick={() => go("people")}>
                        Add someone
                      </button>
                    </div>
                  ) : (
                    <ul className="panel__body" style={{ paddingTop: "0.4rem", paddingBottom: "0.4rem" }}>
                      {matches.map((m, i) => (
                        <li key={m.person.id} className="pm">
                          <div className="pm__top">
                            <Avatar name={m.person.name} pro={m.person.kind === "professional"} />
                            <div className="grow">
                              <div className="pm__name">
                                {m.person.name} <span className="chip chip--plain" style={{ fontSize: "0.8rem", padding: "0.05rem 0.55rem" }}>{m.person.relation}</span>
                                {i === 0 && m.score > 0 && <span className="chip chip--coral" style={{ fontSize: "0.8rem", padding: "0.05rem 0.55rem", marginLeft: "0.3rem" }}>Best fit</span>}
                              </div>
                              <div className="pm__why">
                                {m.why} Reach them by {m.person.reach}.
                              </div>
                              {m.person.note && <div className="prow__note">{m.person.note}</div>}
                            </div>
                            <button
                              type="button"
                              className={`btn btn--sm ${writeTo === m.person.id ? "btn--line" : "btn--primary"}`}
                              aria-expanded={writeTo === m.person.id}
                              onClick={() => setWriteTo(writeTo === m.person.id ? null : m.person.id)}
                            >
                              {writeTo === m.person.id ? "Close" : `Write to ${shortName(m.person.name)}`}
                            </button>
                          </div>
                          {writeTo === m.person.id && (
                            <Sheet title={`Message to ${shortName(m.person.name)}`} onClose={() => setWriteTo(null)}>
                              <Draft person={m.person} topics={thread.topics} onClose={() => setWriteTo(null)} />
                            </Sheet>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {view === "words" && (
                <section className="panel" aria-label="Words to use">
                  <div className="panel__head">
                    <h2 style={{ fontSize: "1.05rem" }}>If you don't know how to begin</h2>
                    <span className="tiny">Tap copy, then change anything.</span>
                  </div>
                  <div className="panel__body lines">
                    {starters.map((s) => (
                      <div key={s.topic}>
                        <h3>{s.topic}</h3>
                        <ul>
                          {s.lines.map((l) => (
                            <li key={l}>
                              <q>{l}</q>
                              <button type="button" className="btn btn--quiet btn--sm" onClick={() => copyLine(l)} aria-label="Copy this line">
                                <Icon n="copy" size={16} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <h3>For asking for what you need</h3>
                    <ul>
                      {GENERIC_CLOSERS.map((l) => (
                        <li key={l}>
                          <q>{l}</q>
                          <button type="button" className="btn btn--quiet btn--sm" onClick={() => copyLine(l)} aria-label="Copy this line">
                            <Icon n="copy" size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

